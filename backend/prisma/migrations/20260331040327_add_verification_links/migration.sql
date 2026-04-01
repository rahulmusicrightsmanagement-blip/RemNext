-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "verificationLinks" TEXT[] DEFAULT ARRAY[]::TEXT[];
