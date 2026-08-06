import type { Response, Request } from "express";
import { activityLogService } from "./activityLog.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { ApiError } from "../../utils/apiError.js";
import type { ListActivityLogQueryInput, ActivityIdParam } from "../../types/activityLog.types.js";

/**
 * Activity Log Controller
 * Controller untuk activity monitoring endpoints
 * Semua endpoints hanya accessible oleh BOD role
 */

export const activityLogController = {
  /**
   * Get all activity logs dengan pagination dan filters
   * GET /api/activity-logs
   * Access: BOD only
   */
  list: asyncHandler(async (req: Request, res: Response) => {
    // Parse query parameters
    const query: ListActivityLogQueryInput = {
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      userId: req.query.userId as string | undefined,
      action: req.query.action as any,
      entityType: req.query.entityType as string | undefined,
      entityId: req.query.entityId as string | undefined,
      startDate: req.query.startDate ? (req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? (req.query.endDate as string) : undefined,
      search: req.query.search as string | undefined,
    };

    const result = await activityLogService.getActivities({
      ...query,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
    });
    return ApiResponse(res, 200, result.data, result.meta);
  }),

  /**
   * Get activity log detail by ID
   * GET /api/activity-logs/:id
   * Access: BOD only
   */
  getById: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as ActivityIdParam;

    const activity = await activityLogService.getActivityById(id);

    if (!activity) {
      throw new ApiError(404, "Activity log tidak ditemukan");
    }

    return ApiResponse(res, 200, activity);
  }),

  /**
   * Get activity statistics untuk dashboard
   * GET /api/activity-logs/stats
   * Access: BOD only
   */
  getStats: asyncHandler(async (req: Request, res: Response) => {
    // Parse optional filters
    const filters = {
      userId: req.query.userId as string | undefined,
      action: req.query.action as any,
      entityType: req.query.entityType as string | undefined,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
    };

    const stats = await activityLogService.getActivityStats(filters);
    return ApiResponse(res, 200, stats);
  }),

  /**
   * Get recent activities (shortcut untuk dashboard)
   * GET /api/activity-logs/recent
   * Access: BOD only
   */
  getRecent: asyncHandler(async (req: Request, res: Response) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    const result = await activityLogService.getActivities({
      limit: Math.min(limit, 50), // Max 50
      page: 1,
    });

    return ApiResponse(res, 200, result.data);
  }),

  /**
   * Get activities by specific user
   * GET /api/activity-logs/user/:userId
   * Access: BOD only
   */
  getByUser: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    const result = await activityLogService.getActivities({
      userId: Array.isArray(userId) ? userId[0] : userId,
      page,
      limit,
    });

    return ApiResponse(res, 200, result.data, result.meta);
  }),

  /**
   * Get activities by entity
   * GET /api/activity-logs/entity/:entityType/:entityId
   * Access: BOD only
   */
  getByEntity: asyncHandler(async (req: Request, res: Response) => {
    const { entityType, entityId } = req.params;
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    const result = await activityLogService.getActivities({
      entityType: Array.isArray(entityType) ? entityType[0] : entityType,
      entityId: Array.isArray(entityId) ? entityId[0] : entityId,
      page,
      limit,
    });

    return ApiResponse(res, 200, result.data, result.meta);
  }),

  /**
   * Get activities by action type
   * GET /api/activity-logs/action/:action
   * Access: BOD only
   */
  getByAction: asyncHandler(async (req: Request, res: Response) => {
    const { action } = req.params;
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    const result = await activityLogService.getActivities({
      action: action as any,
      page,
      limit,
    });

    return ApiResponse(res, 200, result.data, result.meta);
  }),
};
