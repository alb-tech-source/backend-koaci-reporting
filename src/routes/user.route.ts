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

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get list of users
 *     description: Retrieve paginated list of users with optional filtering by search and active status
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *         example: 10
 *       - name: search
 *         in: query
 *         schema:
 *           type: string
 *         description: Search by firstname, lastname, or email
 *         example: "john"
 *       - name: is_active
 *         in: query
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *         example: true
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserListSuccessResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *           example:
 *             success: false
 *             message: "Unauthorized"
 *       403:
 *         description: Forbidden - Missing required permission
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *             success: false
 *             message: "Anda tidak memiliki izin untuk mengakses resource ini"
 */
router.get(
  "/",
  authMiddleware,
  requirePermission(["users:read"]),
  validateQuery(listUserQuerySchema),
  userController.list
);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieve detailed information about a specific user
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: User ID
 *         schema:
 *           type: string
 *           format: uuid
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Success"
 *                 data:
 *                   $ref: '#/components/schemas/SafeUser'
 *             example:
 *               success: true
 *               message: "Success"
 *               data:
 *                 user_id: "123e4567-e89b-12d3-a456-426614174000"
 *                 firstname: "John"
 *                 lastname: "Doe"
 *                 email: "john.doe@example.com"
 *                 is_active: true
 *                 last_login_at: "2026-07-13T10:30:00.000Z"
 *                 createdAt: "2026-01-15T08:00:00.000Z"
 *                 updatedAt: "2026-07-13T09:45:00.000Z"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Unauthorized"
 *       403:
 *         description: Forbidden - Missing required permission
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Anda tidak memiliki izin untuk mengakses resource ini"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "User tidak ditemukan"
 */
router.get(
  "/:id",
  authMiddleware,
  requirePermission(["users:read"]),
  validateParams(userIdParamSchema),
  userController.getById
);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create new user
 *     description: Create a new user account. Password is optional - if not provided, system will generate a temporary password.
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserInput'
 *           example:
 *             firstname: "Jane"
 *             lastname: "Smith"
 *             email: "jane.smith@example.com"
 *             password: "SecurePass123"
 *             is_active: false
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreateUserSuccessResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Unauthorized"
 *       403:
 *         description: Forbidden - Missing required permission
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Anda tidak memiliki izin untuk mengakses resource ini"
 *       409:
 *         description: Email already registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Email sudah terdaftar"
 */
router.post(
  "/",
  authMiddleware,
  requirePermission(["users:create"]),
  validate(createUserSchema),
  userController.create
);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user
 *     description: Update user information. At least one field must be provided.
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: User ID
 *         schema:
 *           type: string
 *           format: uuid
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserInput'
 *           example:
 *             firstname: "Jane"
 *             lastname: "Smith"
 *             email: "jane.smith@example.com"
 *             is_active: true
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Success"
 *                 data:
 *                   $ref: '#/components/schemas/SafeUser'
 *             example:
 *               success: true
 *               message: "Success"
 *               data:
 *                 user_id: "123e4567-e89b-12d3-a456-426614174000"
 *                 firstname: "Jane"
 *                 lastname: "Smith"
 *                 email: "jane.smith@example.com"
 *                 is_active: true
 *                 last_login_at: "2026-07-13T10:30:00.000Z"
 *                 createdAt: "2026-01-15T08:00:00.000Z"
 *                 updatedAt: "2026-07-13T11:30:00.000Z"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Unauthorized"
 *       403:
 *         description: Forbidden - Missing required permission
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Anda tidak memiliki izin untuk mengakses resource ini"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "User tidak ditemukan"
 *       409:
 *         description: Email already used by another user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Email sudah digunakan oleh user lain"
 */
router.put(
  "/:id",
  authMiddleware,
  requirePermission(["users:update"]),
  validateParams(userIdParamSchema),
  validate(updateUserSchema),
  userController.update
);

/**
 * @swagger
 * /api/users/{id}/activate:
 *   patch:
 *     summary: Activate or deactivate user
 *     description: Change user activation status
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: User ID
 *         schema:
 *           type: string
 *           format: uuid
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isActive
 *             properties:
 *               isActive:
 *                 type: boolean
 *                 description: Set true to activate, false to deactivate
 *           example:
 *             isActive: true
 *     responses:
 *       200:
 *         description: User activation status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Success"
 *                 data:
 *                   $ref: '#/components/schemas/SafeUser'
 *             example:
 *               success: true
 *               message: "Success"
 *               data:
 *                 user_id: "123e4567-e89b-12d3-a456-426614174000"
 *                 firstname: "John"
 *                 lastname: "Doe"
 *                 email: "john.doe@example.com"
 *                 is_active: true
 *                 last_login_at: "2026-07-13T10:30:00.000Z"
 *                 createdAt: "2026-01-15T08:00:00.000Z"
 *                 updatedAt: "2026-07-13T12:00:00.000Z"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Unauthorized"
 *       403:
 *         description: Forbidden - Missing required permission
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Anda tidak memiliki izin untuk mengakses resource ini"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "User tidak ditemukan"
 */
router.patch(
  "/:id/activate",
  authMiddleware,
  requirePermission(["users:update"]),
  validateParams(userIdParamSchema),
  userController.changeActivation
);

/**
 * @swagger
 * /api/users/{id}/reset-password:
 *   post:
 *     summary: Reset user password
 *     description: Reset user password and generate a new temporary password
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: User ID
 *         schema:
 *           type: string
 *           format: uuid
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     temporaryPassword:
 *                       type: string
 *                       description: New temporary password (only shown once)
 *             example:
 *               success: true
 *               message: "Success"
 *               data:
 *                 temporaryPassword: "x9y8z7w6v5u4"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Unauthorized"
 *       403:
 *         description: Forbidden - Missing required permission
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Anda tidak memiliki izin untuk mengakses resource ini"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "User tidak ditemukan"
 */
router.post(
  "/:id/reset-password",
  authMiddleware,
  requirePermission(["users:manage_roles"]),
  validateParams(userIdParamSchema),
  userController.resetPassword
);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user
 *     description: Permanently delete a user account. This action cannot be undone!
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: User ID
 *         schema:
 *           type: string
 *           format: uuid
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "User berhasil dihapus permanen"
 *                 data:
 *                   type: object
 *                   nullable: true
 *                   example: null
 *             example:
 *               success: true
 *               message: "User berhasil dihapus permanen"
 *               data: null
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Unauthorized"
 *       403:
 *         description: Forbidden - Missing required permission
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Anda tidak memiliki izin untuk mengakses resource ini"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "User tidak ditemukan"
 */
router.delete(
  "/:id",
  authMiddleware,
  requirePermission(["users:delete"]),
  validateParams(userIdParamSchema),
  userController.remove
);

export default router;
