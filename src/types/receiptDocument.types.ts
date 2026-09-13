import { z } from "zod";
import {
  createReceiptDocumentBodySchema,
  presignReceiptDocumentSchema,
} from "../modules/receiptDocument/receiptDocument.validation.js";

export type PresignReceiptDocumentInput = z.infer<
  typeof presignReceiptDocumentSchema
>;

export type CreateReceiptDocumentInput = z.infer<
  typeof createReceiptDocumentBodySchema
> & {
  uploaded_by: string;
};
