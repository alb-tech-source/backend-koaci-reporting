import type { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { ApiError } from "../utils/apiError.js";

/**
 * Error Prisma yang aman diterjemahkan ke status 4xx. Pesan asli Prisma
 * (berisi nama tabel/kolom/constraint) tidak pernah dikirim ke client.
 */
const PRISMA_ERRORS: Record<string, { status: number; message: string }> = {
  P2002: { status: 409, message: "Data sudah ada (duplikat)" },
  P2003: {
    status: 409,
    message: "Data tidak dapat diubah atau dihapus karena masih digunakan oleh data lain",
  },
  P2025: { status: 404, message: "Data tidak ditemukan" },
};

export function errorMiddleware(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const mapped = PRISMA_ERRORS[err.code];
    if (mapped) {
      return res.status(mapped.status).json({
        success: false,
        message: mapped.message,
      });
    }
  }

  if (err?.message === "Not allowed by CORS") {
    return res.status(403).json({ success: false, message: err.message });
  }

  // Error 4xx dari middleware Express (mis. JSON body tidak valid, payload terlalu besar).
  // `expose` diset oleh http-errors hanya untuk pesan yang aman ditampilkan.
  const status = err?.statusCode ?? err?.status;
  if (typeof status === "number" && status >= 400 && status < 500) {
    return res.status(status).json({
      success: false,
      message: err.expose ? err.message : "Request tidak valid",
    });
  }

  console.error(err); // log error asli agar terlihat di Vercel logs
  return res.status(500).json({
    success: false,
    message: "Terjadi kesalahan pada server",
  });
}
