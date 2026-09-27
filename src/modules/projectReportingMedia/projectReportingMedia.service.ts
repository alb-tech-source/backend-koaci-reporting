import path from "path";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import prisma from "../../lib/prisma.js";
import { r2Client, R2_BUCKET } from "../../lib/r2Client.js";
import { ApiError } from "../../utils/apiError.js";
import {
  DOWNLOAD_URL_EXPIRY_SECONDS,
  STREAM_URL_EXPIRY_SECONDS,
  MAX_MEDIA_SIZE_BYTES,
  MEDIA_UPLOAD_URL_EXPIRY_SECONDS,
  assertAllowedFileSize,
  assertAllowedMimeType,
  assertObjectKeyForResource,
  buildObjectKey,
  mediaMimeTypes,
  presignGetObject,
  presignPutObject,
  verifyUploadedObject,
} from "../../lib/r2Presign.js";
import type {
  PresignProjectReportingMediaInput,
  CreateProjectReportingMediaInput,
  UpdateProjectReportingMediaInput,
  ListProjectReportingMediaQuery,
} from "../../types/projectReportingMedia.types.js";

const includeUploader = {
  user: { select: { user_id: true, firstname: true, lastname: true, email: true } },
};

type SignableMedia = {
  object_key: string;
  media_name: string;
  media_type: string;
  mime_type: string | null;
};

const signableSelect = {
  object_key: true,
  media_name: true,
  media_type: true,
  mime_type: true,
} as const;

/** Nama file unduhan: media_name + ekstensi asli dari object_key bila belum ada. */
const downloadFileName = (media: SignableMedia) => {
  const ext = path.extname(media.object_key);
  return ext && !media.media_name.toLowerCase().endsWith(ext.toLowerCase())
    ? `${media.media_name}${ext}`
    : media.media_name;
};

/** URL unduhan: memaksa browser menyimpan file (attachment). */
const signDownloadUrl = (media: SignableMedia) =>
  presignGetObject(media.object_key, {
    disposition: "attachment",
    fileName: downloadFileName(media),
    expiresInSeconds: DOWNLOAD_URL_EXPIRY_SECONDS,
  });

/**
 * URL stream: ditampilkan/diputar langsung di browser (inline) — untuk `<video>`,
 * `<img>`, atau membuka PDF di tab. R2 melayani Range request sehingga video
 * bisa diputar & di-seek tanpa mengunduh seluruh file.
 */
const signStreamUrl = async (media: SignableMedia) => ({
  streamUrl: await presignGetObject(media.object_key, {
    disposition: "inline",
    fileName: downloadFileName(media),
    contentType: media.mime_type,
    expiresInSeconds: STREAM_URL_EXPIRY_SECONDS,
  }),
  mediaType: media.media_type,
  mimeType: media.mime_type,
  expiresIn: STREAM_URL_EXPIRY_SECONDS,
});

/** Media dari laporan project yang diinvestasi oleh investor yang sedang login. */
const findOwnedMedia = async (user_id: string, mediaId: string) => {
  const investor = await prisma.investor.findUnique({
    where: { user_id },
    select: { investor_id: true },
  });
  if (!investor)
    throw new ApiError(404, `Investor dengan user_id ${user_id} tidak ditemukan.`);

  const media = await prisma.projectReportingMedia.findFirst({
    where: {
      project_reporting_media_id: mediaId,
      projectReporting: {
        project: {
          projectInvestment: { some: { investor_id: investor.investor_id } },
        },
      },
    },
    select: signableSelect,
  });
  if (!media)
    throw new ApiError(
      404,
      "Media laporan project tidak ditemukan atau bukan milik project yang Anda ikuti.",
    );
  return media;
};

