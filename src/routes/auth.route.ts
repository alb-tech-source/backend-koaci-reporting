import { Router } from "express";
import passport from "passport";
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
import { env } from "../config/env.js";

const router = Router();

router.post(
  "/register",
  /*
    #swagger.tags = ['Auth']
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
    #swagger.tags = ['Auth']
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
    #swagger.tags = ['Auth']
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
    #swagger.tags = ['Auth']
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
    #swagger.tags = ['Auth']
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
    #swagger.tags = ['Auth']
    #swagger.summary = 'Get current authenticated user'
    #swagger.security = [{ "bearerAuth": [] }]
  */
  authMiddleware,
  authController.getCurrentUser,
);

router.post(
  "/logout",
  /*
    #swagger.tags = ['Auth']
    #swagger.summary = 'Logout current user'
    #swagger.security = [{ "bearerAuth": [] }]
  */
  authMiddleware,
  authController.logout,
);

router.get(
  "/google",
  /*
    #swagger.tags = ['Auth']
    #swagger.summary = 'Initiate Google OAuth login'
    #swagger.description = 'Redirects user to Google consent screen for authentication. After user approves, Google will redirect to /google/callback endpoint.'
    #swagger.responses[302] = {
      description: 'Redirect to Google OAuth consent screen',
      schema: { type: 'string', description: 'Redirects to Google OAuth URL' }
    }
    #swagger.responses[500] = {
      description: 'Server error during OAuth initiation',
      schema: { $ref: '#/components/schemas/Error' }
    }
  */
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  }),
);

router.get(
  "/google/callback",
  /*
    #swagger.tags = ['Auth']
    #swagger.summary = 'Google OAuth callback endpoint'
    #swagger.description = 'Handles callback from Google OAuth. On success, redirects to client with access_token and refresh_token as query parameters. On failure, redirects to login page with error.'
    #swagger.parameters['code'] = {
      in: 'query',
      description: 'Authorization code from Google',
      required: true,
      type: 'string'
    }
    #swagger.parameters['scope'] = {
      in: 'query',
      description: 'OAuth scope granted by user',
      required: false,
      type: 'string'
    }
    #swagger.parameters['authuser'] = {
      in: 'query',
      description: 'Google account identifier',
      required: false,
      type: 'string'
    }
    #swagger.parameters['prompt'] = {
      in: 'query',
      description: 'Consent prompt behavior',
      required: false,
      type: 'string'
    }
    #swagger.responses[302] = {
      description: 'Redirect to client application with tokens',
      schema: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'Redirect URL containing access_token and refresh_token as query parameters',
            example: 'https://client.example.com/auth/callback?access_token=xxx&refresh_token=yyy'
          }
        }
      }
    }
    #swagger.responses[302]['x-error-example'] = {
      description: 'Redirect to login page on OAuth failure',
      schema: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'Redirect URL with error parameter',
            example: 'https://client.example.com/login?error=oauth_failed'
          }
        }
      }
    }
  */
  passport.authenticate("google", {
    failureRedirect: `${env.CLIENT_URL}/login?error=oauth_failed`,
    session: false,
  }),
  authController.googleLogin,
);

export default router;
