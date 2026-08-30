-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('open', 'closed', 'target_achieved', 'cancelled');

-- CreateTable
CREATE TABLE "Project" (
    "project_id" TEXT NOT NULL,
    "project_key" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "funding_required" DECIMAL(18,2) NOT NULL,
    "net_margin_amount" DECIMAL(18,2),
    "applicant_profit_share_percentage" DOUBLE PRECISION,
    "applicant_profit_share_amount" DECIMAL(18,2),
    "koaci_profit_share_percentage" DOUBLE PRECISION,
    "koaci_profit_share_amount" DECIMAL(18,2),
    "koaci_profit_share_beneficiary_percentage" DOUBLE PRECISION,
    "koaci_profit_share_beneficiary_amount" DECIMAL(18,2),
    "investor_profit_share_percentage" DOUBLE PRECISION,
    "investor_profit_share_amount" DECIMAL(18,2),
    "aggregate_fund_amount" DECIMAL(18,2),
    "disbursement_amount" DECIMAL(18,2),
    "disbursement_date" TIMESTAMP(3),
    "source_account_number" TEXT,
    "destination_account_number" TEXT,
    "beneficiary_refund_date" TIMESTAMP(3),
    "beneficiary_refund_amount" DECIMAL(18,2),
    "beneficiary_repayment_source_account" TEXT,
    "beneficiary_repayment_destination_account" TEXT,
    "url_transaction_folder" TEXT,
    "fund_disbursement_official_record" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("project_id")
);

-- CreateTable
CREATE TABLE "ProjectDocument" (
    "document_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "document_type" TEXT,
    "document_name" TEXT NOT NULL,
    "storage_provider" "StorageProvider" NOT NULL DEFAULT 'cloudflare',
    "object_key" TEXT NOT NULL,
    "file_size_bytes" BIGINT,
    "mime_type" TEXT,
    "uploaded_by" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectDocument_pkey" PRIMARY KEY ("document_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Project_project_key_key" ON "Project"("project_key");

-- CreateIndex
CREATE INDEX "Project_company_id_idx" ON "Project"("company_id");

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");

-- CreateIndex
CREATE INDEX "ProjectDocument_project_id_idx" ON "ProjectDocument"("project_id");

-- CreateIndex
CREATE INDEX "ProjectDocument_uploaded_by_idx" ON "ProjectDocument"("uploaded_by");

-- CreateIndex
CREATE INDEX "ProjectDocument_uploaded_at_idx" ON "ProjectDocument"("uploaded_at");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("company_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectDocument" ADD CONSTRAINT "ProjectDocument_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("project_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectDocument" ADD CONSTRAINT "ProjectDocument_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
