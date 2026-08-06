import type { Response, Request } from "express";
import { userService } from "./user.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import type {
  CreateUserInput,
  UpdateUserInput,
  ListUserQuery,
} from "../../types/user.types.js";
import { activityLogService } from "../activityLog/activityLog.service.js";

export const userController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const { user, temporaryPassword } = await userService.createUser(req.body);

    // Log user creation
    await activityLogService
      .logActivity({
        userId: req.authUser!.userId,
        action: "USER_CREATE",
        entityType: "User",
        entityId: user.user_id,
        description: `User ${user.email} berhasil dibuat oleh ${req.authUser!.email}`,
        metadata: {
          createdUser: {
            userId: user.user_id,
            email: user.email,
            firstname: user.firstname,
            lastname: user.lastname,
          },
        },
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get("user-agent"),
      })
      .catch((err) => console.error("Failed to log user creation:", err));

    return ApiResponse(res, 201, {
      user,
      temporaryPassword,
    });
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const parseValue = (v: any) => {
      if (v === "true") return true;
      if (v === "false") return false;
      if (v === "" || v === null || v === undefined) return v;
      // numeric (ints and floats)
      if (!Number.isNaN(Number(v)) && v !== null && v !== "") return Number(v);
      return v;
    };

    const parseQuery = (q: Record<string, any>): ListUserQuery => {
      const out: Record<string, any> = {};
      for (const [key, value] of Object.entries(q)) {
        if (Array.isArray(value)) out[key] = value.map(parseValue);
        else out[key] = parseValue(value);
      }
      return out as ListUserQuery;
    };

    const query = parseQuery(req.query as unknown as Record<string, any>);
    const result = await userService.listUsers(query);
    return ApiResponse(res, 200, result.data, result.meta);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.getUserById(req.params.id as string);
    return ApiResponse(res, 200, user);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.updateUser(req.params.id as string, req.body);

    // Log user update
    await activityLogService
      .logActivity({
        userId: req.authUser!.userId,
        action: "USER_UPDATE",
        entityType: "User",
        entityId: user.user_id,
        description: `User ${user.email} berhasil diupdate oleh ${req.authUser!.email}`,
        metadata: {
          updatedUser: {
            userId: user.user_id,
            email: user.email,
            changes: req.body,
          },
        },
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get("user-agent"),
      })
      .catch((err) => console.error("Failed to log user update:", err));

    return ApiResponse(res, 200, user);
  }),

  changeActivation: asyncHandler(async (req: Request, res: Response) => {
    const { isActive } = req.body ? req.body : undefined;
    const user = await userService.changeUserActivation(req.params.id as string, isActive);

    // Log user activation/deactivation
    await activityLogService
      .logActivity({
        userId: req.authUser!.userId,
        action: isActive ? "USER_ACTIVATE" : "USER_DEACTIVATE",
        entityType: "User",
        entityId: user.user_id,
        description: `User ${user.email} berhasil ${isActive ? "diaktifkan" : "dinonaktifkan"} oleh ${req.authUser!.email}`,
        metadata: {
          targetUser: {
            userId: user.user_id,
            email: user.email,
            isActive: user.is_active,
          },
        },
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get("user-agent"),
      })
      .catch((err) => console.error("Failed to log user activation change:", err));

    return ApiResponse(res, 200, user);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.id as string;

    // Get user info before deletion for logging
    const user = await userService.getUserById(userId);

    await userService.deleteUser(userId);

    // Log user deletion
    await activityLogService
      .logActivity({
        userId: req.authUser!.userId,
        action: "USER_DELETE",
        entityType: "User",
        entityId: userId,
        description: `User ${user.email} berhasil dihapus oleh ${req.authUser!.email}`,
        metadata: {
          deletedUser: {
            userId: user.user_id,
            email: user.email,
            firstname: user.firstname,
            lastname: user.lastname,
          },
        },
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get("user-agent"),
      })
      .catch((err) => console.error("Failed to log user deletion:", err));

    return ApiResponse(res, 200, "User berhasil dihapus permanen");
  }),

  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.id as string;

    // Get user info before password reset for logging
    const user = await userService.getUserById(userId);

    const result = await userService.resetPasswordUser(userId);

    // Log password reset
    await activityLogService
      .logActivity({
        userId: req.authUser!.userId,
        action: "USER_RESET_PASSWORD",
        entityType: "User",
        entityId: userId,
        description: `Password user ${user.email} berhasil direset oleh ${req.authUser!.email}`,
        metadata: {
          targetUser: {
            userId: user.user_id,
            email: user.email,
          },
        },
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get("user-agent"),
      })
      .catch((err) => console.error("Failed to log password reset:", err));

    return ApiResponse(res, 200, result);
  }),
};
