import { Request, Response, NextFunction } from "express";
import Jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ApiError } from "../utils/apiError.js";
import type { JwtPayload } from "../types/auth.types.js";

/**
 * Extend Express Request type to include user info
 */
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
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
  next: NextFunction
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
    req.user = decoded;
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
  requireAll: boolean = false
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new ApiError(401, "User tidak terautentikasi");
      }

      const userPermissions = req.user.permissions || [];

      // Check if user has required permissions
      const hasPermission = requireAll
        ? requiredPermissions.every((perm) => userPermissions.includes(perm))
        : requiredPermissions.some((perm) => userPermissions.includes(perm));

      if (!hasPermission) {
        throw new ApiError(
          403,
          `Anda tidak memiliki izin: ${requiredPermissions.join(", ")}`
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
      if (!req.user) {
        throw new ApiError(401, "User tidak terautentikasi");
      }

      if (!allowedRoles.includes(req.user.role)) {
        throw new ApiError(
          403,
          `Anda tidak memiliki akses. Role required: ${allowedRoles.join(", ")}`
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
  requireAll: boolean = false
) => {
  return [
    requireRole(allowedRoles),
    requirePermission(requiredPermissions, requireAll),
  ];
};
