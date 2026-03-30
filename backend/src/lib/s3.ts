import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import path from "path";
import crypto from "crypto";

const region = process.env.AWS_REGION || "us-east-1";
const bucket = process.env.AWS_S3_BUCKET!;

export const s3 = new S3Client({
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

/**
 * Upload a file buffer to S3 and return the public URL.
 * @param file - The multer file object
 * @param folder - S3 key prefix (e.g. "profile-photos", "documents", "resumes")
 * @param userId - Used to namespace files per user
 */
export async function uploadToS3(
  fileBuffer: Buffer,
  originalName: string,
  mimeType: string,
  folder: string,
  userId: string
): Promise<string> {
  const ext = path.extname(originalName) || "";
  const uniqueName = `${userId}-${crypto.randomUUID()}${ext}`;
  const key = `${folder}/${uniqueName}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
    })
  );

  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

/**
 * Delete an object from S3 by its full URL.
 */
export async function deleteFromS3(fileUrl: string): Promise<void> {
  try {
    const url = new URL(fileUrl);
    const key = url.pathname.startsWith("/")
      ? url.pathname.slice(1)
      : url.pathname;

    await s3.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );
  } catch {
    // Silently ignore delete errors — the object may already be gone
  }
}
