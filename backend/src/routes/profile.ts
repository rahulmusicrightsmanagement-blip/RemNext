import { Router, Response } from "express";
import prisma from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

// Increase JSON body limit for base64 images
// (handled at app level — this route just consumes it)

// GET /api/profile — get current user's profile
router.get(
  "/",
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const profile = await prisma.userProfile.findUnique({
        where: { userId: req.user!.userId },
      });
      res.json({ profile: profile ?? null });
    } catch (err) {
      console.error("Get profile error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// PUT /api/profile — create or update current user's profile
router.put(
  "/",
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const {
        profilePhoto,
        phoneCode, phone,
        street, road, city, state, country, zipCode,
        documentType, documentValue, documentFileData,
        resumeUrl,
        bankAccountName, bankAccountNumber, bankRoutingNumber, bankSwiftCode,
        paypalEmail,
        ssnId,
      } = req.body;

      const isUS = (country ?? "").toLowerCase().includes("united states") ||
        (country ?? "").toLowerCase() === "us" ||
        (country ?? "").toLowerCase() === "usa";

      const isComplete = Boolean(
        phone &&
        street && city && state && country && zipCode &&
        documentType && documentValue &&
        resumeUrl &&
        ((bankAccountName && bankAccountNumber) || paypalEmail) &&
        (!isUS || ssnId)
      );

      const data = {
        profilePhoto: profilePhoto ?? null,
        phoneCode: phoneCode ?? null,
        phone,
        street, road, city, state, country, zipCode,
        documentType, documentValue,
        documentFileData: documentFileData ?? null,
        resumeUrl,
        bankAccountName, bankAccountNumber, bankRoutingNumber, bankSwiftCode,
        paypalEmail,
        ssnId,
        isComplete,
      };

      const profile = await prisma.userProfile.upsert({
        where: { userId: req.user!.userId },
        create: { userId: req.user!.userId, ...data },
        update: data,
      });

      res.json({ profile });
    } catch (err) {
      console.error("Update profile error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
