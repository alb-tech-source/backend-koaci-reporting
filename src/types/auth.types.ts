import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  refreshTokenSchema,
  resetPasswordSchema,
} from "../modules/auth/auth.validation.js";
import { z } from "zod";

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type RefreshToken = z.infer<typeof refreshTokenSchema>;

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
