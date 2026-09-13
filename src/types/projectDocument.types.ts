import { z } from "zod";
import {
  createProjectDocumentBodySchema,
  presignProjectDocumentSchema,
  updateProjectDocumentSchema,
  listProjectDocumentQuerySchema,
} from "../modules/projectDocument/projectDocument.validation.js";

export type PresignProjectDocumentInput = z.infer<typeof presignProjectDocumentSchema>;
export type CreateProjectDocumentInput = z.infer<typeof createProjectDocumentBodySchema> & {
  uploaded_by: string;
};
export type UpdateProjectDocumentInput = z.infer<typeof updateProjectDocumentSchema>;
export type ListProjectDocumentQuery = z.infer<typeof listProjectDocumentQuerySchema>;
