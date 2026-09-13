-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_company_id_fkey";

-- DropForeignKey
ALTER TABLE "ProjectReporting" DROP CONSTRAINT "ProjectReporting_project_id_fkey";

-- DropForeignKey
ALTER TABLE "ProjectReporting" DROP CONSTRAINT "ProjectReporting_submitted_by_fkey";

-- DropForeignKey
ALTER TABLE "ProjectReporting" DROP CONSTRAINT "ProjectReporting_updated_by_fkey";

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("company_id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectReporting" ADD CONSTRAINT "ProjectReporting_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("project_id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectReporting" ADD CONSTRAINT "ProjectReporting_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "User"("user_id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectReporting" ADD CONSTRAINT "ProjectReporting_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "User"("user_id") ON DELETE NO ACTION ON UPDATE CASCADE;
