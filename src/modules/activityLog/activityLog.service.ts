import prisma from "../../lib/prisma.js";
import type {
  ActivityLogInput,
  ListActivityLogQuery,
  ActivityLogResponse,
  ActivityStats,
  ActivityPriority,
} from "../../types/activityLog.types.js";

/**
 * Activity Log Service
 * Service untuk mengelola activity logs - logging, querying, dan statistics
 */

/**
 * Priority level untuk setiap action type
 * Menentukan berapa lama log harus disimpan
 */
const LOG_PRIORITY: Record<string, ActivityPriority> = {
  // Critical - 1 tahun
  USER_DELETE: "CRITICAL",
  INVESTOR_DELETE: "CRITICAL",
  USER_RESET_PASSWORD: "CRITICAL",
  ROLE_CHANGE: "CRITICAL",

  // Important - 90 hari
  USER_CREATE: "IMPORTANT",
  USER_UPDATE: "IMPORTANT",
  USER_ACTIVATE: "IMPORTANT",
  USER_DEACTIVATE: "IMPORTANT",
  INVESTOR_CREATE: "IMPORTANT",
  INVESTOR_UPDATE: "IMPORTANT",
  INVESTOR_STATUS_CHANGE: "IMPORTANT",
  DOCUMENT_DELETE: "IMPORTANT",

  // Normal - 30 hari
  LOGIN_SUCCESS: "NORMAL",
  LOGOUT: "NORMAL",
  DOCUMENT_UPLOAD: "NORMAL",

  // Low - 7 hari
  LOGIN_FAILED: "LOW",
};

/**
 * Mendapatkan priority level untuk sebuah action
 */
function getLogPriority(action: string): ActivityPriority {
  return LOG_PRIORITY[action] || "NORMAL";
}

/**
 * Sanitize metadata untuk menghindari menyimpan sensitive information
 */
function sanitizeMetadata(metadata: any): any {
  if (!metadata) return undefined;

  const sanitized = { ...metadata };

  // Remove sensitive fields
  const sensitiveFields = ["password", "passwordHash", "token", "secret", "apiKey"];
  sensitiveFields.forEach((field) => {
    if (sanitized[field]) {
      sanitized[field] = "[REDACTED]";
    }
  });

  // Remove large objects/arrays untuk menghemit space
  Object.keys(sanitized).forEach((key) => {
    if (typeof sanitized[key] === "object" && sanitized[key] !== null) {
      if (Array.isArray(sanitized[key]) && sanitized[key].length > 10) {
        sanitized[key] = sanitized[key].slice(0, 10);
      }
    }
  });

  return sanitized;
}

/**
 * Compress description untuk menghemit storage
 */
function compressDescription(description: string): string {
  if (description.length > 500) {
    return description.substring(0, 497) + "...";
  }
  return description;
}

/**
 * Build where clause untuk query activity logs
 */
