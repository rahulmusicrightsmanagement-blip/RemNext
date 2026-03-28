import { Router, Response } from "express";
import prisma from "../lib/prisma";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";

const router = Router();

// GET /api/tasks — admin: list all tasks
router.get(
  "/",
  authenticate,
  authorize("ADMIN"),
  async (_req: AuthRequest, res: Response): Promise<void> => {
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
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { name, description, docLinks, requiresVerification, fullPayment, commission, maxRegistrations, maxAssignments, deadline } = req.body;

      if (!name || fullPayment == null || commission == null || !maxRegistrations || !maxAssignments || !deadline) {
        res.status(400).json({ error: "name, fullPayment, commission, maxRegistrations, maxAssignments and deadline are required" });
        return;
      }

      const userPayment = parseFloat(fullPayment) * (1 - parseFloat(commission) / 100);

      const task = await prisma.task.create({
        data: {
          name,
          description: description || null,
          docLinks: Array.isArray(docLinks) ? docLinks.filter((l: string) => l.trim()) : [],
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
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { name, description, docLinks, requiresVerification, fullPayment, commission, maxRegistrations, maxAssignments, deadline } = req.body;

      const userPayment = parseFloat(fullPayment) * (1 - parseFloat(commission) / 100);

      const task = await prisma.task.update({
        where: { id: req.params.id as string },
        data: {
          name,
          description: description || null,
          docLinks: Array.isArray(docLinks) ? docLinks.filter((l: string) => l.trim()) : [],
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
  async (req: AuthRequest, res: Response): Promise<void> => {
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
