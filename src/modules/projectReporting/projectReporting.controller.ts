import type { Request, Response } from "express";
import { projectReportingService } from "./projectReporting.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { activityLogService } from "../activityLog/activityLog.service.js";

const log = (
  req: Request,
  action:
    | "PROJECT_REPORTING_CREATE"
    | "PROJECT_REPORTING_UPDATE"
    | "PROJECT_REPORTING_DELETE",
  reporting: any,
) =>
  activityLogService.logActivity({
    userId: req.authUser!.userId,
    action,
    entityType: "ProjectReporting",
    entityId: reporting.project_reporting_id,
    description: `${action}: laporan ${reporting.project_reporting_id} oleh ${req.authUser!.email}`,
    metadata: {
      reportingId: reporting.project_reporting_id,
      projectId: reporting.project_id,
      changes: req.body,
    },
    ipAddress: req.ip || req.socket.remoteAddress,
    userAgent: req.get("user-agent"),
  }).catch((error) =>
    console.error("Failed to log project reporting activity:", error),
  );

export const projectReportingController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const reporting = await projectReportingService.create({
      ...req.body,
      submitted_by: req.authUser!.userId,
    });
    await log(req, "PROJECT_REPORTING_CREATE", reporting);
    return ApiResponse(res, 201, {
      reporting,
      message: "Laporan project berhasil dibuat",
    });
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await projectReportingService.list(
      (req as any).validatedQuery,
    );
    return ApiResponse(res, 200, result.data, result.meta);
  }),

  getById: asyncHandler(async (req: Request, res: Response) =>
    ApiResponse(
      res,
      200,
      await projectReportingService.getById(req.params.reportingId as string),
    ),
  ),

  update: asyncHandler(async (req: Request, res: Response) => {
    const reporting = await projectReportingService.update(
      req.params.reportingId as string,
      { ...req.body, updated_by: req.authUser!.userId },
    );
    await log(req, "PROJECT_REPORTING_UPDATE", reporting);
    return ApiResponse(res, 200, {
      reporting,
      message: "Laporan project berhasil diperbarui",
    });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const reporting = await projectReportingService.delete(
      req.params.reportingId as string,
    );
    await log(req, "PROJECT_REPORTING_DELETE", reporting);
    return ApiResponse(res, 200, "Laporan project berhasil dihapus");
  }),
};
