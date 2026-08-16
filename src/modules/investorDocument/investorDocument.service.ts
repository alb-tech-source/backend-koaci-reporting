import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2Client, R2_INVESTOR_BUCKET } from "../../lib/r2Client.js";
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
import type { AccessContext } from "../../middleware/auth.middleware.js";
import { ApiError } from "../../utils/apiError.js";

const documentAccessWhere = (access: AccessContext) =>
  access.scope === "own"
    ? { investor: { user_id: access.userId } }
    : {};

export const investorDocumentService = {
  uploadInvestorDocument: async (
    input: InputInvestorDocumentInput,
    access: AccessContext,
  ): Promise<SafeInvestorDocument> => {
    const investor = await prisma.investor.findFirst({
      where: {
        investor_id: input.investor_id,
        ...(access.scope === "own" ? { user_id: access.userId } : {}),
      },
      select: { investor_id: true },
    });

    if (!investor) {
      throw new ApiError(404, "Investor tidak ditemukan");
    }

    const objectKey = `investor/${input.investor_id}/${randomUUID()}-${input.document_name}`;

    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_INVESTOR_BUCKET,
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
    access: AccessContext,
  ): Promise<string> => {
    const doc = await prisma.investorDocument.findFirstOrThrow({
      where: {
        document_id: input.documentId,
        ...documentAccessWhere(access),
      },
    });

    const command = new GetObjectCommand({
      Bucket: R2_INVESTOR_BUCKET,
      Key: doc.object_key,
    });

    return getSignedUrl(r2Client, command, { expiresIn: 3600 }); // 1 jam
  },

  getListInvestorDocuments: async (
    input: GetListInvestorDocumentsInput,
    access: AccessContext,
  ): Promise<PaginatedResult<SafeInvestorDocument>> => {
    const documents = await prisma.investorDocument.findMany({
      where: {
        investor_id: input.investor_id,
        ...documentAccessWhere(access),
      },
    });

    const total = await prisma.investorDocument.count({
      where: {
        investor_id: input.investor_id,
        ...documentAccessWhere(access),
      },
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
    access: AccessContext,
  ): Promise<SafeInvestorDocument> => {
    const doc = await prisma.investorDocument.findFirstOrThrow({
      where: {
        document_id: input.documentId,
        ...documentAccessWhere(access),
      },
    });

    await r2Client.send(
      new DeleteObjectCommand({ Bucket: R2_INVESTOR_BUCKET, Key: doc.object_key }),
    );

    return prisma.investorDocument.delete({
      where: { document_id: input.documentId },
    });
  },
};
