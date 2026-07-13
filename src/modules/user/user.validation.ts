import { z } from "zod";

export const createUserSchema = z.object({
  firstname: z.string().min(1, "Firstname wajib diisi.").max(50),
  lastname: z.string().min(1, "Lastname wajib diisi.").max(50),
  email: z.email("Format email tidak valid."),
  password: z
    .string()
    .min(8, "Password minimal 8 karakter.")
    .max(50)
    .optional(),
  is_active: z.boolean().optional().default(false),
  role_name: z.enum(["bod", "admin", "investor"]),
  permission_ids: z.array(z.string().uuid()).optional().default([]),
});

export const updateUserSchema = z
  .object({
    firstname: z.string().min(1).max(50),
    lastname: z.string().min(1).max(50),
    email: z.email("Format email tidak valid").optional(),
    password: z.string().min(8).optional(),
    is_active: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Minimal satu field harus diisi untuk update.",
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
