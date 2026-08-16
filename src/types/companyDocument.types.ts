import { z } from "zod";
import {
  createCompanyDocumentBodySchema,
  updateCompanyDocumentSchema,
  listCompanyDocumentQuerySchema,
} from "../modules/companyDocument/companyDocument.validation.js";

export type CreateCompanyDocumentInput = z.infer<typeof createCompanyDocumentBodySchema> & {
  buffer: Buffer;
  mime_type: string;
  uploaded_by: string;
};
export type UpdateCompanyDocumentInput = z.infer<typeof updateCompanyDocumentSchema>;
export type ListCompanyDocumentQuery = z.infer<typeof listCompanyDocumentQuerySchema>;
