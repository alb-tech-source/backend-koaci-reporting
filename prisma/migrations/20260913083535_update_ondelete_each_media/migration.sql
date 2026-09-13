-- DropForeignKey
ALTER TABLE "CompanyDocument" DROP CONSTRAINT "CompanyDocument_uploaded_by_fkey";

-- DropForeignKey
ALTER TABLE "InvestorDocument" DROP CONSTRAINT "InvestorDocument_investor_id_fkey";

-- DropForeignKey
ALTER TABLE "ProjectDocument" DROP CONSTRAINT "ProjectDocument_uploaded_by_fkey";

-- DropForeignKey
ALTER TABLE "ProjectReportingMedia" DROP CONSTRAINT "ProjectReportingMedia_project_reporting_id_fkey";

-- DropForeignKey
ALTER TABLE "ProjectReportingMedia" DROP CONSTRAINT "ProjectReportingMedia_uploaded_by_fkey";

-- DropForeignKey
ALTER TABLE "ReceiptDocument" DROP CONSTRAINT "ReceiptDocument_project_investment_id_fkey";

-- DropForeignKey
ALTER TABLE "ReceiptDocument" DROP CONSTRAINT "ReceiptDocument_uploaded_by_fkey";

-- AddForeignKey
ALTER TABLE "InvestorDocument" ADD CONSTRAINT "InvestorDocument_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "Investor"("investor_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyDocument" ADD CONSTRAINT "CompanyDocument_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "User"("user_id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectDocument" ADD CONSTRAINT "ProjectDocument_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "User"("user_id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceiptDocument" ADD CONSTRAINT "ReceiptDocument_project_investment_id_fkey" FOREIGN KEY ("project_investment_id") REFERENCES "ProjectInvestment"("project_investment_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceiptDocument" ADD CONSTRAINT "ReceiptDocument_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "User"("user_id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectReportingMedia" ADD CONSTRAINT "ProjectReportingMedia_project_reporting_id_fkey" FOREIGN KEY ("project_reporting_id") REFERENCES "ProjectReporting"("project_reporting_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectReportingMedia" ADD CONSTRAINT "ProjectReportingMedia_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "User"("user_id") ON DELETE NO ACTION ON UPDATE CASCADE;
