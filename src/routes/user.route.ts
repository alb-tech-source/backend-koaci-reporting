import { Router } from "express";
import { userController } from "../modules/user/user.controller.js";
import {
  authMiddleware,
  requirePermission,
  restrictRoleElevation,
  restrictRoleDeletion,
} from "../middleware/auth.middleware.js";
import {
  validate,
  validateQuery,
  validateParams,
} from "../middleware/validate.middleware.js";
import {
  createUserSchema,
  updateUserSchema,
  listUserQuerySchema,
  userIdParamSchema,
} from "../modules/user/user.validation.js";

const router = Router();

router.get(
  "/",
  /*
    #swagger.tags = ['User']
    #swagger.summary = 'List all users with pagination and filters'
    #swagger.security = [{ "bearerAuth": [] }]
  */
  authMiddleware,
  requirePermission(["users:read"]),
  validateQuery(listUserQuerySchema),
  userController.list,
);

router.get(
  "/:id",
  /*
    #swagger.tags = ['User']
    #swagger.summary = 'Get user by ID'
    #swagger.security = [{ "bearerAuth": [] }]
    #swagger.parameters['id'] = {
      description: 'User ID',
      required: true,
      type: 'string',
      format: 'uuid'
    }
  */
  authMiddleware,
  requirePermission(["users:read"]),
  validateParams(userIdParamSchema),
  userController.getById,
);

router.post(
  "/",
  /*
    #swagger.tags = ['User']
    #swagger.summary = 'Create new user'
    #swagger.description = 'Create new user with role and permissions. Role Restriction: Admin users cannot create users with SuperAdmin role.'
    #swagger.security = [{ "bearerAuth": [] }]
    #swagger.requestBody = {
      required: true,
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/CreateUserRequest" }
        }
      }
    }
    #swagger.responses[403] = {
      description: 'Forbidden - Role elevation not allowed or insufficient permissions',
      content: {
        "application/json": {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: false },
              message: { type: 'string', example: 'Role admin tidak memiliki izin untuk mengubah user menjadi role superadmin. Hubungi superadmin untuk perubahan ini.' }
            }
          }
        }
      }
    }
  */
  authMiddleware,
  requirePermission(["users:create"]),
  restrictRoleElevation([["admin", "superadmin"]]),
  validate(createUserSchema),
  userController.create,
);

router.put(
  "/:id",
  /*
    #swagger.tags = ['User']
    #swagger.summary = 'Update user by ID'
    #swagger.description = 'Update user data. Use flat format with role_name and permission_ids. Important: When email is changed, email_verified will be reset to false and the user must verify the new email. Note: Users registered via Google OAuth can only update role, permissions, and is_active fields. Personal data (firstname, lastname, email, password) cannot be modified for Google users. Role Restriction: Admin users cannot elevate other users to SuperAdmin role.'
    #swagger.security = [{ "bearerAuth": [] }]
    #swagger.parameters['id'] = {
      description: 'User ID',
      required: true,
      type: 'string',
      format: 'uuid'
    }
    #swagger.requestBody = {
      required: true,
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/UpdateUserRequest" }
        }
      }
    }
    #swagger.responses[200] = {
      description: 'User updated successfully',
      content: {
        "application/json": {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string', example: 'User berhasil diupdate' },
              requiresEmailVerification: { type: 'boolean', example: false },
              data: {
                type: 'object',
                properties: {
                  user: { $ref: '#/components/schemas/UserResponse' }
                }
              }
            }
          }
        }
      }
    }
    #swagger.responses[403] = {
      description: 'Forbidden - Role elevation not allowed or insufficient permissions',
      content: {
        "application/json": {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: false },
              message: { type: 'string', example: 'Role admin tidak memiliki izin untuk mengubah user menjadi role superadmin. Hubungi superadmin untuk perubahan ini.' }
            }
          }
        }
      }
    }
  */
  authMiddleware,
  requirePermission(["users:update"]),
  restrictRoleElevation([["admin", "superadmin"]]),
  validateParams(userIdParamSchema),
  validate(updateUserSchema),
  userController.update,
);

router.patch(
  "/:id/activate",
  /*
    #swagger.tags = ['User']
    #swagger.summary = 'Toggle user activation status'
    #swagger.security = [{ "bearerAuth": [] }]
    #swagger.requestBody = {
      required: true,
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/ChangeActivationUserRequest" }
        }
      }
    }
    #swagger.parameters['id'] = {
      description: 'User ID',
      required: true,
      type: 'string',
      format: 'uuid'
    }
  */
  authMiddleware,
  requirePermission(["users:update"]),
  validateParams(userIdParamSchema),
  userController.changeActivation,
);

router.post(
  "/:id/reset-password",
  /*
    #swagger.tags = ['User']
    #swagger.summary = 'Reset user password (admin only)'
    #swagger.security = [{ "bearerAuth": [] }]
    #swagger.parameters['id'] = {
      description: 'User ID',
      required: true,
      type: 'string',
      format: 'uuid'
    }
  */
  authMiddleware,
  requirePermission(["users:manage_roles"]),
  validateParams(userIdParamSchema),
  userController.resetPassword,
);

router.delete(
  "/:id",
  /*
    #swagger.tags = ['User']
    #swagger.summary = 'Delete user by ID'
    #swagger.description = 'Delete user by ID. Role Restriction: Only SuperAdmin can delete users with BOD or SuperAdmin roles. Other roles cannot delete these protected users.'
    #swagger.security = [{ "bearerAuth": [] }]
    #swagger.parameters['id'] = {
      description: 'User ID',
      required: true,
      type: 'string',
      format: 'uuid'
    }
  #swagger.responses[403] = {
      description: 'Forbidden - Attempting to delete protected role or insufficient permissions',
      content: {
        "application/json": {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: false },
              message: { type: 'string', example: 'Hanya SuperAdmin yang dapat menghapus user dengan role bod. User dengan role admin tidak memiliki izin untuk user ini.' }
            }
          }
        }
      }
    }
  */
  authMiddleware,
  requirePermission(["users:delete"]),
  restrictRoleDeletion(["bod", "superadmin"]),
  validateParams(userIdParamSchema),
  userController.remove,
);

export default router;
