import { Router } from "express";
import { projectController } from "../modules/project/project.controller.js";
import { authMiddleware, authorize } from "../middleware/auth.middleware.js";
import { validate, validateParams, validateQuery } from "../middleware/validate.middleware.js";
import {
  createProjectSchema,
  updateProjectSchema,
  listProjectQuerySchema,
  projectIdParamSchema,
} from "../modules/project/project.validation.js";

const router = Router();

router.get(
  "/",
  /*
    #swagger.tags = ['Project']
    #swagger.summary = 'List projects'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.parameters['page'] = { in: 'query', type: 'integer', default: 1 }
    #swagger.parameters['limit'] = { in: 'query', type: 'integer', default: 10 }
    #swagger.parameters['search'] = { in: 'query', type: 'string' }
    #swagger.parameters['status'] = { in: 'query', schema: { type: 'string', enum: ['open', 'closed', 'target_achieved', 'cancelled'] } }
    #swagger.parameters['company_id'] = { in: 'query', type: 'string', format: 'uuid' }
    #swagger.responses[200] = { description: 'Project list', schema: { $ref: '#/components/schemas/ListProjectsResponse' } }
  */
  authMiddleware, authorize("projects", "read", ["any"]),
  validateQuery(listProjectQuerySchema), projectController.list,
);

router.get(
  "/:id",
  /*
    #swagger.tags = ['Project']
    #swagger.summary = 'Get project by ID'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.parameters['id'] = { in: 'path', required: true, type: 'string', format: 'uuid' }
    #swagger.responses[200] = { description: 'Project detail', schema: { $ref: '#/components/schemas/ProjectResponse' } }
    #swagger.responses[404] = { description: 'Project not found' }
  */
  authMiddleware, authorize("projects", "read", ["any"]),
  validateParams(projectIdParamSchema), projectController.getById,
);

router.post(
  "/",
  /*
    #swagger.tags = ['Project']
    #swagger.summary = 'Create project'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: '#/components/schemas/CreateProjectRequest' } } } }
    #swagger.responses[201] = { description: 'Project created', schema: { $ref: '#/components/schemas/ProjectResponse' } }
    #swagger.responses[404] = { description: 'Company not found' }
    #swagger.responses[409] = { description: 'project_key already used' }
  */
  authMiddleware, authorize("projects", "create", ["any"]),
  validate(createProjectSchema), projectController.create,
);

router.put(
  "/:id",
  /*
    #swagger.tags = ['Project']
    #swagger.summary = 'Update project'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.parameters['id'] = { in: 'path', required: true, type: 'string', format: 'uuid' }
    #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: '#/components/schemas/UpdateProjectRequest' } } } }
    #swagger.responses[200] = { description: 'Project updated', schema: { $ref: '#/components/schemas/ProjectResponse' } }
    #swagger.responses[404] = { description: 'Project not found' }
  */
  authMiddleware, authorize("projects", "update", ["any"]),
  validateParams(projectIdParamSchema), validate(updateProjectSchema), projectController.update,
);

router.delete(
  "/:id",
  /*
    #swagger.tags = ['Project']
    #swagger.summary = 'Delete project'
    #swagger.description = 'Menghapus project beserta seluruh dokumennya (object storage dan database).'
    #swagger.security = [{ "cookieAuth": [] }]
    #swagger.parameters['id'] = { in: 'path', required: true, type: 'string', format: 'uuid' }
    #swagger.responses[200] = { description: 'Project deleted' }
    #swagger.responses[404] = { description: 'Project not found' }
  */
  authMiddleware, authorize("projects", "delete", ["any"]),
  validateParams(projectIdParamSchema), projectController.remove,
);

export default router;
