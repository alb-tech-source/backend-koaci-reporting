import { Prisma } from "@prisma/client";
import type {
  createProjectSettlementInput,
  updateProjectSettlementInput,
  listProjectSettlementQuery,
  PaginatedResult,
} from "../../types/projectSettlement.types.js";
import prisma from "../../lib/prisma.js";
import { ApiError } from "../../utils/apiError.js";
import {
  calculateSettlement,
  type SettlementCalcResult,
} from "./settlement.calculator.js";

type DecimalInput = string | Prisma.Decimal;
const toDecimal = (value: DecimalInput) => new Prisma.Decimal(value);

type Db = typeof prisma | Prisma.TransactionClient;

/** Field input ProjectSettlement (yang diisi admin, bukan hasil hitung). */
interface SettlementInputs {
  profit_model: string;
  total_capital: DecimalInput;
  sales_amount: DecimalInput;
  other_cost: DecimalInput;
  other_cost_description: string;
  applicant_share_pct: DecimalInput;
  koaci_share_pct: DecimalInput;
  koaci_portion_pct: DecimalInput;
  investor_portion_pct: DecimalInput;
}

type CompensationInput = { investor_id: string; compensation_pct: DecimalInput };

const userSelect = {
  user_id: true,
  firstname: true,
  lastname: true,
  email: true,
} as const;

const detailInclude = {
  project: { include: { company: true } },
  createdBy: { select: userSelect },
  approvedBy: { select: userSelect },
  investorSettlement: {
    include: { investor: { include: { user: { select: userSelect } } } },
    orderBy: { principal_amount: "desc" },
  },
} satisfies Prisma.ProjectSettlementInclude;

const EDITABLE_STATUSES = ["review", "rejected"] as const;

/** Total principal per investor dari seluruh ProjectInvestment pada project. */
async function loadPrincipals(db: Db, projectId: string) {
  const rows = await db.projectInvestment.groupBy({
    by: ["investor_id"],
    where: { project_id: projectId },
    _sum: { amount: true },
  });
  return rows
    .map((row) => ({
      investor_id: row.investor_id,
      principal_amount: row._sum.amount ?? new Prisma.Decimal(0),
    }))
    .sort((a, b) => a.investor_id.localeCompare(b.investor_id));
}

async function compute(
  db: Db,
  projectId: string,
  inputs: SettlementInputs,
  compensations: CompensationInput[],
): Promise<SettlementCalcResult> {
  const principals = await loadPrincipals(db, projectId);
  const investedIds = new Set(principals.map((p) => p.investor_id));

  const unknown = compensations.filter((c) => !investedIds.has(c.investor_id));
  if (unknown.length > 0) {
    throw new ApiError(
      400,
      `Investor berikut tidak memiliki investasi pada project ini: ${unknown
        .map((c) => c.investor_id)
        .join(", ")}`,
    );
  }

  const compensationById = new Map(
    compensations.map((c) => [c.investor_id, toDecimal(c.compensation_pct)]),
  );

  return calculateSettlement({
    total_capital: toDecimal(inputs.total_capital),
    sales_amount: toDecimal(inputs.sales_amount),
    other_cost: toDecimal(inputs.other_cost),
    applicant_share_pct: toDecimal(inputs.applicant_share_pct),
    koaci_share_pct: toDecimal(inputs.koaci_share_pct),
    koaci_portion_pct: toDecimal(inputs.koaci_portion_pct),
    investor_portion_pct: toDecimal(inputs.investor_portion_pct),
    investors: principals.map((p) => ({
      ...p,
      compensation_pct:
        compensationById.get(p.investor_id) ?? new Prisma.Decimal(0),
    })),
  });
}

/** Data kolom ProjectSettlement: input admin + hasil hitung. */
const settlementData = (inputs: SettlementInputs, calc: SettlementCalcResult) => ({
  profit_model: inputs.profit_model,
  total_capital: toDecimal(inputs.total_capital),
  sales_amount: toDecimal(inputs.sales_amount),
  other_cost: toDecimal(inputs.other_cost),
  other_cost_description: inputs.other_cost_description,
  applicant_share_pct: toDecimal(inputs.applicant_share_pct),
  koaci_share_pct: toDecimal(inputs.koaci_share_pct),
  koaci_portion_pct: toDecimal(inputs.koaci_portion_pct),
  investor_portion_pct: toDecimal(inputs.investor_portion_pct),
  ...calc.project,
});

