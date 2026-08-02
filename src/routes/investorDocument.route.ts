import { Router } from "express";
import { investorDocumentController } from "../modules/investorDocument/investorDocument.controller.js";
import {
  authMiddleware,
  requirePermission,
} from "../middleware/auth.middleware.js";
import {
  validate,
  validateParams,
} from "../middleware/validate.middleware.js";
import {
  createInvestorDocumentSchema,
  getInvestorDocumentSchema,
  deleteInvestorDocumentSchema,
  investorIdParamSchema,
} from "../modules/investorDocument/investorDocument.validation.js";
import { upload } from "../middleware/upload.middleware.js";

const router = Router();

// Get list of investor documents by investor ID
router.get(
  "/investor/:investorId",
  /*
    #swagger.tags = ['Investor Document']
    #swagger.summary = 'Get list of investor documents'
    #swagger.description = 'Get all documents for a specific investor with pagination support.'
    #swagger.security = [{ "bearerAuth": [] }]
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
  requirePermission(["investors:read", "investors:read_own"]),
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
    #swagger.security = [{ "bearerAuth": [] }]
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
  requirePermission(["investors:read", "investors:read_own"]),
  validateParams(getInvestorDocumentSchema),
  investorDocumentController.getDownloadUrl,
);

// Upload new investor document
router.post(
  "/",
  /*
    #swagger.tags = ['Investor Document']
    #swagger.summary = 'Upload investor document'
    #swagger.description = 'Upload a new document for an investor. Supports multipart/form-data for file upload.'
    #swagger.security = [{ "bearerAuth": [] }]
    #swagger.requestBody = {
      required: true,
      content: {
        "multipart/form-data": {
          schema: {
            type: 'object',
            required: ['investor_id', 'document_name', 'file'],
            properties: {
              investor_id: {
                type: 'string',
                format: 'uuid',
                description: 'Investor ID'
              },
              document_name: {
                type: 'string',
                description: 'Document name (e.g., KTP.pdf)'
              },
              storage_provider: {
                type: 'string',
                enum: ['cloudflare', 'aws', 'tencent'],
                default: 'cloudflare',
                description: 'Storage provider'
              },
              file: {
                type: 'string',
                format: 'binary',
                description: 'File to upload'
              }
            }
          },
          encoding: {
            file: {
              contentType: ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
            }
          }
        }
      }
    }
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
  */
  authMiddleware,
  requirePermission(["investors:update", "investors:update_own"]),
  upload.single("file"),
  investorDocumentController.upload,
);

// Delete investor document by document ID
router.delete(
  "/:documentId",
  /*
    #swagger.tags = ['Investor Document']
    #swagger.summary = 'Delete investor document'
    #swagger.description = 'Permanently delete a document from storage and database. This action cannot be undone.'
    #swagger.security = [{ "bearerAuth": [] }]
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
  requirePermission(["investors:update", "investors:update_own"]),
  validateParams(deleteInvestorDocumentSchema),
  investorDocumentController.delete,
);

export default router;
