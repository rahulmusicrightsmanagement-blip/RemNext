import { Router, Response } from "express";
import multer from "multer";
import prisma from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/auth";
import { uploadToS3, deleteFromS3 } from "../lib/s3";

const router = Router();

// Multer config — store files in memory before uploading to S3
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB per file
  fileFilter: (_req, file, cb) => {
    const allowedPhoto = ["image/jpeg", "image/png", "image/webp"];
    const allowedDoc = [...allowedPhoto, "application/pdf"];
    const allowedResume = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (file.fieldname === "profilePhoto" && allowedPhoto.includes(file.mimetype)) {
      cb(null, true);
    } else if (file.fieldname === "documentFile" && allowedDoc.includes(file.mimetype)) {
      cb(null, true);
    } else if (file.fieldname === "resumeFile" && allowedResume.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type for ${file.fieldname}: ${file.mimetype}`));
    }
  },
});

const profileUpload = upload.fields([
  { name: "profilePhoto", maxCount: 1 },
  { name: "documentFile", maxCount: 1 },
  { name: "resumeFile", maxCount: 1 },
]);

// GET /api/profile — get current user's profile
router.get(
  "/",
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const profile = await prisma.userProfile.findUnique({
        where: { userId: req.authPayload!.userId },
      });
      res.json({ profile: profile ?? null });
    } catch (err) {
      console.error("Get profile error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// PUT /api/profile — create or update current user's profile (multipart)
router.put(
  "/",
  authenticate,
  profileUpload,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.authPayload!.userId;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

      const {
        phoneCode, phone,
        street, road, city, state, country, zipCode,
        documentType, documentValue,
        resumeUrl: resumeUrlField, // URL pasted by user (if no file uploaded)
        paypalEmail,
        airtmEmail,
      } = req.body;

      // Fetch existing profile to handle old file cleanup
      const existing = await prisma.userProfile.findUnique({
        where: { userId },
      });

      // ── Upload files to S3 ──
      let profilePhotoUrl = existing?.profilePhoto ?? null;
      let documentFileUrl = existing?.documentFileData ?? null;
      let resumeUrl = existing?.resumeUrl ?? null;

      // Profile photo
      if (files?.profilePhoto?.[0]) {
        const f = files.profilePhoto[0];
        // Delete old photo from S3 if it exists
        if (existing?.profilePhoto) await deleteFromS3(existing.profilePhoto);
        profilePhotoUrl = await uploadToS3(
          f.buffer, f.originalname, f.mimetype, "profile-photos", userId
        );
      } else if (req.body.removeProfilePhoto === "true") {
        if (existing?.profilePhoto) await deleteFromS3(existing.profilePhoto);
        profilePhotoUrl = null;
      }

      // Document file
      if (files?.documentFile?.[0]) {
        const f = files.documentFile[0];
        if (existing?.documentFileData) await deleteFromS3(existing.documentFileData);
        documentFileUrl = await uploadToS3(
          f.buffer, f.originalname, f.mimetype, "documents", userId
        );
      } else if (req.body.removeDocumentFile === "true") {
        if (existing?.documentFileData) await deleteFromS3(existing.documentFileData);
        documentFileUrl = null;
      }

      // Resume file
      if (files?.resumeFile?.[0]) {
        const f = files.resumeFile[0];
        if (existing?.resumeUrl?.startsWith("https://")) await deleteFromS3(existing.resumeUrl);
        resumeUrl = await uploadToS3(
          f.buffer, f.originalname, f.mimetype, "resumes", userId
        );
      } else if (resumeUrlField) {
        // User pasted a URL instead of uploading a file
        if (existing?.resumeUrl?.startsWith("https://") && existing.resumeUrl.includes(".s3.")) {
          await deleteFromS3(existing.resumeUrl);
        }
        resumeUrl = resumeUrlField;
      } else if (req.body.removeResume === "true") {
        if (existing?.resumeUrl?.startsWith("https://")) await deleteFromS3(existing.resumeUrl);
        resumeUrl = null;
      }

      const isComplete = Boolean(
        phone &&
        street && city && state && country && zipCode &&
        resumeUrl &&
        (paypalEmail || airtmEmail)
      );

      const data = {
        profilePhoto: profilePhotoUrl,
        phoneCode: phoneCode ?? null,
        phone: phone ?? null,
        street: street ?? null,
        road: road ?? null,
        city: city ?? null,
        state: state ?? null,
        country: country ?? null,
        zipCode: zipCode ?? null,
        documentType: documentType ?? null,
        documentValue: documentValue ?? null,
        documentFileData: documentFileUrl,
        resumeUrl,
        paypalEmail: paypalEmail ?? null,
        airtmEmail: airtmEmail ?? null,
        isComplete,
      };

      const profile = await prisma.userProfile.upsert({
        where: { userId },
        create: { userId, ...data },
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
