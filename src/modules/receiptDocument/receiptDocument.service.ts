import { randomUUID } from "crypto";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import prisma from "../../lib/prisma.js";
import { r2Client, R2_BUCKET } from "../../lib/r2Client.js";
import { ApiError } from "../../utils/apiError.js";
import type { CreateReceiptDocumentInput } from "../../types/receiptDocument.types.js";

const includeUploader = {
  user: { select: { user_id: true, firstname: true, lastname: true, email: true } },
};

export const receiptDocumentService = {
  upload: async (input: CreateReceiptDocumentInput) => {
    const investment = await prisma.projectInvestment.findUnique({
      where: { project_investment_id: input.project_investment_id },
      select: { project_investment_id: true },
    });
    if (!investment) throw new ApiError(404, "Data investasi tidak ditemukan");

    // Satu investment hanya boleh punya satu receipt — tolak jika sudah ada
    const existing = await prisma.receiptDocument.findUnique({
      where: { project_investment_id: input.project_investment_id },
      select: { receipt_document_id: true },
    });
    if (existing)
      throw new ApiError(
        409,
        "Receipt document untuk data investasi ini sudah ada. Hapus receipt lama terlebih dahulu jika ingin mengganti.",
      );

    const objectKey = `receipt/${input.project_investment_id}/${randomUUID()}-${input.receipt_name}`;
    await r2Client.send(new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: objectKey,
      Body: input.buffer,
      ContentType: input.mime_type,
    }));

    try {
      return await prisma.receiptDocument.create({
        data: {
          project_investment_id: input.project_investment_id,
          receipt_name: input.receipt_name,
          storage_provider: input.storage_provider,
          object_key: objectKey,
          file_size_bytes: BigInt(input.buffer.length),
          mime_type: input.mime_type,
          uploaded_by: input.uploaded_by,
        },
        include: includeUploader,
      });
    } catch (error: any) {
      await r2Client.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: objectKey })).catch(() => undefined);
      // Race condition: upload pararel untuk investment yang sama
      if (error?.code === "P2002")
        throw new ApiError(
          409,
          "Receipt document untuk data investasi ini sudah ada. Hapus receipt lama terlebih dahulu jika ingin mengganti.",
        );
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

  delete: async (receiptId: string) => {
    const document = await receiptDocumentService.getById(receiptId);
    await r2Client.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: document.object_key }));
    return prisma.receiptDocument.delete({
      where: { receipt_document_id: receiptId },
      include: includeUploader,
    });
  },
};
