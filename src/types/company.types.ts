import { z } from "zod";
import {
  createCompanySchema,
  updateCompanySchema,
  listCompanyQuerySchema,
} from "../modules/company/company.validation.js";

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
export type ListCompanyQuery = z.infer<typeof listCompanyQuerySchema>;

export interface PaginatedResult<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}