function buildWhereClause(filters: Omit<ListActivityLogQuery, "page" | "limit">): any {
  const where: any = {};

  if (filters.userId) {
    where.user_id = filters.userId;
  }

  if (filters.action) {
    where.action = filters.action;
  }

  if (filters.entityType) {
    where.entity_type = filters.entityType;
  }

  if (filters.entityId) {
    where.entity_id = filters.entityId;
  }

  if (filters.startDate || filters.endDate) {
    where.timestamp = {};
    if (filters.startDate) {
      where.timestamp.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      where.timestamp.lte = new Date(filters.endDate);
    }
  }

  if (filters.search) {
    where.OR = [
      { description: { contains: filters.search, mode: "insensitive" } },
      { entity_id: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  return where;
}

export const activityLogService = {
  /**
   * Log activity baru
   * @param data - Activity log input data
   * @returns Created activity log
   */
  async logActivity(data: ActivityLogInput) {
    try {
      // Sanitize metadata untuk security dan storage optimization
      const sanitizedMetadata = sanitizeMetadata(data.metadata);
      const compressedDescription = compressDescription(data.description);

      const activityLog = await prisma.activityLog.create({
        data: {
          user_id: data.userId,
          action: data.action,
          entity_type: data.entityType,
          entity_id: data.entityId,
          description: compressedDescription,
          metadata: sanitizedMetadata,
          ip_address: data.ipAddress,
          user_agent: data.userAgent,
        },
      });

      return activityLog;
    } catch (error) {
      // Jangan throw error agar tidak mengganggu main operation
      console.error("[ActivityLog] Failed to log activity:", error);
      return null;
    }
  },

  /**
   * Query activity logs dengan pagination dan filters
   * @param query - Query parameters
   * @returns Paginated activity logs dengan metadata
   */
  async getActivities(query: ListActivityLogQuery) {
    const { page = 1, limit = 50, ...filters } = query;
    const skip = (page - 1) * limit;

    const where = buildWhereClause(filters);

    try {
      const [total, activities] = await prisma.$transaction([
        prisma.activityLog.count({ where }),
        prisma.activityLog.findMany({
          where,
          skip,
          take: limit,
          orderBy: { timestamp: "desc" },
          include: {
            user: {
              select: {
                user_id: true,
                firstname: true,
                lastname: true,
                email: true,
                role: {
                  select: {
                    role_name: true,
                  },
                },
              },
            },
          },
        }),
      ]);

      return {
        data: activities as ActivityLogResponse[],
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error("[ActivityLog] Failed to query activities:", error);
      throw error;
    }
  },

  /**
   * Get activity log detail by ID
   * @param id - Activity log ID
   * @returns Activity log detail atau null jika tidak ditemukan
   */
  async getActivityById(id: string): Promise<ActivityLogResponse | null> {
    try {
      const activity = await prisma.activityLog.findUnique({
        where: { activity_id: id },
        include: {
          user: {
            select: {
              user_id: true,
              firstname: true,
              lastname: true,
              email: true,
              role: {
                select: {
                  role_name: true,
                },
              },
            },
          },
        },
      });

      return activity as ActivityLogResponse | null;
    } catch (error) {
      console.error("[ActivityLog] Failed to get activity by ID:", error);
      throw error;
    }
  },

  /**
   * Get activity statistics untuk dashboard BOD
   * @param filters - Optional filters
   * @returns Activity statistics
   */
  async getActivityStats(filters?: Omit<ListActivityLogQuery, "page" | "limit">): Promise<ActivityStats> {
    try {
      const where = filters ? buildWhereClause(filters) : {};

      // Get total count
      const totalActivities = await prisma.activityLog.count({ where });

      // Get count by action type
      const activitiesByAction = await prisma.activityLog.groupBy({
        by: ["action"],
        where,
        _count: {
          action: true,
        },
      });

      const byAction: Record<string, number> = activitiesByAction.reduce((acc, item) => {
        acc[item.action] = item._count.action;
        return acc;
      }, {} as Record<string, number>);

      // Get count by entity type
      const activitiesByEntityType = await prisma.activityLog.groupBy({
        by: ["entity_type"],
        where,
        _count: {
          entity_type: true,
        },
      });

      const byEntityType: Record<string, number> = activitiesByEntityType.reduce((acc, item) => {
        acc[item.entity_type] = item._count.entity_type;
        return acc;
      }, {} as Record<string, number>);

      // Get top users by activity count
      const activitiesByUser = await prisma.activityLog.groupBy({
        by: ["user_id"],
        where,
        _count: {
          user_id: true,
        },
        orderBy: {
          _count: {
            user_id: "desc",
          },
        },
        take: 10,
      });

      // Get user details for top users
      const userIds = activitiesByUser.map((item) => item.user_id);
      const users = await prisma.user.findMany({
        where: { user_id: { in: userIds } },
        select: {
          user_id: true,
          email: true,
          firstname: true,
          lastname: true,
        },
      });

      const byUser = activitiesByUser.map((item) => {
        const user = users.find((u) => u.user_id === item.user_id);
        return {
          userId: item.user_id,
          email: user?.email || "Unknown",
          firstname: user?.firstname || null,
          lastname: user?.lastname || null,
          count: item._count.user_id,
        };
      });

      // Get recent activities
      const recentActivities = await prisma.activityLog.findMany({
        where,
        take: 10,
        orderBy: { timestamp: "desc" },
        include: {
          user: {
            select: {
              user_id: true,
              firstname: true,
              lastname: true,
              email: true,
              role: {
                select: {
                  role_name: true,
                },
              },
            },
          },
        },
      });

      return {
        totalActivities,
        byAction: byAction as Record<string, number>,
        byUser,
        byEntityType,
        recentActivities: recentActivities as ActivityLogResponse[],
      };
    } catch (error) {
      console.error("[ActivityLog] Failed to get activity stats:", error);
      throw error;
    }
  },

  /**
   * Cleanup old activity logs berdasarkan retention policy
   * Function ini untuk dijalankan oleh cron job
   */
  async cleanupOldLogs(): Promise<{ deleted: number }> {
    try {
      const now = new Date();

      // Delete logs older than 30 days dengan NORMAL priority
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const normalLogsToDelete = await prisma.activityLog.deleteMany({
        where: {
          timestamp: { lt: thirtyDaysAgo },
          action: { in: ["LOGIN_SUCCESS", "LOGOUT", "DOCUMENT_UPLOAD"] },
        },
      });

      // Delete logs older than 7 days dengan LOW priority
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const lowLogsToDelete = await prisma.activityLog.deleteMany({
        where: {
          timestamp: { lt: sevenDaysAgo },
          action: { in: ["LOGIN_FAILED"] },
        },
      });

      const totalDeleted = normalLogsToDelete.count + lowLogsToDelete.count;

      console.log(`[ActivityLog] Cleanup completed: ${totalDeleted} logs deleted`);

      return { deleted: totalDeleted };
    } catch (error) {
      console.error("[ActivityLog] Failed to cleanup old logs:", error);
      throw error;
    }
  },

  /**
   * Mendapatkan priority level untuk sebuah action
   * @param action - Activity action type
   * @returns Priority level
   */
  getPriority(action: string): ActivityPriority {
    return getLogPriority(action);
  },

  /**
   * Helper function untuk generate description
   * @param action - Activity action
   * @param entityType - Entity type
   * @param actorEmail - Email user yang melakukan action
   * @param targetInfo - Information tentang target entity
   * @returns Human-readable description
   */
  generateDescription(
    action: string,
    entityType: string,
    actorEmail: string,
    targetInfo?: { name?: string; email?: string; id?: string }
  ): string {
    const target = targetInfo?.name || targetInfo?.email || targetInfo?.id || "unknown";

    const actionDescriptions: Record<string, string> = {
      USER_CREATE: `User ${target} berhasil dibuat oleh ${actorEmail}`,
      USER_UPDATE: `User ${target} berhasil diupdate oleh ${actorEmail}`,
      USER_DELETE: `User ${target} berhasil dihapus oleh ${actorEmail}`,
      USER_ACTIVATE: `User ${target} berhasil diaktifkan oleh ${actorEmail}`,
      USER_DEACTIVATE: `User ${target} berhasil dinonaktifkan oleh ${actorEmail}`,
      USER_RESET_PASSWORD: `Password user ${target} berhasil direset oleh ${actorEmail}`,
      INVESTOR_CREATE: `Investor ${target} berhasil dibuat oleh ${actorEmail}`,
      INVESTOR_UPDATE: `Investor ${target} berhasil diupdate oleh ${actorEmail}`,
      INVESTOR_DELETE: `Investor ${target} berhasil dihapus oleh ${actorEmail}`,
      INVESTOR_STATUS_CHANGE: `Status investor ${target} berhasil diubah oleh ${actorEmail}`,
      DOCUMENT_UPLOAD: `Dokumen berhasil diunggah oleh ${actorEmail}`,
      DOCUMENT_DELETE: `Dokumen berhasil dihapus oleh ${actorEmail}`,
      LOGIN_SUCCESS: `User ${actorEmail} berhasil login`,
      LOGIN_FAILED: `Gagal login untuk email ${target}`,
      LOGOUT: `User ${actorEmail} berhasil logout`,
      ROLE_CHANGE: `Role user ${target} berhasil diubah oleh ${actorEmail}`,
    };

    return actionDescriptions[action] || `${action} pada ${entityType} ${target} oleh ${actorEmail}`;
  },
};
