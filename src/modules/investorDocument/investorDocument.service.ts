import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2Client, R2_BUCKET } from "../../lib/r2Client.js";
import prisma from "../../lib/prisma.js";
import { randomUUID } from "crypto";
import type {
  InputInvestorDocumentInput,
  UpdateInvestorDocumentInput,
  GetInvestorDocumentInput,
  DeleteInvestorDocumentInput,
  SafeInvestorDocument,
  PaginatedResult,
  GetListInvestorDocumentsInput,
} from "../../types/investorDocument.types.js";

export const investorDocumentService = {
  uploadInvestorDocument: async (
    input: InputInvestorDocumentInput,
  ): Promise<SafeInvestorDocument> => {
    const objectKey = `investor/${input.investor_id}/${randomUUID()}-${input.document_name}`;

    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: objectKey,
        Body: input.buffer,
        ContentType: input.mime_type,
      }),
    );

    return prisma.investorDocument.create({
      data: {
        investor_id: input.investor_id,
        document_id: randomUUID(),
        document_name: input.document_name,
        storage_provider: input.storage_provider,
        object_key: objectKey,
        file_size_bytes: BigInt(input.buffer.length),
        mime_type: input.mime_type,
      },
    });
  },

  getDocumentDownloadUrl: async (
    input: GetInvestorDocumentInput,
  ): Promise<string> => {
    const doc = await prisma.investorDocument.findUniqueOrThrow({
      where: { document_id: input.documentId },
    });

    const command = new GetObjectCommand({
      Bucket: R2_BUCKET,
      Key: doc.object_key,
    });

    return getSignedUrl(r2Client, command, { expiresIn: 3600 }); // 1 jam
  },

  getListInvestorDocuments: async (
    input: GetListInvestorDocumentsInput,
  ): Promise<PaginatedResult<SafeInvestorDocument>> => {
    const documents = await prisma.investorDocument.findMany({
      where: { investor_id: input.investor_id },
    });

    const total = await prisma.investorDocument.count({
      where: { investor_id: input.investor_id },
    });

    return {
      data: documents,
      meta: {
        total,
        page: 1,
        limit: documents.length,
        totalPages: Math.ceil(total / documents.length),
      },
    };
  },

  deleteInvestorDocument: async (
    input: DeleteInvestorDocumentInput,
  ): Promise<SafeInvestorDocument> => {
    const doc = await prisma.investorDocument.findUniqueOrThrow({
      where: { document_id: input.documentId },
    });

    await r2Client.send(
      new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: doc.object_key }),
    );

    return prisma.investorDocument.delete({
      where: { document_id: input.documentId },
    });
  },
};
