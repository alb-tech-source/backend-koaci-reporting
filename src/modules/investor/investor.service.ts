import type {
  CreateInvestorInput,
  UpdateInvestorInput,
  ListInvestorQuery,
  SafeInvestor,
  PaginatedResult,
} from "../../types/investor.types.js";
import { ApiError } from "../../utils/apiError.js";
import prisma from "../../lib/prisma.js";

export function toSafeInvestor(investor: any): SafeInvestor {
  return {
    investor_id: investor.investor_id,
    user_id: investor.user_id,
    investor_type: investor.investor_type,
    status: investor.status,
    gender: investor.gender,
    nik: investor.nik,
    address: investor.address,
    privy: investor.privy,
    phone: investor.phone,
    account_number: investor.account_number,
    bank_name: investor.bank_name,
    heir_name: investor.heir_name,
    heir_relationship: investor.heir_relationship,
    heir_nik: investor.heir_nik,
    heir_address: investor.heir_address,
    heir_account_number: investor.heir_account_number,
    heir_bank_name: investor.heir_bank_name,
    heir_phone: investor.heir_phone,
    createdAt: investor.createdAt,
    updatedAt: investor.updatedAt,
    user: investor.user
      ? {
          user_id: investor.user.user_id,
          firstname: investor.user.firstname,
          lastname: investor.user.lastname,
          email: investor.user.email,
          is_active: investor.user.is_active,
        }
      : undefined,
    InvestorDocument: investor.InvestorDocument,
  };
}

