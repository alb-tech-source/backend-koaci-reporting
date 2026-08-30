import { Request, Response, NextFunction } from "express";
import { authService } from "./auth.service.js";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "./auth.validation.js";
import type { SafeUser } from "../../types/user.types.js";
import { ApiError } from "../../utils/apiError.js";
import { setAuthCookies, clearAuthCookies } from "../../utils/cookies.js";
import { env } from "../../config/env.js";
import { activityLogService } from "../activityLog/activityLog.service.js";

/**
 * Auth Controller
 * Handles all authentication-related HTTP requests
 */
export const authController = {
  /**
   * Register new user
   * POST /api/auth/register
   */
  async register(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // Validate input
      const validatedData = registerSchema.parse(req.body);

      // Register user
      const user = await authService.register(validatedData);

      res.status(201).json({
        success: true,
        message:
          "Registrasi berhasil. Silakan hubungi admin untuk aktivasi akun.",
        data: {
          user,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Login user
   * POST /api/auth/login
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate input
      const validatedData = loginSchema.parse(req.body);

      // Login user
      const result = await authService.login(validatedData);

      // Log successful login
      await activityLogService
        .logActivity({
          userId: result.user.user_id,
          action: "LOGIN_SUCCESS",
          entityType: "User",
          entityId: result.user.user_id,
          description: `User ${result.user.email} berhasil login`,
          ipAddress: req.ip || req.socket.remoteAddress,
          userAgent: req.get("user-agent"),
        })
        .catch((err) => console.error("Failed to log login:", err));

      // Simpan token ke httpOnly cookie
      setAuthCookies(res, result.tokens);

      res.status(200).json({
        success: true,
        message: "Login berhasil",
      });
    } catch (error) {
      // Log failed login attempt
      if (error instanceof ApiError && error.statusCode === 401) {
        await activityLogService
          .logActivity({
            userId: "anonymous",
            action: "LOGIN_FAILED",
            entityType: "User",
            entityId: req.body.email || "unknown",
            description: `Gagal login untuk email ${req.body.email}`,
            ipAddress: req.ip || req.socket.remoteAddress,
            userAgent: req.get("user-agent"),
          })
          .catch((err) => console.error("Failed to log failed login:", err));
      }
      next(error);
    }
  },

  /**
   * Login user with google
   * POST /api/auth/google
   */
  async googleLogin(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    // Passport may attach user with different shape; coerce to any to read user_id or id
    const userObj: any = req.user;
    const userId = userObj?.user_id ?? userObj?.id;

    try {
      // Validate user ID
      if (!userId) {
        throw new ApiError(401, "User ID tidak ditemukan dalam token");
      }

      // Login user
      const result = await authService.googleLogin(userId);

      // Log successful Google login
      await activityLogService
        .logActivity({
          userId: result.user.user_id,
          action: "LOGIN_SUCCESS",
          entityType: "User",
          entityId: result.user.user_id,
          description: `User ${result.user.email} berhasil login melalui Google OAuth`,
          metadata: { method: "Google OAuth" },
          ipAddress: req.ip || req.socket.remoteAddress,
          userAgent: req.get("user-agent"),
        })
        .catch((err) => console.error("Failed to log Google login:", err));

      // Token dikirim via httpOnly cookie, BUKAN query string
      setAuthCookies(res, result.tokens);

      // Frontend memanggil GET /api/auth/me (dengan cookie) untuk mengambil user
      return res.redirect(`${env.CLIENT_URL}/auth/callback`);
    } catch (error) {
      // Browser melakukan navigasi penuh: balas dengan redirect, bukan JSON.
      // Samakan pola dengan failureRedirect passport.
      console.error("Google login callback failed:", error);
      return res.redirect(`${env.CLIENT_URL}/login?error=oauth_failed`);
    }
  },

  /**
   * Refresh access token using refresh token
   * POST /api/auth/refresh
   */
  async refreshAccessToken(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // Token HANYA dibaca dari httpOnly cookie (tidak ada fallback body)
      const refreshToken = req.cookies?.refresh_token;

      if (!refreshToken) {
        throw new ApiError(401, "Refresh token tidak ditemukan");
      }

      // Refresh token
      const tokens = await authService.refreshAccessToken(refreshToken);

      // Rotasi token via cookie baru
      setAuthCookies(res, tokens);

      res.status(200).json({
        success: true,
        message: "Token berhasil diperbarui",
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Request password reset
   * POST /api/auth/forgot-password
   */
  async forgotPassword(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // Validate input
      const validatedData = forgotPasswordSchema.parse(req.body);

      // Process forgot password
      await authService.forgotPassword(validatedData);

      // Selalu return sukses (hindari email enumeration)
      res.status(200).json({
        success: true,
        message:
          "Jika email terdaftar, link reset password akan dikirim ke email Anda.",
        data: null,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Reset password using token
   * POST /api/auth/reset-password
   */
  async resetPassword(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // Validate input - note: API expects 'token' but schema uses 'token'
      const validatedData = resetPasswordSchema.parse({
        token: req.body.token,
        newPassword: req.body.newPassword,
      });

      // Reset password
      await authService.resetPassword(validatedData);

      res.status(200).json({
        success: true,
        message:
          "Password berhasil direset. Silakan login dengan password baru.",
        data: null,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get current user profile
   * GET /api/auth/me
   * Requires auth middleware
   */
  async getCurrentUser(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // User info from auth middleware
      const userId = req.authUser?.userId;

      if (!userId) {
        throw new ApiError(401, "User tidak terautentikasi");
      }

      // Fetch user from database
      const prisma = await import("../../lib/prisma.js").then((m) => m.default);
      const user = await prisma.user.findUnique({
        where: { user_id: userId },
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      });

      if (!user) {
        throw new ApiError(404, "User tidak ditemukan");
      }

      // Extract permissions
      const permissions =
        user.role?.rolePermissions?.map(
          (rp: any) => rp.permission.permission_key,
        ) ?? [];

      const toSafeUser = (await import("../user/user.service.js")).toSafeUser;

      res.status(200).json({
        success: true,
        message: "User profile berhasil diambil",
        data: {
          user: toSafeUser(user),
          role: user.role?.role_name ?? null,
          permissions: permissions,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Logout user
   * POST /api/auth/logout
   * Requires auth middleware
   *
   * Note: JWT is stateless, penghapusan cookie httpOnly di server
   * menghilangkan akses client terhadap token (logout efektif).
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.authUser?.userId;
      const userEmail = req.authUser?.email;

      if (!userId) {
        throw new ApiError(401, "User tidak terautentikasi");
      }

      // Log logout activity
      await activityLogService
        .logActivity({
          userId: userId,
          action: "LOGOUT",
          entityType: "User",
          entityId: userId,
          description: `User ${userEmail} berhasil logout`,
          ipAddress: req.ip || req.socket.remoteAddress,
          userAgent: req.get("user-agent"),
        })
        .catch((err) => console.error("Failed to log logout:", err));

      // Update last logout time (optional, for audit purposes)
      // const prisma = await import("../../lib/prisma").then((m) => m.default);

      // TODO: Add logout_timestamp field to User model if needed for audit
      // await prisma.user.update({
      //   where: { user_id: userId },
      //   data: { last_logout_at: new Date() },
      // });

      // Hapus cookie auth (access & refresh) dari browser
      clearAuthCookies(res);

      res.status(200).json({
        success: true,
        message: "Logout berhasil",
        data: null,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Send email verification
   * POST /api/auth/send-verify-email
   */
  async sendVerifyEmailController(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // Validate input
      const validateInput = verifyEmailSchema.parse(req.body);

      // Process send verify email
      await authService.sendVerifyEmail(validateInput);

      // Selalu return sukses
      res.status(200).json({
        success: true,
        message: "Email verifikasi telah dikirim ke email anda",
        data: null,
      });
    } catch (error) {
      next(error);
    }
  },

  async verifyEmailController(req: Request, res: Response, next: NextFunction) {
    const { token } = req.query;

    try {
      const verify = await authService.verifyEmail(token as string);

      // Selalu return sukses
      res.status(200).json({
        success: true,
        message: "Akun anda telah berhasil diverifikasi",
        data: null,
      });
    } catch (error) {
      next(error);
    }
  },
};
