import type { Request, Response } from "express";
import { projectSettlementService } from "./projectSettlement.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { activityLogService } from "../activityLog/activityLog.service.js";
import type { ActivityAction } from "../../types/activityLog.types.js";

type InvestorRow = { investor_settlement_id: string; investor_id: string };

const logEntry = (
  req: Request,
  action: ActivityAction,
  entityType: "ProjectSettlement" | "InvestorSettlement" | "Project",
  entityId: string,
  metadata: Record<string, unknown>,
) =>
  activityLogService
    .logActivity({
      userId: req.authUser!.userId,
      action,
      entityType,
      entityId,
      description: `${action}: ${entityType} ${entityId} oleh ${req.authUser!.email}`,
      metadata,
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get("user-agent"),
    })
    .catch((error) =>
      console.error("Failed to log settlement activity:", error),
    );

/** Log aksi pada ProjectSettlement beserta setiap InvestorSettlement yang terdampak. */
const log = (
  req: Request,
  action: "CREATE" | "UPDATE" | "DELETE" | "APPROVE" | "REJECT",
  settlement: { project_settlement_id: string; project_id: string },
  investorRows: Partial<Record<"created" | "updated" | "deleted", InvestorRow[]>>,
) => {
  const base = {
    projectSettlementId: settlement.project_settlement_id,
    projectId: settlement.project_id,
  };
  // "updated" dipakai untuk UPDATE, APPROVE, dan REJECT.
  const investorAction = {
    created: "INVESTOR_SETTLEMENT_CREATE",
    updated: `INVESTOR_SETTLEMENT_${action}`,
    deleted: "INVESTOR_SETTLEMENT_DELETE",
  } as const;

  return Promise.all([
    logEntry(
      req,
      `PROJECT_SETTLEMENT_${action}`,
      "ProjectSettlement",
      settlement.project_settlement_id,
      { ...base, changes: req.body },
    ),
    ...(["created", "updated", "deleted"] as const).flatMap((kind) =>
      (investorRows[kind] ?? []).map((row) =>
        logEntry(
          req,
          investorAction[kind] as ActivityAction,
          "InvestorSettlement",
          row.investor_settlement_id,
          { ...base, investorId: row.investor_id },
        ),
      ),
    ),
  ]);
};

const toRows = (settlement: { investorSettlement: InvestorRow[] }) =>
  settlement.investorSettlement.map(({ investor_settlement_id, investor_id }) => ({
    investor_settlement_id,
    investor_id,
  }));

export const projectSettlementController = {
  preview: asyncHandler(async (req: Request, res: Response) =>
    ApiResponse(res, 200, await projectSettlementService.preview(req.body)),
  ),

  create: asyncHandler(async (req: Request, res: Response) => {
    const { settlement, warnings } = await projectSettlementService.create(
      req.body,
      req.authUser!.userId,
    );
    await log(req, "CREATE", settlement, { created: toRows(settlement) });
    return ApiResponse(res, 201, {
      projectSettlement: settlement,
      warnings,
      message: "Settlement berhasil dibuat dan menunggu approval",
    });
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await projectSettlementService.list(
      (req as any).validatedQuery,
    );
    return ApiResponse(res, 200, result.data, result.meta);
  }),

  getById: asyncHandler(async (req: Request, res: Response) =>
    ApiResponse(
      res,
      200,
      await projectSettlementService.getById(req.params.settlementId as string),
    ),
  ),

  update: asyncHandler(async (req: Request, res: Response) => {
    const { settlement, warnings, investorChanges } =
      await projectSettlementService.update(
        req.params.settlementId as string,
        req.body,
        req.authUser!.userId,
      );
    await log(req, "UPDATE", settlement, investorChanges);
    return ApiResponse(res, 200, {
      projectSettlement: settlement,
      warnings,
      message: "Settlement berhasil diperbarui dan menunggu approval",
    });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const settlement = await projectSettlementService.delete(
      req.params.settlementId as string,
    );
    await log(req, "DELETE", settlement, { deleted: toRows(settlement) });
    return ApiResponse(res, 200, "Settlement berhasil dihapus");
  }),

  approve: asyncHandler(async (req: Request, res: Response) => {
    const settlement = await projectSettlementService.review(
      req.params.settlementId as string,
      "approved",
      req.authUser!.userId,
    );
    await Promise.all([
      log(req, "APPROVE", settlement, { updated: toRows(settlement) }),
      // Status project otomatis menjadi target_achieved saat settlement disetujui
      logEntry(req, "PROJECT_UPDATE", "Project", settlement.project_id, {
        projectSettlementId: settlement.project_settlement_id,
        changes: { status: "target_achieved" },
        reason: "Settlement disetujui",
      }),
    ]);
    return ApiResponse(res, 200, {
      projectSettlement: settlement,
      message: "Settlement berhasil disetujui",
    });
  }),

  reject: asyncHandler(async (req: Request, res: Response) => {
    const settlement = await projectSettlementService.review(
      req.params.settlementId as string,
      "rejected",
      req.authUser!.userId,
    );
    await log(req, "REJECT", settlement, { updated: toRows(settlement) });
    return ApiResponse(res, 200, {
      projectSettlement: settlement,
      message: "Settlement ditolak dan dapat diperbaiki oleh admin",
    });
  }),
};
