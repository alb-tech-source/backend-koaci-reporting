import { Router } from "express";
import { projectReportingMediaController } from "../modules/projectReportingMedia/projectReportingMedia.controller.js";
import { authMiddleware, authorize } from "../middleware/auth.middleware.js";
import { uploadMedia } from "../middleware/upload.middleware.js";
import { validate, validateParams, validateQuery } from "../middleware/validate.middleware.js";
import {
  createProjectReportingMediaBodySchema,
  updateProjectReportingMediaSchema,
  listProjectReportingMediaQuerySchema,
  projectReportingMediaIdParamSchema,
  projectReportingMediaReportingIdParamSchema,
} from "../modules/projectReportingMedia/projectReportingMedia.validation.js";

const router = Router();

router.get(
  "/reporting/:reportingId",
  /*
    #swagger.tags = ['Project Reporting Media']
    #swagger.summary = 'List media by project reporting'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.parameters['reportingId'] = { in: 'path', required: true, type: 'string', format: 'uuid' }
    #swagger.parameters['page'] = { in: 'query', type: 'integer', default: 1 }
    #swagger.parameters['limit'] = { in: 'query', type: 'integer', default: 10 }
    #swagger.parameters['media_type'] = { in: 'query', schema: { type: 'string', enum: ['photo', 'video', 'document'] } }
    #swagger.parameters['search'] = { in: 'query', type: 'string' }
    #swagger.responses[200] = { description: 'Project reporting media list', schema: { $ref: '#/components/schemas/ListProjectReportingMediaResponse' } }
  */
  authMiddleware, authorize("project_reporting_media", "read", ["any"]),
  validateParams(projectReportingMediaReportingIdParamSchema), validateQuery(listProjectReportingMediaQuerySchema),
  projectReportingMediaController.listByReporting,
);

router.get(
  "/:mediaId/download",
  /*
    #swagger.tags = ['Project Reporting Media']
    #swagger.summary = 'Generate media download URL'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.parameters['mediaId'] = { in: 'path', required: true, type: 'string', format: 'uuid' }
    #swagger.responses[200] = { description: 'Presigned download URL', schema: { $ref: '#/components/schemas/ProjectReportingMediaDownloadUrlResponse' } }
  */
  authMiddleware, authorize("project_reporting_media", "download", ["any"]),
  validateParams(projectReportingMediaIdParamSchema), projectReportingMediaController.download,
);

router.get(
  "/:mediaId",
  /*
    #swagger.tags = ['Project Reporting Media']
    #swagger.summary = 'Get project reporting media detail'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.parameters['mediaId'] = { in: 'path', required: true, type: 'string', format: 'uuid' }
    #swagger.responses[200] = { description: 'Project reporting media detail', schema: { $ref: '#/components/schemas/ProjectReportingMediaResponse' } }
    #swagger.responses[404] = { description: 'Project reporting media not found' }
  */
  authMiddleware, authorize("project_reporting_media", "read", ["any"]),
  validateParams(projectReportingMediaIdParamSchema), projectReportingMediaController.getById,
);

router.post(
  "/",
  /*
    #swagger.tags = ['Project Reporting Media']
    #swagger.summary = 'Upload project reporting media'
    #swagger.description = 'Mengunggah media (photo/video/document) untuk laporan project. Maksimal 50MB.'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.requestBody = { required: true, content: { "multipart/form-data": { schema: { type: 'object', required: ['project_reporting_id', 'media_type', 'media_name', 'file'], properties: { project_reporting_id: { type: 'string', format: 'uuid' }, media_type: { type: 'string', enum: ['photo', 'video', 'document'] }, media_name: { type: 'string' }, storage_provider: { type: 'string', enum: ['cloudflare', 'aws', 'tencent'], default: 'cloudflare' }, file: { type: 'string', format: 'binary' } } } } } }
    #swagger.responses[201] = { description: 'Media uploaded', schema: { $ref: '#/components/schemas/ProjectReportingMediaResponse' } }
    #swagger.responses[404] = { description: 'Project reporting not found' }
  */
  authMiddleware, authorize("project_reporting_media", "upload", ["any"]),
  uploadMedia.single("file"), validate(createProjectReportingMediaBodySchema), projectReportingMediaController.upload,
);

router.put(
  "/:mediaId",
  /*
    #swagger.tags = ['Project Reporting Media']
    #swagger.summary = 'Update project reporting media metadata'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.parameters['mediaId'] = { in: 'path', required: true, type: 'string', format: 'uuid' }
    #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: '#/components/schemas/UpdateProjectReportingMediaRequest' } } } }
    #swagger.responses[200] = { description: 'Media updated', schema: { $ref: '#/components/schemas/ProjectReportingMediaResponse' } }
  */
  authMiddleware, authorize("project_reporting_media", "update", ["any"]),
  validateParams(projectReportingMediaIdParamSchema), validate(updateProjectReportingMediaSchema), projectReportingMediaController.update,
);

router.delete(
  "/:mediaId",
  /*
    #swagger.tags = ['Project Reporting Media']
    #swagger.summary = 'Delete project reporting media'
    #swagger.description = 'Menghapus file media dari object storage beserta record database-nya.'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.parameters['mediaId'] = { in: 'path', required: true, type: 'string', format: 'uuid' }
    #swagger.responses[200] = { description: 'Media deleted' }
    #swagger.responses[404] = { description: 'Project reporting media not found' }
  */
  authMiddleware, authorize("project_reporting_media", "delete", ["any"]),
  validateParams(projectReportingMediaIdParamSchema), projectReportingMediaController.remove,
);

export default router;
