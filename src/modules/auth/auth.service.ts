import bcrypt from "bcrypt";
import crypto, { verify } from "crypto";
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
  ChangePasswordInput,
} from "../../types/auth.types.js";
import type { SafeUser } from "../../types/user.types.js";
import { ApiError } from "../../utils/apiError.js";
import { transporter } from "../../config/mailer.js";
import {
  generateEmailVerificationToken,
  verifyEmailVerificationToken,
} from "../../utils/emailToken.js";
import { email } from "zod";

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
      user.role?.rolePermissions?.map(
        (rp: any) => rp.permission.permission_key,
      ) ?? [];

    const tokens = generateTokens({
      userId: user.user_id,
      email: user.email,
      role: user.role?.role_name ?? "user", // default role dengan akses paling terbatas
      isActive: user.is_active,
      permissions: permissions,
    });

    await prisma.user.update({
      where: { user_id: user.user_id },
      data: { last_login_at: new Date() },
    });

    return { user: toSafeUser(user), tokens };
  },

  async googleLogin(user_id: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { user_id: user_id },
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
        throw new ApiError(401, "Credential anda belum tervalidasi");
      }

      // Extract permissions from role
      const permissions =
        user.role?.rolePermissions?.map(
          (rp: any) => rp.permission.permission_key,
        ) ?? [];

      const tokens = generateTokens({
        userId: user.user_id,
        email: user.email,
        role: user.role?.role_name ?? "user", // default role dengan akses paling terbatas
        isActive: user.is_active,
        permissions: permissions,
      });

      await prisma.user.update({
        where: { user_id: user.user_id },
        data: { last_login_at: new Date() },
      });

      return { user: toSafeUser(user), tokens };
    } catch (err) {
      throw new ApiError(401, `Gagal validasi google ${err}`);
    }
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

    // Buang klaim waktu (iat/exp) dari token lama agar bisa di-sign ulang
    // dengan expiry baru (Jwt.sign menolak expiresIn jika payload punya exp)
    const { iat, exp, ...payload } = decoded as JwtPayload & {
      iat?: number;
      exp?: number;
    };

    return generateTokens(payload);
  },

  async forgotPassword(input: ForgotPasswordInput): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      select: {
        user_id: true,
        email: true,
        googleId: true,
      },
    });

    // Selalu return sukses walau user gak ketemu (hindari email enumeration)
    if (!user) return;

    // Cek apakah user login via Google
    if (user.googleId) {
      throw new ApiError(
        403,
        "User yang login melalui Google tidak dapat mereset password. Silakan login menggunakan Google OAuth.",
      );
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 menit

    await prisma.user.update({
      where: { user_id: user.user_id },
      data: { reset_token: resetToken, reset_token_expires: resetTokenExpires },
    });

    // TODO: kirim email/Lark notif berisi link reset dengan resetToken
    const resetLink = `${env.FRONTEND_ADMIN_URL}/reset-password?token=${resetToken}`;

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
      select: {
        user_id: true,
        email: true,
        googleId: true,
        reset_token: true,
      },
    });

    if (!user) {
      throw new ApiError(400, "Token reset tidak valid atau sudah kadaluarsa");
    }

    // Cek apakah user login via Google
    if (user.googleId) {
      throw new ApiError(
        403,
        "User yang login melalui Google tidak dapat mereset password. Silakan login menggunakan Google OAuth.",
      );
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

  /**
   * Ganti password user yang sedang login. Wajib menyertakan password lama agar
   * sesi yang tertinggal (mis. perangkat yang lupa logout) tidak bisa dipakai
   * untuk mengambil alih akun.
   */
  async changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      select: { user_id: true, password: true, googleId: true },
    });

    if (!user) {
      throw new ApiError(404, "User tidak ditemukan");
    }

    if (user.googleId) {
      throw new ApiError(
        403,
        "User yang login melalui Google tidak dapat mengganti password. Silakan kelola password melalui akun Google.",
      );
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      input.currentPassword,
      user.password,
    );
    if (!isCurrentPasswordValid) {
      // 400 (bukan 401) agar frontend tidak mengira sesi habis lalu logout.
      throw new ApiError(400, "Password saat ini salah");
    }

    await prisma.user.update({
      where: { user_id: user.user_id },
      data: {
        password: await bcrypt.hash(input.newPassword, SALT_ROUNDS),
        // Link reset password yang masih aktif tidak boleh dipakai lagi.
        reset_token: null,
        reset_token_expires: null,
      },
    });
  },

  /**
   * Kirim link verifikasi ke email user yang sedang login.
   * Mengembalikan false jika email sudah terverifikasi (tidak ada email dikirim).
   */
  async sendVerifyEmail(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { user_id: userId },
    });

    if (!user) {
      throw new ApiError(404, "User tidak ditemukan");
    }

    if (user.email_verified) {
      return false;
    }

    const verificationToken = generateEmailVerificationToken({
      userId: user.user_id,
      email: user.email,
    });

    const verifyUrl = `${env.FRONTEND_ADMIN_URL}/auth/send-verify-email?token=${verificationToken}`;

    await transporter.sendMail({
      from: `"Koaci Reporting App" <${env.SMTP_USER}>`,
      to: user.email,
      subject: "Verifikasi Email Anda",
      html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
        <h2>Verifikasi Email</h2>
        <p>Klik tombol di bawah untuk verifikasi email kamu. Link berlaku selama 30 menit.</p>
        <a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:6px;">
          Verifikasi Email
        </a>
        <p style="margin-top:16px;font-size:12px;color:#666;">
          Atau salin link berikut ke browser:<br/>${verifyUrl}
        </p>
      </div>
    `,
    });

    return true;
  },

  async verifyEmail(token: string): Promise<void> {
    if (!token || typeof token !== "string") {
      throw new ApiError(400, "Token tidak ditemukan");
    }

    let decoded;
    try {
      decoded = verifyEmailVerificationToken(token);
    } catch (error) {
      throw new ApiError(400, "Token tidak valid atau sudah kadaluarsa");
    }

    const user = await prisma.user.findUnique({
      where: { user_id: decoded.userId },
    });

    if (!user) {
      throw new ApiError(404, "User tidak ditemukan");
    }

    // Token hanya berlaku untuk email yang dituju saat link dikirim. Tanpa cek ini,
    // user bisa mengganti email ke alamat orang lain lalu memakai link lama
    // sehingga alamat tersebut tercatat terverifikasi.
    if (decoded.email !== user.email) {
      throw new ApiError(
        400,
        "Link verifikasi tidak berlaku karena email akun sudah berubah. Silakan minta link verifikasi baru.",
      );
    }

    if (user.email_verified) {
      return;
    }

    await prisma.user.update({
      where: { user_id: user.user_id },
      data: { email_verified: true },
    });

    return;
  },
};
