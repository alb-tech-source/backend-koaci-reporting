import { Request, Response, NextFunction } from "express";
import { authService } from "./auth.service.js";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
} from "./auth.validation.js";
import type { SafeUser } from "../../types/user.types.js";
import { ApiError } from "../../utils/apiError.js";

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

      res.status(200).json({
        success: true,
        message: "Login berhasil",
        data: {
          user: result.user,
          tokens: result.tokens,
        },
      });
    } catch (error) {
      next(error);
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
      // Validate input
      const validatedData = refreshTokenSchema.parse(req.body);

      // Refresh token
      const tokens = await authService.refreshAccessToken(
        validatedData.refreshToken,
      );

      res.status(200).json({
        success: true,
        message: "Token berhasil diperbarui",
        data: {
          tokens,
        },
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
      const userId = req.user?.userId;

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
   * Note: JWT is stateless, so real logout happens on client side
   * by removing the tokens. This endpoint is for cleanup/logging purposes.
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        throw new ApiError(401, "User tidak terautentikasi");
      }

      // Update last logout time (optional, for audit purposes)
      // const prisma = await import("../../lib/prisma").then((m) => m.default);

      // TODO: Add logout_timestamp field to User model if needed for audit
      // await prisma.user.update({
      //   where: { user_id: userId },
      //   data: { last_logout_at: new Date() },
      // });

      res.status(200).json({
        success: true,
        message: "Logout berhasil",
        data: null,
      });
    } catch (error) {
      next(error);
    }
  },
};
