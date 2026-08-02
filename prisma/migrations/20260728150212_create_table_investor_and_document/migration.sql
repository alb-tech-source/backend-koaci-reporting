-- CreateEnum
CREATE TYPE "InvestorType" AS ENUM ('individual', 'corporation');

-- CreateEnum
CREATE TYPE "InvestorStatus" AS ENUM ('active', 'inactive', 'blacklist');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('men', 'women');

-- CreateEnum
CREATE TYPE "StorageProvider" AS ENUM ('cloudflare', 'tencent', 'aws');

-- CreateTable
CREATE TABLE "Investor" (
    "investor_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "investor_type" "InvestorType" NOT NULL,
    "status" "InvestorStatus" NOT NULL DEFAULT 'active',
    "full_name" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "email" TEXT NOT NULL,
    "nik" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "privy" TEXT,
    "phone" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "bank_name" TEXT NOT NULL,
    "heir_name" TEXT,
    "heir_relationship" TEXT,
    "heir_nik" TEXT,
    "heir_address" TEXT,
    "heir_account_number" TEXT,
    "heir_bank_name" TEXT,
    "heir_phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Investor_pkey" PRIMARY KEY ("investor_id")
);

-- CreateTable
CREATE TABLE "InvestorDocument" (
    "document_id" TEXT NOT NULL,
    "investor_id" TEXT NOT NULL,
    "document_name" TEXT NOT NULL,
    "storage_provider" "StorageProvider" NOT NULL DEFAULT 'cloudflare',
    "object_key" TEXT NOT NULL,
    "file_size_bytes" BIGINT,
    "mime_type" TEXT,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvestorDocument_pkey" PRIMARY KEY ("document_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Investor_user_id_key" ON "Investor"("user_id");

-- AddForeignKey
ALTER TABLE "Investor" ADD CONSTRAINT "Investor_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestorDocument" ADD CONSTRAINT "InvestorDocument_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "Investor"("investor_id") ON DELETE RESTRICT ON UPDATE CASCADE;
