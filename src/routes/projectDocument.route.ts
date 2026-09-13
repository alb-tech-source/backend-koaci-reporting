import { Router } from "express";
import { projectDocumentController } from "../modules/projectDocument/projectDocument.controller.js";
import { authMiddleware, authorize } from "../middleware/auth.middleware.js";
import { validate, validateParams, validateQuery } from "../middleware/validate.middleware.js";
import {
  presignProjectDocumentSchema,
  createProjectDocumentBodySchema,
  updateProjectDocumentSchema,
  listProjectDocumentQuerySchema,
  projectDocumentIdParamSchema,
  projectDocumentProjectIdParamSchema,
} from "../modules/projectDocument/projectDocument.validation.js";

const router = Router();

router.get(
  "/project/:projectId",
  /*
    #swagger.tags = ['Project Document']
    #swagger.summary = 'List documents by project'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.parameters['projectId'] = { in: 'path', required: true, type: 'string', format: 'uuid' }
    #swagger.parameters['page'] = { in: 'query', type: 'integer', default: 1 }
    #swagger.parameters['limit'] = { in: 'query', type: 'integer', default: 10 }
    #swagger.parameters['document_type'] = { in: 'query', type: 'string' }
    #swagger.parameters['search'] = { in: 'query', type: 'string' }
    #swagger.responses[200] = { description: 'Project document list', schema: { $ref: '#/components/schemas/ListProjectDocumentsResponse' } }
  */
  authMiddleware, authorize("project_documents", "read", ["any"]),
  validateParams(projectDocumentProjectIdParamSchema), validateQuery(listProjectDocumentQuerySchema),
  projectDocumentController.listByProject,
);

router.get(
  "/:documentId/download",
  /*
    #swagger.tags = ['Project Document']
    #swagger.summary = 'Generate document download URL'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.parameters['documentId'] = { in: 'path', required: true, type: 'string', format: 'uuid' }
    #swagger.responses[200] = { description: 'Presigned download URL', schema: { $ref: '#/components/schemas/ProjectDocumentDownloadUrlResponse' } }
  */
  authMiddleware, authorize("project_documents", "download", ["any"]),
  validateParams(projectDocumentIdParamSchema), projectDocumentController.download,
);

router.get(
  "/:documentId",
  /*
    #swagger.tags = ['Project Document']
    #swagger.summary = 'Get project document detail'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.parameters['documentId'] = { in: 'path', required: true, type: 'string', format: 'uuid' }
    #swagger.responses[200] = { description: 'Project document detail', schema: { $ref: '#/components/schemas/ProjectDocumentResponse' } }
  */
  authMiddleware, authorize("project_documents", "read", ["any"]),
  validateParams(projectDocumentIdParamSchema), projectDocumentController.getById,
);

router.post(
  "/presign",
  /*
    #swagger.tags = ['Project Document']
    #swagger.summary = 'Presign upload URL untuk project document'
    #swagger.description = 'Langkah 1 alur upload direct ke Cloudflare R2. Kembalikan uploadUrl (presigned PUT, Content-Type di-sign) + objectKey. Maksimal 100MB, kedaluwarsa 15 menit.'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: '#/components/schemas/PresignProjectDocumentRequest' } } } }
    #swagger.responses[200] = { description: 'Presigned upload URL', schema: { $ref: '#/components/schemas/PresignUploadResponse' } }
    #swagger.responses[404] = { description: 'Project not found' }
    #swagger.responses[413] = { description: 'Ukuran file melebihi batas maksimal 100MB' }
    #swagger.responses[415] = { description: 'Tipe file tidak diizinkan' }
  */
  authMiddleware, authorize("project_documents", "upload", ["any"]),
  validate(presignProjectDocumentSchema), projectDocumentController.presign,
);

router.post(
  "/",
  /*
    #swagger.tags = ['Project Document']
    #swagger.summary = 'Konfirmasi upload project document'
    #swagger.description = 'Langkah 2 alur upload direct ke R2: setelah PUT ke uploadUrl berhasil, kirim body ini untuk membuat record DB. Ukuran & tipe file diverifikasi ulang dari storage.'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: '#/components/schemas/ConfirmProjectDocumentRequest' } } } }
    #swagger.responses[201] = { description: 'Document uploaded', schema: { $ref: '#/components/schemas/ProjectDocumentResponse' } }
    #swagger.responses[400] = { description: 'object_key tidak valid atau mime_type tidak sesuai' }
    #swagger.responses[404] = { description: 'Project not found atau file belum diunggah ke storage' }
    #swagger.responses[413] = { description: 'Ukuran file aktual melebihi batas maksimal 100MB' }
  */
  authMiddleware, authorize("project_documents", "upload", ["any"]),
  validate(createProjectDocumentBodySchema), projectDocumentController.upload,
);

router.put(
  "/:documentId",
  /*
    #swagger.tags = ['Project Document']
    #swagger.summary = 'Update project document metadata'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.parameters['documentId'] = { in: 'path', required: true, type: 'string', format: 'uuid' }
    #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: '#/components/schemas/UpdateProjectDocumentRequest' } } } }
    #swagger.responses[200] = { description: 'Document updated', schema: { $ref: '#/components/schemas/ProjectDocumentResponse' } }
  */
  authMiddleware, authorize("project_documents", "update", ["any"]),
  validateParams(projectDocumentIdParamSchema), validate(updateProjectDocumentSchema), projectDocumentController.update,
);

router.delete(
  "/:documentId",
  /*
    #swagger.tags = ['Project Document']
    #swagger.summary = 'Delete project document'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.parameters['documentId'] = { in: 'path', required: true, type: 'string', format: 'uuid' }
    #swagger.responses[200] = { description: 'Document deleted' }
  */
  authMiddleware, authorize("project_documents", "delete", ["any"]),
  validateParams(projectDocumentIdParamSchema), projectDocumentController.remove,
);

export default router;
