import { Router } from "express";
import { authController } from "../modules/auth/auth.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
} from "../modules/auth/auth.validation.js";

const router = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register new user
 *     description: Create a new user account. Account needs to be activated by admin.
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterInput'
 *           example:
 *             firstname: "John"
 *             lastname: "Doe"
 *             email: "john.doe@example.com"
 *             password: "SecurePass123"
 *     responses:
 *       201:
 *         description: Registration successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RegisterSuccessResponse'
 *       409:
 *         description: Email already registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *           example:
 *             success: false
 *             message: "Email sudah terdaftar"
 */
router.post(
  "/register",
  validate(registerSchema),
  authController.register
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     description: Authenticate user with email and password
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *           example:
 *             email: "admin@koaci.com"
 *             password: "Admin@123456"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginSuccessResponse'
 *       401:
 *         description: Invalid credentials or inactive account
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *           examples:
 *             invalidCredentials:
 *               summary: Invalid credentials
 *               value:
 *                 success: false
 *                 message: "Email atau password salah"
 *             inactiveAccount:
 *               summary: Inactive account
 *               value:
 *                 success: false
 *                 message: "Akun Anda belum aktif. Silakan hubungi admin."
 */
router.post(
  "/login",
  validate(loginSchema),
  authController.login
);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: Get new access token using refresh token
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: JWT refresh token
 *           example:
 *             refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMTIzZTQ1NjctZTg5Yi0xMmQzLWE0NTYtNDI2NjE0MTc0MDAwIiwiaWF0IjoxNjg5MTIzNDU2LCJleHAiOjE2ODk3MjgyNTZ9.qO6L4qQX9L-3sVJKZVGJVGJYVJMqJHJKVVFGJqJHJJV"
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: "boolean"
 *                   example: true
 *                 message:
 *                   type: "string"
 *                   example: "Token berhasil diperbarui"
 *                 data:
 *                   type: object
 *                   properties:
 *                     tokens:
 *                       $ref: '#/components/schemas/AuthTokens'
 *             example:
 *               success: true
 *               message: "Token berhasil diperbarui"
 *               data:
 *                 tokens:
 *                   accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMTIzZTQ1NjctZTg5Yi0xMmQzLWE0NTYtNDI2NjE0MTc0MDAwIiwiaWF0IjoxNjg5MTIzNDU2LCJleHAiOjE2ODkxMjcwNjZ9.qO6L4qQX9L-3sVJKZVGJVGJYVJMqJHJKVVFGJqJHJJV"
 *                   refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMTIzZTQ1NjctZTg5Yi0xMmQzLWE0NTYtNDI2NjE0MTc0MDAwIiwiaWF0IjoxNjg5MTIzNDU2LCJleHAiOjE2ODk3MjgyNTZ9.qO6L4qQX9L-3sVJKZVGJVGJYVJMqJHJKVVFGJqJHJJV"
 *       401:
 *         description: Invalid or expired refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Refresh token tidak valid atau sudah kadaluarsa"
 */
router.post(
  "/refresh",
  validate(refreshTokenSchema),
  authController.refreshAccessToken
);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     description: Send password reset link to user's email
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *           example:
 *             email: "user@example.com"
 *     responses:
 *       200:
 *         description: Password reset email sent (always returns success for security)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: "boolean"
 *                   example: true
 *                 message:
 *                   type: "string"
 *                   example: "Jika email terdaftar, link reset password akan dikirim ke email Anda."
 *                 data:
 *                   type: object
 *                   nullable: true
 *                   example: null
 *             example:
 *               success: true
 *               message: "Jika email terdaftar, link reset password akan dikirim ke email Anda."
 *               data: null
 */
router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  authController.forgotPassword
);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password
 *     description: Reset password using token from forgot password email
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 description: Reset token from email
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 description: New password (min 8 chars, must contain uppercase and number)
 *           example:
 *             token: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
 *             newPassword: "NewPassword123"
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: "boolean"
 *                   example: true
 *                 message:
 *                   type: "string"
 *                   example: "Password berhasil direset. Silakan login dengan password baru."
 *                 data:
 *                   type: object
 *                   nullable: true
 *                   example: null
 *             example:
 *               success: true
 *               message: "Password berhasil direset. Silakan login dengan password baru."
 *               data: null
 *       400:
 *         description: Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Token reset tidak valid atau sudah kadaluarsa"
 */
router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  authController.resetPassword
);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     description: Get profile of the currently authenticated user including role and permissions
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MeSuccessResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Unauthorized"
 */
router.get(
  "/me",
  authMiddleware,
  authController.getCurrentUser
);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     description: Logout current user (client-side token removal)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: "boolean"
 *                   example: true
 *                 message:
 *                   type: "string"
 *                   example: "Logout berhasil"
 *                 data:
 *                   type: object
 *                   nullable: true
 *                   example: null
 *             example:
 *               success: true
 *               message: "Logout berhasil"
 *               data: null
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Unauthorized"
 */
router.post(
  "/logout",
  authMiddleware,
  authController.logout
);

export default router;
