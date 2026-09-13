import type { Request, Response } from "express";
import { receiptDocumentService } from "./receiptDocument.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { activityLogService } from "../activityLog/activityLog.service.js";

const log = (
  req: Request,
  action: "RECEIPT_DOCUMENT_UPLOAD" | "RECEIPT_DOCUMENT_DELETE",
  document: any,
) =>
  activityLogService.logActivity({
    userId: req.authUser!.userId,
    action,
    entityType: "ReceiptDocument",
    entityId: document.receipt_document_id,
    description: `${action}: ${document.receipt_name} oleh ${req.authUser!.email}`,
    metadata: {
      receiptId: document.receipt_document_id,
      investmentId: document.project_investment_id,
    },
    ipAddress: req.ip || req.socket.remoteAddress,
    userAgent: req.get("user-agent"),
  }).catch((error) => console.error("Failed to log receipt document activity:", error));

export const receiptDocumentController = {
  presign: asyncHandler(async (req: Request, res: Response) => {
    const result = await receiptDocumentService.presign(req.body);
    return ApiResponse(res, 200, { ...result, message: "URL upload berhasil dibuat" });
  }),

  upload: asyncHandler(async (req: Request, res: Response) => {
    const document = await receiptDocumentService.upload({
      ...req.body,
      uploaded_by: req.authUser!.userId,
    });
    await log(req, "RECEIPT_DOCUMENT_UPLOAD", document);
    return ApiResponse(res, 201, { document, message: "Receipt document berhasil diunggah" });
  }),

  getByInvestment: asyncHandler(async (req: Request, res: Response) =>
    ApiResponse(
      res,
      200,
      await receiptDocumentService.getByInvestment(req.params.investmentId as string),
    ),
  ),

  getById: asyncHandler(async (req: Request, res: Response) =>
    ApiResponse(res, 200, await receiptDocumentService.getById(req.params.receiptId as string)),
  ),

  download: asyncHandler(async (req: Request, res: Response) =>
    ApiResponse(res, 200, {
      downloadUrl: await receiptDocumentService.getDownloadUrl(req.params.receiptId as string),
      message: "URL download berhasil dibuat",
    }),
  ),

  getByUser: asyncHandler(async (req: Request, res: Response) =>
    ApiResponse(
      res,
      200,
      await receiptDocumentService.getByUser(req.authUser!.userId),
    ),
  ),

  downloadByUser: asyncHandler(async (req: Request, res: Response) =>
    ApiResponse(res, 200, {
      downloadUrl: await receiptDocumentService.getDownloadUrlByUser(
        req.authUser!.userId,
        req.params.receiptId as string,
      ),
      message: "URL download berhasil dibuat",
    }),
  ),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const document = await receiptDocumentService.delete(req.params.receiptId as string);
    await log(req, "RECEIPT_DOCUMENT_DELETE", document);
    return ApiResponse(res, 200, "Receipt document berhasil dihapus");
  }),
};
