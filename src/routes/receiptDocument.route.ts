import { Router } from "express";
import { receiptDocumentController } from "../modules/receiptDocument/receiptDocument.controller.js";
import { authMiddleware, authorize } from "../middleware/auth.middleware.js";
import { validate, validateParams } from "../middleware/validate.middleware.js";
import {
  presignReceiptDocumentSchema,
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
  "/own",
  /*
    #swagger.tags = ['Receipt Document']
    #swagger.summary = 'Get receipt documents milik sendiri (login sebagai investor)'
    #swagger.description = 'Mengambil semua receipt document dari project investment milik investor yang sedang login.'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.responses[200] = { description: 'Daftar receipt document milik user', schema: { type: 'array', items: { $ref: '#/components/schemas/ReceiptDocumentResponse' } } }
    #swagger.responses[404] = { description: 'Investor tidak ditemukan' }
  */
  authMiddleware, authorize("receipt_documents", "read", ["own"]),
  receiptDocumentController.getByUser,
);

router.get(
  "/own/:receiptId/download",
  /*
    #swagger.tags = ['Receipt Document']
    #swagger.summary = 'Generate download URL receipt document milik sendiri'
    #swagger.description = 'Membuat presigned URL untuk receipt document milik investor yang sedang login. Ditolak (404) jika receipt bukan milik user.'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.parameters['receiptId'] = { in: 'path', required: true, type: 'string', format: 'uuid' }
    #swagger.responses[200] = { description: 'Presigned download URL', schema: { $ref: '#/components/schemas/ReceiptDocumentDownloadUrlResponse' } }
    #swagger.responses[404] = { description: 'Receipt document tidak ditemukan atau bukan milik Anda' }
  */
  authMiddleware, authorize("receipt_documents", "download", ["own"]),
  validateParams(receiptDocumentIdParamSchema), receiptDocumentController.downloadByUser,
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
  "/presign",
  /*
    #swagger.tags = ['Receipt Document']
    #swagger.summary = 'Presign upload URL untuk receipt document'
    #swagger.description = 'Langkah 1 alur upload direct ke Cloudflare R2. Kembalikan uploadUrl (presigned PUT, Content-Type di-sign) + objectKey. Maksimal 100MB, kedaluwarsa 15 menit. Ditolak (409) jika investment sudah memiliki receipt.'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: '#/components/schemas/PresignReceiptDocumentRequest' } } } }
    #swagger.responses[200] = { description: 'Presigned upload URL', schema: { $ref: '#/components/schemas/PresignUploadResponse' } }
    #swagger.responses[404] = { description: 'Project investment not found' }
    #swagger.responses[409] = { description: 'Receipt document untuk data investasi ini sudah ada' }
    #swagger.responses[413] = { description: 'Ukuran file melebihi batas maksimal 100MB' }
    #swagger.responses[415] = { description: 'Tipe file tidak diizinkan' }
  */
  authMiddleware, authorize("receipt_documents", "upload", ["any"]),
  validate(presignReceiptDocumentSchema), receiptDocumentController.presign,
);

router.post(
  "/",
  /*
    #swagger.tags = ['Receipt Document']
    #swagger.summary = 'Konfirmasi upload receipt document'
    #swagger.description = 'Langkah 2 alur upload direct ke R2: setelah PUT ke uploadUrl berhasil, kirim body ini untuk membuat record DB. Ukuran & tipe file diverifikasi ulang dari storage. Ditolak (409) jika investment sudah memiliki receipt.'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: '#/components/schemas/ConfirmReceiptDocumentRequest' } } } }
    #swagger.responses[201] = { description: 'Receipt document uploaded', schema: { $ref: '#/components/schemas/ReceiptDocumentResponse' } }
    #swagger.responses[400] = { description: 'object_key tidak valid atau mime_type tidak sesuai' }
    #swagger.responses[404] = { description: 'Project investment not found atau file belum diunggah ke storage' }
    #swagger.responses[409] = { description: 'Receipt document untuk data investasi ini sudah ada' }
    #swagger.responses[413] = { description: 'Ukuran file aktual melebihi batas maksimal 100MB' }
  */
  authMiddleware, authorize("receipt_documents", "upload", ["any"]),
  validate(createReceiptDocumentBodySchema), receiptDocumentController.upload,
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
