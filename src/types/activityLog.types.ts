import { z } from "zod";

/**
 * Activity Action Types
 * Semua tipe aktivitas yang dapat dilacak oleh sistem
 */
export type ActivityAction =
  | "USER_CREATE"
  | "USER_UPDATE"
  | "USER_DELETE"
  | "USER_ACTIVATE"
  | "USER_DEACTIVATE"
  | "USER_RESET_PASSWORD"
  | "INVESTOR_CREATE"
  | "INVESTOR_UPDATE"
  | "INVESTOR_DELETE"
  | "INVESTOR_STATUS_CHANGE"
  | "DOCUMENT_UPLOAD"
  | "DOCUMENT_DELETE"
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "LOGOUT"
  | "ROLE_CHANGE";

/**
 * Activity Log Input
 * Data yang dibutuhkan untuk membuat activity log baru
 */
export interface ActivityLogInput {
  userId: string;
  action: ActivityAction;
  entityType: string;
  entityId: string;
  description: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * List Activity Log Query
 * Query parameters untuk mengambil list activity logs
 */
export interface ListActivityLogQuery {
  page?: number;
  limit?: number;
  userId?: string;
  action?: ActivityAction;
  entityType?: string;
  entityId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

/**
 * Activity Log Response
 * Format response activity log dengan user information
 */
export interface ActivityLogResponse {
  activity_id: string;
  user_id: string;
  action: ActivityAction;
  entity_type: string;
  entity_id: string;
  description: string;
  metadata?: any;
  ip_address: string | null;
  user_agent: string | null;
  timestamp: Date;
  user: {
    user_id: string;
    firstname: string | null;
    lastname: string | null;
    email: string;
    role: {
      role_name: string;
    } | null;
  };
}

/**
 * Activity Statistics
 * Statistik aktivitas untuk dashboard BOD
 */
export interface ActivityStats {
  totalActivities: number;
  byAction: Record<ActivityAction, number>;
  byUser: Array<{
    userId: string;
    email: string;
    firstname: string | null;
    lastname: string | null;
    count: number;
  }>;
  byEntityType: Record<string, number>;
  recentActivities: ActivityLogResponse[];
}

/**
 * Activity Priority Levels
 * Untuk menentukan retention policy
 */
export type ActivityPriority = "CRITICAL" | "IMPORTANT" | "NORMAL" | "LOW";

/**
 * Activity Metadata Schema
 * Struktur metadata yang akan disimpan
 */
export interface ActivityMetadata {
  method?: string;
  path?: string;
  changes?: {
    field?: string;
    oldValue?: any;
    newValue?: any;
  };
  affectedUser?: {
    userId?: string;
    email?: string;
  };
  reason?: string;
  [key: string]: any;
}

/**
 * Zod schema untuk activity action validation
 */
export const activityActionSchema = z.enum([
  "USER_CREATE",
  "USER_UPDATE",
  "USER_DELETE",
  "USER_ACTIVATE",
  "USER_DEACTIVATE",
  "USER_RESET_PASSWORD",
  "INVESTOR_CREATE",
  "INVESTOR_UPDATE",
  "INVESTOR_DELETE",
  "INVESTOR_STATUS_CHANGE",
  "DOCUMENT_UPLOAD",
  "DOCUMENT_DELETE",
  "LOGIN_SUCCESS",
  "LOGIN_FAILED",
  "LOGOUT",
  "ROLE_CHANGE",
]);

/**
 * Zod schema untuk list activity log query
 */
export const listActivityLogQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
  userId: z.string().uuid().optional(),
  action: activityActionSchema.optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  search: z.string().optional(),
});

/**
 * Zod schema untuk activity ID parameter
 */
export const activityIdParamSchema = z.object({
  id: z.string().uuid("Format activity ID tidak valid"),
});

/**
 * Type inference dari Zod schemas
 */
export type ListActivityLogQueryInput = z.infer<typeof listActivityLogQuerySchema>;
export type ActivityIdParam = z.infer<typeof activityIdParamSchema>;
