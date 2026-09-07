import { Router } from "express";
import { receiptDocumentController } from "../modules/receiptDocument/receiptDocument.controller.js";
import { authMiddleware, authorize } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";
import { validate, validateParams } from "../middleware/validate.middleware.js";
import {
  createReceiptDocumentBodySchema,
  receiptDocumentIdParamSchema,
  receiptDocumentInvestmentIdParamSchema,
} from "../modules/receiptDocument/receiptDocument.validation.js";

const router = Router();

router.get(
  "/investment/:investmentId",
  /*
    #swagger.tags = ['Receipt Document']
    #swagger.summary = 'Get receipt document by project investment ID'
    #swagger.description = 'Satu data investasi hanya memiliki satu receipt document (relasi 1-1).'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.parameters['investmentId'] = { in: 'path', required: true, type: 'string', format: 'uuid' }
    #swagger.responses[200] = { description: 'Receipt document detail', schema: { $ref: '#/components/schemas/ReceiptDocumentResponse' } }
    #swagger.responses[404] = { description: 'Receipt document not found' }
  */
  authMiddleware, authorize("receipt_documents", "read", ["any"]),
  validateParams(receiptDocumentInvestmentIdParamSchema), receiptDocumentController.getByInvestment,
);

router.get(
  "/:receiptId/download",
  /*
    #swagger.tags = ['Receipt Document']
    #swagger.summary = 'Generate receipt document download URL'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.parameters['receiptId'] = { in: 'path', required: true, type: 'string', format: 'uuid' }
    #swagger.responses[200] = { description: 'Presigned download URL', schema: { $ref: '#/components/schemas/ReceiptDocumentDownloadUrlResponse' } }
  */
  authMiddleware, authorize("receipt_documents", "download", ["any"]),
  validateParams(receiptDocumentIdParamSchema), receiptDocumentController.download,
);

router.get(
  "/:receiptId",
  /*
    #swagger.tags = ['Receipt Document']
    #swagger.summary = 'Get receipt document by ID'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.parameters['receiptId'] = { in: 'path', required: true, type: 'string', format: 'uuid' }
    #swagger.responses[200] = { description: 'Receipt document detail', schema: { $ref: '#/components/schemas/ReceiptDocumentResponse' } }
    #swagger.responses[404] = { description: 'Receipt document not found' }
  */
  authMiddleware, authorize("receipt_documents", "read", ["any"]),
  validateParams(receiptDocumentIdParamSchema), receiptDocumentController.getById,
);

router.post(
  "/",
  /*
    #swagger.tags = ['Receipt Document']
    #swagger.summary = 'Upload receipt document'
    #swagger.description = 'Mengunggah receipt untuk satu data investasi. Ditolak (409) jika investment tersebut sudah memiliki receipt — hapus receipt lama terlebih dahulu untuk mengganti.'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.requestBody = { required: true, content: { "multipart/form-data": { schema: { type: 'object', required: ['project_investment_id', 'receipt_name', 'file'], properties: { project_investment_id: { type: 'string', format: 'uuid' }, receipt_name: { type: 'string' }, storage_provider: { type: 'string', enum: ['cloudflare', 'aws', 'tencent'], default: 'cloudflare' }, file: { type: 'string', format: 'binary' } } } } } }
    #swagger.responses[201] = { description: 'Receipt document uploaded', schema: { $ref: '#/components/schemas/ReceiptDocumentResponse' } }
    #swagger.responses[404] = { description: 'Project investment not found' }
    #swagger.responses[409] = { description: 'Receipt document untuk data investasi ini sudah ada' }
  */
  authMiddleware, authorize("receipt_documents", "upload", ["any"]),
  upload.single("file"), validate(createReceiptDocumentBodySchema), receiptDocumentController.upload,
);

router.delete(
  "/:receiptId",
  /*
    #swagger.tags = ['Receipt Document']
    #swagger.summary = 'Delete receipt document'
    #swagger.description = 'Menghapus file receipt dari object storage beserta record database-nya. Setelah dihapus, investment bisa menerima upload receipt baru.'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.parameters['receiptId'] = { in: 'path', required: true, type: 'string', format: 'uuid' }
    #swagger.responses[200] = { description: 'Receipt document deleted' }
    #swagger.responses[404] = { description: 'Receipt document not found' }
  */
  authMiddleware, authorize("receipt_documents", "delete", ["any"]),
  validateParams(receiptDocumentIdParamSchema), receiptDocumentController.remove,
);

export default router;