const pickInputs = (source: SettlementInputs): SettlementInputs => ({
  profit_model: source.profit_model,
  total_capital: source.total_capital,
  sales_amount: source.sales_amount,
  other_cost: source.other_cost,
  other_cost_description: source.other_cost_description,
  applicant_share_pct: source.applicant_share_pct,
  koaci_share_pct: source.koaci_share_pct,
  koaci_portion_pct: source.koaci_portion_pct,
  investor_portion_pct: source.investor_portion_pct,
});

async function assertProjectExists(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { project_id: projectId },
    select: { project_id: true },
  });
  if (!project) throw new ApiError(404, "Project tidak ditemukan");
}

export const projectSettlementService = {
  /** Hitung settlement tanpa menyimpan (untuk live preview di form). */
  preview: async (input: createProjectSettlementInput) => {
    await assertProjectExists(input.project_id);

    const inputs = pickInputs(input);
    const calc = await compute(prisma, input.project_id, inputs, input.investors);

    return {
      projectSettlement: {
        project_id: input.project_id,
        ...settlementData(inputs, calc),
      },
      investorSettlements: calc.investors,
      warnings: calc.warnings,
    };
  },

  create: async (input: createProjectSettlementInput, userId: string) => {
    await assertProjectExists(input.project_id);

    const existing = await prisma.projectSettlement.findUnique({
      where: { project_id: input.project_id },
      select: { project_settlement_id: true },
    });
    if (existing)
      throw new ApiError(409, "Project ini sudah memiliki settlement");

    const inputs = pickInputs(input);
    const calc = await compute(prisma, input.project_id, inputs, input.investors);

    try {
      const settlement = await prisma.projectSettlement.create({
        data: {
          project_id: input.project_id,
          created_by: userId,
          ...settlementData(inputs, calc),
          investorSettlement: {
            create: calc.investors.map((investor) => ({
              ...investor,
              created_by: userId,
            })),
          },
        },
        include: detailInclude,
      });
      return { settlement, warnings: calc.warnings };
    } catch (error: any) {
      if (error?.code === "P2002")
        throw new ApiError(409, "Project ini sudah memiliki settlement");
      throw error;
    }
  },

  list: async (
    query: listProjectSettlementQuery,
  ): Promise<PaginatedResult<any>> => {
    const { page, limit, search, status, project_id } = query;
    const where: Prisma.ProjectSettlementWhereInput = {
      ...(status && { status }),
      ...(project_id && { project_id }),
      ...(search && {
        project: { project_key: { contains: search, mode: "insensitive" } },
      }),
    };

    const [total, data] = await prisma.$transaction([
      prisma.projectSettlement.count({ where }),
      prisma.projectSettlement.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: "desc" },
        include: {
          project: { include: { company: true } },
          createdBy: { select: userSelect },
          approvedBy: { select: userSelect },
          _count: { select: { investorSettlement: true } },
        },
      }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  },

  getById: async (settlementId: string) => {
    const settlement = await prisma.projectSettlement.findUnique({
      where: { project_settlement_id: settlementId },
      include: detailInclude,
    });
    if (!settlement) throw new ApiError(404, "Settlement tidak ditemukan");
    return settlement;
  },

  /**
   * Ubah input settlement lalu hitung ulang seluruhnya (termasuk principal
   * terbaru dari ProjectInvestment). Hanya untuk status review/rejected;
   * status kembali ke review dan menunggu approval ulang.
   *
   * `investors` (jika dikirim) menggantikan seluruh daftar kompensasi;
   * investor yang tidak dicantumkan dianggap compensation_pct = 0.
   */
  update: async (
    settlementId: string,
    input: updateProjectSettlementInput,
    userId: string,
  ) => {
    const existing = await projectSettlementService.getById(settlementId);
    if (existing.status === "approved")
      throw new ApiError(409, "Settlement yang sudah disetujui tidak dapat diubah");

    const { investors, ...changes } = input;
    const inputs = pickInputs({ ...existing, ...changes });
    const compensations =
      investors ??
      existing.investorSettlement.map((row) => ({
        investor_id: row.investor_id,
        compensation_pct: row.compensation_pct,
      }));

    const result = await prisma.$transaction(async (tx) => {
      const calc = await compute(tx, existing.project_id, inputs, compensations);

      const guard = await tx.projectSettlement.updateMany({
        where: {
          project_settlement_id: settlementId,
          status: { in: [...EDITABLE_STATUSES] },
        },
        data: {
          ...settlementData(inputs, calc),
          status: "review",
          approved_by: null,
        },
      });
      if (guard.count === 0)
        throw new ApiError(409, "Settlement yang sudah disetujui tidak dapat diubah");

      // Pertahankan ID InvestorSettlement yang sudah ada agar riwayat log tetap terhubung.
      const current = await tx.investorSettlement.findMany({
        where: { project_settlement_id: settlementId },
        select: { investor_settlement_id: true, investor_id: true },
      });
      const currentByInvestor = new Map(current.map((r) => [r.investor_id, r]));
      const investorChanges = {
        created: [] as { investor_settlement_id: string; investor_id: string }[],
        updated: [] as { investor_settlement_id: string; investor_id: string }[],
        deleted: [] as { investor_settlement_id: string; investor_id: string }[],
      };

      for (const investor of calc.investors) {
        const row = currentByInvestor.get(investor.investor_id);
        if (row) {
          await tx.investorSettlement.update({
            where: { investor_settlement_id: row.investor_settlement_id },
            data: { ...investor, status: "pending", approved_by: null },
          });
          investorChanges.updated.push(row);
          currentByInvestor.delete(investor.investor_id);
        } else {
          const created = await tx.investorSettlement.create({
            data: {
              ...investor,
              project_settlement_id: settlementId,
              created_by: userId,
            },
            select: { investor_settlement_id: true, investor_id: true },
          });
          investorChanges.created.push(created);
        }
      }

      // Investor yang sudah tidak punya investasi pada project.
      const removed = [...currentByInvestor.values()];
      if (removed.length > 0) {
        await tx.investorSettlement.deleteMany({
          where: {
            investor_settlement_id: {
              in: removed.map((r) => r.investor_settlement_id),
            },
          },
        });
        investorChanges.deleted.push(...removed);
      }

      return { warnings: calc.warnings, investorChanges };
    });

    return {
      settlement: await projectSettlementService.getById(settlementId),
      ...result,
    };
  },

  delete: async (settlementId: string) => {
    const existing = await projectSettlementService.getById(settlementId);
    if (existing.status === "approved")
      throw new ApiError(409, "Settlement yang sudah disetujui tidak dapat dihapus");

    await prisma.$transaction(async (tx) => {
      await tx.investorSettlement.deleteMany({
        where: { project_settlement_id: settlementId },
      });
      const deleted = await tx.projectSettlement.deleteMany({
        where: {
          project_settlement_id: settlementId,
          status: { in: [...EDITABLE_STATUSES] },
        },
      });
      if (deleted.count === 0)
        throw new ApiError(409, "Settlement yang sudah disetujui tidak dapat dihapus");
    });

    return existing;
  },

  /**
   * Approve / reject settlement berstatus review. Status seluruh
   * InvestorSettlement ikut berubah dalam transaksi yang sama. Saat approve,
   * status Project juga diubah menjadi target_achieved (proyek selesai).
   */
  review: async (
    settlementId: string,
    decision: "approved" | "rejected",
    userId: string,
  ) => {
    const approvedBy = decision === "approved" ? userId : null;

    await prisma.$transaction(async (tx) => {
      const updated = await tx.projectSettlement.updateMany({
        where: { project_settlement_id: settlementId, status: "review" },
        data: { status: decision, approved_by: approvedBy },
      });

      if (updated.count === 0) {
        const current = await tx.projectSettlement.findUnique({
          where: { project_settlement_id: settlementId },
          select: { status: true },
        });
        if (!current) throw new ApiError(404, "Settlement tidak ditemukan");
        throw new ApiError(
          409,
          `Settlement berstatus ${current.status}; hanya settlement berstatus review yang dapat di-${decision === "approved" ? "approve" : "reject"}`,
        );
      }

      await tx.investorSettlement.updateMany({
        where: { project_settlement_id: settlementId },
        data: { status: decision, approved_by: approvedBy },
      });

      if (decision === "approved") {
        const { project_id } = await tx.projectSettlement.findUniqueOrThrow({
          where: { project_settlement_id: settlementId },
          select: { project_id: true },
        });
        await tx.project.update({
          where: { project_id },
          data: { status: "target_achieved" },
        });
      }
    });

    return projectSettlementService.getById(settlementId);
  },
};
