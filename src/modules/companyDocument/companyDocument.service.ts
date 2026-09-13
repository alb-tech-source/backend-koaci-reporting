import { DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import prisma from "../../lib/prisma.js";
import { r2Client, R2_BUCKET } from "../../lib/r2Client.js";
import { ApiError } from "../../utils/apiError.js";
import {
  MAX_DOCUMENT_SIZE_BYTES,
  UPLOAD_URL_EXPIRY_SECONDS,
  assertAllowedFileSize,
  assertAllowedMimeType,
  assertObjectKeyForResource,
  buildObjectKey,
  documentMimeTypes,
  presignPutObject,
  verifyUploadedObject,
} from "../../lib/r2Presign.js";
import type {
  PresignCompanyDocumentInput,
  CreateCompanyDocumentInput,
  UpdateCompanyDocumentInput,
  ListCompanyDocumentQuery,
} from "../../types/companyDocument.types.js";

const includeUploader = {
  user: { select: { user_id: true, firstname: true, lastname: true, email: true } },
};

export const companyDocumentService = {
  presign: async (input: PresignCompanyDocumentInput) => {
    const company = await prisma.company.findUnique({ where: { company_id: input.company_id } });
    if (!company) throw new ApiError(404, "Perusahaan tidak ditemukan");

    assertAllowedMimeType(input.mime_type, documentMimeTypes);
    assertAllowedFileSize(input.file_size_bytes, MAX_DOCUMENT_SIZE_BYTES);

    const objectKey = buildObjectKey("company", input.company_id, input.file_name);
    const uploadUrl = await presignPutObject(objectKey, input.mime_type, UPLOAD_URL_EXPIRY_SECONDS);
    return { uploadUrl, objectKey, expiresIn: UPLOAD_URL_EXPIRY_SECONDS };
  },

  // Konfirmasi setelah client PUT langsung ke R2 — buat record DB dari hasil verifikasi storage
  upload: async (input: CreateCompanyDocumentInput) => {
    const company = await prisma.company.findUnique({ where: { company_id: input.company_id } });
    if (!company) throw new ApiError(404, "Perusahaan tidak ditemukan");

    assertObjectKeyForResource(input.object_key, "company", input.company_id);
    assertAllowedMimeType(input.mime_type, documentMimeTypes);
    const verified = await verifyUploadedObject({
      objectKey: input.object_key,
      expectedMimeType: input.mime_type,
      maxSizeBytes: MAX_DOCUMENT_SIZE_BYTES,
    });

    try {
      return await prisma.companyDocument.create({
        data: {
          company_id: input.company_id,
          document_type: input.document_type,
          document_name: input.document_name,
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

  listByCompany: async (companyId: string, query: ListCompanyDocumentQuery) => {
    const { page, limit, document_type, search } = query;
    const where = {
      company_id: companyId,
      ...(document_type && { document_type }),
      ...(search && { document_name: { contains: search, mode: "insensitive" as const } }),
    };
    const [total, data] = await prisma.$transaction([
      prisma.companyDocument.count({ where }),
      prisma.companyDocument.findMany({
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
    const document = await prisma.companyDocument.findUnique({
      where: { document_id: documentId },
      include: { ...includeUploader, company: true },
    });
    if (!document) throw new ApiError(404, "Dokumen perusahaan tidak ditemukan");
    return document;
  },

  getDownloadUrl: async (documentId: string) => {
    const document = await companyDocumentService.getById(documentId);
    const command = new GetObjectCommand({ Bucket: R2_BUCKET, Key: document.object_key });
    return getSignedUrl(r2Client, command, { expiresIn: 3600 });
  },

  update: async (documentId: string, input: UpdateCompanyDocumentInput) => {
    await companyDocumentService.getById(documentId);
    return prisma.companyDocument.update({
      where: { document_id: documentId },
      data: input,
      include: includeUploader,
    });
  },

  delete: async (documentId: string) => {
    const document = await companyDocumentService.getById(documentId);
    await r2Client.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: document.object_key }));
    return prisma.companyDocument.delete({ where: { document_id: documentId } });
  },
};
