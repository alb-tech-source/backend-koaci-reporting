-- AlterTable
ALTER TABLE "User" ADD COLUMN     "email_verification_expires" TEXT,
ADD COLUMN     "email_verification_token" TEXT,
ADD COLUMN     "email_verified" BOOLEAN NOT NULL DEFAULT false;
