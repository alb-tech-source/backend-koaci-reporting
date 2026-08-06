import { z } from "zod";
import {
  listActivityLogQuerySchema,
  activityIdParamSchema,
  activityActionSchema,
} from "../../types/activityLog.types.js";

/**
 * Activity Log Validation Schemas
 * Semua validation schemas untuk activity log module
 */

/**
 * List Activity Log Query Schema
 * Untuk validasi query parameter saat mengambil list activity logs
 */
export { listActivityLogQuerySchema };

/**
 * Activity ID Parameter Schema
 * Untuk validasi activity ID di URL parameter
 */
export { activityIdParamSchema };

/**
 * Activity Action Schema
 * Untuk validasi activity action type
 */
export { activityActionSchema };

/**
 * Create Activity Log Schema (Internal)
 * Untuk validasi saat membuat activity log baru
 * Biasanya digunakan internally oleh service
 */
export const createActivityLogSchema = z.object({
  userId: z.string().uuid("Format user ID tidak valid"),
  action: activityActionSchema,
  entityType: z.string().min(1, "Entity type harus diisi"),
  entityId: z.string().min(1, "Entity ID harus diisi"),
  description: z.string().min(1, "Description harus diisi").max(500, "Description maksimal 500 karakter"),
  metadata: z.any().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().max(500).optional(),
});

/**
 * Activity Statistics Query Schema
 * Untuk validasi query parameter saat mengambil statistics
 */
export const activityStatsQuerySchema = z.object({
  userId: z.string().uuid().optional(),
  action: activityActionSchema.optional(),
  entityType: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

/**
 * Date Range Schema untuk filtering
 */
export const dateRangeSchema = z.object({
  startDate: z.string().datetime("Format start date tidak valid. Gunakan ISO 8601").optional(),
  endDate: z.string().datetime("Format end date tidak valid. Gunakan ISO 8601").optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return start <= end;
    }
    return true;
  },
  {
    message: "Start date harus lebih kecil atau sama dengan end date",
  }
);

/**
 * Export semua schemas untuk digunakan di module lain
 */
export const activityLogValidation = {
  listActivityLogQuerySchema,
  activityIdParamSchema,
  activityActionSchema,
  createActivityLogSchema,
  activityStatsQuerySchema,
  dateRangeSchema,
};
