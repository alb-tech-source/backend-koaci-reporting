import { Router } from "express";
import { userController } from "../modules/user/user.controller.js";
import {
  authMiddleware,
  requirePermission,
} from "../middleware/auth.middleware.js";
import { validate, validateQuery, validateParams } from "../middleware/validate.middleware.js";
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
    #swagger.summary = 'List all users with pagination and filters'
    #swagger.security = [{ "bearerAuth": [] }]
  */
  authMiddleware,
  requirePermission(["users:read"]),
  validateQuery(listUserQuerySchema),
  userController.list
);

router.get(
  "/:id",
  /*
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
  userController.getById
);

router.post(
  "/",
  /*
    #swagger.summary = 'Create new user'
    #swagger.security = [{ "bearerAuth": [] }]
    #swagger.requestBody = {
      required: true,
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/CreateUserRequest" }
        }
      }
    }
  */
  authMiddleware,
  requirePermission(["users:create"]),
  validate(createUserSchema),
  userController.create
);

router.put(
  "/:id",
  /*
    #swagger.summary = 'Update user by ID'
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
  */
  authMiddleware,
  requirePermission(["users:update"]),
  validateParams(userIdParamSchema),
  validate(updateUserSchema),
  userController.update
);

router.patch(
  "/:id/activate",
  /*
    #swagger.summary = 'Toggle user activation status'
    #swagger.security = [{ "bearerAuth": [] }]
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
  userController.changeActivation
);

router.post(
  "/:id/reset-password",
  /*
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
  userController.resetPassword
);

router.delete(
  "/:id",
  /*
    #swagger.summary = 'Delete user by ID'
    #swagger.security = [{ "bearerAuth": [] }]
    #swagger.parameters['id'] = {
      description: 'User ID',
      required: true,
      type: 'string',
      format: 'uuid'
    }
  */
  authMiddleware,
  requirePermission(["users:delete"]),
  validateParams(userIdParamSchema),
  userController.remove
);

export default router;
