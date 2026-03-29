import { Router, Response } from "express";
import prisma from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

// GET /api/notifications — get user's notifications
router.get(
  "/",
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const notifications = await prisma.notification.findMany({
        where: { userId: req.user!.userId },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      res.json({ notifications });
    } catch (err) {
      console.error("Get notifications error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/notifications/unread-count — get count of unread notifications
router.get(
  "/unread-count",
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const count = await prisma.notification.count({
        where: { userId: req.user!.userId, read: false },
      });
      res.json({ count });
    } catch (err) {
      console.error("Unread count error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// PUT /api/notifications/:id/read — mark a notification as read
router.put(
  "/:id/read",
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const notification = await prisma.notification.findUnique({
        where: { id: req.params.id as string },
      });

      if (!notification || notification.userId !== req.user!.userId) {
        res.status(404).json({ error: "Notification not found" });
        return;
      }

      await prisma.notification.update({
        where: { id: notification.id },
        data: { read: true },
      });

      res.json({ success: true });
    } catch (err) {
      console.error("Mark read error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// PUT /api/notifications/read-all — mark all notifications as read
router.put(
  "/read-all",
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      await prisma.notification.updateMany({
        where: { userId: req.user!.userId, read: false },
        data: { read: true },
      });
      res.json({ success: true });
    } catch (err) {
      console.error("Mark all read error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