export const projectReportingMediaService = {
  presign: async (input: PresignProjectReportingMediaInput) => {
    const reporting = await prisma.projectReporting.findUnique({
      where: { project_reporting_id: input.project_reporting_id },
      select: { project_reporting_id: true },
    });
    if (!reporting) throw new ApiError(404, "Laporan project tidak ditemukan");

    assertAllowedMimeType(input.mime_type, mediaMimeTypes);
    assertAllowedFileSize(input.file_size_bytes, MAX_MEDIA_SIZE_BYTES);

    const objectKey = buildObjectKey("reporting", input.project_reporting_id, input.file_name);
    const uploadUrl = await presignPutObject(objectKey, input.mime_type, MEDIA_UPLOAD_URL_EXPIRY_SECONDS);
    return { uploadUrl, objectKey, expiresIn: MEDIA_UPLOAD_URL_EXPIRY_SECONDS };
  },

  // Konfirmasi setelah client PUT langsung ke R2 — buat record DB dari hasil verifikasi storage
  upload: async (input: CreateProjectReportingMediaInput) => {
    const reporting = await prisma.projectReporting.findUnique({
      where: { project_reporting_id: input.project_reporting_id },
      select: { project_reporting_id: true },
    });
    if (!reporting) throw new ApiError(404, "Laporan project tidak ditemukan");

    assertObjectKeyForResource(input.object_key, "reporting", input.project_reporting_id);
    assertAllowedMimeType(input.mime_type, mediaMimeTypes);
    const verified = await verifyUploadedObject({
      objectKey: input.object_key,
      expectedMimeType: input.mime_type,
      maxSizeBytes: MAX_MEDIA_SIZE_BYTES,
    });

    try {
      return await prisma.projectReportingMedia.create({
        data: {
          project_reporting_id: input.project_reporting_id,
          media_type: input.media_type,
          media_name: input.media_name,
          storage_provider: input.storage_provider,
          object_key: input.object_key,
          file_size_bytes: BigInt(verified.fileSizeBytes),
          mime_type: verified.mimeType,
          uploaded_by: input.uploaded_by,
        },
        include: includeUploader,
      });
    } catch (error) {
      await r2Client.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: input.object_key })).catch(() => undefined);
      throw error;
    }
  },

  listByReporting: async (reportingId: string, query: ListProjectReportingMediaQuery) => {
    const { page, limit, media_type, search } = query;
    const where = {
      project_reporting_id: reportingId,
      ...(media_type && { media_type }),
      ...(search && { media_name: { contains: search, mode: "insensitive" as const } }),
    };
    const [total, data] = await prisma.$transaction([
      prisma.projectReportingMedia.count({ where }),
      prisma.projectReportingMedia.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { uploaded_at: "desc" },
        include: includeUploader,
      }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  },

  getById: async (mediaId: string) => {
    const media = await prisma.projectReportingMedia.findUnique({
      where: { project_reporting_media_id: mediaId },
      include: { ...includeUploader, projectReporting: true },
    });
    if (!media) throw new ApiError(404, "Media laporan project tidak ditemukan");
    return media;
  },

  getDownloadUrl: async (mediaId: string) =>
    signDownloadUrl(await projectReportingMediaService.getById(mediaId)),

  getStreamUrl: async (mediaId: string) =>
    signStreamUrl(await projectReportingMediaService.getById(mediaId)),

  // Media dari laporan project yang diinvestasi oleh investor yang sedang login
  getByUser: async (user_id: string) => {
    const investor = await prisma.investor.findUnique({
      where: {
        user_id: user_id,
      },
      select: {
        investor_id: true,
      },
    });

    if (!investor)
      throw new ApiError(
        404,
        `Investor dengan user_id ${user_id} tidak ditemukan.`,
      );

    return prisma.projectReportingMedia.findMany({
      where: {
        projectReporting: {
          project: {
            projectInvestment: { some: { investor_id: investor.investor_id } },
          },
        },
      },
      include: {
        ...includeUploader,
        projectReporting: {
          include: {
            project: true,
          },
        },
      },
      orderBy: { uploaded_at: "desc" },
    });
  },

  getDownloadUrlByUser: async (user_id: string, mediaId: string) =>
    signDownloadUrl(await findOwnedMedia(user_id, mediaId)),

  getStreamUrlByUser: async (user_id: string, mediaId: string) =>
    signStreamUrl(await findOwnedMedia(user_id, mediaId)),

  update: async (mediaId: string, input: UpdateProjectReportingMediaInput) => {
    await projectReportingMediaService.getById(mediaId);
    return prisma.projectReportingMedia.update({
      where: { project_reporting_media_id: mediaId },
      data: input,
      include: includeUploader,
    });
  },

  delete: async (mediaId: string) => {
    const media = await projectReportingMediaService.getById(mediaId);
    await r2Client.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: media.object_key }));
    return prisma.projectReportingMedia.delete({
      where: { project_reporting_media_id: mediaId },
    });
  },
};
