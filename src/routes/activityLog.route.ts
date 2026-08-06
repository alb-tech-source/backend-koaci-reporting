import { Router } from "express";
import { activityLogController } from "../modules/activityLog/activityLog.controller.js";
import { authMiddleware, requireRole } from "../middleware/auth.middleware.js";
import {
  validate,
  validateQuery,
  validateParams,
} from "../middleware/validate.middleware.js";
import {
  listActivityLogQuerySchema,
  activityIdParamSchema,
} from "../modules/activityLog/activityLog.validation.js";

const router = Router();

/**
 * Activity Log Routes
 * Semua routes hanya accessible oleh user dengan role 'bod'
 * Untuk monitoring dan audit trail purposes
 */

/**
 * Get all activity logs dengan pagination dan filters
 * @route GET /api/activity-logs
 * @access BOD
 */
router.get(
  "/",
  /*
    #swagger.tags = ['Activity Log']
    #swagger.summary = 'Get all activity logs'
    #swagger.description = 'Get all activity logs with pagination and filters. Only accessible by BOD role.'
    #swagger.security = [{ "bearerAuth": [] }]
    #swagger.parameters['page'] = { in: 'query', type: 'integer', description: 'Page number', default: 1 }
    #swagger.parameters['limit'] = { in: 'query', type: 'integer', description: 'Items per page (max 100)', default: 50 }
    #swagger.parameters['userId'] = { in: 'query', type: 'string', description: 'Filter by user ID who performed action' }
    #swagger.parameters['action'] = { in: 'query', type: 'string', enum: ['USER_CREATE', 'USER_UPDATE', 'USER_DELETE', 'INVESTOR_CREATE', 'LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT'], description: 'Filter by action type' }
    #swagger.parameters['entityType'] = { in: 'query', type: 'string', description: 'Filter by entity type (User, Investor, etc.)' }
    #swagger.parameters['entityId'] = { in: 'query', type: 'string', description: 'Filter by specific entity ID' }
    #swagger.parameters['startDate'] = { in: 'query', type: 'string', format: 'date-time', description: 'Filter by start date (ISO 8601)' }
    #swagger.parameters['endDate'] = { in: 'query', type: 'string', format: 'date-time', description: 'Filter by end date (ISO 8601)' }
    #swagger.parameters['search'] = { in: 'query', type: 'string', description: 'Search in descriptions' }
    #swagger.responses[200] = {
      description: 'Activity logs retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { type: 'array', items: { $ref: '#/components/schemas/ActivityLog' } },
          meta: { $ref: '#/components/schemas/PaginationMeta' }
        }
      }
    }
  */
  authMiddleware,
  requireRole(["bod"]),
  validateQuery(listActivityLogQuerySchema),
  activityLogController.list
);

/**
 * Get activity statistics untuk dashboard
 * @route GET /api/activity-logs/stats
 * @access BOD
 */
router.get(
  "/stats",
  /*
    #swagger.tags = ['Activity Log']
    #swagger.summary = 'Get activity statistics'
    #swagger.description = 'Get activity statistics for dashboard. Only accessible by BOD role.'
    #swagger.security = [{ "bearerAuth": [] }]
    #swagger.responses[200] = {
      description: 'Activity statistics retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              totalActivities: { type: 'integer', example: 1500 },
              byAction: { type: 'object' },
              byUser: { type: 'array', items: { type: 'object' } },
              byEntityType: { type: 'object' },
              recentActivities: { type: 'array', items: { $ref: '#/components/schemas/ActivityLog' } }
            }
          }
        }
      }
    }
  */
  authMiddleware,
  requireRole(["bod"]),
  activityLogController.getStats
);

/**
 * Get recent activities untuk dashboard
 * @route GET /api/activity-logs/recent
 * @access BOD
 */
