import { Router } from "express";
import passport from "passport";
import { authController } from "../modules/auth/auth.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  loginRateLimiter,
  changePasswordRateLimiter,
  sendVerifyEmailRateLimiter,
} from "../middleware/rateLimit.middleware.js";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
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
    #swagger.responses[429] = { description: 'Terlalu banyak percobaan login gagal (5 per IP+email / 20 per IP dalam 15 menit)' }
  */
  ...loginRateLimiter,
  validate(loginSchema),
  authController.login,
);

router.post(
  "/refresh",
  /*
    #swagger.tags = ['Auth']
    #swagger.summary = 'Refresh access token'
    #swagger.description = 'Membaca refresh_token dari httpOnly cookie, lalu mengganti access_token dan refresh_token cookie. Tidak ada token dalam request body maupun response body.'
  */
  authController.refreshAccessToken,
);

router.post(
  "/forgot-password",
  /*
    #swagger.tags = ['Auth']
    #swagger.summary = 'Request password reset email'
    #swagger.description = 'Request password reset email. Note: Users registered via Google OAuth cannot reset password through this system and must use Google OAuth for authentication.'
    #swagger.requestBody = {
      required: true,
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/ForgotPasswordRequest" }
        }
      }
    }
  #swagger.responses[403] = {
      description: 'Forbidden - Google user cannot reset password',
      content: {
        "application/json": {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: false },
              message: { type: 'string', example: 'User yang login melalui Google tidak dapat mereset password. Silakan login menggunakan Google OAuth.' }
            }
          }
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
    #swagger.description = 'Reset password using token received from forgot-password email. Note: Users registered via Google OAuth cannot reset password through this system and must use Google OAuth for authentication.'
    #swagger.requestBody = {
      required: true,
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/ResetPasswordRequest" }
        }
      }
    }
  #swagger.responses[403] = {
      description: 'Forbidden - Google user cannot reset password',
      content: {
        "application/json": {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: false },
              message: { type: 'string', example: 'User yang login melalui Google tidak dapat mereset password. Silakan login menggunakan Google OAuth.' }
            }
          }
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
    #swagger.security = [{ "cookieAuth": [] }]
  */
  authMiddleware,
  authController.getCurrentUser,
);

router.post(
  "/logout",
  /*
    #swagger.tags = ['Auth']
    #swagger.summary = 'Logout current user'
    #swagger.security = [{ "cookieAuth": [] }]
  */
  authMiddleware,
  authController.logout,
);

router.post(
  "/send-verify-email",
  /*
    #swagger.tags = ['Auth']
    #swagger.summary = 'Send Email Verification'
    #swagger.description = 'Mengirim link verifikasi (berlaku 30 menit) ke email user yang sedang login. Tidak memerlukan body. Jika email sudah terverifikasi, tidak ada email yang dikirim. Dibatasi 3 permintaan per user per 15 menit.'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.responses[200] = { description: 'Email verifikasi dikirim, atau email sudah terverifikasi (lihat message)' }
    #swagger.responses[429] = { description: 'Terlalu banyak permintaan email verifikasi' }
  */
  authMiddleware,
  sendVerifyEmailRateLimiter,
  authController.sendVerifyEmailController,
);

router.post(
  "/change-password",
  /*
    #swagger.tags = ['Auth']
    #swagger.summary = 'Change password (user yang sedang login)'
    #swagger.description = 'Wajib menyertakan password saat ini. Password baru minimal 8 karakter, mengandung huruf besar dan angka, dan harus berbeda dari password saat ini. User Google OAuth tidak dapat mengganti password. Dibatasi 5 percobaan gagal per user per 15 menit.'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.requestBody = {
      required: true,
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/ChangePasswordRequest" }
        }
      }
    }
    #swagger.responses[200] = { description: 'Password berhasil diganti' }
    #swagger.responses[400] = { description: 'Password saat ini salah / password baru tidak memenuhi aturan' }
    #swagger.responses[403] = { description: 'User Google OAuth tidak dapat mengganti password' }
    #swagger.responses[429] = { description: 'Terlalu banyak percobaan ganti password gagal' }
  */
  authMiddleware,
  changePasswordRateLimiter,
  validate(changePasswordSchema),
  authController.changePassword,
);

router.get(
  "/verify-email",
  /*
    #swagger.tags = ['Auth']
    #swagger.summary = 'Verify Email with Token'
    #swagger.description = 'Token hanya berlaku untuk email yang dituju saat link dikirim. Jika email akun sudah berubah, token ditolak (400) dan user harus meminta link baru.'
    #swagger.parameters['token'] = {
      in: 'query',
      description: 'Email verification token from email',
      required: true,
      type: 'string'
    }
  */
  authController.verifyEmailController,
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
    #swagger.description = 'Handles callback from Google OAuth. On success, sets httpOnly access_token and refresh_token cookies and redirects to the client callback page (no tokens in URL). On failure, redirects to login page with error.'
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
      description: 'Redirect to client application with httpOnly cookies set',
      schema: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'Redirect URL (tokens are delivered via httpOnly cookies, not in the URL)',
            example: 'https://client.example.com/auth/callback'
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
