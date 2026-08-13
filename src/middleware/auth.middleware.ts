import { Request, Response, NextFunction } from "express";
import Jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ApiError } from "../utils/apiError.js";
import type { JwtPayload } from "../types/auth.types.js";

/**
 * Extend Express Request type to include authenticated user info
 * Note: Using 'authUser' instead of 'user' to avoid conflict with Express's built-in User type
 */
declare global {
  namespace Express {
    interface Request {
      authUser?: JwtPayload;
    }
  }
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user info to request
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ApiError(401, "Token tidak ditemukan");
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    let decoded: JwtPayload;
    try {
      decoded = Jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    } catch (error) {
      throw new ApiError(401, "Token tidak valid atau sudah kadaluarsa");
    }

    // Attach user info to request
    req.authUser = decoded;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Permission checker middleware factory
 * Creates middleware that checks if user has required permissions
 *
 * @param requiredPermissions - Array of permission keys required
 * @param requireAll - If true, user must have ALL permissions (default: false)
 *
 * Usage:
 * - app.get("/reports", authMiddleware, requirePermission(["reports:read"]), getReports)
 * - app.post("/reports", authMiddleware, requirePermission(["reports:create"]), createReport)
 * - app.delete("/users/:id", authMiddleware, requirePermission(["users:delete"], true), deleteUser)
 */
export const requirePermission = (
  requiredPermissions: string[],
  requireAll: boolean = false,
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.authUser) {
        throw new ApiError(401, "User tidak terautentikasi");
      }

      const userPermissions = req.authUser.permissions || [];

      // Check if user has required permissions
      const hasPermission = requireAll
        ? requiredPermissions.every((perm) => userPermissions.includes(perm))
        : requiredPermissions.some((perm) => userPermissions.includes(perm));

      if (!hasPermission) {
        throw new ApiError(
          403,
          `Anda tidak memiliki izin: ${requiredPermissions.join(", ")}`,
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Role checker middleware factory
 * Creates middleware that checks if user has required role
 *
 * @param allowedRoles - Array of role names allowed to access
 *
 * Usage:
 * - app.get("/admin/dashboard", authMiddleware, requireRole(["admin", "bod"]), getAdminDashboard)
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.authUser) {
        throw new ApiError(401, "User tidak terautentikasi");
      }

      if (!allowedRoles.includes(req.authUser.role)) {
        throw new ApiError(
          403,
          `Anda tidak memiliki akses. Role required: ${allowedRoles.join(", ")}`,
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Combine permission and role checks
 * User must have at least one of the required roles AND at least one of the required permissions
 *
 * @param allowedRoles - Array of role names allowed
 * @param requiredPermissions - Array of permission keys required
 * @param requireAll - If true, user must have ALL permissions
 *
 * Usage:
 * - app.post("/reports", authMiddleware, requireRoleAndPermission(["admin", "bod"], ["reports:create"]), createReport)
 */
export const requireRoleAndPermission = (
  allowedRoles: string[],
  requiredPermissions: string[],
  requireAll: boolean = false,
) => {
  return [
    requireRole(allowedRoles),
    requirePermission(requiredPermissions, requireAll),
  ];
};

/**
 * Role elevation restriction middleware
 * Prevents users from elevating others to roles higher than their own
 * Specifically: Admin cannot elevate users to SuperAdmin
 *
 * @param restrictedElevations - Array of [fromRole, toRole] pairs that are restricted
 *
 * Usage:
 * - app.put("/users/:id", authMiddleware, restrictRoleElevation([["admin", "superadmin"]]), updateUser)
 */
export const restrictRoleElevation = (
  restrictedElevations: [string, string][]
) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.authUser) {
        throw new ApiError(401, "User tidak terautentikasi");
      }

      const currentUserRole = req.authUser.role;
      const targetRole = req.body.role_name;

      // Only check if role elevation is being attempted
      if (targetRole && targetRole !== currentUserRole) {
        // Check if this elevation is restricted
        const isRestricted = restrictedElevations.some(
          ([fromRole, toRole]) =>
            fromRole === currentUserRole && toRole === targetRole
        );

        if (isRestricted) {
          throw new ApiError(
            403,
            `Role ${currentUserRole} tidak memiliki izin untuk mengubah user menjadi role ${targetRole}. Hubungi superadmin untuk perubahan ini.`
          );
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Role deletion protection middleware
 * Prevents users from deleting other users with protected roles
 * Only SuperAdmin can delete BOD and SuperAdmin users
 *
 * @param protectedRoles - Array of roles that can only be deleted by superadmin
 *
 * Usage:
 * - app.delete("/users/:id", authMiddleware, restrictRoleDeletion(["bod", "superadmin"]), deleteUser)
 */
export const restrictRoleDeletion = (
  protectedRoles: string[]
) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.authUser) {
        throw new ApiError(401, "User tidak terautentikasi");
      }

      const currentUserRole = req.authUser.role;
      const targetUserId = req.params.id as string;

      // Only superadmin can delete protected roles
      if (currentUserRole !== "superadmin") {
        // Fetch target user to check their role
        const prisma = await import("../lib/prisma.js").then((m) => m.default);
        const targetUser = await prisma.user.findUnique({
          where: { user_id: targetUserId },
          select: {
            user_id: true,
            role: {
              select: {
                role_name: true,
              },
            },
          },
        });

        if (!targetUser) {
          throw new ApiError(404, "User tidak ditemukan");
        }

        const targetUserRole = targetUser.role?.role_name;

        // Check if target user has protected role
        if (targetUserRole && protectedRoles.includes(targetUserRole)) {
          throw new ApiError(
            403,
            `Hanya SuperAdmin yang dapat menghapus user dengan role ${targetUserRole}. User dengan role ${currentUserRole} tidak memiliki izin untuk user ini.`
          );
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Investor activity validation middleware
 * Validates that investor users meet all requirements before performing activities
 * Requirements:
 * 1. Role must be 'investor'
 * 2. Account must be active (is_active = true)
 * 3. Email must be verified (email_verified = true)
 *
 * Error messages guide users to appropriate actions:
 * - Email not verified → Request email verification
 * - Account not active → Contact admin
 *
 * Usage:
 * - app.post("/investor/reports", authMiddleware, requireValidInvestor, createReport)
 * - app.get("/investor/dashboard", authMiddleware, requireValidInvestor, getDashboard)
 */
export const requireValidInvestor = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.authUser) {
      throw new ApiError(401, "User tidak terautentikasi");
    }

    // Check if user role is investor
    if (req.authUser.role !== "investor") {
      throw new ApiError(
        403,
        "Akses ini hanya untuk role investor. Role anda: " + req.authUser.role,
      );
    }

    // Fetch fresh user data from database to ensure current status
    const prisma = await import("../lib/prisma.js").then((m) => m.default);
    const user = await prisma.user.findUnique({
      where: { user_id: req.authUser!.userId },
      select: {
        user_id: true,
        email: true,
        is_active: true,
        email_verified: true,
        firstname: true,
        lastname: true,
      },
    });

    if (!user) {
      throw new ApiError(404, "User tidak ditemukan");
    }

    // Check if email is verified
    if (!user.email_verified) {
      throw new ApiError(
        403,
        "Email anda belum diverifikasi. Silakan verifikasi email anda terlebih dahulu dengan mengirimkan permintaan verifikasi email melalui endpoint /api/auth/send-verify-email",
      );
    }

    // Check if account is active
    if (!user.is_active) {
      throw new ApiError(
        403,
        "Akun anda belum aktif. Silakan hubungi admin untuk mengaktifkan akun anda.",
      );
    }

    // All checks passed - update req.authUser with fresh data
    req.authUser.isActive = user.is_active;

    next();
  } catch (error) {
    next(error);
  }
};
