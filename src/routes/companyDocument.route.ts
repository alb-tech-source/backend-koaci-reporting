import { Router } from "express";
import { companyDocumentController } from "../modules/companyDocument/companyDocument.controller.js";
import { authMiddleware, authorize } from "../middleware/auth.middleware.js";
import { validate, validateParams, validateQuery } from "../middleware/validate.middleware.js";
import {
  presignCompanyDocumentSchema,
  createCompanyDocumentBodySchema,
  updateCompanyDocumentSchema,
  listCompanyDocumentQuerySchema,
  companyDocumentIdParamSchema,
  companyDocumentCompanyIdParamSchema,
} from "../modules/companyDocument/companyDocument.validation.js";

const router = Router();

router.get(
  "/company/:companyId",
  /*
    #swagger.tags = ['Company Document']
    #swagger.summary = 'List documents by company'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.parameters['companyId'] = { in: 'path', required: true, type: 'string', format: 'uuid' }
    #swagger.parameters['page'] = { in: 'query', type: 'integer', default: 1 }
    #swagger.parameters['limit'] = { in: 'query', type: 'integer', default: 10 }
    #swagger.parameters['document_type'] = { in: 'query', type: 'string' }
    #swagger.parameters['search'] = { in: 'query', type: 'string' }
    #swagger.responses[200] = { description: 'Company document list', schema: { $ref: '#/components/schemas/ListCompanyDocumentsResponse' } }
  */
  authMiddleware, authorize("company_documents", "read", ["any"]),
  validateParams(companyDocumentCompanyIdParamSchema), validateQuery(listCompanyDocumentQuerySchema),
  companyDocumentController.listByCompany,
);

router.get(
  "/:documentId/download",
  /*
    #swagger.tags = ['Company Document']
    #swagger.summary = 'Generate document download URL'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.parameters['documentId'] = { in: 'path', required: true, type: 'string', format: 'uuid' }
    #swagger.responses[200] = { description: 'Presigned download URL', schema: { $ref: '#/components/schemas/CompanyDocumentDownloadUrlResponse' } }
  */
  authMiddleware, authorize("company_documents", "download", ["any"]),
  validateParams(companyDocumentIdParamSchema), companyDocumentController.download,
);

router.get(
  "/:documentId",
  /*
    #swagger.tags = ['Company Document']
    #swagger.summary = 'Get company document detail'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.parameters['documentId'] = { in: 'path', required: true, type: 'string', format: 'uuid' }
    #swagger.responses[200] = { description: 'Company document detail', schema: { $ref: '#/components/schemas/CompanyDocumentResponse' } }
  */
  authMiddleware, authorize("company_documents", "read", ["any"]),
  validateParams(companyDocumentIdParamSchema), companyDocumentController.getById,
);

router.post(
  "/presign",
  /*
    #swagger.tags = ['Company Document']
    #swagger.summary = 'Presign upload URL untuk company document'
    #swagger.description = 'Langkah 1 alur upload direct ke Cloudflare R2. Kembalikan uploadUrl (presigned PUT, Content-Type di-sign) + objectKey. Maksimal 100MB, kedaluwarsa 15 menit.'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: '#/components/schemas/PresignCompanyDocumentRequest' } } } }
    #swagger.responses[200] = { description: 'Presigned upload URL', schema: { $ref: '#/components/schemas/PresignUploadResponse' } }
    #swagger.responses[404] = { description: 'Company not found' }
    #swagger.responses[413] = { description: 'Ukuran file melebihi batas maksimal 100MB' }
    #swagger.responses[415] = { description: 'Tipe file tidak diizinkan' }
  */
  authMiddleware, authorize("company_documents", "upload", ["any"]),
  validate(presignCompanyDocumentSchema), companyDocumentController.presign,
);

router.post(
  "/",
  /*
    #swagger.tags = ['Company Document']
    #swagger.summary = 'Konfirmasi upload company document'
    #swagger.description = 'Langkah 2 alur upload direct ke R2: setelah PUT ke uploadUrl berhasil, kirim body ini untuk membuat record DB. Ukuran & tipe file diverifikasi ulang dari storage.'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: '#/components/schemas/ConfirmCompanyDocumentRequest' } } } }
    #swagger.responses[201] = { description: 'Document uploaded', schema: { $ref: '#/components/schemas/CompanyDocumentResponse' } }
    #swagger.responses[400] = { description: 'object_key tidak valid atau mime_type tidak sesuai' }
    #swagger.responses[404] = { description: 'Company not found atau file belum diunggah ke storage' }
    #swagger.responses[413] = { description: 'Ukuran file aktual melebihi batas maksimal 100MB' }
  */
  authMiddleware, authorize("company_documents", "upload", ["any"]),
  validate(createCompanyDocumentBodySchema), companyDocumentController.upload,
);

router.put(
  "/:documentId",
  /*
    #swagger.tags = ['Company Document']
    #swagger.summary = 'Update company document metadata'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.parameters['documentId'] = { in: 'path', required: true, type: 'string', format: 'uuid' }
    #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: '#/components/schemas/UpdateCompanyDocumentRequest' } } } }
    #swagger.responses[200] = { description: 'Document updated', schema: { $ref: '#/components/schemas/CompanyDocumentResponse' } }
  */
  authMiddleware, authorize("company_documents", "update", ["any"]),
  validateParams(companyDocumentIdParamSchema), validate(updateCompanyDocumentSchema), companyDocumentController.update,
);

router.delete(
  "/:documentId",
  /*
    #swagger.tags = ['Company Document']
    #swagger.summary = 'Delete company document'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.parameters['documentId'] = { in: 'path', required: true, type: 'string', format: 'uuid' }
    #swagger.responses[200] = { description: 'Document deleted' }
  */
  authMiddleware, authorize("company_documents", "delete", ["any"]),
  validateParams(companyDocumentIdParamSchema), companyDocumentController.remove,
);

export default router;
