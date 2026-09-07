import prisma from "../../lib/prisma.js";
import { ApiError } from "../../utils/apiError.js";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, R2_BUCKET } from "../../lib/r2Client.js";
import type {
  CreateProjectInput,
  UpdateProjectInput,
  ListProjectQuery,
  PaginatedResult,
} from "../../types/project.types.js";

const projectInclude = {
  company: true,
  projectDocument: { orderBy: { uploaded_at: "desc" as const } },
};

export const projectService = {
  create: async (input: CreateProjectInput) => {
    const company = await prisma.company.findUnique({
      where: { company_id: input.company_id },
    });
    if (!company) throw new ApiError(404, "Perusahaan tidak ditemukan");

    try {
      return await prisma.project.create({ data: input, include: projectInclude });
    } catch (error: any) {
      if (error?.code === "P2002") throw new ApiError(409, "project_key sudah digunakan");
      throw error;
    }
  },

  list: async (query: ListProjectQuery): Promise<PaginatedResult<any>> => {
    const { page, limit, search, status, company_id } = query;
    const where = {
      ...(status && { status }),
      ...(company_id && { company_id }),
      ...(search && { project_key: { contains: search, mode: "insensitive" as const } }),
    };
    const [total, data] = await prisma.$transaction([
      prisma.project.count({ where }),
      prisma.project.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: projectInclude,
      }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  },

  getById: async (projectId: string) => {
    const project = await prisma.project.findUnique({
      where: { project_id: projectId },
      include: projectInclude,
    });
    if (!project) throw new ApiError(404, "Project tidak ditemukan");
    return project;
  },

  update: async (projectId: string, input: UpdateProjectInput) => {
    await projectService.getById(projectId);
    try {
      return await prisma.project.update({
        where: { project_id: projectId },
        data: input,
        include: projectInclude,
      });
    } catch (error: any) {
      if (error?.code === "P2002") throw new ApiError(409, "project_key sudah digunakan");
      throw error;
    }
  },

  delete: async (projectId: string) => {
    const project = await projectService.getById(projectId);
    await Promise.all(
      project.projectDocument.map((document) =>
        r2Client.send(new DeleteObjectCommand({
          Bucket: R2_BUCKET,
          Key: document.object_key,
        })),
      ),
    );
    await prisma.project.delete({ where: { project_id: projectId } });
    return project;
  },
};
