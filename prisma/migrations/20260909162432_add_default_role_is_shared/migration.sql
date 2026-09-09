-- AlterTable
ALTER TABLE "CompanyDocument" ADD COLUMN     "is_shared" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Permission" ADD COLUMN     "default_of_role" TEXT[];

-- AlterTable
ALTER TABLE "ProjectDocument" ADD COLUMN     "is_shared" BOOLEAN NOT NULL DEFAULT false;
