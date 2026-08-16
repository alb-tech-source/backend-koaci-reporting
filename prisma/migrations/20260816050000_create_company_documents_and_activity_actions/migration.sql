ALTER TYPE "ActivityAction" ADD VALUE IF NOT EXISTS 'COMPANY_CREATE';
ALTER TYPE "ActivityAction" ADD VALUE IF NOT EXISTS 'COMPANY_UPDATE';
ALTER TYPE "ActivityAction" ADD VALUE IF NOT EXISTS 'COMPANY_DELETE';
ALTER TYPE "ActivityAction" ADD VALUE IF NOT EXISTS 'COMPANY_DOCUMENT_UPLOAD';
ALTER TYPE "ActivityAction" ADD VALUE IF NOT EXISTS 'COMPANY_DOCUMENT_UPDATE';
ALTER TYPE "ActivityAction" ADD VALUE IF NOT EXISTS 'COMPANY_DOCUMENT_DELETE';

CREATE INDEX "CompanyDocument_company_id_idx" ON "CompanyDocument"("company_id");
CREATE INDEX "CompanyDocument_uploaded_by_idx" ON "CompanyDocument"("uploaded_by");
CREATE INDEX "CompanyDocument_uploaded_at_idx" ON "CompanyDocument"("uploaded_at");

ALTER TABLE "CompanyDocument" DROP CONSTRAINT "CompanyDocument_company_id_fkey";
ALTER TABLE "CompanyDocument"
ADD CONSTRAINT "CompanyDocument_company_id_fkey"
FOREIGN KEY ("company_id") REFERENCES "Company"("company_id") ON DELETE CASCADE ON UPDATE CASCADE;
