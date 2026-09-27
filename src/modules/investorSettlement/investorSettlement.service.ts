import type { Prisma } from "@prisma/client";
import type {
  listInvestorSettlementQuery,
  PaginatedResult,
} from "../../types/investorSettlement.types.js";
import type { AccessContext } from "../../middleware/auth.middleware.js";
import prisma from "../../lib/prisma.js";
import { ApiError } from "../../utils/apiError.js";

const userSelect = {
  user_id: true,
  firstname: true,
  lastname: true,
  email: true,
} as const;

// Scope any (admin/bod/superadmin): seluruh rincian settlement project.
const fullInclude = {
  investor: { include: { user: { select: userSelect } } },
  projectSettlement: { include: { project: { include: { company: true } } } },
  createdBy: { select: userSelect },
  approvedBy: { select: userSelect },
} satisfies Prisma.InvestorSettlementInclude;

// Scope own (investor): hanya ringkasan settlement project yang relevan bagi
// investor, tanpa rincian porsi internal Koaci dan pemohon.
const ownInclude = {
  investor: { include: { user: { select: userSelect } } },
  projectSettlement: {
    select: {
      project_settlement_id: true,
      profit_model: true,
      total_capital: true,
      sales_amount: true,
      net_profit_margin: true,
      investor_portion_pct: true,
      investor_portion_amount: true,
      status: true,
      project: { include: { company: true } },
    },
  },
} satisfies Prisma.InvestorSettlementInclude;

/**
 * Investor hanya melihat settlement miliknya yang sudah disetujui;
 * settlement berstatus review/rejected masih bisa berubah.
 */
async function accessWhere(
  access: AccessContext,
): Promise<Prisma.InvestorSettlementWhereInput> {
  if (access.scope === "any") return {};

  const investor = await prisma.investor.findUnique({
    where: { user_id: access.userId },
    select: { investor_id: true },
  });
  if (!investor) throw new ApiError(404, "Profil investor tidak ditemukan");

  return { investor_id: investor.investor_id, status: "approved" };
}

export const investorSettlementService = {
  list: async (
    query: listInvestorSettlementQuery,
    access: AccessContext,
  ): Promise<PaginatedResult<any>> => {
    const { page, limit, status, project_settlement_id, project_id, investor_id } =
      query;

    const where: Prisma.InvestorSettlementWhereInput = {
      ...(status && { status }),
      ...(project_settlement_id && { project_settlement_id }),
      ...(project_id && { projectSettlement: { project_id } }),
      ...(investor_id && { investor_id }),
      ...(await accessWhere(access)),
    };

    const [total, data] = await prisma.$transaction([
      prisma.investorSettlement.count({ where }),
      prisma.investorSettlement.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: "desc" },
        include: access.scope === "any" ? fullInclude : ownInclude,
      }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  },

  getById: async (investorSettlementId: string, access: AccessContext) => {
    const settlement = await prisma.investorSettlement.findFirst({
      where: {
        investor_settlement_id: investorSettlementId,
        ...(await accessWhere(access)),
      },
      include: access.scope === "any" ? fullInclude : ownInclude,
    });
    if (!settlement)
      throw new ApiError(404, "Settlement investor tidak ditemukan");
    return settlement;
  },
};
