import { z } from "zod";
import { createReceiptDocumentBodySchema } from "../modules/receiptDocument/receiptDocument.validation.js";

export type CreateReceiptDocumentInput = z.infer<
  typeof createReceiptDocumentBodySchema
> & {
  buffer: Buffer;
  mime_type: string;
  uploaded_by: string;
};
