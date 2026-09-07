import { randomUUID } from "crypto";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import prisma from "../../lib/prisma.js";
import { r2Client, R2_BUCKET } from "../../lib/r2Client.js";
import { ApiError } from "../../utils/apiError.js";
import type {
  CreateProjectReportingMediaInput,
  UpdateProjectReportingMediaInput,
  ListProjectReportingMediaQuery,
} from "../../types/projectReportingMedia.types.js";

const includeUploader = {
  user: { select: { user_id: true, firstname: true, lastname: true, email: true } },
};

export const projectReportingMediaService = {
  upload: async (input: CreateProjectReportingMediaInput) => {
    const reporting = await prisma.projectReporting.findUnique({
      where: { project_reporting_id: input.project_reporting_id },
      select: { project_reporting_id: true },
    });
    if (!reporting) throw new ApiError(404, "Laporan project tidak ditemukan");

    const objectKey = `reporting/${input.project_reporting_id}/${randomUUID()}-${input.media_name}`;
    await r2Client.send(new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: objectKey,
      Body: input.buffer,
      ContentType: input.mime_type,
    }));

    try {
      return await prisma.projectReportingMedia.create({
        data: {
          project_reporting_id: input.project_reporting_id,
          media_type: input.media_type,
          media_name: input.media_name,
          storage_provider: input.storage_provider,
          object_key: objectKey,
          file_size_bytes: BigInt(input.buffer.length),
          mime_type: input.mime_type,
          uploaded_by: input.uploaded_by,
        },
        include: includeUploader,
      });
    } catch (error) {
      await r2Client.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: objectKey })).catch(() => undefined);
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
