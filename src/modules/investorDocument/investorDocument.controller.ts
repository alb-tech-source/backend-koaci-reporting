import type { Response, Request } from "express";
import { investorDocumentService } from "./investorDocument.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";

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
        (req.body.storage_provider as "cloudflare" | "aws" | "tencent") ||
        "cloudflare",
      buffer: req.file.buffer,
      mime_type: req.file.mimetype,
    };

    const document =
      await investorDocumentService.uploadInvestorDocument(input);

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
    await investorDocumentService.deleteInvestorDocument({
      documentId: req.params.documentId as string,
    });

    return ApiResponse(res, 200, "Dokumen investor berhasil dihapus");
  }),
};
