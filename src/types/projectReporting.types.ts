import { z } from "zod";
import {
  createProjectReportingBodySchema,
  projectReportingIdParamSchema,
  updateProjectReportingBodySchema,
  listProjectReportingQuerySchema,
} from "../modules/projectReporting/projectReporting.validation.js";

export type CreateProjectReportingInput = z.infer<
  typeof createProjectReportingBodySchema
> & {
  submitted_by: string;
};
export type projectReportingIdParam = z.infer<
  typeof projectReportingIdParamSchema
>;
export type UpdateProjectReportingInput = z.infer<
  typeof updateProjectReportingBodySchema
> & {
  updated_by: string;
};
export type ListProjectReportingQuery = z.infer<
  typeof listProjectReportingQuerySchema
>;

export interface PaginatedResult<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}
