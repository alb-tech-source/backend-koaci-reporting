import { randomUUID } from "crypto";
import {
  DeleteObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2Client, R2_BUCKET } from "./r2Client.js";
import { ApiError } from "../utils/apiError.js";

// Allowed MIME types for documents (PDF, images, documents)
export const documentMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

// Allowed MIME types for project reporting media (photo, video, document)
export const mediaMimeTypes = [
  ...documentMimeTypes,
  "video/mp4",
  "video/quicktime",
  "video/x-msvideo",
  "video/webm",
];

export const MAX_DOCUMENT_SIZE_BYTES = 100 * 1024 * 1024; // 100MB
export const MAX_MEDIA_SIZE_BYTES = 300 * 1024 * 1024; // 300MB

export const UPLOAD_URL_EXPIRY_SECONDS = 900; // 15 menit
export const MEDIA_UPLOAD_URL_EXPIRY_SECONDS = 1800; // 30 menit (video besar)

export interface PresignUploadResult {
  uploadUrl: string;
  objectKey: string;
  expiresIn: number;
}

export interface VerifiedUploadObject {
  fileSizeBytes: number;
  mimeType: string;
}

/** Buat object key dengan skema {prefix}/{resourceId}/{uuid}-{fileName} */
export const buildObjectKey = (
  prefix: string,
  resourceId: string,
  fileName: string,
): string => {
  const safeName =
    fileName.replace(/[^A-Za-z0-9._()-]/g, "_").slice(0, 150) || "file";
  return `${prefix}/${resourceId}/${randomUUID()}-${safeName}`;
};

export const assertAllowedMimeType = (
  mimeType: string,
  allowed: string[],
): void => {
  if (!allowed.includes(mimeType))
    throw new ApiError(
      415,
      `Tipe file ${mimeType} tidak diizinkan. Tipe yang diizinkan: ${allowed.join(", ")}`,
    );
};

export const assertAllowedFileSize = (bytes: number, max: number): void => {
  if (bytes > max)
    throw new ApiError(
      413,
      `Ukuran file melebihi batas maksimal ${Math.floor(max / (1024 * 1024))}MB`,
    );
};

/** Pastikan object_key benar-benar milik resource ini (cegah confirm lintas resource/user) */
export const assertObjectKeyForResource = (
  objectKey: string,
  prefix: string,
  resourceId: string,
): void => {
  if (
    !objectKey.startsWith(`${prefix}/${resourceId}/`) ||
    objectKey.includes("..")
  )
    throw new ApiError(400, "object_key tidak valid untuk resource ini");
};

/** Presign PUT URL; ContentType di-sign sehingga client wajib mengirim Content-Type yang sama */
export const presignPutObject = async (
  objectKey: string,
  contentType: string,
  expiresInSeconds: number = UPLOAD_URL_EXPIRY_SECONDS,
): Promise<string> => {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: objectKey,
    ContentType: contentType,
  });
  return getSignedUrl(r2Client, command, { expiresIn: expiresInSeconds });
};

/**
 * Verifikasi object hasil upload direct ke R2 sebelum record DB dibuat:
 * - object benar-benar ada (HeadObject)
 * - ukuran aktual ≤ batas maksimal (object oversized dihapus, tidak akan pernah bisa dikonfirmasi)
 * - content-type aktual sesuai mime_type yang diklaim
 */
export const verifyUploadedObject = async (input: {
  objectKey: string;
  expectedMimeType: string;
  maxSizeBytes: number;
}): Promise<VerifiedUploadObject> => {
  let head;
  try {
    head = await r2Client.send(
      new HeadObjectCommand({ Bucket: R2_BUCKET, Key: input.objectKey }),
    );
  } catch (error: any) {
    if (error?.$metadata?.httpStatusCode === 404 || error?.name === "NotFound")
      throw new ApiError(
        404,
        "File belum ditemukan di storage. Pastikan PUT ke uploadUrl sudah berhasil sebelum konfirmasi.",
      );
    throw error;
  }

  const fileSizeBytes = head.ContentLength ?? 0;
  if (fileSizeBytes > input.maxSizeBytes) {
    await r2Client
      .send(
        new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: input.objectKey }),
      )
      .catch(() => undefined);
    throw new ApiError(
      413,
      `Ukuran file melebihi batas maksimal ${Math.floor(input.maxSizeBytes / (1024 * 1024))}MB`,
    );
  }

  if (
    head.ContentType &&
    input.expectedMimeType &&
    head.ContentType !== input.expectedMimeType
  )
    throw new ApiError(
      400,
      "mime_type tidak sesuai dengan file yang terunggah di storage",
    );

  return {
    fileSizeBytes,
    mimeType: head.ContentType || input.expectedMimeType,
  };
};
