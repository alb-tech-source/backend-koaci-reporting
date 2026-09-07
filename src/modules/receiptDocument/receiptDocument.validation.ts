import { z } from "zod";

export const createReceiptDocumentBodySchema = z.object({
  project_investment_id: z.uuid("Format project_investment_id tidak valid"),
  receipt_name: z.string().trim().min(2).max(150),
  storage_provider: z.enum(["cloudflare", "aws", "tencent"]).default("cloudflare"),
});

export const receiptDocumentIdParamSchema = z.object({
  receiptId: z.uuid("Format receipt_document_id tidak valid"),
});

export const receiptDocumentInvestmentIdParamSchema = z.object({
  investmentId: z.uuid("Format investment_id tidak valid"),
});
