import { z } from "zod";

const percentage = z.number().min(0).max(100);
const summaryText = z.string().trim().min(5).max(5000);
const optionalSummaryText = z.string().trim().max(5000).optional();

export const createProjectReportingBodySchema = z.object({
  project_id: z.uuid("Format project_id tidak valid"),
  report_date: z.coerce.date(),
  estimate_progress_percentage: percentage.optional(),
  narative_summary: summaryText,
  issues_blockers: optionalSummaryText,
  next_week_plan: optionalSummaryText,
  fund_disbursed: z
    .number()
    .min(0, "Nominal tidak boleh negatif")
    .optional(),
});

export const updateProjectReportingBodySchema =
  createProjectReportingBodySchema
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
      message: "Minimal satu field harus diisi untuk update",
    });

export const projectReportingIdParamSchema = z.object({
  reportingId: z.uuid("Format project_reporting_id tidak valid"),
});

export const listProjectReportingQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().optional(),
  project_id: z.uuid("Format project_id tidak valid").optional(),
});
