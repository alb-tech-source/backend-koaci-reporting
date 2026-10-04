-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "is_public" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "project_name" TEXT;
