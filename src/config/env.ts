import "dotenv/config";
import zod from "zod";

const envSchema = zod.object({
  PORT: zod
    .string()
    .default("8000")
    .transform((val) => {
      const num = Number(val);
      return isNaN(num) ? 8000 : num;
    }),
  DATABASE_URL: zod.string(),
  JWT_SECRET: zod.string(),
  JWT_REFRESH_SECRET: zod.string(),
  SMTP_HOST: zod.string(),
  SMTP_USER: zod.string(),
  SMTP_PORT: zod.string(),
  SMTP_PASS: zod.string(),
  FRONTEND_URL: zod.string(),
});

export const env = envSchema.parse(process.env);
