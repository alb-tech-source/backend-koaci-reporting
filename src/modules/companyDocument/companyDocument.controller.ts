import type { Request, Response } from "express";
import { companyDocumentService } from "./companyDocument.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { activityLogService } from "../activityLog/activityLog.service.js";

const log = (req: Request, action: "COMPANY_DOCUMENT_UPLOAD" | "COMPANY_DOCUMENT_UPDATE" | "COMPANY_DOCUMENT_DELETE", document: any) =>
  activityLogService.logActivity({
    userId: req.authUser!.userId,
    action,
    entityType: "CompanyDocument",
    entityId: document.document_id,
    description: `${action}: ${document.document_name} oleh ${req.authUser!.email}`,
    metadata: { documentId: document.document_id, companyId: document.company_id },
    ipAddress: req.ip || req.socket.remoteAddress,
    userAgent: req.get("user-agent"),
  }).catch((error) => console.error("Failed to log company document activity:", error));

export const companyDocumentController = {
  upload: asyncHandler(async (req: Request, res: Response) => {
    if (!req.file?.buffer) return ApiResponse(res, 400, { message: "File wajib diunggah" });
    const document = await companyDocumentService.upload({
      ...req.body,
      buffer: req.file.buffer,
      mime_type: req.file.mimetype,
      uploaded_by: req.authUser!.userId,
    });
    await log(req, "COMPANY_DOCUMENT_UPLOAD", document);
    return ApiResponse(res, 201, { document, message: "Dokumen perusahaan berhasil diunggah" });
  }),
  listByCompany: asyncHandler(async (req: Request, res: Response) => {
    const result = await companyDocumentService.listByCompany(req.params.companyId as string, (req as any).validatedQuery);
    return ApiResponse(res, 200, result.data, result.meta);
  }),
  getById: asyncHandler(async (req: Request, res: Response) =>
    ApiResponse(res, 200, await companyDocumentService.getById(req.params.documentId as string))),
  download: asyncHandler(async (req: Request, res: Response) =>
    ApiResponse(res, 200, {
      downloadUrl: await companyDocumentService.getDownloadUrl(req.params.documentId as string),
      message: "URL download berhasil dibuat",
    })),
  update: asyncHandler(async (req: Request, res: Response) => {
    const document = await companyDocumentService.update(req.params.documentId as string, req.body);
    await log(req, "COMPANY_DOCUMENT_UPDATE", document);
    return ApiResponse(res, 200, { document, message: "Dokumen perusahaan berhasil diperbarui" });
  }),
  remove: asyncHandler(async (req: Request, res: Response) => {
    const document = await companyDocumentService.delete(req.params.documentId as string);
    await log(req, "COMPANY_DOCUMENT_DELETE", document);
    return ApiResponse(res, 200, "Dokumen perusahaan berhasil dihapus");
  }),
};
