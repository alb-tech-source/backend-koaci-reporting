import { z } from "zod";
import {
  createProjectSchema,
  updateProjectSchema,
  listProjectQuerySchema,
  listPublicProjectQuerySchema,
} from "../modules/project/project.validation.js";

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ListProjectQuery = z.infer<typeof listProjectQuerySchema>;
export type ListPublicProjectQuery = z.infer<typeof listPublicProjectQuerySchema>;

export interface PaginatedResult<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}
