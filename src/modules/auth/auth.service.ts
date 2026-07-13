import bcrypt from "bcrypt";
import crypto from "crypto";
import Jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import prisma from "../../lib/prisma.js";
import { toSafeUser } from "../user/user.service.js";
import type {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  JwtPayload,
  AuthTokens,
} from "../../types/auth.types.js";
import type { SafeUser } from "../../types/user.types.js";
import { ApiError } from "../../utils/apiError.js";
import { transporter } from "../../config/mailer.js";

const SALT_ROUNDS = 10;

function generateTokens(payload: JwtPayload): AuthTokens {
  const accessToken = Jwt.sign(payload, env.JWT_SECRET, { expiresIn: "1h" });
  const refreshToken = Jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
  return { accessToken, refreshToken };
}

export const authService = {
  async register(input: RegisterInput): Promise<SafeUser> {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new ApiError(409, "Email sudah terdaftar");
    }

    const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        firstname: input.firstname,
        lastname: input.lastname,
        email: input.email,
        password: hashedPassword,
      },
    });

    return toSafeUser(user);
  },

  async login(
    input: LoginInput,
  ): Promise<{ user: SafeUser; tokens: AuthTokens }> {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
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

    if (!user) {
      throw new ApiError(401, "Email atau password salah");
    }

    if (!user.is_active) {
      throw new ApiError(403, "Akun belum aktif, silakan hubungi admin");
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.password);
    if (!isPasswordValid) {
      throw new ApiError(401, "Email atau password salah");
    }

    // Extract permissions from role
    const permissions =
      user.role?.rolePermissions?.map((rp) => rp.permission.permission_key) ??
      [];

    const tokens = generateTokens({
      userId: user.user_id,
      email: user.email,
      role: user.role?.role_name ?? "investor", // default role dengan akses paling terbatas
      permissions: permissions,
    });

    await prisma.user.update({
      where: { user_id: user.user_id },
      data: { last_login_at: new Date() },
    });

    return { user: toSafeUser(user), tokens };
  },

  async refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
    let decoded: JwtPayload;
    try {
      decoded = Jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as JwtPayload;
    } catch {
      throw new ApiError(
        401,
        "Refresh token tidak valid atau sudah kadaluarsa",
      );
    }

    const user = await prisma.user.findUnique({
      where: { user_id: decoded.userId },
    });
    if (!user || !user.is_active) {
      throw new ApiError(401, "User tidak ditemukan atau tidak aktif");
    }

    return generateTokens(decoded);
  },

  async forgotPassword(input: ForgotPasswordInput): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    // Selalu return sukses walau user gak ketemu (hindari email enumeration)
    if (!user) return;

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 menit

    await prisma.user.update({
      where: { user_id: user.user_id },
      data: { reset_token: resetToken, reset_token_expires: resetTokenExpires },
    });

    // TODO: kirim email/Lark notif berisi link reset dengan resetToken
    const resetLink = `${env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    await transporter.sendMail({
      from: `"Koaci Reporting App" <${env.SMTP_USER}>`,
      to: input.email,
      subject: "Reset Password",
      html: `
      <p>Klik link berikut untuk reset password (berlaku 30 menit):</p>
      <a href="${resetLink}">${resetLink}</a>
    `,
    });

    return;
  },

  async resetPassword(input: ResetPasswordInput): Promise<void> {
    const user = await prisma.user.findFirst({
      where: {
        reset_token: input.token,
        reset_token_expires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new ApiError(400, "Token reset tidak valid atau sudah kadaluarsa");
    }

    const hashedPassword = await bcrypt.hash(input.newPassword, SALT_ROUNDS);

    await prisma.user.update({
      where: { user_id: user.user_id },
      data: {
        password: hashedPassword,
        reset_token: null,
        reset_token_expires: null,
      },
    });
  },
};
