import prisma from "../../lib/prisma.js";
import { ApiError } from "../../utils/apiError.js";
import type {
  CreateCompanyInput,
  UpdateCompanyInput,
  ListCompanyQuery,
  PaginatedResult,
} from "../../types/company.types.js";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, R2_BUCKET } from "../../lib/r2Client.js";

const companyInclude = {
  companyDocument: { orderBy: { uploaded_at: "desc" as const } },
};

export const companyService = {
  create: async (input: CreateCompanyInput) =>
    prisma.company.create({ data: input, include: companyInclude }),

  list: async (query: ListCompanyQuery): Promise<PaginatedResult<any>> => {
    const { page, limit, search, company_type, status } = query;
    const where = {
      ...(company_type && { company_type }),
      ...(status && { status }),
      ...(search && {
        OR: [
          { company_name: { contains: search, mode: "insensitive" as const } },
          { director_name: { contains: search, mode: "insensitive" as const } },
          { company_email: { contains: search, mode: "insensitive" as const } },
          { industry_sector: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    };
    const [total, data] = await prisma.$transaction([
      prisma.company.count({ where }),
      prisma.company.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: companyInclude,
      }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  },

  getById: async (companyId: string) => {
    const company = await prisma.company.findUnique({
      where: { company_id: companyId },
      include: companyInclude,
    });
    if (!company) throw new ApiError(404, "Perusahaan tidak ditemukan");
    return company;
  },

  update: async (companyId: string, input: UpdateCompanyInput) => {
    await companyService.getById(companyId);
    return prisma.company.update({
      where: { company_id: companyId },
      data: input,
      include: companyInclude,
    });
  },

  delete: async (companyId: string) => {
    const company = await companyService.getById(companyId);
    await Promise.all(
      company.companyDocument.map((document) =>
        r2Client.send(new DeleteObjectCommand({
          Bucket: R2_BUCKET,
          Key: document.object_key,
        })),
      ),
    );
    await prisma.company.delete({ where: { company_id: companyId } });
  },
};
