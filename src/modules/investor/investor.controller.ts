import type { Response, Request } from "express";
import { investorService } from "./investor.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import type { ListInvestorQuery } from "../../types/investor.types.js";
import { activityLogService } from "../activityLog/activityLog.service.js";

export const investorController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const investor = await investorService.createInvestor(req.body);

    // Log investor creation
    await activityLogService
      .logActivity({
        userId: req.authUser!.userId,
        action: "INVESTOR_CREATE",
        entityType: "Investor",
        entityId: investor.investor_id,
        description: `Investor ${investor.nik} berhasil dibuat oleh ${req.authUser!.email}`,
        metadata: {
          createdInvestor: {
            investorId: investor.investor_id,
            nik: investor.nik,
            investorType: investor.investor_type,
          },
        },
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get("user-agent"),
      })
      .catch((err) => console.error("Failed to log investor creation:", err));

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
    const investor = await investorService.updateInvestor(req.params.id as string, req.body);

    // Log investor update
    await activityLogService
      .logActivity({
        userId: req.authUser!.userId,
        action: "INVESTOR_UPDATE",
        entityType: "Investor",
        entityId: investor.investor_id,
        description: `Investor ${investor.nik} berhasil diupdate oleh ${req.authUser!.email}`,
        metadata: {
          updatedInvestor: {
            investorId: investor.investor_id,
            nik: investor.nik,
            changes: req.body,
          },
        },
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get("user-agent"),
      })
      .catch((err) => console.error("Failed to log investor update:", err));

    return ApiResponse(res, 200, {
      investor,
      message: "Investor berhasil diupdate",
    });
  }),

  updateStatus: asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.body;
    const investor = await investorService.updateInvestorStatus(req.params.id as string, status);

    // Log investor status change
    await activityLogService
      .logActivity({
        userId: req.authUser!.userId,
        action: "INVESTOR_STATUS_CHANGE",
        entityType: "Investor",
        entityId: investor.investor_id,
        description: `Status investor ${investor.nik} berhasil diubah ke ${status} oleh ${req.authUser!.email}`,
        metadata: {
          investor: {
            investorId: investor.investor_id,
            nik: investor.nik,
            oldStatus: investor.status,
            newStatus: status,
          },
        },
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get("user-agent"),
      })
      .catch((err) => console.error("Failed to log investor status change:", err));

    return ApiResponse(res, 200, {
      investor,
      message: "Status investor berhasil diupdate",
    });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const investorId = req.params.id as string;

    // Get investor info before deletion for logging
    const investor = await investorService.getInvestorById(investorId);

    await investorService.deleteInvestor(investorId);

    // Log investor deletion
    await activityLogService
      .logActivity({
        userId: req.authUser!.userId,
        action: "INVESTOR_DELETE",
        entityType: "Investor",
        entityId: investorId,
        description: `Investor ${investor.nik} berhasil dihapus oleh ${req.authUser!.email}`,
        metadata: {
          deletedInvestor: {
            investorId: investor.investor_id,
            nik: investor.nik,
            investorType: investor.investor_type,
          },
        },
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get("user-agent"),
      })
      .catch((err) => console.error("Failed to log investor deletion:", err));

    return ApiResponse(res, 200, "Investor berhasil dihapus permanen");
  }),
};
