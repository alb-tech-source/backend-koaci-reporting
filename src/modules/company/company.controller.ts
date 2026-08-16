import type { Request, Response } from "express";
import { companyService } from "./company.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { activityLogService } from "../activityLog/activityLog.service.js";

const log = (req: Request, action: "COMPANY_CREATE" | "COMPANY_UPDATE" | "COMPANY_DELETE", company: any) =>
  activityLogService.logActivity({
    userId: req.authUser!.userId,
    action,
    entityType: "Company",
    entityId: company.company_id,
    description: `${action}: ${company.company_name} oleh ${req.authUser!.email}`,
    metadata: { companyId: company.company_id, changes: req.body },
    ipAddress: req.ip || req.socket.remoteAddress,
    userAgent: req.get("user-agent"),
  }).catch((error) => console.error("Failed to log company activity:", error));

export const companyController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const company = await companyService.create(req.body);
    await log(req, "COMPANY_CREATE", company);
    return ApiResponse(res, 201, { company, message: "Perusahaan berhasil dibuat" });
  }),
  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await companyService.list((req as any).validatedQuery);
    return ApiResponse(res, 200, result.data, result.meta);
  }),
  getById: asyncHandler(async (req: Request, res: Response) =>
    ApiResponse(res, 200, await companyService.getById(req.params.id as string))),
  update: asyncHandler(async (req: Request, res: Response) => {
    const company = await companyService.update(req.params.id as string, req.body);
    await log(req, "COMPANY_UPDATE", company);
    return ApiResponse(res, 200, { company, message: "Perusahaan berhasil diperbarui" });
  }),
  remove: asyncHandler(async (req: Request, res: Response) => {
    const company = await companyService.getById(req.params.id as string);
    await companyService.delete(company.company_id);
    await log(req, "COMPANY_DELETE", company);
    return ApiResponse(res, 200, "Perusahaan berhasil dihapus");
  }),
};
