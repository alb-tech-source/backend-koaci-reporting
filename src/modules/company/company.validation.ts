import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).optional();
const phone = z.string().trim().min(8).max(20).regex(/^[0-9+()\-\s]+$/, "Format nomor telepon tidak valid");

export const createCompanySchema = z.object({
  company_name: z.string().trim().min(2).max(150),
  company_type: z.enum(["PT", "CV", "Firma", "Perorangan"]).default("PT"),
  industry_sector: optionalText(100),
  description: optionalText(1000),
  director_name: z.string().trim().min(2).max(150),
  director_phone: phone,
  company_email: z.email("Format email perusahaan tidak valid").optional(),
  director_privy: optionalText(150),
  company_address: z.string().trim().min(5).max(500),
  website: z.url("Format website tidak valid").optional(),
  heirs_director_name: optionalText(150),
  heirs_director_phone: phone.optional(),
  heirs_director_address: optionalText(500),
  status: z.enum(["active", "inactive", "blacklist"]).default("active"),
});

export const updateCompanySchema = createCompanySchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "Minimal satu field harus diisi untuk update" },
);

export const listCompanyQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().optional(),
  company_type: z.enum(["PT", "CV", "Firma", "Perorangan"]).optional(),
  status: z.enum(["active", "inactive", "blacklist"]).optional(),
});

export const companyIdParamSchema = z.object({
  id: z.uuid("Format company_id tidak valid"),
});
