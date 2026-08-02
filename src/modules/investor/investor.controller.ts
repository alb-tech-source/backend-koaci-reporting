import type { Response, Request } from "express";
import { investorService } from "./investor.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import type { ListInvestorQuery } from "../../types/investor.types.js";

export const investorController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const investor = await investorService.createInvestor(req.body);

    return ApiResponse(res, 201, {
      investor,
      message: "Investor berhasil dibuat",
    });
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const parseValue = (v: any) => {
      if (v === "true") return true;
      if (v === "false") return false;
      if (v === "" || v === null || v === undefined) return v;
      // numeric (ints and floats)
      if (!Number.isNaN(Number(v)) && v !== null && v !== "") return Number(v);
      return v;
    };

    const parseQuery = (q: Record<string, any>): ListInvestorQuery => {
      const out: Record<string, any> = {};
      for (const [key, value] of Object.entries(q)) {
        if (Array.isArray(value)) out[key] = value.map(parseValue);
        else out[key] = parseValue(value);
      }
      return out as ListInvestorQuery;
    };

    const query = parseQuery(req.query as unknown as Record<string, any>);
    const result = await investorService.listInvestors(query);
    return ApiResponse(res, 200, result.data, result.meta);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const investor = await investorService.getInvestorById(
      req.params.id as string,
    );
    return ApiResponse(res, 200, investor);
  }),

  getByUserId: asyncHandler(async (req: Request, res: Response) => {
    console.log("req.params.userId", req.params.userId);
    const investor = await investorService.getInvestorByUserId(
      req.params.userId as string,
    );
    return ApiResponse(res, 200, investor);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const investor = await investorService.updateInvestor(
      req.params.id as string,
      req.body,
    );
    return ApiResponse(res, 200, {
      investor,
      message: "Investor berhasil diupdate",
    });
  }),

  updateStatus: asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.body;
    const investor = await investorService.updateInvestorStatus(
      req.params.id as string,
      status,
    );
    return ApiResponse(res, 200, {
      investor,
      message: "Status investor berhasil diupdate",
    });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await investorService.deleteInvestor(req.params.id as string);
    return ApiResponse(res, 200, "Investor berhasil dihapus permanen");
  }),
};
