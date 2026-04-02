import { Router, Response } from "express";
import prisma from "../lib/prisma";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";

const router = Router();

// POST /api/applications/:taskId — user applies to a task
router.post(
  "/:taskId",
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.authPayload!.userId;
      const taskId = req.params.taskId as string;

      // Check task exists
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: { applications: { select: { id: true } } },
      });

      if (!task) {
        res.status(404).json({ error: "Task not found" });
        return;
      }

      // Check if max registrations reached
      if (task.applications.length >= task.maxRegistrations) {
        res.status(400).json({ error: "Maximum application limit reached for this project" });
        return;
      }

      // Check if user already applied
      const existing = await prisma.application.findUnique({
        where: { userId_taskId: { userId, taskId } },
      });

      if (existing) {
        res.status(409).json({ error: "You have already applied to this project" });
        return;
      }

      // Check user has a profile
      const profile = await prisma.userProfile.findUnique({ where: { userId } });
      if (!profile || !profile.isComplete) {
        res.status(400).json({ error: "Please complete your profile before applying" });
        return;
      }

      const application = await prisma.application.create({
        data: { userId, taskId, managerId: task.managerId || undefined },
      });

      res.status(201).json({ application });
    } catch (err) {
      console.error("Apply error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/applications/my-projects — user's approved projects with hours
router.get(
  "/my-projects",
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const applications = await prisma.application.findMany({
        where: { userId: req.authPayload!.userId, status: "APPROVED" },
        include: {
          task: {
            select: {
              id: true,
              name: true,
              description: true,
              userPayment: true,
              deadline: true,
              docLinks: true,
            },
          },
          hoursLogs: {
            select: { hours: true, note: true, createdAt: true },
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const projects = applications.map((a) => ({
        ...a,
        totalHours: a.hoursLogs.reduce((sum, l) => sum + l.hours, 0),
      }));

      res.json({ projects });
    } catch (err) {
      console.error("My projects error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/applications/my-applications — user's all applications with status
router.get(
  "/my-applications",
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const applications = await prisma.application.findMany({
        where: { userId: req.authPayload!.userId },
        select: { taskId: true, status: true },
      });
      res.json({ applications });
    } catch (err) {
      console.error("My applications error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/applications/task/:taskId — admin: get applications for a task (only mailSent=true ones for approve/reject)
router.get(
  "/task/:taskId",
  authenticate,
  authorize("ADMIN"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const applications = await prisma.application.findMany({
        where: { taskId: req.params.taskId as string, mailSent: true },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          manager: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      res.json({ applications });
    } catch (err) {
      console.error("Task applications error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/applications/:id/details — admin: get full application details with user profile
router.get(
  "/:id/details",
  authenticate,
  authorize("ADMIN"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const application = await prisma.application.findUnique({
        where: { id: req.params.id as string },
        include: {
          user: {
            select: { id: true, name: true, email: true, createdAt: true },
          },
          task: {
            select: { id: true, name: true, manager: { select: { id: true, name: true, email: true } } },
          },
        },
      });

      if (!application) {
        res.status(404).json({ error: "Application not found" });
        return;
      }

      const profile = await prisma.userProfile.findUnique({
        where: { userId: application.userId },
      });

      res.json({ application: { ...application, verificationLinks: application.verificationLinks ?? [] }, profile });
    } catch (err) {
      console.error("Application details error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// PUT /api/applications/:id/approve — admin approves
router.put(
  "/:id/approve",
  authenticate,
  authorize("ADMIN"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const application = await prisma.application.findUnique({
        where: { id: req.params.id as string },
        include: { task: { select: { name: true, id: true } } },
      });

      if (!application) {
        res.status(404).json({ error: "Application not found" });
        return;
      }

      const updated = await prisma.application.update({
        where: { id: application.id },
        data: { status: "APPROVED" },
      });

      // Create notification for user
      await prisma.notification.create({
        data: {
          userId: application.userId,
          message: `Your application for "${application.task.name}" has been approved! 🎉`,
          type: "APPROVED",
          taskId: application.task.id,
          taskName: application.task.name,
        },
      });

      res.json({ application: updated });
    } catch (err) {
      console.error("Approve error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// PUT /api/applications/:id/reject — admin rejects
router.put(
  "/:id/reject",
  authenticate,
  authorize("ADMIN"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const application = await prisma.application.findUnique({
        where: { id: req.params.id as string },
        include: { task: { select: { name: true, id: true } } },
      });

      if (!application) {
        res.status(404).json({ error: "Application not found" });
        return;
      }

      const updated = await prisma.application.update({
        where: { id: application.id },
        data: { status: "REJECTED" },
      });

      // Create notification for user
      await prisma.notification.create({
        data: {
          userId: application.userId,
          message: `Your application for "${application.task.name}" has been rejected.`,
          type: "REJECTED",
          taskId: application.task.id,
          taskName: application.task.name,
        },
      });

      res.json({ application: updated });
    } catch (err) {
      console.error("Reject error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/applications/pending-all — admin: get all pending applications (with assignment info)
router.get(
  "/pending-all",
  authenticate,
  authorize("ADMIN"),
  async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
      const applications = await prisma.application.findMany({
        where: { status: "PENDING" },
        include: {
          user: { select: { id: true, name: true, email: true } },
          task: { select: { id: true, name: true } },
          manager: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      res.json({ applications });
    } catch (err) {
      console.error("Pending all error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/applications/managers-overview — admin: get all managers with their task assignments
router.get(
  "/managers-overview",
  authenticate,
  authorize("ADMIN"),
  async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
      const managers = await prisma.user.findMany({
        where: { role: "MANAGER" },
        select: {
          id: true,
          name: true,
          email: true,
          managedTasks: {
            select: {
              id: true,
              name: true,
              applications: {
                include: {
                  user: { select: { id: true, name: true, email: true } },
                },
              },
            },
          },
        },
      });

      const result = managers.map((m) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        assignedCount: m.managedTasks.length,
        users: m.managedTasks.flatMap((t) =>
          t.applications.map((a) => ({
            id: a.user.id,
            name: a.user.name,
            email: a.user.email,
            taskName: t.name,
            status: a.status,
          }))
        ),
      }));

      res.json({ managers: result });
    } catch (err) {
      console.error("Managers overview error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/applications/managers-list — admin: get all managers for assignment dropdown
router.get(
  "/managers-list",
  authenticate,
  authorize("ADMIN"),
  async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
      const managers = await prisma.user.findMany({
        where: { role: "MANAGER" },
        select: { id: true, name: true, email: true },
        orderBy: { name: "asc" },
      });
      res.json({ managers });
    } catch (err) {
      console.error("Managers list error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/applications/count/:taskId — get application count for a task (authenticated)
router.get(
  "/count/:taskId",
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const count = await prisma.application.count({
        where: { taskId: req.params.taskId as string },
      });
      res.json({ count });
    } catch (err) {
      console.error("Count error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
