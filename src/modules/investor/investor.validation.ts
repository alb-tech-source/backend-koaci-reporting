import { z } from "zod";

// Schema untuk membuat Investor baru
export const createInvestorSchema = z.object({
  user_id: z.string().uuid("Format user_id tidak valid."),
  investor_type: z.enum(["individual", "corporation"], {
    message: "Tipe investor harus individual atau corporation.",
  }),
  status: z
    .enum(["active", "inactive", "blacklist"])
    .optional()
    .default("inactive"),
  gender: z.enum(["men", "women"], {
    message: "Gender harus men atau women.",
  }),
  nik: z
    .string()
    .min(16, "NIK minimal 16 karakter.")
    .max(16, "NIK maksimal 16 karakter.")
    .regex(/^[0-9]+$/, "NIK harus berupa angka."),
  address: z
    .string()
    .min(1, "Alamat wajib diisi.")
    .max(255, "Alamat maksimal 255 karakter."),
  privy: z.string().optional(),
  phone: z
    .string()
    .min(10, "Nomor telepon minimal 10 karakter.")
    .max(15, "Nomor telepon maksimal 15 karakter.")
    .regex(/^[0-9+]+$/, "Nomor telepon hanya boleh angka dan +."),
  account_number: z
    .string()
    .min(1, "Nomor rekening wajib diisi.")
    .max(30, "Nomor rekening maksimal 30 karakter.")
    .regex(/^[0-9]+$/, "Nomor rekening harus berupa angka."),
  bank_name: z
    .string()
    .min(1, "Nama bank wajib diisi.")
    .max(50, "Nama bank maksimal 50 karakter."),
  heir_name: z
    .string()
    .max(100, "Nama ahli waris maksimal 100 karakter.")
    .optional(),
  heir_relationship: z
    .string()
    .max(50, "Hubungan ahli waris maksimal 50 karakter.")
    .optional(),
  heir_nik: z
    .string()
    .length(16, "NIK ahli waris harus 16 karakter.")
    .regex(/^[0-9]+$/, "NIK ahli waris harus berupa angka.")
    .optional(),
  heir_address: z
    .string()
    .max(255, "Alamat ahli waris maksimal 255 karakter.")
    .optional(),
  heir_account_number: z
    .string()
    .max(30, "Nomor rekening ahli waris maksimal 30 karakter.")
    .regex(/^[0-9]+$/, "Nomor rekening ahli waris harus berupa angka.")
    .optional(),
  heir_bank_name: z
    .string()
    .max(50, "Nama bank ahli waris maksimal 50 karakter.")
    .optional(),
  heir_phone: z
    .string()
    .max(15, "Nomor telepon ahli waris maksimal 15 karakter.")
    .regex(/^[0-9+]+$/, "Nomor telepon ahli waris hanya boleh angka dan +.")
    .optional(),
});

// Schema untuk update Investor (semua field optional)
export const updateInvestorSchema = z
  .object({
    investor_type: z.enum(["individual", "corporation"]).optional(),
    status: z.enum(["active", "inactive", "blacklist"]).optional(),
    gender: z.enum(["men", "women"]).optional(),
    nik: z
      .string()
      .min(16, "NIK minimal 16 karakter.")
      .max(16, "NIK maksimal 16 karakter.")
      .regex(/^[0-9]+$/, "NIK harus berupa angka.")
      .optional(),
    address: z.string().min(1).max(255).optional(),
    privy: z.string().optional(),
    phone: z
      .string()
      .min(10, "Nomor telepon minimal 10 karakter.")
      .max(15, "Nomor telepon maksimal 15 karakter.")
      .regex(/^[0-9+]+$/, "Nomor telepon hanya boleh angka dan +.")
      .optional(),
    account_number: z
      .string()
      .min(1, "Nomor rekening wajib diisi.")
      .max(30, "Nomor rekening maksimal 30 karakter.")
      .regex(/^[0-9]+$/, "Nomor rekening harus berupa angka.")
      .optional(),
    bank_name: z.string().min(1).max(50).optional(),
    heir_name: z.string().max(100).optional(),
    heir_relationship: z.string().max(50).optional(),
    heir_nik: z
      .string()
      .length(16, "NIK ahli waris harus 16 karakter.")
      .regex(/^[0-9]+$/, "NIK ahli waris harus berupa angka.")
      .optional(),
    heir_address: z.string().max(255).optional(),
    heir_account_number: z
      .string()
      .max(30, "Nomor rekening ahli waris maksimal 30 karakter.")
      .regex(/^[0-9]+$/, "Nomor rekening ahli waris harus berupa angka.")
      .optional(),
    heir_bank_name: z.string().max(50).optional(),
    heir_phone: z
      .string()
      .max(15, "Nomor telepon ahli waris maksimal 15 karakter.")
      .regex(/^[0-9+]+$/, "Nomor telepon ahli waris hanya boleh angka dan +.")
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Minimal satu field harus diisi untuk update.",
  });

// Schema untuk query parameters list Investor
export const listInvestorQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  investor_type: z.enum(["individual", "corporation"]).optional(),
  status: z.enum(["active", "inactive", "blacklist"]).optional(),
  gender: z.enum(["men", "women"]).optional(),
});

// Schema untuk parameter investor_id di URL
export const investorIdParamSchema = z.object({
  id: z.string().uuid("Format investor_id tidak valid."),
});

export const userIdParamSchema = z.object({
  userId: z.string().uuid("Format user_id tidak valid."),
});
