import type { Response, Request } from "express";
import { investorDocumentService } from "./investorDocument.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { activityLogService } from "../activityLog/activityLog.service.js";

export const investorDocumentController = {
  upload: asyncHandler(async (req: Request, res: Response) => {
    // Parse form data from req.body
    if (!req.file || !req.file.buffer) {
      return ApiResponse(res, 400, {
        message: "File wajib diunggah",
      });
    }

    const input = {
      investor_id: req.body.investor_id as string,
      document_name: req.body.document_name as string,
      storage_provider:
        (req.body.storage_provider as "cloudflare" | "aws" | "tencent") || "cloudflare",
      buffer: req.file.buffer,
      mime_type: req.file.mimetype,
    };

    const document = await investorDocumentService.uploadInvestorDocument(input);

    // Log document upload
    await activityLogService
      .logActivity({
        userId: req.authUser!.userId,
        action: "DOCUMENT_UPLOAD",
        entityType: "InvestorDocument",
        entityId: document.document_id,
        description: `Dokumen ${document.document_name} berhasil diunggah oleh ${req.authUser!.email}`,
        metadata: {
          uploadedDocument: {
            documentId: document.document_id,
            documentName: document.document_name,
            investorId: document.investor_id,
            storageProvider: document.storage_provider,
            fileSize: document.file_size_bytes,
          },
        },
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get("user-agent"),
      })
      .catch((err) => console.error("Failed to log document upload:", err));

    return ApiResponse(res, 201, {
      document,
      message: "Dokumen investor berhasil diunggah",
    });
  }),

  getList: asyncHandler(async (req: Request, res: Response) => {
    const result = await investorDocumentService.getListInvestorDocuments({
      investor_id: req.params.investorId as string,
    });
    return ApiResponse(res, 200, result.data, result.meta);
  }),

  getDownloadUrl: asyncHandler(async (req: Request, res: Response) => {
    const downloadUrl = await investorDocumentService.getDocumentDownloadUrl({
      documentId: req.params.documentId as string,
    });

    return ApiResponse(res, 200, {
      downloadUrl,
      message: "URL download berhasil dibuat",
    });
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const documentId = req.params.documentId as string;

    // Get document info before deletion for logging
    const document = await investorDocumentService.getDocumentDownloadUrl({
      documentId,
    });

    await investorDocumentService.deleteInvestorDocument({
      documentId,
    });

    // Log document deletion
    await activityLogService
      .logActivity({
        userId: req.authUser!.userId,
        action: "DOCUMENT_DELETE",
        entityType: "InvestorDocument",
        entityId: documentId,
        description: `Dokumen berhasil dihapus oleh ${req.authUser!.email}`,
        metadata: {
          deletedDocument: {
            documentId,
          },
        },
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get("user-agent"),
      })
      .catch((err) => console.error("Failed to log document deletion:", err));

    return ApiResponse(res, 200, "Dokumen investor berhasil dihapus");
  }),
};
