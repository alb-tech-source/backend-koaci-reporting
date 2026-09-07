import { Router } from "express";
import { projectInvestmentController } from "../modules/projectInvestment/projectInvestment.controller.js";
import { authMiddleware, authorize } from "../middleware/auth.middleware.js";
import { validate, validateParams, validateQuery } from "../middleware/validate.middleware.js";
import {
  createProjectInvestmentBodySchema,
  updateProjectInvestmentBodySchema,
  listProjectInvestmentQuerySchema,
  projectInvestmentIdParamSchema,
} from "../modules/projectInvestment/projectInvestment.validation.js";

const router = Router();

router.get(
  "/",
  /*
    #swagger.tags = ['Project Investment']
    #swagger.summary = 'List project investments'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.parameters['page'] = { in: 'query', type: 'integer', default: 1 }
    #swagger.parameters['limit'] = { in: 'query', type: 'integer', default: 10 }
    #swagger.parameters['search'] = { in: 'query', type: 'string' }
    #swagger.parameters['status'] = { in: 'query', schema: { type: 'string', enum: ['open', 'closed', 'target_achieved', 'cancelled'] } }
    #swagger.parameters['project_id'] = { in: 'query', type: 'string', format: 'uuid' }
    #swagger.parameters['investor_id'] = { in: 'query', type: 'string', format: 'uuid' }
    #swagger.responses[200] = { description: 'Project investment list', schema: { $ref: '#/components/schemas/ListProjectInvestmentsResponse' } }
  */
  authMiddleware, authorize("project_investments", "read", ["any"]),
  validateQuery(listProjectInvestmentQuerySchema), projectInvestmentController.list,
);

router.get(
  "/:investmentId",
  /*
    #swagger.tags = ['Project Investment']
    #swagger.summary = 'Get project investment by ID'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.parameters['investmentId'] = { in: 'path', required: true, type: 'string', format: 'uuid' }
    #swagger.responses[200] = { description: 'Project investment detail', schema: { $ref: '#/components/schemas/ProjectInvestmentResponse' } }
    #swagger.responses[404] = { description: 'Project investment not found' }
  */
  authMiddleware, authorize("project_investments", "read", ["any"]),
  validateParams(projectInvestmentIdParamSchema), projectInvestmentController.getById,
);

router.post(
  "/",
  /*
    #swagger.tags = ['Project Investment']
    #swagger.summary = 'Create project investment'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: '#/components/schemas/CreateProjectInvestmentRequest' } } } }
    #swagger.responses[201] = { description: 'Project investment created', schema: { $ref: '#/components/schemas/ProjectInvestmentResponse' } }
    #swagger.responses[404] = { description: 'Project or investor not found' }
  */
  authMiddleware, authorize("project_investments", "create", ["any"]),
  validate(createProjectInvestmentBodySchema), projectInvestmentController.create,
);

router.put(
  "/:investmentId",
  /*
    #swagger.tags = ['Project Investment']
    #swagger.summary = 'Update project investment'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.parameters['investmentId'] = { in: 'path', required: true, type: 'string', format: 'uuid' }
    #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: '#/components/schemas/UpdateProjectInvestmentRequest' } } } }
    #swagger.responses[200] = { description: 'Project investment updated', schema: { $ref: '#/components/schemas/ProjectInvestmentResponse' } }
    #swagger.responses[400] = { description: 'Minimal satu field harus diisi untuk update' }
    #swagger.responses[404] = { description: 'Project investment, project, or investor not found' }
  */
  authMiddleware, authorize("project_investments", "update", ["any"]),
  validateParams(projectInvestmentIdParamSchema), validate(updateProjectInvestmentBodySchema), projectInvestmentController.update,
);

router.delete(
  "/:investmentId",
  /*
    #swagger.tags = ['Project Investment']
    #swagger.summary = 'Delete project investment'
    #swagger.description = 'Menghapus data investasi project. Akan ditolak (409) jika masih ada receipt document terkait.'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.parameters['investmentId'] = { in: 'path', required: true, type: 'string', format: 'uuid' }
    #swagger.responses[200] = { description: 'Project investment deleted' }
    #swagger.responses[404] = { description: 'Project investment not found' }
    #swagger.responses[409] = { description: 'Receipt document masih terkait dengan data investasi ini' }
  */
  authMiddleware, authorize("project_investments", "delete", ["any"]),
  validateParams(projectInvestmentIdParamSchema), projectInvestmentController.remove,
);

export default router;