router.get(
  "/recent",
  /*
    #swagger.tags = ['Activity Log']
    #swagger.summary = 'Get recent activities'
    #swagger.description = 'Get recent activities for dashboard. Only accessible by BOD role.'
    #swagger.security = [{ "bearerAuth": [] }]
    #swagger.parameters['limit'] = { in: 'query', type: 'integer', description: 'Number of recent activities (max 50)', default: 10 }
  */
  authMiddleware,
  requireRole(["bod"]),
  activityLogController.getRecent
);

/**
 * Get activity log detail by ID
 * @route GET /api/activity-logs/:id
 * @access BOD
 */
router.get(
  "/:id",
  /*
    #swagger.tags = ['Activity Log']
    #swagger.summary = 'Get activity log detail'
    #swagger.description = 'Get specific activity log detail by ID. Only accessible by BOD role.'
    #swagger.security = [{ "bearerAuth": [] }]
    #swagger.parameters['id'] = { description: 'Activity log ID', required: true, type: 'string', format: 'uuid' }
    #swagger.responses[200] = {
      description: 'Activity log retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { $ref: '#/components/schemas/ActivityLogDetail' }
        }
      }
    }
  */
  authMiddleware,
  requireRole(["bod"]),
  validateParams(activityIdParamSchema),
  activityLogController.getById
);

/**
 * Get activities by specific user
 * @route GET /api/activity-logs/user/:userId
 * @access BOD
 */
router.get(
  "/user/:userId",
  /*
    #swagger.tags = ['Activity Log']
    #swagger.summary = 'Get activities by user'
    #swagger.description = 'Get all activities performed by specific user. Only accessible by BOD role.'
    #swagger.security = [{ "bearerAuth": [] }]
    #swagger.parameters['userId'] = { description: 'User ID', required: true, type: 'string', format: 'uuid' }
    #swagger.parameters['page'] = { in: 'query', type: 'integer', description: 'Page number', default: 1 }
    #swagger.parameters['limit'] = { in: 'query', type: 'integer', description: 'Items per page', default: 50 }
  */
  authMiddleware,
  requireRole(["bod"]),
  activityLogController.getByUser
);

/**
 * Get activities by entity
 * @route GET /api/activity-logs/entity/:entityType/:entityId
 * @access BOD
 */
router.get(
  "/entity/:entityType/:entityId",
  /*
    #swagger.tags = ['Activity Log']
    #swagger.summary = 'Get activities by entity'
    #swagger.description = 'Get all activities related to specific entity. Only accessible by BOD role.'
    #swagger.security = [{ "bearerAuth": [] }]
    #swagger.parameters['entityType'] = { description: 'Entity type (User, Investor, etc.)', required: true, type: 'string' }
    #swagger.parameters['entityId'] = { description: 'Entity ID', required: true, type: 'string' }
    #swagger.parameters['page'] = { in: 'query', type: 'integer', description: 'Page number', default: 1 }
    #swagger.parameters['limit'] = { in: 'query', type: 'integer', description: 'Items per page', default: 50 }
  */
  authMiddleware,
  requireRole(["bod"]),
  activityLogController.getByEntity
);

/**
 * Get activities by action type
 * @route GET /api/activity-logs/action/:action
 * @access BOD
 */
router.get(
  "/action/:action",
  /*
    #swagger.tags = ['Activity Log']
    #swagger.summary = 'Get activities by action type'
    #swagger.description = 'Get all activities of specific action type. Only accessible by BOD role.'
    #swagger.security = [{ "bearerAuth": [] }]
    #swagger.parameters['action'] = { description: 'Action type', required: true, type: 'string', enum: ['USER_CREATE', 'USER_UPDATE', 'USER_DELETE', 'INVESTOR_CREATE', 'LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT'] }
    #swagger.parameters['page'] = { in: 'query', type: 'integer', description: 'Page number', default: 1 }
    #swagger.parameters['limit'] = { in: 'query', type: 'integer', description: 'Items per page', default: 50 }
  */
  authMiddleware,
  requireRole(["bod"]),
  activityLogController.getByAction
);

export default router;
