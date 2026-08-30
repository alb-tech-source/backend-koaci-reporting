import { z } from "zod";

// Trim spasi awal/akhir sebelum validasi format (khas hasil copy-paste di form)
const emailSchema = z.string().trim().pipe(z.email("Format email tidak valid."));

export const createUserSchema = z.object({
  firstname: z.string().min(1, "Firstname wajib diisi.").max(50),
  lastname: z.string().min(1, "Lastname wajib diisi.").max(50),
  email: emailSchema,
  password: z
    .string()
    .min(8, "Password minimal 8 karakter.")
    .max(50)
    .optional(),
  is_active: z.boolean().optional().default(false),
  role_name: z.enum(["user", "investor", "admin", "superadmin", "bod"]),
  permission_ids: z.array(z.string().uuid()).optional().default([]),
});

export const updateUserSchema = z
  .object({
    firstname: z.string().min(1).max(50).optional(),
    lastname: z.string().min(1).max(50).optional(),
    email: emailSchema.optional(),
    password: z.string().min(8).max(50).optional(),
    is_active: z.boolean().optional(),
    role_name: z.enum(["user", "investor", "admin", "superadmin", "bod"]).optional(),
    permission_ids: z.array(z.string().uuid()).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Minimal satu field harus diisi untuk update.",
  })
  .refine((data) => {
    // Check for duplicate permission_ids
    if (data.permission_ids && data.permission_ids.length > 0) {
      const unique = new Set(data.permission_ids);
      if (unique.size !== data.permission_ids.length) {
        return false; // Has duplicates
      }
    }
    return true;
  }, {
    message: "permission_ids tidak boleh mengandung duplikat",
  });

export const listUserQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  is_active: z
    .enum(["true", "false"])
    .optional()
    .transform((val) => (val === undefined ? undefined : val === "true")),
});

export const userIdParamSchema = z.object({
  id: z.uuid("Format user_id tidak valid"),
});
