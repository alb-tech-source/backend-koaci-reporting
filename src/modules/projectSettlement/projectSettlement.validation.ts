import { z } from "zod";
import { Prisma } from "@prisma/client";

const DECIMAL_PATTERN = /^-?\d+(\.\d+)?$/;

/**
 * Angka desimal yang diterima sebagai number atau string ("500000000.50"),
 * lalu dinormalisasi menjadi string agar tidak kehilangan presisi.
 */
const decimalField = (
  field: string,
  { maxDp, min, max }: { maxDp: number; min?: number; max?: number },
) =>
  z
    .union([z.number(), z.string().trim()])
    .transform((value) => String(value))
    .refine((value) => DECIMAL_PATTERN.test(value), {
      message: `${field} harus berupa angka`,
    })
    .refine((value) => new Prisma.Decimal(value).decimalPlaces() <= maxDp, {
      message: `${field} maksimal ${maxDp} angka desimal`,
    })
    .refine((value) => min === undefined || new Prisma.Decimal(value).gte(min), {
      message: `${field} minimal ${min}`,
    })
    .refine((value) => max === undefined || new Prisma.Decimal(value).lte(max), {
      message: `${field} maksimal ${max}`,
    });

const money = (field: string, min = 0) => decimalField(field, { maxDp: 2, min });
const pct = (field: string) => decimalField(field, { maxDp: 4, min: 0, max: 100 });

const investorCompensationSchema = z.object({
  investor_id: z.uuid("Format investor_id tidak valid"),
  compensation_pct: pct("compensation_pct").default("0"),
});

const settlementFields = {
  profit_model: z.string().trim().min(1, "profit_model wajib diisi"),
  total_capital: money("total_capital").refine(
    (value) => new Prisma.Decimal(value).gt(0),
    { message: "total_capital harus lebih besar dari 0" },
  ),
  sales_amount: money("sales_amount"),
  other_cost: money("other_cost").default("0"),
  other_cost_description: z.string().trim().default(""),
  applicant_share_pct: pct("applicant_share_pct"),
  koaci_share_pct: pct("koaci_share_pct"),
  koaci_portion_pct: pct("koaci_portion_pct"),
  investor_portion_pct: pct("investor_portion_pct"),
  investors: z.array(investorCompensationSchema).default([]),
};

const uniqueInvestors = (investors: { investor_id: string }[] | undefined) =>
  !investors ||
  new Set(investors.map((i) => i.investor_id)).size === investors.length;

const sumsTo100 = (a: string, b: string) =>
  new Prisma.Decimal(a).plus(b).eq(100);

export const createProjectSettlementBodySchema = z
  .object({
    project_id: z.uuid("Format project_id tidak valid"),
    ...settlementFields,
  })
  .refine((data) => uniqueInvestors(data.investors), {
    path: ["investors"],
    message: "investor_id tidak boleh duplikat",
  })
  .refine((data) => sumsTo100(data.applicant_share_pct, data.koaci_share_pct), {
    path: ["koaci_share_pct"],
    message: "applicant_share_pct + koaci_share_pct harus berjumlah 100",
  })
  .refine(
    (data) => sumsTo100(data.koaci_portion_pct, data.investor_portion_pct),
    {
      path: ["investor_portion_pct"],
      message: "koaci_portion_pct + investor_portion_pct harus berjumlah 100",
    },
  );

// Tanpa .default() agar field yang tidak dikirim tetap memakai nilai tersimpan.
// Validasi jumlah persen dilakukan di service setelah merge dengan data lama.
export const updateProjectSettlementBodySchema = z
  .object({
    profit_model: settlementFields.profit_model,
    total_capital: settlementFields.total_capital,
    sales_amount: settlementFields.sales_amount,
    other_cost: money("other_cost"),
    other_cost_description: z.string().trim(),
    applicant_share_pct: settlementFields.applicant_share_pct,
    koaci_share_pct: settlementFields.koaci_share_pct,
    koaci_portion_pct: settlementFields.koaci_portion_pct,
    investor_portion_pct: settlementFields.investor_portion_pct,
    investors: z.array(investorCompensationSchema),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Minimal satu field harus diisi untuk update",
  })
  .refine((data) => uniqueInvestors(data.investors), {
    path: ["investors"],
    message: "investor_id tidak boleh duplikat",
  });

export const projectSettlementIdParamSchema = z.object({
  settlementId: z.uuid("Format project_settlement_id tidak valid"),
});

export const listProjectSettlementQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().optional(),
  status: z.enum(["review", "approved", "rejected"]).optional(),
  project_id: z.uuid("Format project_id tidak valid").optional(),
});
