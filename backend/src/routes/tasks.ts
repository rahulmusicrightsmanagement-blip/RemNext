import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";

const router = Router();

// GET /api/tasks/browse — authenticated users: list tasks matching their profile country
router.get(
  "/browse",
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const profile = await prisma.userProfile.findUnique({
        where: { userId: req.authPayload!.userId },
        select: { country: true },
      });

      const allTasks = await prisma.task.findMany({
        where: { deadline: { gte: new Date() } },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          description: true,
          country: true,
          requiresVerification: true,
          userPayment: true,
          maxRegistrations: true,
          deadline: true,
          createdAt: true,
          _count: { select: { applications: true } },
        },
      });

      const userCountry = profile?.country?.trim().toLowerCase();
      const tasks = userCountry
        ? allTasks.filter(t =>
            !t.country ||
            t.country.split(",").map(c => c.trim().toLowerCase()).includes(userCountry)
          )
        : allTasks;

      res.json({ tasks });
    } catch (err) {
      console.error("Browse tasks error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/tasks — admin: list all tasks
router.get(
  "/",
  authenticate,
  authorize("ADMIN"),
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const tasks = await prisma.task.findMany({
        orderBy: { createdAt: "desc" },
      });
      res.json({ tasks });
    } catch (err) {
      console.error("List tasks error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// POST /api/tasks — admin: create a task
router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, description, country, requiresVerification, fullPayment, commission, maxRegistrations, maxAssignments, deadline } = req.body;

      if (!name || fullPayment == null || commission == null || !maxRegistrations || !maxAssignments || !deadline || !country) {
        res.status(400).json({ error: "name, country, fullPayment, commission, maxRegistrations, maxAssignments and deadline are required" });
        return;
      }

      const userPayment = parseFloat(fullPayment) * (1 - parseFloat(commission) / 100);

      const task = await prisma.task.create({
        data: {
          name,
          description: description || null,
          docLinks: [],
          country,
          requiresVerification: Boolean(requiresVerification),
          fullPayment: parseFloat(fullPayment),
          commission: parseFloat(commission),
          userPayment: parseFloat(userPayment.toFixed(2)),
          maxRegistrations: parseInt(maxRegistrations),
          maxAssignments: parseInt(maxAssignments),
          deadline: new Date(deadline),
        },
      });

      res.status(201).json({ task });
    } catch (err) {
      console.error("Create task error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// PATCH /api/tasks/:id — admin: update a task
router.patch(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, description, country, requiresVerification, fullPayment, commission, maxRegistrations, maxAssignments, deadline } = req.body;

      const userPayment = parseFloat(fullPayment) * (1 - parseFloat(commission) / 100);

      const task = await prisma.task.update({
        where: { id: req.params.id as string },
        data: {
          name,
          description: description || null,
          country: country || null,
          requiresVerification: Boolean(requiresVerification),
          fullPayment: parseFloat(fullPayment),
          commission: parseFloat(commission),
          userPayment: parseFloat(userPayment.toFixed(2)),
          maxRegistrations: parseInt(maxRegistrations),
          maxAssignments: parseInt(maxAssignments),
          deadline: new Date(deadline),
        },
      });

      res.json({ task });
    } catch (err) {
      console.error("Update task error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// DELETE /api/tasks/:id — admin: delete a task
router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      await prisma.task.delete({ where: { id: req.params.id as string } });
      res.json({ success: true });
    } catch (err) {
      console.error("Delete task error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
