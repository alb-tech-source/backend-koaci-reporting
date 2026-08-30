import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).optional();
const amount = z.number().positive("Nominal harus lebih besar dari 0");
const percentage = z.number().min(0).max(100);

export const createProjectSchema = z.object({
  company_id: z.uuid("Format company_id tidak valid"),
  project_key: z
    .string()
    .trim()
    .min(3)
    .max(50)
    .regex(
      /^[a-z0-9][a-z0-9._-]*$/,
      "project_key hanya boleh huruf kecil, angka, titik, garis bawah, dan strip",
    ),
  funding_required: amount,
  net_margin_amount: amount.optional(),
  applicant_profit_share_percentage: percentage.optional(),
  applicant_profit_share_amount: amount.optional(),
  koaci_profit_share_percentage: percentage.optional(),
  koaci_profit_share_amount: amount.optional(),
  koaci_profit_share_beneficiary_percentage: percentage.optional(),
  koaci_profit_share_beneficiary_amount: amount.optional(),
  investor_profit_share_percentage: percentage.optional(),
  investor_profit_share_amount: amount.optional(),
  aggregate_fund_amount: amount.optional(),
  disbursement_amount: amount.optional(),
  disbursement_date: z.coerce.date().optional(),
  source_account_number: optionalText(50),
  destination_account_number: optionalText(50),
  beneficiary_refund_date: z.coerce.date().optional(),
  beneficiary_refund_amount: amount.optional(),
  beneficiary_repayment_source_account: optionalText(50),
  beneficiary_repayment_destination_account: optionalText(50),
  url_transaction_folder: z.url("Format URL tidak valid").optional(),
  fund_disbursement_official_record: optionalText(255),
  status: z.enum(["open", "closed", "target_achieved", "cancelled"]).default("open"),
});

export const updateProjectSchema = createProjectSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "Minimal satu field harus diisi untuk update" },
);

export const listProjectQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().optional(),
  status: z.enum(["open", "closed", "target_achieved", "cancelled"]).optional(),
  company_id: z.uuid("Format company_id tidak valid").optional(),
});

export const projectIdParamSchema = z.object({
  id: z.uuid("Format project_id tidak valid"),
});
