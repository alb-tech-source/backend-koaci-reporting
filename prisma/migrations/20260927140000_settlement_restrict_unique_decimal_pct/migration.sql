-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ActivityAction" ADD VALUE 'PROJECT_SETTLEMENT_APPROVE';
ALTER TYPE "ActivityAction" ADD VALUE 'PROJECT_SETTLEMENT_REJECT';
ALTER TYPE "ActivityAction" ADD VALUE 'INVESTOR_SETTLEMENT_CREATE';
ALTER TYPE "ActivityAction" ADD VALUE 'INVESTOR_SETTLEMENT_UPDATE';
ALTER TYPE "ActivityAction" ADD VALUE 'INVESTOR_SETTLEMENT_DELETE';
ALTER TYPE "ActivityAction" ADD VALUE 'INVESTOR_SETTLEMENT_APPROVE';
ALTER TYPE "ActivityAction" ADD VALUE 'INVESTOR_SETTLEMENT_REJECT';

-- DropForeignKey
ALTER TABLE "ProjectSettlement" DROP CONSTRAINT "ProjectSettlement_project_id_fkey";

-- DropForeignKey
ALTER TABLE "ProjectSettlement" DROP CONSTRAINT "ProjectSettlement_created_by_fkey";

-- DropForeignKey
ALTER TABLE "InvestorSettlement" DROP CONSTRAINT "InvestorSettlement_project_settlement_id_fkey";

-- DropForeignKey
ALTER TABLE "InvestorSettlement" DROP CONSTRAINT "InvestorSettlement_investor_id_fkey";

-- DropForeignKey
ALTER TABLE "InvestorSettlement" DROP CONSTRAINT "InvestorSettlement_created_by_fkey";

-- DropIndex
DROP INDEX "InvestorSettlement_project_settlement_id_idx";

-- AlterTable
ALTER TABLE "ProjectSettlement" ALTER COLUMN "applicant_share_pct" SET DATA TYPE DECIMAL(7,4),
ALTER COLUMN "koaci_share_pct" SET DATA TYPE DECIMAL(7,4),
ALTER COLUMN "koaci_portion_pct" SET DATA TYPE DECIMAL(7,4),
ALTER COLUMN "investor_portion_pct" SET DATA TYPE DECIMAL(7,4);

-- Backfill sebelum compensation_pct menjadi NOT NULL
UPDATE "InvestorSettlement" SET "compensation_pct" = 0 WHERE "compensation_pct" IS NULL;

-- AlterTable
ALTER TABLE "InvestorSettlement" ALTER COLUMN "modal_portion_pct" SET DATA TYPE DECIMAL(12,6),
ALTER COLUMN "compensation_pct" SET NOT NULL,
ALTER COLUMN "compensation_pct" SET DEFAULT 0,
ALTER COLUMN "compensation_pct" SET DATA TYPE DECIMAL(7,4);

-- CreateIndex
CREATE INDEX "ProjectSettlement_status_idx" ON "ProjectSettlement"("status");

-- CreateIndex
CREATE UNIQUE INDEX "InvestorSettlement_project_settlement_id_investor_id_key" ON "InvestorSettlement"("project_settlement_id", "investor_id");

-- AddForeignKey
ALTER TABLE "ProjectSettlement" ADD CONSTRAINT "ProjectSettlement_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("project_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectSettlement" ADD CONSTRAINT "ProjectSettlement_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestorSettlement" ADD CONSTRAINT "InvestorSettlement_project_settlement_id_fkey" FOREIGN KEY ("project_settlement_id") REFERENCES "ProjectSettlement"("project_settlement_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestorSettlement" ADD CONSTRAINT "InvestorSettlement_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "Investor"("investor_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestorSettlement" ADD CONSTRAINT "InvestorSettlement_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

