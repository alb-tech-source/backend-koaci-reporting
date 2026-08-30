import { Router } from "express";
import { companyDocumentController } from "../modules/companyDocument/companyDocument.controller.js";
import { authMiddleware, authorize } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";
import { validate, validateParams, validateQuery } from "../middleware/validate.middleware.js";
import {
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
  "/",
  /*
    #swagger.tags = ['Company Document']
    #swagger.summary = 'Upload company document'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.requestBody = { required: true, content: { "multipart/form-data": { schema: { type: 'object', required: ['company_id', 'document_name', 'file'], properties: { company_id: { type: 'string', format: 'uuid' }, document_type: { type: 'string' }, document_name: { type: 'string' }, storage_provider: { type: 'string', enum: ['cloudflare', 'aws', 'tencent'], default: 'cloudflare' }, file: { type: 'string', format: 'binary' } } } } } }
    #swagger.responses[201] = { description: 'Document uploaded', schema: { $ref: '#/components/schemas/CompanyDocumentResponse' } }
  */
  authMiddleware, authorize("company_documents", "upload", ["any"]),
  upload.single("file"), validate(createCompanyDocumentBodySchema), companyDocumentController.upload,
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
