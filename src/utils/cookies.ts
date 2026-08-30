import type { Response } from "express";
import { env } from "../config/env.js";
import type { AuthTokens } from "../types/auth.types.js";

/**
 * Auth Cookie Helper
 * Mengatur dan menghapus token auth via httpOnly cookie
 */
export const AUTH_COOKIES = {
  accessToken: "access_token",
  refreshToken: "refresh_token",
} as const;

// Harus sama dengan expiry JWT di auth.service.ts (1h / 7d)
export const ACCESS_TOKEN_MAX_AGE_MS = 60 * 60 * 1000;
export const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const baseCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: env.NODE_ENV === "production" ? "none" : "lax", // "none" untuk cross-domain production
  path: "/",
} as const;

export function setAuthCookies(res: Response, tokens: AuthTokens): void {
  res.cookie(AUTH_COOKIES.accessToken, tokens.accessToken, {
    ...baseCookieOptions,
    maxAge: ACCESS_TOKEN_MAX_AGE_MS,
  });
  res.cookie(AUTH_COOKIES.refreshToken, tokens.refreshToken, {
    ...baseCookieOptions,
    maxAge: REFRESH_TOKEN_MAX_AGE_MS,
  });
}

export function clearAuthCookies(res: Response): void {
  // Flag harus identik dengan saat set (secure/sameSite/path),
  // jika tidak browser tidak menghapus cookie SameSite=None di production
  res.clearCookie(AUTH_COOKIES.accessToken, baseCookieOptions);
  res.clearCookie(AUTH_COOKIES.refreshToken, baseCookieOptions);
}
