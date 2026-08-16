import { Request, Response, NextFunction } from "express";
import Jwt from "jsonwebtoken";
import type { Express } from "express";
import express from "express";
import { env } from "../config/env.js";
import { ApiError } from "../utils/apiError.js";
import type { JwtPayload } from "../types/auth.types.js";

export type AccessScope = "any" | "own";
export type AccessResource =
  | "users"
  | "roles"
  | "investors"
  | "investor_documents"
  | "companies"
  | "company_documents";

export interface AccessContext {
  resource: AccessResource;
  action: string;
  scope: AccessScope;
  userId: string;
}

/**
 * Extend Express Request type to include authenticated user info
 * Note: Using 'authUser' instead of 'user' to avoid conflict with Express's built-in User type
 */
declare global {
  namespace Express {
    interface Request {
      authUser?: JwtPayload;
      access?: AccessContext;
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
    const token = req.cookies.access_token;

    if (!token) {
      throw new ApiError(401, "Token tidak ditemukan");
    }

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
export const authorize = (
  resource: AccessResource,
  action: string,
  allowedScopes: readonly AccessScope[] = ["any", "own"],
) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.authUser) {
        throw new ApiError(401, "User tidak terautentikasi");
      }

      const permissions = new Set(req.authUser.permissions ?? []);
      const scope = allowedScopes.find((candidate) =>
        permissions.has(`${resource}:${action}:${candidate}`),
      );

      if (!scope) {
        const expected = allowedScopes.map(
          (candidate) => `${resource}:${action}:${candidate}`,
        );
        throw new ApiError(
          403,
          `Anda tidak memiliki izin: ${expected.join(" atau ")}`,
        );
      }

      req.access = {
        resource,
        action,
        scope,
        userId: req.authUser.userId,
      };
      return next();
    } catch (error) {
      return next(error);
    }
  };
};

export const authorizeRoleMutation = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.authUser) {
      throw new ApiError(401, "User tidak terautentikasi");
    }

    const changesRole = req.body?.role_name !== undefined;
    const permissionIds = req.body?.permission_ids as string[] | undefined;
    if (!changesRole && permissionIds === undefined) return next();

    const actorPermissions = new Set(req.authUser.permissions ?? []);
    if (!actorPermissions.has("roles:update:any")) {
      throw new ApiError(403, "Anda tidak memiliki izin: roles:update:any");
    }

    if (permissionIds?.length) {
      const prisma = await import("../lib/prisma.js").then(
        (module) => module.default,
      );
      const requested = await prisma.permission.findMany({
        where: { permission_id: { in: permissionIds } },
        select: { permission_key: true },
      });

      if (requested.length !== new Set(permissionIds).size) {
        throw new ApiError(400, "Terdapat permission_id yang tidak valid");
      }

      const canGrant = requested.every(({ permission_key }) => {
        if (actorPermissions.has(permission_key)) return true;
        const parts = permission_key.split(":");
        if (parts.length !== 3 || parts[2] !== "own") return false;
        return actorPermissions.has(`${parts[0]}:${parts[1]}:any`);
      });

      if (!canGrant) {
        throw new ApiError(
          403,
          "Anda tidak dapat memberikan permission di luar akses Anda",
        );
      }
    }

    return next();
  } catch (error) {
    return next(error);
  }
};

/** @deprecated Gunakan authorize(resource, action). */
export const adminRequirePermission = (
  requiredPermissions: string[],
  requireAll: boolean = false,
) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.authUser) {
        throw new ApiError(401, "User tidak terautentikasi");
      }
      const hasPermission = requireAll
        ? requiredPermissions.every((perm) =>
            req.authUser!.permissions.includes(perm),
          )
        : requiredPermissions.some((perm) =>
            req.authUser!.permissions.includes(perm),
          );

      if (!hasPermission) {
        throw new ApiError(
          403,
          `Anda tidak memiliki izin: ${requiredPermissions.join(", ")}`,
        );
      }
      return next();
    } catch (error) {
      return next(error);
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
    adminRequirePermission(requiredPermissions, requireAll),
  ];
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
