import { z } from "zod";

export const createProjectReportingMediaBodySchema = z.object({
  project_reporting_id: z.uuid("Format project_reporting_id tidak valid"),
  media_type: z.enum(["photo", "video", "document"]),
  media_name: z.string().trim().min(2).max(150),
  storage_provider: z.enum(["cloudflare", "aws", "tencent"]).default("cloudflare"),
});

export const updateProjectReportingMediaSchema = z.object({
  media_type: z.enum(["photo", "video", "document"]).optional(),
  media_name: z.string().trim().min(2).max(150).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "Minimal satu field harus diisi untuk update",
});

export const listProjectReportingMediaQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  media_type: z.enum(["photo", "video", "document"]).optional(),
  search: z.string().trim().optional(),
});

export const projectReportingMediaIdParamSchema = z.object({
  mediaId: z.uuid("Format project_reporting_media_id tidak valid"),
});

export const projectReportingMediaReportingIdParamSchema = z.object({
  reportingId: z.uuid("Format project_reporting_id tidak valid"),
});
