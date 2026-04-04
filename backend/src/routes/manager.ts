import { Router, Response } from "express";
import prisma from "../lib/prisma";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";
import { sendVerificationLinks } from "../lib/mailer";

const router = Router();

// GET /api/manager/applications — manager: get applications for tasks they manage
router.get(
  "/applications",
  authenticate,
  authorize("MANAGER"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const applications = await prisma.application.findMany({
        where: { task: { managerId: req.authPayload!.userId } },
        include: {
          user: { select: { id: true, name: true, email: true } },
          task: { select: { id: true, name: true, userPayment: true, deadline: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      res.json({ applications });
    } catch (err) {
      console.error("Manager applications error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/manager/dashboard — manager: get dashboard stats with per-task breakdown
router.get(
  "/dashboard",
  authenticate,
  authorize("MANAGER"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const managerId = req.authPayload!.userId;

      // Get tasks managed by this manager with applications + hours
      const tasks = await prisma.task.findMany({
        where: { managerId },
        select: {
          id: true,
          name: true,
          userPayment: true,
          deadline: true,
          country: true,
          applications: {
            include: {
              user: { select: { id: true, name: true, email: true } },
              hoursLogs: { select: { hours: true } },
            },
          },
        },
      });

      const taskCards = tasks.map((t) => {
        const totalHours = t.applications.reduce(
          (sum, a) =>
            sum + a.hoursLogs.reduce((s, l) => s + l.hours, 0),
          0
        );
        return {
          id: t.id,
          name: t.name,
          userPayment: t.userPayment,
          deadline: t.deadline,
          country: t.country,
          applicationsCount: t.applications.length,
          approvedCount: t.applications.filter((a) => a.status === "APPROVED")
            .length,
          pendingMailCount: t.applications.filter(
            (a) => !a.mailSent && a.status === "PENDING"
          ).length,
          totalHours,
        };
      });

      const allApps = tasks.flatMap((t) => t.applications);
      const totalApplications = allApps.length;
      const pendingMailCount = allApps.filter(
        (a) => !a.mailSent && a.status === "PENDING"
      ).length;
      const mailSentCount = allApps.filter((a) => a.mailSent).length;
      const approvedCount = allApps.filter(
        (a) => a.status === "APPROVED"
      ).length;

      res.json({
        totalApplications,
        projectsManaged: tasks.length,
        pendingMailCount,
        mailSentCount,
        approvedCount,
        projects: tasks.map((t) => ({ id: t.id, name: t.name })),
        taskCards,
      });
    } catch (err) {
      console.error("Manager dashboard error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// POST /api/manager/applications/:id/send-verification — manager sends verification mail
router.post(
  "/applications/:id/send-verification",
  authenticate,
  authorize("MANAGER"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { urls } = req.body as { urls: string[] };

      if (
        !urls ||
        !Array.isArray(urls) ||
        urls.filter((u) => u.trim()).length === 0
      ) {
        res.status(400).json({ error: "At least one URL is required" });
        return;
      }

      const application = await prisma.application.findUnique({
        where: { id: req.params.id as string },
        include: {
          user: { select: { name: true, email: true } },
          task: { select: { name: true, managerId: true } },
        },
      });

      if (!application) {
        res.status(404).json({ error: "Application not found" });
        return;
      }

      if (application.task.managerId !== req.authPayload!.userId) {
        res.status(403).json({ error: "This application is not assigned to you" });
        return;
      }

      const cleanUrls = urls.map((u) => u.trim()).filter(Boolean);

      await sendVerificationLinks(
        application.user.email,
        application.user.name,
        application.task.name,
        cleanUrls
      );

      // Save sent URLs and mark mailSent=true
      const updated = await prisma.application.update({
        where: { id: req.params.id as string },
        data: {
          verificationLinks: { push: cleanUrls },
          mailSent: true,
        },
        select: { verificationLinks: true, mailSent: true },
      });

      res.json({
        success: true,
        sentTo: application.user.email,
        verificationLinks: updated.verificationLinks,
      });
    } catch (err) {
      console.error("Manager send verification error:", err);
      res.status(500).json({ error: "Failed to send email" });
    }
  }
);

// POST /api/manager/applications/:id/hours — manager logs hours for an approved application
router.post(
  "/applications/:id/hours",
  authenticate,
  authorize("MANAGER"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { hours, note } = req.body;

      if (!hours || isNaN(parseFloat(hours)) || parseFloat(hours) <= 0) {
        res.status(400).json({ error: "Hours must be a positive number" });
        return;
      }

      const application = await prisma.application.findUnique({
        where: { id: req.params.id as string },
        include: { task: { select: { managerId: true } } },
      });

      if (!application) {
        res.status(404).json({ error: "Application not found" });
        return;
      }

      if (application.task.managerId !== req.authPayload!.userId) {
        res.status(403).json({ error: "This application is not assigned to you" });
        return;
      }

      if (application.status !== "APPROVED") {
        res.status(400).json({ error: "Can only log hours for approved applications" });
        return;
      }

      const log = await prisma.hoursLog.create({
        data: {
          applicationId: application.id,
          managerId: req.authPayload!.userId,
          hours: parseFloat(hours),
          note: note || null,
        },
      });

      // Auto-update progress to IN_PROGRESS if still JUST_STARTED
      if (application.taskProgress === "JUST_STARTED") {
        await prisma.application.update({
          where: { id: application.id },
          data: { taskProgress: "IN_PROGRESS" },
        });
      }

      res.status(201).json({ log });
    } catch (err) {
      console.error("Log hours error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/manager/applications/:id/hours — get hours logs for an application
router.get(
  "/applications/:id/hours",
  authenticate,
  authorize("MANAGER"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const application = await prisma.application.findUnique({
        where: { id: req.params.id as string },
        include: { task: { select: { managerId: true } } },
      });

      if (!application) {
        res.status(404).json({ error: "Application not found" });
        return;
      }

      if (application.task.managerId !== req.authPayload!.userId) {
        res.status(403).json({ error: "This application is not assigned to you" });
        return;
      }

      const logs = await prisma.hoursLog.findMany({
        where: { applicationId: application.id },
        orderBy: { createdAt: "desc" },
      });

      const totalHours = logs.reduce((sum: number, l: { hours: number }) => sum + l.hours, 0);

      res.json({ logs, totalHours });
    } catch (err) {
      console.error("Get hours error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// PUT /api/manager/applications/:id/complete — mark application as completed
router.put(
  "/applications/:id/complete",
  authenticate,
  authorize("MANAGER"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const application = await prisma.application.findUnique({
        where: { id: req.params.id as string },
        include: { task: { select: { managerId: true } } },
      });
      if (!application) { res.status(404).json({ error: "Application not found" }); return; }
      if (application.task.managerId !== req.authPayload!.userId) { res.status(403).json({ error: "Not your application" }); return; }
      if (application.status !== "APPROVED") { res.status(400).json({ error: "Only approved applications can be completed" }); return; }

      const updated = await prisma.application.update({
        where: { id: application.id },
        data: { taskProgress: "COMPLETED" },
      });
      res.json({ application: updated });
    } catch (err) {
      console.error("Complete application error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// PUT /api/manager/hours/mark-paid — mark selected hours logs as paid
router.put(
  "/hours/mark-paid",
  authenticate,
  authorize("MANAGER"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { logIds } = req.body as { logIds: string[] };
      if (!logIds || !Array.isArray(logIds) || logIds.length === 0) {
        res.status(400).json({ error: "No log IDs provided" }); return;
      }

      // Verify all logs belong to manager's tasks
      const logs = await prisma.hoursLog.findMany({
        where: { id: { in: logIds } },
        include: { application: { include: { task: { select: { managerId: true } } } } },
      });

      const unauthorized = logs.some(l => l.application.task.managerId !== req.authPayload!.userId);
      if (unauthorized) { res.status(403).json({ error: "Some logs are not yours" }); return; }

      await prisma.hoursLog.updateMany({
        where: { id: { in: logIds } },
        data: { paymentStatus: "PAID" },
      });

      res.json({ success: true, updated: logIds.length });
    } catch (err) {
      console.error("Mark paid error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/manager/users/:id/profile — get a user's profile (must be assigned to manager's task)
router.get(
  "/users/:id/profile",
  authenticate,
  authorize("MANAGER"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const managerId = req.authPayload!.userId;
      const userId = req.params.id as string;

      // Verify this user has applied to one of the manager's tasks
      const application = await prisma.application.findFirst({
        where: {
          userId,
          task: { managerId },
        },
      });

      if (!application) {
        res.status(403).json({ error: "User is not assigned to your tasks" });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      });

      const profile = await prisma.userProfile.findUnique({
        where: { userId },
      });

      res.json({ user, profile: profile ?? null });
    } catch (err) {
      console.error("Get user profile error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
