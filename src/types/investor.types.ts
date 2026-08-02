import { z } from "zod";
import {
  createInvestorSchema,
  updateInvestorSchema,
  listInvestorQuerySchema,
} from "../modules/investor/investor.validation.js";

export type CreateInvestorInput = z.infer<typeof createInvestorSchema>;
export type UpdateInvestorInput = z.infer<typeof updateInvestorSchema>;
export type ListInvestorQuery = z.infer<typeof listInvestorQuerySchema>;

export interface SafeInvestor {
  investor_id: string;
  user_id: string;
  investor_type: "individual" | "corporation";
  status: "active" | "inactive" | "blacklist";
  gender: "men" | "women";
  nik: string;
  address: string;
  privy: string | null;
  phone: string;
  account_number: string;
  bank_name: string;
  heir_name: string | null;
  heir_relationship: string | null;
  heir_nik: string | null;
  heir_address: string | null;
  heir_account_number: string | null;
  heir_bank_name: string | null;
  heir_phone: string | null;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    user_id: string;
    firstname: string | null;
    lastname: string | null;
    email: string;
    is_active: boolean;
  };
  InvestorDocument?: Array<{
    document_id: string;
    document_name: string;
    storage_provider: "cloudflare" | "tencent" | "aws";
    object_key: string;
    file_size_bytes: bigint | null;
    mime_type: string | null;
    uploaded_at: Date;
  }>;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
