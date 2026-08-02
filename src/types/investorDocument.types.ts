import { z } from "zod";
import {
  createInvestorDocumentSchema,
  getInvestorDocumentSchema,
  updateInvestorDocumentSchema,
  deleteInvestorDocumentSchema,
  getListInvestorDocumentsSchema,
} from "../modules/investorDocument/investorDocument.validation.js";

export type InputInvestorDocumentInput = z.infer<
  typeof createInvestorDocumentSchema
>;
export type UpdateInvestorDocumentInput = z.infer<
  typeof updateInvestorDocumentSchema
>;
export type GetInvestorDocumentInput = z.infer<
  typeof getInvestorDocumentSchema
>;
export type DeleteInvestorDocumentInput = z.infer<
  typeof deleteInvestorDocumentSchema
>;
export type GetListInvestorDocumentsInput = z.infer<
  typeof getListInvestorDocumentsSchema
>;

export interface SafeInvestorDocument {
  investor_id: string;
  document_id: string;
  document_name: string;
  storage_provider: "cloudflare" | "tencent" | "aws";
  object_key: string;
  file_size_bytes: bigint | null;
  mime_type: string | null;
  uploaded_at: Date;
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
