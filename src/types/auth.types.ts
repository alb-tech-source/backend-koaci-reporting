import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from "../modules/auth/auth.validation.js";
import { z } from "zod";

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  isActive: boolean;
  permissions: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
