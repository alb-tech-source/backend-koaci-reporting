import type { Request, Response } from "express";
import { rateLimit, ipKeyGenerator } from "express-rate-limit";

const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 menit

const tooManyAttempts = (_req: Request, res: Response) =>
  res.status(429).json({
    success: false,
    message:
      "Terlalu banyak percobaan login gagal. Silakan coba lagi dalam 15 menit.",
  });

const clientIp = (req: Request) => ipKeyGenerator(req.ip ?? "unknown");

/**
 * Rate limit login, dua lapis. Hanya percobaan GAGAL (status >= 400) yang
 * dihitung, sehingga user yang berhasil login tidak ikut terblokir.
 *
 * 1. Per IP + email: menahan brute force password pada satu akun.
 * 2. Per IP: menahan credential stuffing (mencoba banyak email dari satu IP).
 *
 * Catatan: store bawaan adalah memori per instance. Di Vercel, hitungan tidak
 * dibagi antar instance, jadi batas efektif bisa lebih longgar.
 */
export const loginRateLimiter = [
  rateLimit({
    windowMs: LOGIN_WINDOW_MS,
    limit: 5,
    skipSuccessfulRequests: true,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    keyGenerator: (req) =>
      `${clientIp(req)}:${String(req.body?.email ?? "").trim().toLowerCase()}`,
    handler: tooManyAttempts,
  }),
  rateLimit({
    windowMs: LOGIN_WINDOW_MS,
    limit: 20,
    skipSuccessfulRequests: true,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    keyGenerator: clientIp,
    handler: tooManyAttempts,
  }),
];
