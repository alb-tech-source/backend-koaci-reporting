import crypto from "crypto";
import bcrypt from "bcrypt";
import type {
  CreateUserInput,
  UpdateUserInput,
  ListUserQuery,
  SafeUser,
  PaginatedResult,
} from "../../types/user.types.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { ApiError } from "../../utils/apiError.js";
import prisma from "../../lib/prisma.js";
import { email } from "zod";

const SALT_ROUNDS = 10;

export function toSafeUser(user: any): SafeUser {
  return {
    user_id: user.user_id,
    firstname: user.firstname,
    lastname: user.lastname,
    email: user.email,
    is_active: user.is_active,
    last_login_at: user.last_login_at,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    role: user.role
      ? {
          role_id: user.role.role_id,
          role_name: user.role.role_name,
          rolePermissions: user.role.rolePermissions,
        }
      : undefined,
  };
}

export const userService = {
  createUser: async (
    input: CreateUserInput,
  ): Promise<{ user: SafeUser; temporaryPassword: string }> => {
    const existingUser = await prisma.user.findUnique({
      where: {
        email: input.email,
      },
    });

    if (existingUser) {
      throw new ApiError(409, "Email sudah terdaftar.");
    }

    const temporaryPassword = crypto.randomBytes(8).toString("hex");
    const hashedPassword = await bcrypt.hash(temporaryPassword, SALT_ROUNDS);

    // Create user with role and permissions
    const user = await prisma.user.create({
      data: {
        firstname: input.firstname,
        lastname: input.lastname,
        email: input.email,
        password: hashedPassword,
        is_active: input.is_active,
        role: {
          create: {
            role_name: input.role_name,
            rolePermissions: {
              create: input.permission_ids.map((permission_id) => ({
                permission_id,
              })),
            },
          },
        },
      },
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

    // TO DO: Send credential account to email user.

    return { user: toSafeUser(user), temporaryPassword };
  },

  listUsers: async (
    query: ListUserQuery,
  ): Promise<PaginatedResult<SafeUser>> => {
    const { page, limit, search, is_active } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...(is_active !== undefined && { is_active }),
      ...(search && {
        OR: [
          { firstname: { contains: search, mode: "insensitive" as const } },
          { lastname: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    };

    const [total, users] = await prisma.$transaction([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      data: users.map(toSafeUser),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  getUserById: async (userId: string): Promise<SafeUser> => {
    const user = await prisma.user.findUnique({
      where: {
        user_id: userId,
      },
      include: {
        role: {
          select: {
            role_name: true,
            role_id: true,
            rolePermissions: {
              include: {
                permission: {
                  select: {
                    permission_id: true,
                    permission_key: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new ApiError(404, "User tidak ditemukan!");
    }

    return toSafeUser(user);
  },

  updateUser: async (
    userId: string,
    input: UpdateUserInput,
  ): Promise<SafeUser> => {
    const existingUser = await prisma.user.findUnique({
      where: { user_id: userId },
    });

    if (!existingUser) {
      throw new ApiError(404, "User tidak ditemukan!");
    }

    if (input.email && input.email !== existingUser.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email: input.email },
      });
      if (emailTaken) {
        throw new ApiError(409, "Email sudah digunakan user lain");
      }
    }

    const updatedUser = await prisma.user.update({
      where: { user_id: userId },
      data: input,
    });

    return toSafeUser(updatedUser);
  },

  changeUserActivation: async (
    userId: string,
    isActive: boolean,
  ): Promise<SafeUser> => {
    const existingUser = await prisma.user.findUnique({
      where: { user_id: userId },
    });

    if (!existingUser) {
      throw new ApiError(404, "User tidak ditemukan!");
    }

    console.log(isActive);

    const updatedUser = await prisma.user.update({
      where: {
        user_id: userId,
      },
      data: {
        is_active: isActive,
      },
    });

    return toSafeUser(updatedUser);
  },

  deleteUser: async (userId: string): Promise<void> => {
    const existingUser = await prisma.user.findUnique({
      where: { user_id: userId },
      include: {
        role: {
          select: {
            role_id: true,
          },
        },
      },
    });
    if (!existingUser) {
      throw new ApiError(404, "User tidak ditemukan");
    }

    await prisma.$transaction([
      prisma.rolePermission.deleteMany({
        where: { role_id: existingUser.role?.role_id || "" },
      }),
      prisma.role.delete({ where: { user_id: userId } }),
      prisma.user.delete({ where: { user_id: userId } }),
    ]);
  },

  resetPasswordUser: async (
    userId: string,
  ): Promise<{ temporaryPassword: string }> => {
    const existingUser = await prisma.user.findUnique({
      where: { user_id: userId },
    });
    if (!existingUser) {
      throw new ApiError(404, "User tidak ditemukan");
    }

    const temporaryPassword = crypto.randomBytes(6).toString("hex");
    const hashedPassword = await bcrypt.hash(temporaryPassword, SALT_ROUNDS);

    await prisma.user.update({
      where: { user_id: userId },
      data: { password: hashedPassword },
    });

    // TODO: kirim temporaryPassword via email

    return { temporaryPassword };
  },
};
