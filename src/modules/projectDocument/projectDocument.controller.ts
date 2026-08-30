import type { Request, Response } from "express";
import { projectDocumentService } from "./projectDocument.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { activityLogService } from "../activityLog/activityLog.service.js";

const log = (req: Request, action: "PROJECT_DOCUMENT_UPLOAD" | "PROJECT_DOCUMENT_UPDATE" | "PROJECT_DOCUMENT_DELETE", document: any) =>
  activityLogService.logActivity({
    userId: req.authUser!.userId,
    action,
    entityType: "ProjectDocument",
    entityId: document.document_id,
    description: `${action}: ${document.document_name} oleh ${req.authUser!.email}`,
    metadata: { documentId: document.document_id, projectId: document.project_id },
    ipAddress: req.ip || req.socket.remoteAddress,
    userAgent: req.get("user-agent"),
  }).catch((error) => console.error("Failed to log project document activity:", error));

export const projectDocumentController = {
  upload: asyncHandler(async (req: Request, res: Response) => {
    if (!req.file?.buffer) return ApiResponse(res, 400, { message: "File wajib diunggah" });
    const document = await projectDocumentService.upload({
      ...req.body,
      buffer: req.file.buffer,
      mime_type: req.file.mimetype,
      uploaded_by: req.authUser!.userId,
    });
    await log(req, "PROJECT_DOCUMENT_UPLOAD", document);
    return ApiResponse(res, 201, { document, message: "Dokumen project berhasil diunggah" });
  }),
  listByProject: asyncHandler(async (req: Request, res: Response) => {
    const result = await projectDocumentService.listByProject(req.params.projectId as string, (req as any).validatedQuery);
    return ApiResponse(res, 200, result.data, result.meta);
  }),
  getById: asyncHandler(async (req: Request, res: Response) =>
    ApiResponse(res, 200, await projectDocumentService.getById(req.params.documentId as string))),
  download: asyncHandler(async (req: Request, res: Response) =>
    ApiResponse(res, 200, {
      downloadUrl: await projectDocumentService.getDownloadUrl(req.params.documentId as string),
      message: "URL download berhasil dibuat",
    })),
  update: asyncHandler(async (req: Request, res: Response) => {
    const document = await projectDocumentService.update(req.params.documentId as string, req.body);
    await log(req, "PROJECT_DOCUMENT_UPDATE", document);
    return ApiResponse(res, 200, { document, message: "Dokumen project berhasil diperbarui" });
  }),
  remove: asyncHandler(async (req: Request, res: Response) => {
    const document = await projectDocumentService.delete(req.params.documentId as string);
    await log(req, "PROJECT_DOCUMENT_DELETE", document);
    return ApiResponse(res, 200, "Dokumen project berhasil dihapus");
  }),
};
