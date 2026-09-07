import { randomUUID } from "crypto";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import prisma from "../../lib/prisma.js";
import { r2Client, R2_BUCKET } from "../../lib/r2Client.js";
import { ApiError } from "../../utils/apiError.js";
import type {
  CreateCompanyDocumentInput,
  UpdateCompanyDocumentInput,
  ListCompanyDocumentQuery,
} from "../../types/companyDocument.types.js";

const includeUploader = {
  user: { select: { user_id: true, firstname: true, lastname: true, email: true } },
};

export const companyDocumentService = {
  upload: async (input: CreateCompanyDocumentInput) => {
    const company = await prisma.company.findUnique({ where: { company_id: input.company_id } });
    if (!company) throw new ApiError(404, "Perusahaan tidak ditemukan");

    const objectKey = `company/${input.company_id}/${randomUUID()}-${input.document_name}`;
    await r2Client.send(new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: objectKey,
      Body: input.buffer,
      ContentType: input.mime_type,
    }));

    try {
      return await prisma.companyDocument.create({
        data: {
          company_id: input.company_id,
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
      await r2Client.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: objectKey })).catch(() => undefined);
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
