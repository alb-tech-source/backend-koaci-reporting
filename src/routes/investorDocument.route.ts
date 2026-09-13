import { Router } from "express";
import { investorDocumentController } from "../modules/investorDocument/investorDocument.controller.js";
import {
  authMiddleware,
  authorize,
} from "../middleware/auth.middleware.js";
import {
  validate,
  validateParams,
} from "../middleware/validate.middleware.js";
import {
  presignInvestorDocumentSchema,
  createInvestorDocumentSchema,
  getInvestorDocumentSchema,
  deleteInvestorDocumentSchema,
  investorIdParamSchema,
} from "../modules/investorDocument/investorDocument.validation.js";

const router = Router();

// Get list of investor documents by investor ID
router.get(
  "/investor/:investorId",
  /*
    #swagger.tags = ['Investor Document']
    #swagger.summary = 'Get list of investor documents'
    #swagger.description = 'Get all documents for a specific investor with pagination support.'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.parameters['investorId'] = {
      description: 'Investor ID (UUID)',
      required: true,
      type: 'string',
      format: 'uuid'
    }
    #swagger.responses[200] = {
      description: 'List of investor documents',
      schema: {
        data: [
          {
            document_id: 'uuid-doc-id',
            investor_id: 'uuid-investor-id',
            document_name: 'KTP.pdf',
            storage_provider: 'cloudflare',
            object_key: 'investor/uuid/uuid-KTP.pdf',
            file_size_bytes: 1024000,
            mime_type: 'application/pdf',
            uploaded_at: '2024-01-01T00:00:00.000Z'
          }
        ],
        meta: {
          total: 10,
          page: 1,
          limit: 10,
          totalPages: 1
        }
      }
    }
  */
  authMiddleware,
  authorize("investor_documents", "download"),
  validateParams(investorIdParamSchema),
  investorDocumentController.getList,
);

// Get document download URL by document ID
router.get(
  "/:documentId/download",
  /*
    #swagger.tags = ['Investor Document']
    #swagger.summary = 'Get document download URL'
    #swagger.description = 'Get a presigned URL for downloading a specific document. URL is valid for 1 hour.'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.parameters['documentId'] = {
      description: 'Document ID (UUID)',
      required: true,
      type: 'string',
      format: 'uuid'
    }
    #swagger.responses[200] = {
      description: 'Download URL generated successfully',
      schema: {
        downloadUrl: 'https://presigned-url-here',
        message: 'URL download berhasil dibuat'
      }
    }
  */
  authMiddleware,
  authorize("investor_documents", "download"),
  validateParams(getInvestorDocumentSchema),
  investorDocumentController.getDownloadUrl,
);

// Presign upload URL for direct-to-R2 upload
router.post(
  "/presign",
  /*
    #swagger.tags = ['Investor Document']
    #swagger.summary = 'Presign upload URL untuk dokumen investor'
    #swagger.description = 'Langkah 1 alur upload direct ke Cloudflare R2. Kembalikan uploadUrl (presigned PUT, Content-Type di-sign) + objectKey. Maksimal 100MB, kedaluwarsa 15 menit.'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: '#/components/schemas/PresignInvestorDocumentRequest' } } } }
    #swagger.responses[200] = { description: 'Presigned upload URL', schema: { $ref: '#/components/schemas/PresignUploadResponse' } }
    #swagger.responses[404] = { description: 'Investor tidak ditemukan' }
    #swagger.responses[413] = { description: 'Ukuran file melebihi batas maksimal 100MB' }
    #swagger.responses[415] = { description: 'Tipe file tidak diizinkan' }
  */
  authMiddleware,
  authorize("investor_documents", "upload"),
  validate(presignInvestorDocumentSchema),
  investorDocumentController.presign,
);

// Confirm upload — create DB record after direct PUT to R2
router.post(
  "/",
  /*
    #swagger.tags = ['Investor Document']
    #swagger.summary = 'Konfirmasi upload dokumen investor'
    #swagger.description = 'Langkah 2 alur upload direct ke R2: setelah PUT ke uploadUrl berhasil, kirim body ini untuk membuat record DB. Ukuran & tipe file diverifikasi ulang dari storage.'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: '#/components/schemas/ConfirmInvestorDocumentRequest' } } } }
    #swagger.responses[201] = {
      description: 'Document uploaded successfully',
      schema: {
        document: {
          document_id: 'uuid-doc-id',
          investor_id: 'uuid-investor-id',
          document_name: 'KTP.pdf',
          storage_provider: 'cloudflare',
          object_key: 'investor/uuid/uuid-KTP.pdf',
          file_size_bytes: 1024000,
          mime_type: 'application/pdf',
          uploaded_at: '2024-01-01T00:00:00.000Z'
        },
        message: 'Dokumen investor berhasil diunggah'
      }
    }
    #swagger.responses[400] = { description: 'object_key tidak valid atau mime_type tidak sesuai' }
    #swagger.responses[404] = { description: 'Investor tidak ditemukan atau file belum diunggah ke storage' }
    #swagger.responses[413] = { description: 'Ukuran file aktual melebihi batas maksimal 100MB' }
  */
  authMiddleware,
  authorize("investor_documents", "upload"),
  validate(createInvestorDocumentSchema),
  investorDocumentController.upload,
);

// Delete investor document by document ID
router.delete(
  "/:documentId",
  /*
    #swagger.tags = ['Investor Document']
    #swagger.summary = 'Delete investor document'
    #swagger.description = 'Permanently delete a document from storage and database. This action cannot be undone.'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.parameters['documentId'] = {
      description: 'Document ID (UUID)',
      required: true,
      type: 'string',
      format: 'uuid'
    }
    #swagger.responses[200] = {
      description: 'Document deleted successfully',
      schema: {
        message: 'Dokumen investor berhasil dihapus'
      }
    }
  */
  authMiddleware,
  authorize("investor_documents", "delete"),
  validateParams(deleteInvestorDocumentSchema),
  investorDocumentController.delete,
);

export default router;
