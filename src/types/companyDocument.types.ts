import { z } from "zod";
import {
  createCompanyDocumentBodySchema,
  presignCompanyDocumentSchema,
  updateCompanyDocumentSchema,
  listCompanyDocumentQuerySchema,
} from "../modules/companyDocument/companyDocument.validation.js";

export type PresignCompanyDocumentInput = z.infer<typeof presignCompanyDocumentSchema>;
export type CreateCompanyDocumentInput = z.infer<typeof createCompanyDocumentBodySchema> & {
  uploaded_by: string;
};
export type UpdateCompanyDocumentInput = z.infer<typeof updateCompanyDocumentSchema>;
export type ListCompanyDocumentQuery = z.infer<typeof listCompanyDocumentQuerySchema>;
