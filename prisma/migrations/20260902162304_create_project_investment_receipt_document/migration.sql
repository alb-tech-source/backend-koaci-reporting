-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('cash', 'transfer');

-- CreateTable
CREATE TABLE "ProjectInvestment" (
    "project_investment_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "investor_id" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "total_package" INTEGER NOT NULL,
    "source_account_transaction" TEXT,
    "account_reference" TEXT,
    "receipt_number" TEXT,
    "payment_method" "PaymentMethod" NOT NULL,
    "destination_account_number" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectInvestment_pkey" PRIMARY KEY ("project_investment_id")
);

-- CreateTable
CREATE TABLE "ReceiptDocument" (
    "receipt_document_id" TEXT NOT NULL,
    "project_investment_id" TEXT NOT NULL,
    "receipt_name" TEXT NOT NULL,
    "storage_provider" "StorageProvider" NOT NULL DEFAULT 'cloudflare',
    "object_key" TEXT NOT NULL,
    "file_size_bytes" BIGINT,
    "mime_type" TEXT,
    "uploaded_by" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReceiptDocument_pkey" PRIMARY KEY ("receipt_document_id")
);

-- CreateIndex
CREATE INDEX "ProjectInvestment_project_id_idx" ON "ProjectInvestment"("project_id");

-- CreateIndex
CREATE INDEX "ProjectInvestment_investor_id_idx" ON "ProjectInvestment"("investor_id");

-- CreateIndex
CREATE UNIQUE INDEX "ReceiptDocument_project_investment_id_key" ON "ReceiptDocument"("project_investment_id");

-- CreateIndex
CREATE INDEX "ReceiptDocument_project_investment_id_idx" ON "ReceiptDocument"("project_investment_id");

-- CreateIndex
CREATE INDEX "Investor_user_id_idx" ON "Investor"("user_id");

-- CreateIndex
CREATE INDEX "Investor_status_idx" ON "Investor"("status");

-- CreateIndex
CREATE INDEX "Investor_nik_idx" ON "Investor"("nik");

-- AddForeignKey
ALTER TABLE "ProjectInvestment" ADD CONSTRAINT "ProjectInvestment_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("project_id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectInvestment" ADD CONSTRAINT "ProjectInvestment_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "Investor"("investor_id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceiptDocument" ADD CONSTRAINT "ReceiptDocument_project_investment_id_fkey" FOREIGN KEY ("project_investment_id") REFERENCES "ProjectInvestment"("project_investment_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceiptDocument" ADD CONSTRAINT "ReceiptDocument_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
