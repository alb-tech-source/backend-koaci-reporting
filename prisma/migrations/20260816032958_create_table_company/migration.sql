-- CreateEnum
CREATE TYPE "CompanyType" AS ENUM ('PT', 'CV', 'Firma', 'Perorangan');

-- CreateEnum
CREATE TYPE "CompanyStatus" AS ENUM ('active', 'inactive', 'blacklist');

-- CreateTable
CREATE TABLE "Company" (
    "company_id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "company_type" "CompanyType" NOT NULL DEFAULT 'PT',
    "industry_sector" TEXT,
    "description" TEXT,
    "director_name" TEXT NOT NULL,
    "director_phone" TEXT NOT NULL,
    "company_email" TEXT,
    "director_privy" TEXT,
    "company_address" TEXT NOT NULL,
    "website" TEXT,
    "heirs_director_name" TEXT,
    "heirs_director_phone" TEXT,
    "heirs_director_address" TEXT,
    "status" "CompanyStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("company_id")
);
