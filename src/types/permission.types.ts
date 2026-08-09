import { z } from "zod";
import {
  createPermissionSchema,
  updatePermissionSchema,
  listPermissionQuerySchema,
} from "../modules/permission/permission.validation.js";

export type CreatePermissionInput = z.infer<typeof createPermissionSchema>;
export type UpdatePermissionInput = z.infer<typeof updatePermissionSchema>;
export type ListPermissionQuery = z.infer<typeof listPermissionQuerySchema>;

export interface SafePermission {
  permission_id: string;
  permission_key: string;
}

export interface PermissionWithRoles extends SafePermission {
  rolePermissions: Array<{
    role_id: string;
    role: {
      role_id: string;
      role_name: string;
      user: {
        user_id: string;
        email: string;
        firstname: string | null;
        lastname: string | null;
      };
    };
  }>;
}

export interface PaginatedPermissionResult {
  data: SafePermission[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
