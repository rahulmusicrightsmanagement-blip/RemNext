-- Remove old payment fields and add airtmEmail
ALTER TABLE "UserProfile" DROP COLUMN IF EXISTS "bankAccountName";
ALTER TABLE "UserProfile" DROP COLUMN IF EXISTS "bankAccountNumber";
ALTER TABLE "UserProfile" DROP COLUMN IF EXISTS "bankRoutingNumber";
ALTER TABLE "UserProfile" DROP COLUMN IF EXISTS "bankSwiftCode";
ALTER TABLE "UserProfile" DROP COLUMN IF EXISTS "ssnId";
ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "airtmEmail" TEXT;
