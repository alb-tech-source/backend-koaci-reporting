import { z } from "zod";
import { listInvestorSettlementQuerySchema } from "../modules/investorSettlement/investorSettlement.validation.js";

export type listInvestorSettlementQuery = z.infer<
  typeof listInvestorSettlementQuerySchema
>;

export interface PaginatedResult<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}
