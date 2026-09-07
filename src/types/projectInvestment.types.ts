import { z } from "zod";
import {
  createProjectInvestmentBodySchema,
  projectInvestmentIdParamSchema,
  updateProjectInvestmentBodySchema,
  listProjectInvestmentQuerySchema,
} from "../modules/projectInvestment/projectInvestment.validation.js";

export type createProjectInvestmentInput = z.infer<
  typeof createProjectInvestmentBodySchema
>;
export type projectInvestmentIdParam = z.infer<
  typeof projectInvestmentIdParamSchema
>;
export type updateProjectInvestmentInput = z.infer<
  typeof updateProjectInvestmentBodySchema
>;
export type listProjectInvestmentQuery = z.infer<
  typeof listProjectInvestmentQuerySchema
>;

export interface PaginatedResult<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}
