import { z } from "zod";

export const presignInvestorDocumentSchema = z.object({
  investor_id: z.string().uuid("Format investor_id tidak valid."),
  file_name: z.string().trim().min(1).max(150),
  mime_type: z.string().trim().min(1).max(100),
  file_size_bytes: z.number().int().positive(),
});

export const createInvestorDocumentSchema = z.object({
  investor_id: z.string().uuid("Format investor_id tidak valid."),
  document_name: z
    .string()
    .min(2, "Nama dokumen minimal 2 karakter.")
    .max(100, "Nama dokumen maksimal 100 karakter."),
  storage_provider: z
    .enum(["cloudflare", "aws", "tencent"], {
      message: "Penyedia penyimpanan harus cloudflare, aws, atau tencent.",
    })
    .default("cloudflare"),
  object_key: z.string().trim().min(1).max(512),
  mime_type: z
    .string()
    .min(1, "Mime type wajib diisi.")
    .max(100, "Mime type maksimal 100 karakter."),
});

export const updateInvestorDocumentSchema = z.object({
  document_name: z
    .string()
    .min(2, "Nama dokumen minimal 2 karakter.")
    .max(100, "Nama dokumen maksimal 100 karakter.")
    .optional(),
  storage_provider: z
    .enum(["cloudflare", "aws", "tencent"], {
      message: "Penyedia penyimpanan harus cloudflare, aws, atau tencent.",
    })
    .optional(),
});

export const getListInvestorDocumentsSchema = z.object({
  investor_id: z.string().uuid("Format investor_id tidak valid."),
});

export const getInvestorDocumentSchema = z.object({
  documentId: z.string().uuid("Format document_id tidak valid."),
});

export const deleteInvestorDocumentSchema = z.object({
  documentId: z.string().uuid("Format document_id tidak valid."),
});

export const investorIdParamSchema = z.object({
  investorId: z.string().uuid("Format investor_id tidak valid."),
});
