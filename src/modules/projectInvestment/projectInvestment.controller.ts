import type { Request, Response } from "express";
import { projectInvestmentService } from "./projectInvestment.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { activityLogService } from "../activityLog/activityLog.service.js";

const log = (
  req: Request,
  action:
    | "PROJECT_INVESTMENT_CREATE"
    | "PROJECT_INVESTMENT_UPDATE"
    | "PROJECT_INVESTMENT_DELETE",
  investment: any,
) =>
  activityLogService.logActivity({
    userId: req.authUser!.userId,
    action,
    entityType: "ProjectInvestment",
    entityId: investment.project_investment_id,
    description: `${action}: investasi ${investment.project_investment_id} oleh ${req.authUser!.email}`,
    metadata: {
      investmentId: investment.project_investment_id,
      projectId: investment.project_id,
      investorId: investment.investor_id,
      changes: req.body,
    },
    ipAddress: req.ip || req.socket.remoteAddress,
    userAgent: req.get("user-agent"),
  }).catch((error) =>
    console.error("Failed to log project investment activity:", error),
  );

export const projectInvestmentController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const projectInvestment = await projectInvestmentService.create(req.body);
    await log(req, "PROJECT_INVESTMENT_CREATE", projectInvestment);
    return ApiResponse(res, 201, {
      projectInvestment,
      message: "Data investasi berhasil dibuat",
    });
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await projectInvestmentService.list(
      (req as any).validatedQuery,
    );
    return ApiResponse(res, 200, result.data, result.meta);
  }),

  getById: asyncHandler(async (req: Request, res: Response) =>
    ApiResponse(
      res,
      200,
      await projectInvestmentService.getById(req.params.investmentId as string),
    ),
  ),

  update: asyncHandler(async (req: Request, res: Response) => {
    const projectInvestment = await projectInvestmentService.update(
      req.params.investmentId as string,
      req.body,
    );
    await log(req, "PROJECT_INVESTMENT_UPDATE", projectInvestment);
    return ApiResponse(res, 200, {
      projectInvestment,
      message: "Data investasi berhasil diperbarui",
    });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const projectInvestment = await projectInvestmentService.delete(
      req.params.investmentId as string,
    );
    await log(req, "PROJECT_INVESTMENT_DELETE", projectInvestment);
    return ApiResponse(res, 200, "Data investasi berhasil dihapus");
  }),
};
