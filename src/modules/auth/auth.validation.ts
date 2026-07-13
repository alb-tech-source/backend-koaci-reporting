import { z } from "zod";

export const registerSchema = z.object({
  firstname: z.string().min(1, "Firstname wajib diisi").max(50),
  lastname: z.string().min(1, "lastname wajib diisi").max(50),
  email: z.email("Format email tidak valid"),
  password: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .regex(/[A-Z]/, "Password harus mengandung huruf Capital.")
    .regex(/[0-9]/, "Password harus mengandung angka."),
});

export const loginSchema = z.object({
  email: z.email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Format email tidak valid"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token wajib diisi"),
  newPassword: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .regex(/[A-Z]/, "Password harus mengandung huruf besar")
    .regex(/[0-9]/, "Password harus mengandung angka"),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token wajib diisi"),
});
