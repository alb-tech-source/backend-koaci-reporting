import { z } from "zod";
import {
  createUserSchema,
  updateUserSchema,
  listUserQuerySchema,
} from "../modules/user/user.validation.js";

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ListUserQuery = z.infer<typeof listUserQuerySchema>;

export interface SafeUser {
  user_id: string;
  firstname: string | null;
  lastname: string | null;
  email: string;
  is_active: boolean;
  last_login_at: Date | null;
  createdAt: Date;
  updatedAt: Date;
  role?: {
    role_id: string;
    role_name: string;
    rolePermissions?: Array<{
      permission_id: string;
      permission: {
        permission_id: string;
        permission_key: string;
      };
    }>;
  } | null;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
