-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'MANAGER';

-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "mailSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "managerId" TEXT;

-- CreateTable
CREATE TABLE "HoursLog" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "hours" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HoursLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HoursLog" ADD CONSTRAINT "HoursLog_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HoursLog" ADD CONSTRAINT "HoursLog_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
