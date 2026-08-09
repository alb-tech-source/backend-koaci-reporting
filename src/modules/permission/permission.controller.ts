import type { Response, Request } from "express";
import { permissionService } from "./permission.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import type {
  CreatePermissionInput,
  UpdatePermissionInput,
  ListPermissionQuery,
} from "../../types/permission.types.js";
import { activityLogService } from "../activityLog/activityLog.service.js";

export const permissionController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const permission = await permissionService.createPermission(req.body);

    // Log permission creation
    await activityLogService
      .logActivity({
        userId: req.authUser!.userId,
        action: "PERMISSION_CREATE",
        entityType: "Permission",
        entityId: permission.permission_id,
        description: `Permission ${permission.permission_key} berhasil dibuat oleh ${req.authUser!.email}`,
        metadata: {
          createdPermission: {
            permissionId: permission.permission_id,
            permissionKey: permission.permission_key,
          },
        },
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get("user-agent"),
      })
      .catch((err) => console.error("Failed to log permission creation:", err));

    return ApiResponse(res, 201, permission);
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const parseValue = (v: any) => {
      if (v === "true") return true;
      if (v === "false") return false;
      if (v === "" || v === null || v === undefined) return v;
      if (!Number.isNaN(Number(v)) && v !== null && v !== "") return Number(v);
      return v;
    };

    const parseQuery = (q: Record<string, any>): ListPermissionQuery => {
      const out: Record<string, any> = {};
      for (const [key, value] of Object.entries(q)) {
        if (Array.isArray(value)) out[key] = value.map(parseValue);
        else out[key] = parseValue(value);
      }
      return out as ListPermissionQuery;
    };

    const query = parseQuery(req.query as unknown as Record<string, any>);
    const result = await permissionService.listPermissions(query);
    return ApiResponse(res, 200, result.data, result.meta);
  }),

  listAll: asyncHandler(async (req: Request, res: Response) => {
    const permissions = await permissionService.listAllPermissions();
    return ApiResponse(res, 200, permissions);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const permission = await permissionService.getPermissionById(req.params.id as string);
    return ApiResponse(res, 200, permission);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const permission = await permissionService.updatePermission(
      req.params.id as string,
      req.body,
    );

    // Log permission update
    await activityLogService
      .logActivity({
        userId: req.authUser!.userId,
        action: "PERMISSION_UPDATE",
        entityType: "Permission",
        entityId: permission.permission_id,
        description: `Permission ${permission.permission_key} berhasil diupdate oleh ${req.authUser!.email}`,
        metadata: {
          updatedPermission: {
            permissionId: permission.permission_id,
            permissionKey: permission.permission_key,
            changes: req.body,
          },
        },
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get("user-agent"),
      })
      .catch((err) => console.error("Failed to log permission update:", err));

    return ApiResponse(res, 200, permission);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const permissionId = req.params.id as string;

    // Get permission info before deletion for logging
    const permission = await permissionService.getPermissionById(permissionId);

    await permissionService.deletePermission(permissionId);

    // Log permission deletion
    await activityLogService
      .logActivity({
        userId: req.authUser!.userId,
        action: "PERMISSION_DELETE",
        entityType: "Permission",
        entityId: permissionId,
        description: `Permission ${permission.permission_key} berhasil dihapus oleh ${req.authUser!.email}`,
        metadata: {
          deletedPermission: {
            permissionId: permission.permission_id,
            permissionKey: permission.permission_key,
          },
        },
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get("user-agent"),
      })
      .catch((err) => console.error("Failed to log permission deletion:", err));

    return ApiResponse(res, 200, "Permission berhasil dihapus permanen");
  }),
};