export const investorService = {
  createInvestor: async (input: CreateInvestorInput): Promise<SafeInvestor> => {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { user_id: input.user_id },
      include: {
        role: true,
      },
    });

    if (!user) {
      throw new ApiError(404, "User tidak ditemukan.");
    }

    // Check if investor already exists for this user
    const existingInvestor = await prisma.investor.findUnique({
      where: { user_id: input.user_id },
    });

    if (existingInvestor) {
      throw new ApiError(409, "Investor sudah terdaftar untuk user ini.");
    }

    // Check if NIK is already registered
    const existingNIK = await prisma.investor.findFirst({
      where: { nik: input.nik },
    });

    if (existingNIK) {
      throw new ApiError(409, "NIK sudah terdaftar.");
    }

    // Validate and update role to investor
    // Only users with role "user" can be promoted to "investor"
    const restrictedRoles = ["admin", "superadmin", "bod"];

    if (user.role && restrictedRoles.includes(user.role.role_name)) {
      throw new ApiError(
        403,
        `User dengan role ${user.role.role_name} tidak dapat diubah menjadi investor.`,
      );
    }

    // Create or update role to investor
    if (user.role && user.role.role_name === "user") {
      // Update existing role from user to investor
      await prisma.role.update({
        where: { user_id: input.user_id },
        data: { role_name: "investor" },
      });
    }

    const investor = await prisma.investor.create({
      data: {
        user_id: input.user_id,
        investor_type: input.investor_type,
        status: input.status,
        gender: input.gender,
        nik: input.nik,
        address: input.address,
        privy: input.privy,
        phone: input.phone,
        account_number: input.account_number,
        bank_name: input.bank_name,
        heir_name: input.heir_name,
        heir_relationship: input.heir_relationship,
        heir_nik: input.heir_nik,
        heir_address: input.heir_address,
        heir_account_number: input.heir_account_number,
        heir_bank_name: input.heir_bank_name,
        heir_phone: input.heir_phone,
      },
      include: {
        user: {
          select: {
            user_id: true,
            firstname: true,
            lastname: true,
            email: true,
            is_active: true,
          },
        },
        InvestorDocument: true,
      },
    });

    return toSafeInvestor(investor);
  },

  listInvestors: async (
    query: ListInvestorQuery,
  ): Promise<PaginatedResult<SafeInvestor>> => {
    const { page, limit, search, investor_type, status, gender } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      ...(investor_type && { investor_type }),
      ...(status && { status }),
      ...(gender && { gender }),
      ...(search && {
        OR: [
          {
            user: {
              firstname: { contains: search, mode: "insensitive" as const },
            },
          },
          {
            user: {
              lastname: { contains: search, mode: "insensitive" as const },
            },
          },
          {
            user: { email: { contains: search, mode: "insensitive" as const } },
          },
          { nik: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    };

    const [total, investors] = await prisma.$transaction([
      prisma.investor.count({ where }),
      prisma.investor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              user_id: true,
              firstname: true,
              lastname: true,
              email: true,
              is_active: true,
            },
          },
          InvestorDocument: true,
        },
      }),
    ]);

    return {
      data: investors.map(toSafeInvestor),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  getInvestorById: async (investorId: string): Promise<SafeInvestor> => {
    const investor = await prisma.investor.findUnique({
      where: {
        investor_id: investorId,
      },
      include: {
        user: {
          select: {
            user_id: true,
            firstname: true,
            lastname: true,
            email: true,
            is_active: true,
          },
        },
        InvestorDocument: {
          orderBy: { uploaded_at: "desc" },
        },
      },
    });

    if (!investor) {
      throw new ApiError(404, "Investor tidak ditemukan!");
    }

    return toSafeInvestor(investor);
  },

  getInvestorByUserId: async (userId: string): Promise<SafeInvestor> => {
    const investor = await prisma.investor.findUnique({
      where: {
        user_id: userId,
      },
      include: {
        user: {
          select: {
            user_id: true,
            firstname: true,
            lastname: true,
            email: true,
            is_active: true,
          },
        },
        InvestorDocument: {
          orderBy: { uploaded_at: "desc" },
        },
      },
    });

    if (!investor) {
      throw new ApiError(404, "Investor tidak ditemukan!");
    }

    return toSafeInvestor(investor);
  },

  updateInvestor: async (
    investorId: string,
    input: UpdateInvestorInput,
  ): Promise<SafeInvestor> => {
    const existingInvestor = await prisma.investor.findUnique({
      where: { investor_id: investorId },
    });

    if (!existingInvestor) {
      throw new ApiError(404, "Investor tidak ditemukan!");
    }

    // Check if NIK is already registered by another investor
    if (input.nik && input.nik !== existingInvestor.nik) {
      const existingNIK = await prisma.investor.findFirst({
        where: { nik: input.nik },
      });

      if (existingNIK) {
        throw new ApiError(409, "NIK sudah terdaftar pada investor lain.");
      }
    }

    const updatedInvestor = await prisma.investor.update({
      where: { investor_id: investorId },
      data: input,
      include: {
        user: {
          select: {
            user_id: true,
            firstname: true,
            lastname: true,
            email: true,
            is_active: true,
          },
        },
        InvestorDocument: true,
      },
    });

    return toSafeInvestor(updatedInvestor);
  },

  updateInvestorStatus: async (
    investorId: string,
    status: "active" | "inactive" | "blacklist",
  ): Promise<SafeInvestor> => {
    const existingInvestor = await prisma.investor.findUnique({
      where: { investor_id: investorId },
    });

    if (!existingInvestor) {
      throw new ApiError(404, "Investor tidak ditemukan!");
    }

    const updatedInvestor = await prisma.investor.update({
      where: {
        investor_id: investorId,
      },
      data: {
        status,
      },
      include: {
        user: {
          select: {
            user_id: true,
            firstname: true,
            lastname: true,
            email: true,
            is_active: true,
          },
        },
        InvestorDocument: true,
      },
    });

    return toSafeInvestor(updatedInvestor);
  },

  deleteInvestor: async (investorId: string): Promise<void> => {
    const existingInvestor = await prisma.investor.findUnique({
      where: { investor_id: investorId },
      include: {
        InvestorDocument: {
          select: {
            document_id: true,
          },
        },
      },
    });

    if (!existingInvestor) {
      throw new ApiError(404, "Investor tidak ditemukan");
    }

    // Delete investor and related documents
    await prisma.$transaction([
      prisma.investorDocument.deleteMany({
        where: { investor_id: investorId },
      }),
      prisma.investor.delete({ where: { investor_id: investorId } }),
    ]);
  },
};
