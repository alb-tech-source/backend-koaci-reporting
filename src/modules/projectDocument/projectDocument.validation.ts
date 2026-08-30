import { z } from "zod";

export const createProjectDocumentBodySchema = z.object({
  project_id: z.uuid("Format project_id tidak valid"),
  document_type: z.string().trim().min(2).max(100).optional(),
  document_name: z.string().trim().min(2).max(150),
  storage_provider: z.enum(["cloudflare", "aws", "tencent"]).default("cloudflare"),
});

export const updateProjectDocumentSchema = z.object({
  document_type: z.string().trim().min(2).max(100).nullable().optional(),
  document_name: z.string().trim().min(2).max(150).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "Minimal satu field harus diisi untuk update",
});

export const listProjectDocumentQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  document_type: z.string().trim().optional(),
  search: z.string().trim().optional(),
});

export const projectDocumentIdParamSchema = z.object({
  documentId: z.uuid("Format document_id tidak valid"),
});

export const projectDocumentProjectIdParamSchema = z.object({
  projectId: z.uuid("Format project_id tidak valid"),
});
