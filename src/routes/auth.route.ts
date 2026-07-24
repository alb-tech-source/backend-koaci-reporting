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

router.post(
  "/register",
  /*
    #swagger.summary = 'Register new user'
    #swagger.requestBody = {
      required: true,
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/RegisterRequest" }
        }
      }
    }
  */
  validate(registerSchema),
  authController.register,
);

router.post(
  "/login",
  /*
    #swagger.summary = 'Login users'
    #swagger.requestBody = {
      required: true,
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/LoginRequest" }
        }
      }
    }
  */
  validate(loginSchema),
  authController.login,
);

router.post(
  "/refresh",
  /*
    #swagger.summary = 'Refresh access token'
    #swagger.requestBody = {
      required: true,
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/RefreshTokenRequest" }
        }
      }
    }
  */
  validate(refreshTokenSchema),
  authController.refreshAccessToken,
);

router.post(
  "/forgot-password",
  /*
    #swagger.summary = 'Request password reset email'
    #swagger.requestBody = {
      required: true,
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/ForgotPasswordRequest" }
        }
      }
    }
  */
  validate(forgotPasswordSchema),
  authController.forgotPassword,
);

router.post(
  "/reset-password",
  /*
    #swagger.summary = 'Reset password with token'
    #swagger.requestBody = {
      required: true,
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/ResetPasswordRequest" }
        }
      }
    }
  */
  validate(resetPasswordSchema),
  authController.resetPassword,
);

router.get(
  "/me",
  /*
    #swagger.summary = 'Get current authenticated user'
    #swagger.security = [{ "bearerAuth": [] }]
  */
  authMiddleware,
  authController.getCurrentUser,
);

router.post(
  "/logout",
  /*
    #swagger.summary = 'Logout current user'
    #swagger.security = [{ "bearerAuth": [] }]
  */
  authMiddleware,
  authController.logout,
);

export default router;
