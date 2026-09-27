-- CreateEnum
CREATE TYPE "InvestorSettlementStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "ProjectSettlementStatus" AS ENUM ('review', 'approved', 'rejected');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ActivityAction" ADD VALUE 'PROJECT_SETTLEMENT_CREATE';
ALTER TYPE "ActivityAction" ADD VALUE 'PROJECT_SETTLEMENT_UPDATE';
ALTER TYPE "ActivityAction" ADD VALUE 'PROJECT_SETTLEMENT_DELETE';

-- CreateTable
CREATE TABLE "ProjectSettlement" (
    "project_settlement_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "profit_model" TEXT NOT NULL,
    "total_capital" DECIMAL(18,2) NOT NULL,
    "sales_amount" DECIMAL(18,2) NOT NULL,
    "gross_margin" DECIMAL(18,2) NOT NULL,
    "other_cost" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "other_cost_description" TEXT NOT NULL DEFAULT '',
    "net_profit_margin" DECIMAL(18,2) NOT NULL,
    "applicant_share_pct" DOUBLE PRECISION NOT NULL,
    "applicant_share_amount" DECIMAL(18,2) NOT NULL,
    "koaci_share_pct" DOUBLE PRECISION NOT NULL,
    "koaci_share_amount" DECIMAL(18,2) NOT NULL,
    "koaci_portion_pct" DOUBLE PRECISION NOT NULL,
    "koaci_portion_amount" DECIMAL(18,2) NOT NULL,
    "investor_portion_pct" DOUBLE PRECISION NOT NULL,
    "investor_portion_amount" DECIMAL(18,2) NOT NULL,
    "compensation_total" DECIMAL(18,2),
    "koaci_final_profit" DECIMAL(18,2),
    "status" "ProjectSettlementStatus" NOT NULL DEFAULT 'review',
    "created_by" TEXT NOT NULL,
    "approved_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectSettlement_pkey" PRIMARY KEY ("project_settlement_id")
);

-- CreateTable
CREATE TABLE "InvestorSettlement" (
    "investor_settlement_id" TEXT NOT NULL,
    "project_settlement_id" TEXT NOT NULL,
    "investor_id" TEXT NOT NULL,
    "principal_amount" DECIMAL(18,2) NOT NULL,
    "modal_portion_pct" DOUBLE PRECISION NOT NULL,
    "profit_share_amount" DECIMAL(18,2) NOT NULL,
    "compensation_pct" DOUBLE PRECISION,
    "compensation_amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "total_profit" DECIMAL(18,2) NOT NULL,
    "status" "InvestorSettlementStatus" NOT NULL DEFAULT 'pending',
    "created_by" TEXT NOT NULL,
    "approved_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestorSettlement_pkey" PRIMARY KEY ("investor_settlement_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectSettlement_project_id_key" ON "ProjectSettlement"("project_id");

-- CreateIndex
CREATE INDEX "InvestorSettlement_project_settlement_id_idx" ON "InvestorSettlement"("project_settlement_id");

-- CreateIndex
CREATE INDEX "InvestorSettlement_investor_id_idx" ON "InvestorSettlement"("investor_id");

-- AddForeignKey
ALTER TABLE "ProjectSettlement" ADD CONSTRAINT "ProjectSettlement_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("project_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectSettlement" ADD CONSTRAINT "ProjectSettlement_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectSettlement" ADD CONSTRAINT "ProjectSettlement_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestorSettlement" ADD CONSTRAINT "InvestorSettlement_project_settlement_id_fkey" FOREIGN KEY ("project_settlement_id") REFERENCES "ProjectSettlement"("project_settlement_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestorSettlement" ADD CONSTRAINT "InvestorSettlement_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "Investor"("investor_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestorSettlement" ADD CONSTRAINT "InvestorSettlement_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestorSettlement" ADD CONSTRAINT "InvestorSettlement_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
