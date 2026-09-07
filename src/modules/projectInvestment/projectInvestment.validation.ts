import { z } from "zod";

const amount = z.number().positive("Nominal harus lebih besar dari 0");

export const createProjectInvestmentBodySchema = z.object({
  project_id: z.uuid("Format project_id tidak valid"),
  investor_id: z.uuid("Format investor_id tidak valid"),
  amount: amount,
  total_package: z
    .number()
    .int()
    .positive("Total package harus lebih besar dari 0"),
  source_account_transaction: z.string().trim().optional(),
  account_reference: z.string().trim().optional(),
  receipt_number: z.string().trim().optional(),
  payment_method: z.enum(["transfer", "cash"]).default("transfer"),
  destination_account_number: z.string().trim().optional(),
});

export const updateProjectInvestmentBodySchema =
  createProjectInvestmentBodySchema
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
      message: "Minimal satu field harus diisi untuk update",
    });

export const projectInvestmentIdParamSchema = z.object({
  investmentId: z.uuid("Format investment_id tidak valid"),
});

export const listProjectInvestmentQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().optional(),
  status: z.enum(["open", "closed", "target_achieved", "cancelled"]).optional(),
  project_id: z.uuid("Format project_id tidak valid").optional(),
  investor_id: z.uuid("Format investor_id tidak valid").optional(),
});
