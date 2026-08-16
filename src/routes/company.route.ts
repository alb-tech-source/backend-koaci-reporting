import { Router } from "express";
import { companyController } from "../modules/company/company.controller.js";
import { authMiddleware, authorize } from "../middleware/auth.middleware.js";
import { validate, validateParams, validateQuery } from "../middleware/validate.middleware.js";
import {
  createCompanySchema,
  updateCompanySchema,
  listCompanyQuerySchema,
  companyIdParamSchema,
} from "../modules/company/company.validation.js";

const router = Router();

router.get(
  "/",
  /*
    #swagger.tags = ['Company']
    #swagger.summary = 'List companies'
    #swagger.security = [{ "bearerAuth": [] }]
    #swagger.parameters['page'] = { in: 'query', type: 'integer', default: 1 }
    #swagger.parameters['limit'] = { in: 'query', type: 'integer', default: 10 }
    #swagger.parameters['search'] = { in: 'query', type: 'string' }
    #swagger.parameters['company_type'] = { in: 'query', schema: { type: 'string', enum: ['PT', 'CV', 'Firma', 'Perorangan'] } }
    #swagger.parameters['status'] = { in: 'query', schema: { type: 'string', enum: ['active', 'inactive', 'blacklist'] } }
    #swagger.responses[200] = { description: 'Company list', schema: { $ref: '#/components/schemas/ListCompaniesResponse' } }
  */
  authMiddleware, authorize("companies", "read", ["any"]),
  validateQuery(listCompanyQuerySchema), companyController.list,
);

router.get(
  "/:id",
  /*
    #swagger.tags = ['Company']
    #swagger.summary = 'Get company by ID'
    #swagger.security = [{ "bearerAuth": [] }]
    #swagger.parameters['id'] = { in: 'path', required: true, type: 'string', format: 'uuid' }
    #swagger.responses[200] = { description: 'Company detail', schema: { $ref: '#/components/schemas/CompanyResponse' } }
    #swagger.responses[404] = { description: 'Company not found' }
  */
  authMiddleware, authorize("companies", "read", ["any"]),
  validateParams(companyIdParamSchema), companyController.getById,
);

router.post(
  "/",
  /*
    #swagger.tags = ['Company']
    #swagger.summary = 'Create company'
    #swagger.security = [{ "bearerAuth": [] }]
    #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: '#/components/schemas/CreateCompanyRequest' } } } }
    #swagger.responses[201] = { description: 'Company created', schema: { $ref: '#/components/schemas/CompanyResponse' } }
  */
  authMiddleware, authorize("companies", "create", ["any"]),
  validate(createCompanySchema), companyController.create,
);

router.put(
  "/:id",
  /*
    #swagger.tags = ['Company']
    #swagger.summary = 'Update company'
    #swagger.security = [{ "bearerAuth": [] }]
    #swagger.parameters['id'] = { in: 'path', required: true, type: 'string', format: 'uuid' }
    #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: '#/components/schemas/UpdateCompanyRequest' } } } }
    #swagger.responses[200] = { description: 'Company updated', schema: { $ref: '#/components/schemas/CompanyResponse' } }
  */
  authMiddleware, authorize("companies", "update", ["any"]),
  validateParams(companyIdParamSchema), validate(updateCompanySchema), companyController.update,
);

router.delete(
  "/:id",
  /*
    #swagger.tags = ['Company']
    #swagger.summary = 'Delete company'
    #swagger.security = [{ "bearerAuth": [] }]
    #swagger.parameters['id'] = { in: 'path', required: true, type: 'string', format: 'uuid' }
    #swagger.responses[200] = { description: 'Company deleted' }
  */
  authMiddleware, authorize("companies", "delete", ["any"]),
  validateParams(companyIdParamSchema), companyController.remove,
);

export default router;
