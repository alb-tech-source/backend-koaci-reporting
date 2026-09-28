import { z } from "zod";

// Trim spasi awal/akhir sebelum validasi format (khas hasil copy-paste di form)
const emailSchema = z.string().trim().pipe(z.email("Format email tidak valid"));

// Aturan password tunggal untuk register, reset, change password, dan update user.
export const passwordSchema = z
  .string()
  .min(8, "Password minimal 8 karakter")
  .max(50, "Password maksimal 50 karakter")
  .regex(/[A-Z]/, "Password harus mengandung huruf besar")
  .regex(/[0-9]/, "Password harus mengandung angka");

export const registerSchema = z.object({
  firstname: z.string().min(1, "Firstname wajib diisi").max(50),
  lastname: z.string().min(1, "lastname wajib diisi").max(50),
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password wajib diisi"),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token wajib diisi"),
  newPassword: passwordSchema,
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Password saat ini wajib diisi"),
    newPassword: passwordSchema,
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    path: ["newPassword"],
    message: "Password baru harus berbeda dari password saat ini",
  });
