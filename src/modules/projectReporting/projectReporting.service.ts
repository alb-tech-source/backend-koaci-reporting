import {
  CreateProjectReportingInput,
  UpdateProjectReportingInput,
  ListProjectReportingQuery,
  PaginatedResult,
} from "../../types/projectReporting.types.js";
import prisma from "../../lib/prisma.js";
import { ApiError } from "../../utils/apiError.js";

const includeRelations = {
  project: true,
  submitted: {
    select: { user_id: true, firstname: true, lastname: true, email: true },
  },
  updated: {
    select: { user_id: true, firstname: true, lastname: true, email: true },
  },
  projectReportingMedia: true,
};

export const projectReportingService = {
  create: async (input: CreateProjectReportingInput) => {
    const project = await prisma.project.findUnique({
      where: { project_id: input.project_id },
    });

    if (!project) throw new ApiError(404, "Project tidak ditemukan");

    return prisma.projectReporting.create({
      data: input,
      include: includeRelations,
    });
  },

  list: async (
    query: ListProjectReportingQuery,
  ): Promise<PaginatedResult<any>> => {
    const { page, limit, search, project_id } = query;
    const where = {
      ...(project_id && { project_id }),
      ...(search && {
        narative_summary: { contains: search, mode: "insensitive" as const },
      }),
    };

    const [total, data] = await prisma.$transaction([
      prisma.projectReporting.count({ where }),
      prisma.projectReporting.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { report_date: "desc" },
        include: includeRelations,
      }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  },

  getById: async (reportingId: string) => {
    const reporting = await prisma.projectReporting.findUnique({
      where: { project_reporting_id: reportingId },
      include: includeRelations,
    });
    if (!reporting) throw new ApiError(404, "Laporan project tidak ditemukan");
    return reporting;
  },

  update: async (
    reportingId: string,
    input: UpdateProjectReportingInput,
  ) => {
    await projectReportingService.getById(reportingId);

    if (input.project_id) {
      const project = await prisma.project.findUnique({
        where: { project_id: input.project_id },
      });
      if (!project) throw new ApiError(404, "Project tidak ditemukan");
    }

    return prisma.projectReporting.update({
      where: { project_reporting_id: reportingId },
      data: input,
      include: includeRelations,
    });
  },

  delete: async (reportingId: string) => {
    const reporting = await projectReportingService.getById(reportingId);

    try {
      await prisma.projectReporting.delete({
        where: { project_reporting_id: reportingId },
      });
    } catch (error: any) {
      if (error?.code === "P2003")
        throw new ApiError(
          409,
          "Hapus media laporan terlebih dahulu sebelum menghapus laporan",
        );
      throw error;
    }

    return reporting;
  },
};
