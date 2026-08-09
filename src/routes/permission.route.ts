import { Router } from "express";
import { permissionController } from "../modules/permission/permission.controller.js";
import {
  authMiddleware,
  requireRole,
} from "../middleware/auth.middleware.js";
import {
  validate,
  validateQuery,
  validateParams,
} from "../middleware/validate.middleware.js";
import {
  createPermissionSchema,
  updatePermissionSchema,
  listPermissionQuerySchema,
  permissionIdParamSchema,
} from "../modules/permission/permission.validation.js";

const router = Router();

// List all permissions - accessible by admin and superadmin
router.get(
  "/all",
  /*
    #swagger.tags = ['Permission']
    #swagger.summary = 'List all permissions without pagination'
    #swagger.security = [{ "bearerAuth": [] }]
  */
  authMiddleware,
  requireRole(["admin", "superadmin"]),
  permissionController.listAll,
);

// List permissions with pagination - accessible by admin and superadmin
router.get(
  "/",
  /*
    #swagger.tags = ['Permission']
    #swagger.summary = 'List permissions with pagination and filters'
    #swagger.security = [{ "bearerAuth": [] }]
  */
  authMiddleware,
  requireRole(["admin", "superadmin"]),
  validateQuery(listPermissionQuerySchema),
  permissionController.list,
);

// Get permission by ID - accessible by admin and superadmin
router.get(
  "/:id",
  /*
    #swagger.tags = ['Permission']
    #swagger.summary = 'Get permission by ID'
    #swagger.security = [{ "bearerAuth": [] }]
    #swagger.parameters['id'] = {
      description: 'Permission ID',
      required: true,
      type: 'string',
      format: 'uuid'
    }
  */
  authMiddleware,
  requireRole(["admin", "superadmin"]),
  validateParams(permissionIdParamSchema),
  permissionController.getById,
);

// Create new permission - only superadmin
router.post(
  "/",
  /*
    #swagger.tags = ['Permission']
    #swagger.summary = 'Create new permission (superadmin only)'
    #swagger.security = [{ "bearerAuth": [] }]
    #swagger.requestBody = {
      required: true,
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/CreatePermissionRequest" }
        }
      }
    }
  */
  authMiddleware,
  requireRole(["superadmin"]),
  validate(createPermissionSchema),
  permissionController.create,
);

// Update permission - only superadmin
router.put(
  "/:id",
  /*
    #swagger.tags = ['Permission']
    #swagger.summary = 'Update permission by ID (superadmin only)'
    #swagger.security = [{ "bearerAuth": [] }]
    #swagger.parameters['id'] = {
      description: 'Permission ID',
      required: true,
      type: 'string',
      format: 'uuid'
    }
    #swagger.requestBody = {
      required: true,
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/UpdatePermissionRequest" }
        }
      }
    }
  */
  authMiddleware,
  requireRole(["superadmin"]),
  validateParams(permissionIdParamSchema),
  validate(updatePermissionSchema),
  permissionController.update,
);

// Delete permission - only superadmin
router.delete(
  "/:id",
  /*
    #swagger.tags = ['Permission']
    #swagger.summary = 'Delete permission by ID (superadmin only)'
    #swagger.security = [{ "bearerAuth": [] }]
    #swagger.parameters['id'] = {
      description: 'Permission ID',
      required: true,
      type: 'string',
      format: 'uuid'
    }
  */
  authMiddleware,
  requireRole(["superadmin"]),
  validateParams(permissionIdParamSchema),
  permissionController.remove,
);

export default router;
