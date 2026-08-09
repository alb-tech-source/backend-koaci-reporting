import type {
  CreatePermissionInput,
  UpdatePermissionInput,
  ListPermissionQuery,
  SafePermission,
  PermissionWithRoles,
  PaginatedPermissionResult,
} from "../../types/permission.types.js";
import { ApiError } from "../../utils/apiError.js";
import prisma from "../../lib/prisma.js";

export function toSafePermission(permission: any): SafePermission {
  return {
    permission_id: permission.permission_id,
    permission_key: permission.permission_key,
  };
}

export const permissionService = {
  createPermission: async (
    input: CreatePermissionInput,
  ): Promise<SafePermission> => {
    // Check if permission_key already exists
    const existingPermission = await prisma.permission.findFirst({
      where: {
        permission_key: input.permission_key,
      },
    });

    if (existingPermission) {
      throw new ApiError(409, "Permission key sudah terdaftar.");
    }

    const permission = await prisma.permission.create({
      data: {
        permission_key: input.permission_key,
      },
    });

    return toSafePermission(permission);
  },

  listPermissions: async (
    query: ListPermissionQuery,
  ): Promise<PaginatedPermissionResult> => {
    const { page, limit, search, permission_key } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...(permission_key && { permission_key: { contains: permission_key, mode: "insensitive" as const } }),
      ...(search && {
        OR: [
          { permission_key: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    };

    const [total, permissions] = await prisma.$transaction([
      prisma.permission.count({ where }),
      prisma.permission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { permission_key: "asc" },
      }),
    ]);

    return {
      data: permissions.map(toSafePermission),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  getPermissionById: async (
    permissionId: string,
  ): Promise<PermissionWithRoles> => {
    const permission = await prisma.permission.findUnique({
      where: {
        permission_id: permissionId,
      },
      include: {
        rolePermissions: {
          include: {
            role: {
              include: {
                user: {
                  select: {
                    user_id: true,
                    email: true,
                    firstname: true,
                    lastname: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!permission) {
      throw new ApiError(404, "Permission tidak ditemukan!");
    }

    return permission as unknown as PermissionWithRoles;
  },

  updatePermission: async (
    permissionId: string,
    input: UpdatePermissionInput,
  ): Promise<SafePermission> => {
    const existingPermission = await prisma.permission.findUnique({
      where: { permission_id: permissionId },
    });

    if (!existingPermission) {
      throw new ApiError(404, "Permission tidak ditemukan!");
    }

    // If updating permission_key, check if new key already exists
    if (input.permission_key && input.permission_key !== existingPermission.permission_key) {
      const keyTaken = await prisma.permission.findFirst({
        where: { permission_key: input.permission_key },
      });
      if (keyTaken) {
        throw new ApiError(409, "Permission key sudah digunakan permission lain");
      }
    }

    const updatedPermission = await prisma.permission.update({
      where: { permission_id: permissionId },
      data: input,
    });

    return toSafePermission(updatedPermission);
  },

  deletePermission: async (permissionId: string): Promise<void> => {
    const existingPermission = await prisma.permission.findUnique({
      where: { permission_id: permissionId },
      include: {
        rolePermissions: {
          select: {
            role_id: true,
          },
        },
      },
    });

    if (!existingPermission) {
      throw new ApiError(404, "Permission tidak ditemukan");
    }

    // Check if permission is assigned to any roles
    if (existingPermission.rolePermissions.length > 0) {
      throw new ApiError(
        400,
        `Permission tidak bisa dihapus karena masih digunakan oleh ${existingPermission.rolePermissions.length} role`,
      );
    }

    await prisma.permission.delete({
      where: { permission_id: permissionId },
    });
  },

  listAllPermissions: async (): Promise<SafePermission[]> => {
    const permissions = await prisma.permission.findMany({
      orderBy: { permission_key: "asc" },
    });

    return permissions.map(toSafePermission);
  },
};
