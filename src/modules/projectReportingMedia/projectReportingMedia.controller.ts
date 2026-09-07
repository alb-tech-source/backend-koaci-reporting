import type { Request, Response } from "express";
import { projectReportingMediaService } from "./projectReportingMedia.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { activityLogService } from "../activityLog/activityLog.service.js";

const log = (
  req: Request,
  action: "PROJECT_REPORTING_MEDIA_UPLOAD" | "PROJECT_REPORTING_MEDIA_UPDATE" | "PROJECT_REPORTING_MEDIA_DELETE",
  media: any,
) =>
  activityLogService.logActivity({
    userId: req.authUser!.userId,
    action,
    entityType: "ProjectReportingMedia",
    entityId: media.project_reporting_media_id,
    description: `${action}: ${media.media_name} oleh ${req.authUser!.email}`,
    metadata: {
      mediaId: media.project_reporting_media_id,
      reportingId: media.project_reporting_id,
    },
    ipAddress: req.ip || req.socket.remoteAddress,
    userAgent: req.get("user-agent"),
  }).catch((error) => console.error("Failed to log project reporting media activity:", error));

export const projectReportingMediaController = {
  upload: asyncHandler(async (req: Request, res: Response) => {
    if (!req.file?.buffer) return ApiResponse(res, 400, { message: "File wajib diunggah" });
    const media = await projectReportingMediaService.upload({
      ...req.body,
      buffer: req.file.buffer,
      mime_type: req.file.mimetype,
      uploaded_by: req.authUser!.userId,
    });
    await log(req, "PROJECT_REPORTING_MEDIA_UPLOAD", media);
    return ApiResponse(res, 201, { media, message: "Media laporan project berhasil diunggah" });
  }),

  listByReporting: asyncHandler(async (req: Request, res: Response) => {
    const result = await projectReportingMediaService.listByReporting(
      req.params.reportingId as string,
      (req as any).validatedQuery,
    );
    return ApiResponse(res, 200, result.data, result.meta);
  }),

  getById: asyncHandler(async (req: Request, res: Response) =>
    ApiResponse(res, 200, await projectReportingMediaService.getById(req.params.mediaId as string)),
  ),

  download: asyncHandler(async (req: Request, res: Response) =>
    ApiResponse(res, 200, {
      downloadUrl: await projectReportingMediaService.getDownloadUrl(req.params.mediaId as string),
      message: "URL download berhasil dibuat",
    }),
  ),

  update: asyncHandler(async (req: Request, res: Response) => {
    const media = await projectReportingMediaService.update(req.params.mediaId as string, req.body);
    await log(req, "PROJECT_REPORTING_MEDIA_UPDATE", media);
    return ApiResponse(res, 200, { media, message: "Media laporan project berhasil diperbarui" });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const media = await projectReportingMediaService.delete(req.params.mediaId as string);
    await log(req, "PROJECT_REPORTING_MEDIA_DELETE", media);
    return ApiResponse(res, 200, "Media laporan project berhasil dihapus");
  }),
};
