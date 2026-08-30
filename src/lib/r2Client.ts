import { S3Client } from "@aws-sdk/client-s3";
import { env } from "../config/env.js";

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

export const R2_INVESTOR_BUCKET = env.R2_BUCKET_INVESTOR_NAME;
export const R2_COMPANY_BUCKET = env.R2_BUCKET_COMPANY_NAME;
// Belum ada bucket khusus project — fallback ke bucket company selama belum dikonfigurasi
export const R2_PROJECT_BUCKET = env.R2_BUCKET_PROJECT_NAME ?? env.R2_BUCKET_COMPANY_NAME;
