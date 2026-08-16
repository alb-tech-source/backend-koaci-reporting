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
import type { AccessContext } from "../../middleware/auth.middleware.js";
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
    access: AccessContext,
  ): Promise<PaginatedResult<SafeUser>> => {
    const { page, limit, search, is_active } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...(access.scope === "own" && { user_id: access.userId }),
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
        select: {
          user_id: true,
          firstname: true,
          lastname: true,
          email: true,
          is_active: true,
          last_login_at: true,
          createdAt: true,
          updatedAt: true,
          role: {
            select: {
              role_id: true,
              role_name: true,
              rolePermissions: {
                select: {
                  permission_id: true,
                  permission: true,
                },
              },
            },
          },
        },
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

  getUserById: async (
    userId: string,
    access: AccessContext,
  ): Promise<SafeUser> => {
    const user = await prisma.user.findFirst({
      where: {
        user_id: userId,
        ...(access.scope === "own" && { user_id: access.userId }),
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
    access: AccessContext,
  ): Promise<SafeUser> => {
    if (
      access.scope === "own" &&
      (input.role_name !== undefined ||
        input.permission_ids !== undefined ||
        input.is_active !== undefined)
    ) {
      throw new ApiError(
        403,
        "Role, permission, dan status aktivasi hanya dapat diubah dengan scope any",
      );
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        user_id: userId,
        ...(access.scope === "own" && { user_id: access.userId }),
      },
      include: {
        role: {
          include: {
            rolePermissions: true,
          },
        },
      },
    });

    if (!existingUser) {
      throw new ApiError(404, "User tidak ditemukan!");
    }

    // Extract role and permission updates from input
    const { role_name, permission_ids, ...userData } = input as any;

    // Check if user registered via Google
    if (existingUser.googleId) {
      // Google users can only update role and permissions
      const allowedUpdates: any = {};
      let hasRestrictedUpdate = false;

      // Check if user trying to update restricted fields
      if (userData.firstname !== undefined) hasRestrictedUpdate = true;
      if (userData.lastname !== undefined) hasRestrictedUpdate = true;
      if (userData.email !== undefined) hasRestrictedUpdate = true;
      if (userData.password !== undefined) hasRestrictedUpdate = true;

      if (hasRestrictedUpdate) {
        throw new ApiError(
          403,
          "User yang mendaftar melalui Google tidak dapat mengupdate data pribadi (firstname, lastname, email, password). Hanya role dan permissions yang dapat diupdate."
        );
      }

      // Google users can update is_active (for admin activation)
      if (userData.is_active !== undefined) {
        allowedUpdates.is_active = userData.is_active;
      }

      // Merge allowed basic updates
      Object.assign(userData, allowedUpdates);
    } else {
      // Regular users - email validation
      if (input.email && input.email !== existingUser.email) {
        const emailTaken = await prisma.user.findUnique({
          where: { email: input.email },
        });
        if (emailTaken) {
          throw new ApiError(409, "Email sudah digunakan user lain");
        }
      }
    }

    // Track if email is being changed for security reset
    const isEmailChanged = input.email && input.email !== existingUser.email;

    // Prepare user update data
    const userUpdateData: any = {};
    if (userData.firstname !== undefined) userUpdateData.firstname = userData.firstname;
    if (userData.lastname !== undefined) userUpdateData.lastname = userData.lastname;
    if (userData.email !== undefined) userUpdateData.email = userData.email;
    if (userData.password !== undefined) {
      userUpdateData.password = await bcrypt.hash(userData.password, SALT_ROUNDS);
    }
    if (userData.is_active !== undefined) userUpdateData.is_active = userData.is_active;

    // Reset email verification when email is changed
    if (isEmailChanged) {
      userUpdateData.email_verified = false;
      userUpdateData.email_verification_token = null;
      userUpdateData.email_verification_expires = null;
    }

    // Use transaction for atomic updates
    const updatedUser = await prisma.$transaction(async (tx) => {
      // Update basic user fields
      if (Object.keys(userUpdateData).length > 0) {
        await tx.user.update({
          where: { user_id: userId },
          data: userUpdateData,
        });
      }

      // Handle role and permission updates
      if (role_name !== undefined || permission_ids !== undefined) {
        // Check if user has a role
        if (!existingUser.role) {
          // Create new role for user
          if (!role_name) {
            throw new ApiError(400, "Role name wajib diisi untuk membuat role baru");
          }

          await tx.role.create({
            data: {
              user_id: userId,
              role_name: role_name,
              rolePermissions: {
                create: (permission_ids || [])
                  .filter((value: string, index: number, self: string[]) =>
                    self.indexOf(value) === index
                  )
                  .map((permission_id: string) => ({
                    permission_id,
                  })),
              },
            },
          });
        } else {
          // Update existing role
          const roleUpdateData: any = {};
          if (role_name !== undefined) {
            roleUpdateData.role_name = role_name;
          }

          // Update role basic fields
          if (Object.keys(roleUpdateData).length > 0) {
            await tx.role.update({
              where: { role_id: existingUser.role.role_id },
              data: roleUpdateData,
            });
          }

          // Handle permission updates (delete-insert pattern)
          if (permission_ids !== undefined) {
            // Delete existing permissions
            await tx.rolePermission.deleteMany({
              where: { role_id: existingUser.role.role_id },
            });

            // Insert new permissions if provided (with deduplication)
            if (permission_ids.length > 0) {
              // Remove duplicates using filter
              const uniquePermissionIds = permission_ids.filter(
                (value: string, index: number, self: string[]) =>
                  self.indexOf(value) === index
              );

              await tx.rolePermission.createMany({
                data: uniquePermissionIds.map((permission_id: string) => ({
                  role_id: existingUser.role!.role_id,
                  permission_id,
                })),
                skipDuplicates: true, // Skip any remaining duplicates at database level
              });
            }
          }
        }
      }

      // Fetch updated user with all relations
      return await tx.user.findUnique({
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
    });

    if (!updatedUser) {
      throw new ApiError(500, "Gagal mengupdate user");
    }

    // Return user data with email verification status
    const safeUser = toSafeUser(updatedUser);

    // Add verification warning if email was changed
    if (isEmailChanged) {
      return {
        ...safeUser,
        _meta: {
          requiresEmailVerification: true,
          message: "Email telah diubah. User perlu memverifikasi email baru melalui endpoint /api/auth/send-verify-email"
        }
      } as any;
    }

    return safeUser;
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

  deleteUser: async (
    userId: string,
    access: AccessContext,
  ): Promise<void> => {
    const existingUser = await prisma.user.findFirst({
      where: {
        user_id: userId,
        ...(access.scope === "own" && { user_id: access.userId }),
      },
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
      prisma.role.deleteMany({
        where: { user_id: userId },
      }),
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
