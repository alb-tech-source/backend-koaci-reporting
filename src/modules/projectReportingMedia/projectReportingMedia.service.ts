import { DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import prisma from "../../lib/prisma.js";
import { r2Client, R2_BUCKET } from "../../lib/r2Client.js";
import { ApiError } from "../../utils/apiError.js";
import {
  MAX_MEDIA_SIZE_BYTES,
  MEDIA_UPLOAD_URL_EXPIRY_SECONDS,
  assertAllowedFileSize,
  assertAllowedMimeType,
  assertObjectKeyForResource,
  buildObjectKey,
  mediaMimeTypes,
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

  getDownloadUrl: async (mediaId: string) => {
    const media = await projectReportingMediaService.getById(mediaId);
    const command = new GetObjectCommand({ Bucket: R2_BUCKET, Key: media.object_key });
    return getSignedUrl(r2Client, command, { expiresIn: 3600 });
  },

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

  getDownloadUrlByUser: async (user_id: string, mediaId: string) => {
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

    const media = await prisma.projectReportingMedia.findFirst({
      where: {
        project_reporting_media_id: mediaId,
        projectReporting: {
          project: {
            projectInvestment: { some: { investor_id: investor.investor_id } },
          },
        },
      },
      select: {
        object_key: true,
      },
    });

    if (!media)
      throw new ApiError(
        404,
        "Media laporan project tidak ditemukan atau bukan milik project yang Anda ikuti.",
      );

    const command = new GetObjectCommand({ Bucket: R2_BUCKET, Key: media.object_key });
    return getSignedUrl(r2Client, command, { expiresIn: 3600 });
  },

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
