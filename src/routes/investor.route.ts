import { Router } from "express";
import { investorController } from "../modules/investor/investor.controller.js";
import {
  authMiddleware,
  requirePermission,
} from "../middleware/auth.middleware.js";
import {
  validate,
  validateQuery,
  validateParams,
} from "../middleware/validate.middleware.js";
import {
  createInvestorSchema,
  updateInvestorSchema,
  listInvestorQuerySchema,
  investorIdParamSchema,
  userIdParamSchema,
} from "../modules/investor/investor.validation.js";

const router = Router();

// List all investors with pagination and filters
router.get(
  "/",
  /*
    #swagger.tags = ['Investor']
    #swagger.summary = 'List all investors with pagination and filters'
    #swagger.description = 'Get list of investors with pagination support. Admin and above can see all investors, while investors can only see their own data.'
    #swagger.security = [{ "bearerAuth": [] }]
    #swagger.parameters['page'] = { description: 'Page number', type: 'number', default: 1 }
    #swagger.parameters['limit'] = { description: 'Items per page (max 100)', type: 'number', default: 10 }
    #swagger.parameters['search'] = { description: 'Search by full_name, email, or NIK', type: 'string' }
    #swagger.parameters['investor_type'] = { description: 'Filter by investor type', schema: { type: 'string', enum: ['individual', 'corporation'] } }
    #swagger.parameters['status'] = { description: 'Filter by status', schema: { type: 'string', enum: ['active', 'inactive', 'blacklist'] } }
    #swagger.parameters['gender'] = { description: 'Filter by gender', schema: { type: 'string', enum: ['men', 'women'] } }
  */
  authMiddleware,
  requirePermission(["investors:read_all", "investors:read_own"]),
  validateQuery(listInvestorQuerySchema),
  investorController.list,
);

// Get investor by ID
router.get(
  "/:id",
  /*
    #swagger.tags = ['Investor']
    #swagger.summary = 'Get investor by ID'
    #swagger.description = 'Get detailed investor information by investor_id. Requires investors:read or investors:read_own permission.'
    #swagger.security = [{ "bearerAuth": [] }]
    #swagger.parameters['id'] = {
      description: 'Investor ID (UUID)',
      required: true,
      type: 'string',
      format: 'uuid'
    }
    #swagger.responses[200] = {
      description: 'Investor found',
      schema: { $ref: '#/components/schemas/InvestorResponse' }
    }
  */
  authMiddleware,
  requirePermission(["investors:read", "investors:read_own"]),
  validateParams(investorIdParamSchema),
  investorController.getById,
);

// Get investor by user ID
router.get(
  "/user/:userId",
  /*
    #swagger.tags = ['Investor']
    #swagger.summary = 'Get investor by user ID'
    #swagger.description = 'Get investor profile by user_id. Useful for getting current user investor profile.'
    #swagger.security = [{ "bearerAuth": [] }]
    #swagger.parameters['userId'] = {
      description: 'User ID (UUID)',
      required: true,
      type: 'string',
      format: 'uuid'
    }
  */
  authMiddleware,
  requirePermission(["investors:read", "investors:read_own"]),
  validateParams(userIdParamSchema), // Using same UUID validation
  investorController.getByUserId,
);

// Create new investor
router.post(
  "/",
  /*
    #swagger.tags = ['Investor']
    #swagger.summary = 'Create new investor'
    #swagger.description = 'Create a new investor profile. Automatically assigns "investor" role to the user (if user role was "user" or no role).'
    #swagger.security = [{ "bearerAuth": [] }]
    #swagger.requestBody = {
      required: true,
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/CreateInvestorRequest" }
        }
      }
    }
    #swagger.responses[201] = {
      description: 'Investor created successfully',
      schema: { $ref: '#/components/schemas/InvestorResponse' }
    }
  */
  authMiddleware,
  requirePermission(["investors:create"]),
  validate(createInvestorSchema),
  investorController.create,
);

// Update investor by ID
router.put(
  "/:id",
  /*
    #swagger.tags = ['Investor']
    #swagger.summary = 'Update investor by ID'
    #swagger.description = 'Update investor information. All fields are optional (partial update).'
    #swagger.security = [{ "bearerAuth": [] }]
    #swagger.parameters['id'] = {
      description: 'Investor ID (UUID)',
      required: true,
      type: 'string',
      format: 'uuid'
    }
    #swagger.requestBody = {
      required: true,
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/UpdateInvestorRequest" }
        }
      }
    }
    #swagger.responses[200] = {
      description: 'Investor updated successfully',
      schema: { $ref: '#/components/schemas/InvestorResponse' }
    }
  */
  authMiddleware,
  requirePermission(["investors:update"]),
  validateParams(investorIdParamSchema),
  validate(updateInvestorSchema),
  investorController.update,
);

// Update investor status
router.patch(
  "/:id/status",
  /*
    #swagger.tags = ['Investor']
    #swagger.summary = 'Update investor status'
    #swagger.description = 'Update investor status (active/inactive/blacklist). Only admin and above can change status.'
    #swagger.security = [{ "bearerAuth": [] }]
    #swagger.parameters['id'] = {
      description: 'Investor ID (UUID)',
      required: true,
      type: 'string',
      format: 'uuid'
    }
    #swagger.requestBody = {
      required: true,
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/UpdateInvestorStatusRequest" }
        }
      }
    }
  */
  authMiddleware,
  requirePermission(["investors:update_status"]),
  validateParams(investorIdParamSchema),
  investorController.updateStatus,
);

// Delete investor by ID
router.delete(
  "/:id",
  /*
    #swagger.tags = ['Investor']
    #swagger.summary = 'Delete investor by ID'
    #swagger.description = 'Permanently delete investor and all related documents. This action cannot be undone.'
    #swagger.security = [{ "bearerAuth": [] }]
    #swagger.parameters['id'] = {
      description: 'Investor ID (UUID)',
      required: true,
      type: 'string',
      format: 'uuid'
    }
    #swagger.responses[200] = {
      description: 'Investor deleted successfully'
    }
  */
  authMiddleware,
  requirePermission(["investors:delete"]),
  validateParams(investorIdParamSchema),
  investorController.remove,
);

export default router;
