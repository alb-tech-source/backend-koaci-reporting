import {
  createProjectInvestmentInput,
  projectInvestmentIdParam,
  updateProjectInvestmentInput,
  listProjectInvestmentQuery,
  PaginatedResult,
} from "../../types/projectInvestment.types.js";
import prisma from "../../lib/prisma.js";
import { ApiError } from "../../utils/apiError.js";

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
        include: { project: true, investor: true },
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
        include: { project: true, investor: true },
      }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  },

  getById: async (investmentId: string) => {
    const investment = await prisma.projectInvestment.findUnique({
      where: { project_investment_id: investmentId },
      include: { project: true, investor: true },
    });
    if (!investment) throw new ApiError(404, "Data investasi tidak ditemukan");
    return investment;
  },

  update: async (
    investmentId: string,
    input: updateProjectInvestmentInput,
  ) => {
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
      include: { project: true, investor: true },
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
};
