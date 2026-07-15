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
  authMiddleware,
  requirePermission(["users:read"]),
  validateQuery(listUserQuerySchema),
  userController.list
);

router.get(
  "/:id",
  authMiddleware,
  requirePermission(["users:read"]),
  validateParams(userIdParamSchema),
  userController.getById
);

router.post(
  "/",
  authMiddleware,
  requirePermission(["users:create"]),
  validate(createUserSchema),
  userController.create
);

router.put(
  "/:id",
  authMiddleware,
  requirePermission(["users:update"]),
  validateParams(userIdParamSchema),
  validate(updateUserSchema),
  userController.update
);

router.patch(
  "/:id/activate",
  authMiddleware,
  requirePermission(["users:update"]),
  validateParams(userIdParamSchema),
  userController.changeActivation
);

router.post(
  "/:id/reset-password",
  authMiddleware,
  requirePermission(["users:manage_roles"]),
  validateParams(userIdParamSchema),
  userController.resetPassword
);

router.delete(
  "/:id",
  authMiddleware,
  requirePermission(["users:delete"]),
  validateParams(userIdParamSchema),
  userController.remove
);

export default router;
