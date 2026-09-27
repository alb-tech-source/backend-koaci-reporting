import { z } from "zod";
import {
  createProjectSettlementBodySchema,
  updateProjectSettlementBodySchema,
  listProjectSettlementQuerySchema,
} from "../modules/projectSettlement/projectSettlement.validation.js";

export type createProjectSettlementInput = z.infer<
  typeof createProjectSettlementBodySchema
>;
export type updateProjectSettlementInput = z.infer<
  typeof updateProjectSettlementBodySchema
>;
export type listProjectSettlementQuery = z.infer<
  typeof listProjectSettlementQuerySchema
>;

export interface PaginatedResult<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}
