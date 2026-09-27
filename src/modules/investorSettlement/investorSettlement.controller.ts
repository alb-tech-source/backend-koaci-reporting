import type { Request, Response } from "express";
import { investorSettlementService } from "./investorSettlement.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";

// Read-only: InvestorSettlement dibuat, diubah, dan di-approve melalui ProjectSettlement.
export const investorSettlementController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await investorSettlementService.list(
      (req as any).validatedQuery,
      req.access!,
    );
    return ApiResponse(res, 200, result.data, result.meta);
  }),

  getById: asyncHandler(async (req: Request, res: Response) =>
    ApiResponse(
      res,
      200,
      await investorSettlementService.getById(
        req.params.investorSettlementId as string,
        req.access!,
      ),
    ),
  ),
};
