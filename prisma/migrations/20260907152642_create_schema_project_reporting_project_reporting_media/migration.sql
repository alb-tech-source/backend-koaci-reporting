-- CreateEnum
CREATE TYPE "ProjectMedia" AS ENUM ('photo', 'video', 'document');

-- CreateTable
CREATE TABLE "ProjectReporting" (
    "project_reporting_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "report_date" TIMESTAMP(3) NOT NULL,
    "estimate_progress_percentage" DOUBLE PRECISION,
    "narative_summary" TEXT NOT NULL,
    "issues_blockers" TEXT,
    "next_week_plan" TEXT,
    "fund_disbursed" DECIMAL(18,2),
    "submitted_by" TEXT NOT NULL,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectReporting_pkey" PRIMARY KEY ("project_reporting_id")
);

-- CreateTable
CREATE TABLE "ProjectReportingMedia" (
    "project_reporting_media_id" TEXT NOT NULL,
    "project_reporting_id" TEXT NOT NULL,
    "media_type" "ProjectMedia" NOT NULL,
    "media_name" TEXT NOT NULL,
    "storage_provider" "StorageProvider" NOT NULL DEFAULT 'cloudflare',
    "object_key" TEXT NOT NULL,
    "file_size_bytes" BIGINT,
    "mime_type" TEXT,
    "uploaded_by" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectReportingMedia_pkey" PRIMARY KEY ("project_reporting_media_id")
);

-- CreateIndex
CREATE INDEX "ProjectReporting_project_id_idx" ON "ProjectReporting"("project_id");

-- CreateIndex
CREATE INDEX "ProjectReporting_report_date_idx" ON "ProjectReporting"("report_date");

-- CreateIndex
CREATE INDEX "ProjectReporting_submitted_by_idx" ON "ProjectReporting"("submitted_by");

-- CreateIndex
CREATE INDEX "ProjectReporting_updated_by_idx" ON "ProjectReporting"("updated_by");

-- CreateIndex
CREATE INDEX "ProjectReportingMedia_project_reporting_id_idx" ON "ProjectReportingMedia"("project_reporting_id");

-- AddForeignKey
ALTER TABLE "ProjectReporting" ADD CONSTRAINT "ProjectReporting_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("project_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectReporting" ADD CONSTRAINT "ProjectReporting_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectReporting" ADD CONSTRAINT "ProjectReporting_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectReportingMedia" ADD CONSTRAINT "ProjectReportingMedia_project_reporting_id_fkey" FOREIGN KEY ("project_reporting_id") REFERENCES "ProjectReporting"("project_reporting_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectReportingMedia" ADD CONSTRAINT "ProjectReportingMedia_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
