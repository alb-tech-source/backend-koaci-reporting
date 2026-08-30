import { z } from "zod";
import {
  createProjectDocumentBodySchema,
  updateProjectDocumentSchema,
  listProjectDocumentQuerySchema,
} from "../modules/projectDocument/projectDocument.validation.js";

export type CreateProjectDocumentInput = z.infer<typeof createProjectDocumentBodySchema> & {
  buffer: Buffer;
  mime_type: string;
  uploaded_by: string;
};
export type UpdateProjectDocumentInput = z.infer<typeof updateProjectDocumentSchema>;
export type ListProjectDocumentQuery = z.infer<typeof listProjectDocumentQuerySchema>;
