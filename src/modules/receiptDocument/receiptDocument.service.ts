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
  PresignReceiptDocumentInput,
  CreateReceiptDocumentInput,
} from "../../types/receiptDocument.types.js";

const includeUploader = {
  user: { select: { user_id: true, firstname: true, lastname: true, email: true } },
};

const RECEIPT_ALREADY_EXISTS =
  "Receipt document untuk data investasi ini sudah ada. Hapus receipt lama terlebih dahulu jika ingin mengganti.";

export const receiptDocumentService = {
  presign: async (input: PresignReceiptDocumentInput) => {
    const investment = await prisma.projectInvestment.findUnique({
      where: { project_investment_id: input.project_investment_id },
      select: { project_investment_id: true },
    });
    if (!investment) throw new ApiError(404, "Data investasi tidak ditemukan");

    // Satu investment hanya boleh punya satu receipt — tolak lebih awal (final check tetap di konfirmasi)
    const existing = await prisma.receiptDocument.findUnique({
      where: { project_investment_id: input.project_investment_id },
      select: { receipt_document_id: true },
    });
    if (existing) throw new ApiError(409, RECEIPT_ALREADY_EXISTS);

    assertAllowedMimeType(input.mime_type, documentMimeTypes);
    assertAllowedFileSize(input.file_size_bytes, MAX_DOCUMENT_SIZE_BYTES);

    const objectKey = buildObjectKey("receipt", input.project_investment_id, input.file_name);
    const uploadUrl = await presignPutObject(objectKey, input.mime_type, UPLOAD_URL_EXPIRY_SECONDS);
    return { uploadUrl, objectKey, expiresIn: UPLOAD_URL_EXPIRY_SECONDS };
  },

  // Konfirmasi setelah client PUT langsung ke R2 — buat record DB dari hasil verifikasi storage
  upload: async (input: CreateReceiptDocumentInput) => {
    const investment = await prisma.projectInvestment.findUnique({
      where: { project_investment_id: input.project_investment_id },
      select: { project_investment_id: true },
    });
    if (!investment) throw new ApiError(404, "Data investasi tidak ditemukan");

    // Satu investment hanya boleh punya satu receipt — tolak jika sudah ada
    const existing = await prisma.receiptDocument.findUnique({
      where: { project_investment_id: input.project_investment_id },
      select: { receipt_document_id: true, object_key: true },
    });
    if (existing) {
      // Hapus object kalah hanya jika berbeda dari yang tercatat — double-submit body yang sama tidak boleh menghapus object yang hidup
      if (existing.object_key !== input.object_key) {
        await r2Client
          .send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: input.object_key }))
          .catch(() => undefined);
      }
      throw new ApiError(409, RECEIPT_ALREADY_EXISTS);
    }

    assertObjectKeyForResource(input.object_key, "receipt", input.project_investment_id);
    assertAllowedMimeType(input.mime_type, documentMimeTypes);
    const verified = await verifyUploadedObject({
      objectKey: input.object_key,
      expectedMimeType: input.mime_type,
      maxSizeBytes: MAX_DOCUMENT_SIZE_BYTES,
    });

    try {
      return await prisma.receiptDocument.create({
        data: {
          project_investment_id: input.project_investment_id,
          receipt_name: input.receipt_name,
          storage_provider: input.storage_provider,
          object_key: input.object_key,
          file_size_bytes: BigInt(verified.fileSizeBytes),
          mime_type: verified.mimeType,
          uploaded_by: input.uploaded_by,
        },
        include: includeUploader,
      });
    } catch (error: any) {
      await r2Client.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: input.object_key })).catch(() => undefined);
      // Race condition: konfirmasi paralel untuk investment yang sama
      if (error?.code === "P2002")
        throw new ApiError(409, RECEIPT_ALREADY_EXISTS);
      throw error;
    }
  },

  getByInvestment: async (investmentId: string) => {
    const document = await prisma.receiptDocument.findUnique({
      where: { project_investment_id: investmentId },
      include: includeUploader,
    });
    if (!document) throw new ApiError(404, "Receipt document tidak ditemukan");
    return document;
  },

  getById: async (receiptId: string) => {
    const document = await prisma.receiptDocument.findUnique({
      where: { receipt_document_id: receiptId },
      include: includeUploader,
    });
    if (!document) throw new ApiError(404, "Receipt document tidak ditemukan");
    return document;
  },

  getDownloadUrl: async (receiptId: string) => {
    const document = await receiptDocumentService.getById(receiptId);
    const command = new GetObjectCommand({ Bucket: R2_BUCKET, Key: document.object_key });
    return getSignedUrl(r2Client, command, { expiresIn: 3600 });
  },

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

    return prisma.receiptDocument.findMany({
      where: { projectInvestment: { investor_id: investor.investor_id } },
      include: {
        user: { select: { user_id: true, firstname: true, lastname: true, email: true } },
        projectInvestment: {
          include: {
            project: {
              include: {
                company: true,
              },
            },
          },
        },
      },
      orderBy: { uploaded_at: "desc" },
    });
  },

  getDownloadUrlByUser: async (user_id: string, receiptId: string) => {
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

    const document = await prisma.receiptDocument.findFirst({
      where: {
        receipt_document_id: receiptId,
        projectInvestment: { investor_id: investor.investor_id },
      },
      select: {
        object_key: true,
      },
    });

    if (!document)
      throw new ApiError(
        404,
        "Receipt document tidak ditemukan atau bukan milik Anda.",
      );

    const command = new GetObjectCommand({ Bucket: R2_BUCKET, Key: document.object_key });
    return getSignedUrl(r2Client, command, { expiresIn: 3600 });
  },

  delete: async (receiptId: string) => {
    const document = await receiptDocumentService.getById(receiptId);
    await r2Client.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: document.object_key }));
    return prisma.receiptDocument.delete({
      where: { receipt_document_id: receiptId },
      include: includeUploader,
    });
  },
};
