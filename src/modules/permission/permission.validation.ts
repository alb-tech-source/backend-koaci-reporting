import { z } from "zod";

export const createPermissionSchema = z.object({
  permission_key: z
    .string()
    .min(1, "Permission key wajib diisi.")
    .max(100, "Permission key maksimal 100 karakter.")
    .regex(/^[a-zA-Z0-9_:.-]+$/, "Permission key hanya boleh mengandung huruf, angka, dan karakter _:.-"),
});

export const updatePermissionSchema = z
  .object({
    permission_key: z
      .string()
      .min(1, "Permission key wajib diisi.")
      .max(100, "Permission key maksimal 100 karakter.")
      .regex(/^[a-zA-Z0-9_:.-]+$/, "Permission key hanya boleh mengandung huruf, angka, dan karakter _:.-")
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Minimal satu field harus diisi untuk update.",
  });

export const listPermissionQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  permission_key: z.string().optional(),
});

export const permissionIdParamSchema = z.object({
  id: z.uuid("Format permission_id tidak valid"),
});
