import Jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export interface EmailTokenPayload {
  userId: string;
  email: string;
}

export const generateEmailVerificationToken = (
  payload: EmailTokenPayload,
): string => {
  return Jwt.sign(payload, env.JWT_VERIFY_SECRET, { expiresIn: "30m" });
};

export const verifyEmailVerificationToken = (
  token: string,
): EmailTokenPayload => {
  return Jwt.verify(token, env.JWT_VERIFY_SECRET) as EmailTokenPayload;
};
