import { Router } from "express";
import { projectDocumentController } from "../modules/projectDocument/projectDocument.controller.js";
import { authMiddleware, authorize } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";
import { validate, validateParams, validateQuery } from "../middleware/validate.middleware.js";
import {
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
  "/",
  /*
    #swagger.tags = ['Project Document']
    #swagger.summary = 'Upload project document'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.requestBody = { required: true, content: { "multipart/form-data": { schema: { type: 'object', required: ['project_id', 'document_name', 'file'], properties: { project_id: { type: 'string', format: 'uuid' }, document_type: { type: 'string' }, document_name: { type: 'string' }, storage_provider: { type: 'string', enum: ['cloudflare', 'aws', 'tencent'], default: 'cloudflare' }, file: { type: 'string', format: 'binary' } } } } } }
    #swagger.responses[201] = { description: 'Document uploaded', schema: { $ref: '#/components/schemas/ProjectDocumentResponse' } }
    #swagger.responses[404] = { description: 'Project not found' }
  */
  authMiddleware, authorize("project_documents", "upload", ["any"]),
  upload.single("file"), validate(createProjectDocumentBodySchema), projectDocumentController.upload,
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
