import { z } from "zod";

export const investorSettlementIdParamSchema = z.object({
  investorSettlementId: z.uuid("Format investor_settlement_id tidak valid"),
});

export const listInvestorSettlementQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  project_settlement_id: z
    .uuid("Format project_settlement_id tidak valid")
    .optional(),
  project_id: z.uuid("Format project_id tidak valid").optional(),
  investor_id: z.uuid("Format investor_id tidak valid").optional(),
});
