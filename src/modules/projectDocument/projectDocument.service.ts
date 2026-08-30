import { randomUUID } from "crypto";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import prisma from "../../lib/prisma.js";
import { r2Client, R2_PROJECT_BUCKET } from "../../lib/r2Client.js";
import { ApiError } from "../../utils/apiError.js";
import type {
  CreateProjectDocumentInput,
  UpdateProjectDocumentInput,
  ListProjectDocumentQuery,
} from "../../types/projectDocument.types.js";

const includeUploader = {
  user: { select: { user_id: true, firstname: true, lastname: true, email: true } },
};

export const projectDocumentService = {
  upload: async (input: CreateProjectDocumentInput) => {
    const project = await prisma.project.findUnique({ where: { project_id: input.project_id } });
    if (!project) throw new ApiError(404, "Project tidak ditemukan");

    const objectKey = `project/${input.project_id}/${randomUUID()}-${input.document_name}`;
    await r2Client.send(new PutObjectCommand({
      Bucket: R2_PROJECT_BUCKET,
      Key: objectKey,
      Body: input.buffer,
      ContentType: input.mime_type,
    }));

    try {
      return await prisma.projectDocument.create({
        data: {
          project_id: input.project_id,
          document_type: input.document_type,
          document_name: input.document_name,
          storage_provider: input.storage_provider,
          object_key: objectKey,
          file_size_bytes: BigInt(input.buffer.length),
          mime_type: input.mime_type,
          uploaded_by: input.uploaded_by,
        },
        include: includeUploader,
      });
    } catch (error) {
      await r2Client.send(new DeleteObjectCommand({ Bucket: R2_PROJECT_BUCKET, Key: objectKey })).catch(() => undefined);
      throw error;
    }
  },

  listByProject: async (projectId: string, query: ListProjectDocumentQuery) => {
    const { page, limit, document_type, search } = query;
    const where = {
      project_id: projectId,
      ...(document_type && { document_type }),
      ...(search && { document_name: { contains: search, mode: "insensitive" as const } }),
    };
    const [total, data] = await prisma.$transaction([
      prisma.projectDocument.count({ where }),
      prisma.projectDocument.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { uploaded_at: "desc" },
        include: includeUploader,
      }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  },

  getById: async (documentId: string) => {
    const document = await prisma.projectDocument.findUnique({
      where: { document_id: documentId },
      include: { ...includeUploader, project: true },
    });
    if (!document) throw new ApiError(404, "Dokumen project tidak ditemukan");
    return document;
  },

  getDownloadUrl: async (documentId: string) => {
    const document = await projectDocumentService.getById(documentId);
    const command = new GetObjectCommand({ Bucket: R2_PROJECT_BUCKET, Key: document.object_key });
    return getSignedUrl(r2Client, command, { expiresIn: 3600 });
  },

  update: async (documentId: string, input: UpdateProjectDocumentInput) => {
    await projectDocumentService.getById(documentId);
    return prisma.projectDocument.update({
      where: { document_id: documentId },
      data: input,
      include: includeUploader,
    });
  },

  delete: async (documentId: string) => {
    const document = await projectDocumentService.getById(documentId);
    await r2Client.send(new DeleteObjectCommand({ Bucket: R2_PROJECT_BUCKET, Key: document.object_key }));
    return prisma.projectDocument.delete({ where: { document_id: documentId } });
  },
};
