import type { Request, Response } from "express";
import { projectService } from "./project.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { activityLogService } from "../activityLog/activityLog.service.js";

const log = (req: Request, action: "PROJECT_CREATE" | "PROJECT_UPDATE" | "PROJECT_DELETE", project: any) =>
  activityLogService.logActivity({
    userId: req.authUser!.userId,
    action,
    entityType: "Project",
    entityId: project.project_id,
    description: `${action}: ${project.project_key} oleh ${req.authUser!.email}`,
    metadata: { projectId: project.project_id, companyId: project.company_id, changes: req.body },
    ipAddress: req.ip || req.socket.remoteAddress,
    userAgent: req.get("user-agent"),
  }).catch((error) => console.error("Failed to log project activity:", error));

export const projectController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const project = await projectService.create(req.body);
    await log(req, "PROJECT_CREATE", project);
    return ApiResponse(res, 201, { project, message: "Project berhasil dibuat" });
  }),
  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await projectService.list((req as any).validatedQuery);
    return ApiResponse(res, 200, result.data, result.meta);
  }),
  getById: asyncHandler(async (req: Request, res: Response) =>
    ApiResponse(res, 200, await projectService.getById(req.params.id as string))),
  update: asyncHandler(async (req: Request, res: Response) => {
    const project = await projectService.update(req.params.id as string, req.body);
    await log(req, "PROJECT_UPDATE", project);
    return ApiResponse(res, 200, { project, message: "Project berhasil diperbarui" });
  }),
  remove: asyncHandler(async (req: Request, res: Response) => {
    const project = await projectService.delete(req.params.id as string);
    await log(req, "PROJECT_DELETE", project);
    return ApiResponse(res, 200, "Project berhasil dihapus");
  }),
};
