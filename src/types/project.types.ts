import { z } from "zod";
import {
  createProjectSchema,
  updateProjectSchema,
  listProjectQuerySchema,
} from "../modules/project/project.validation.js";

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ListProjectQuery = z.infer<typeof listProjectQuerySchema>;

export interface PaginatedResult<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}
