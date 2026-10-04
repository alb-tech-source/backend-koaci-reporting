import {
  createProjectInvestmentInput,
  projectInvestmentIdParam,
  updateProjectInvestmentInput,
  listProjectInvestmentQuery,
  PaginatedResult,
} from "../../types/projectInvestment.types.js";
import { Prisma } from "@prisma/client";
import prisma from "../../lib/prisma.js";
import { ApiError } from "../../utils/apiError.js";
import { fundingProgressPct } from "./fundingProgress.js";
import {
  ACTIVE_PROJECT_STATUSES,
  summarizeActiveInvestments,
} from "./investmentSummary.js";

// Jangan pernah include `user: true` — model User berisi hash password & token.
const safeUserSelect = {
  select: { user_id: true, firstname: true, lastname: true, email: true },
} as const;

/**
 * Dana terkumpul dari SEMUA investor dan progres laporan terakhir per project.
 * Dihitung di sini karena investor hanya boleh membaca investasinya sendiri,
 * sehingga frontend investor tidak punya data untuk menghitungnya.
 */
async function loadProjectProgress(projectIds: string[]) {
  const [collectedRows, latestReports] = await Promise.all([
    prisma.projectInvestment.groupBy({
      by: ["project_id"],
      where: { project_id: { in: projectIds } },
      _sum: { amount: true },
    }),
    prisma.projectReporting.findMany({
      where: { project_id: { in: projectIds } },
      orderBy: [{ report_date: "desc" }, { created_at: "desc" }],
      distinct: ["project_id"],
      select: { project_id: true, estimate_progress_percentage: true },
    }),
  ]);

  return {
    collected: new Map(
      collectedRows.map((row) => [row.project_id, row._sum.amount]),
    ),
    latestProgress: new Map(
      latestReports.map((report) => [
        report.project_id,
        report.estimate_progress_percentage,
      ]),
    ),
  };
}

export const projectInvestmentService = {
  create: async (input: createProjectInvestmentInput) => {
    const project = await prisma.project.findUnique({
      where: { project_id: input.project_id },
    });

    if (!project) throw new ApiError(404, "Project tidak ditemukan");

    const investor = await prisma.investor.findUnique({
      where: { investor_id: input.investor_id },
    });

    if (!investor) throw new ApiError(404, "Investor tidak ditemukan");

    try {
      return await prisma.projectInvestment.create({
        data: input,
        include: { project: true, investor: true, receiptDocument: true },
      });
    } catch (error: any) {
      if (error?.code === "P2002")
        throw new ApiError(409, "project_key sudah digunakan");
      throw error;
    }
  },

  list: async (
    query: listProjectInvestmentQuery,
  ): Promise<PaginatedResult<any>> => {
    const { page, limit, search, status, project_id, investor_id } = query;
    const where = {
      ...(status && { status }),
      ...(project_id && { project_id }),
      ...(investor_id && { investor_id }),
      ...(search && {
        project_key: { contains: search, mode: "insensitive" as const },
      }),
    };

    const [total, data] = await prisma.$transaction([
      prisma.projectInvestment.count({ where }),
      prisma.projectInvestment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          project: {
            include: {
              company: true,
            },
          },
          investor: {
            include: { user: safeUserSelect },
          },
          receiptDocument: true,
        },
      }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  },

  getById: async (investmentId: string) => {
    const investment = await prisma.projectInvestment.findFirst({
      where: { project_investment_id: investmentId },
      include: {
        project: {
          include: {
            company: true,
          },
        },
        investor: {
          include: {
            user: safeUserSelect,
          },
        },
        receiptDocument: true,
      },
    });
    if (!investment) throw new ApiError(404, "Data investasi tidak ditemukan");
    return investment;
  },

  update: async (investmentId: string, input: updateProjectInvestmentInput) => {
    await projectInvestmentService.getById(investmentId);

    if (input.project_id) {
      const project = await prisma.project.findUnique({
        where: { project_id: input.project_id },
      });
      if (!project) throw new ApiError(404, "Project tidak ditemukan");
    }

    if (input.investor_id) {
      const investor = await prisma.investor.findUnique({
        where: { investor_id: input.investor_id },
      });
      if (!investor) throw new ApiError(404, "Investor tidak ditemukan");
    }

    return prisma.projectInvestment.update({
      where: { project_investment_id: investmentId },
      data: input,
      include: { project: true, investor: true, receiptDocument: true },
    });
  },

  delete: async (investmentId: string) => {
    const investment = await projectInvestmentService.getById(investmentId);

    try {
      await prisma.projectInvestment.delete({
        where: { project_investment_id: investmentId },
      });
    } catch (error: any) {
      if (error?.code === "P2003")
        throw new ApiError(
          409,
          "Hapus receipt document terlebih dahulu sebelum menghapus data investasi",
        );
      throw error;
    }

    return investment;
  },

  getByUser: async (user_id: string) => {
    const investor = await prisma.investor.findUnique({
      where: {
        user_id: user_id,
      },
      select: {
        investor_id: true,
      },
    });

    if (!investor)
      throw new ApiError(
        404,
        `Investor dengan user_id ${user_id} tidak ditemukan.`,
      );

    const investments = await prisma.projectInvestment.findMany({
      where: { investor_id: investor.investor_id },
      include: {
        project: {
          include: {
            company: true,
          },
        },
        investor: {
          include: {
            user: safeUserSelect,
          },
        },
        receiptDocument: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const progress = await loadProjectProgress([
      ...new Set(investments.map((investment) => investment.project_id)),
    ]);

    return investments.map((investment) => {
      const collected =
        progress.collected.get(investment.project_id) ?? new Prisma.Decimal(0);

      return {
        ...investment,
        project: {
          ...investment.project,
          funding_collected: collected,
          funding_progress_pct: fundingProgressPct(
            collected,
            investment.project.funding_required,
          ),
          // null = project belum punya laporan
          latest_progress_pct:
            progress.latestProgress.get(investment.project_id) ?? null,
        },
      };
    });
  },

  /** Ringkasan investasi aktif milik investor yang sedang login (untuk beranda). */
  getOwnSummary: async (user_id: string) => {
    const investor = await prisma.investor.findUnique({
      where: { user_id },
      select: { investor_id: true },
    });

    // User yang belum melengkapi profil investor belum punya investasi.
    if (!investor) return summarizeActiveInvestments([]);

    const rows = await prisma.projectInvestment.groupBy({
      by: ["project_id"],
      where: {
        investor_id: investor.investor_id,
        project: { status: { in: [...ACTIVE_PROJECT_STATUSES] } },
      },
      _sum: { amount: true },
    });

    return summarizeActiveInvestments(
      rows.map((row) => ({
        project_id: row.project_id,
        amount: row._sum.amount,
      })),
    );
  },
};
