import { Router } from "express";
import { projectReportingController } from "../modules/projectReporting/projectReporting.controller.js";
import { authMiddleware, authorize } from "../middleware/auth.middleware.js";
import { validate, validateParams, validateQuery } from "../middleware/validate.middleware.js";
import {
  createProjectReportingBodySchema,
  updateProjectReportingBodySchema,
  listProjectReportingQuerySchema,
  projectReportingIdParamSchema,
} from "../modules/projectReporting/projectReporting.validation.js";

const router = Router();

router.get(
  "/",
  /*
    #swagger.tags = ['Project Reporting']
    #swagger.summary = 'List project reportings'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.parameters['page'] = { in: 'query', type: 'integer', default: 1 }
    #swagger.parameters['limit'] = { in: 'query', type: 'integer', default: 10 }
    #swagger.parameters['search'] = { in: 'query', type: 'string' }
    #swagger.parameters['project_id'] = { in: 'query', type: 'string', format: 'uuid' }
    #swagger.responses[200] = { description: 'Project reporting list', schema: { $ref: '#/components/schemas/ListProjectReportingsResponse' } }
  */
  authMiddleware, authorize("project_reportings", "read", ["any"]),
  validateQuery(listProjectReportingQuerySchema), projectReportingController.list,
);

router.get(
  "/:reportingId",
  /*
    #swagger.tags = ['Project Reporting']
    #swagger.summary = 'Get project reporting by ID'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.parameters['reportingId'] = { in: 'path', required: true, type: 'string', format: 'uuid' }
    #swagger.responses[200] = { description: 'Project reporting detail', schema: { $ref: '#/components/schemas/ProjectReportingResponse' } }
    #swagger.responses[404] = { description: 'Project reporting not found' }
  */
  authMiddleware, authorize("project_reportings", "read", ["any"]),
  validateParams(projectReportingIdParamSchema), projectReportingController.getById,
);

router.post(
  "/",
  /*
    #swagger.tags = ['Project Reporting']
    #swagger.summary = 'Create project reporting'
    #swagger.description = 'Membuat laporan progress project. Field submitted_by diisi otomatis dari user yang login.'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: '#/components/schemas/CreateProjectReportingRequest' } } } }
    #swagger.responses[201] = { description: 'Project reporting created', schema: { $ref: '#/components/schemas/ProjectReportingResponse' } }
    #swagger.responses[404] = { description: 'Project not found' }
  */
  authMiddleware, authorize("project_reportings", "create", ["any"]),
  validate(createProjectReportingBodySchema), projectReportingController.create,
);

router.put(
  "/:reportingId",
  /*
    #swagger.tags = ['Project Reporting']
    #swagger.summary = 'Update project reporting'
    #swagger.description = 'Mengubah laporan project. Field updated_by diisi otomatis dari user yang login.'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.parameters['reportingId'] = { in: 'path', required: true, type: 'string', format: 'uuid' }
    #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: '#/components/schemas/UpdateProjectReportingRequest' } } } }
    #swagger.responses[200] = { description: 'Project reporting updated', schema: { $ref: '#/components/schemas/ProjectReportingResponse' } }
    #swagger.responses[400] = { description: 'Minimal satu field harus diisi untuk update' }
    #swagger.responses[404] = { description: 'Project reporting or project not found' }
  */
  authMiddleware, authorize("project_reportings", "update", ["any"]),
  validateParams(projectReportingIdParamSchema), validate(updateProjectReportingBodySchema), projectReportingController.update,
);

router.delete(
  "/:reportingId",
  /*
    #swagger.tags = ['Project Reporting']
    #swagger.summary = 'Delete project reporting'
    #swagger.description = 'Menghapus laporan project. Akan ditolak (409) jika masih ada media laporan terkait.'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.parameters['reportingId'] = { in: 'path', required: true, type: 'string', format: 'uuid' }
    #swagger.responses[200] = { description: 'Project reporting deleted' }
    #swagger.responses[404] = { description: 'Project reporting not found' }
    #swagger.responses[409] = { description: 'Media laporan masih terkait dengan laporan ini' }
  */
  authMiddleware, authorize("project_reportings", "delete", ["any"]),
  validateParams(projectReportingIdParamSchema), projectReportingController.remove,
);

export default router;
