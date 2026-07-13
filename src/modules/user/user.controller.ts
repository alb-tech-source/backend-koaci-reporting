import type { Response, Request } from "express";
import { userService } from "./user.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import type {
  CreateUserInput,
  UpdateUserInput,
  ListUserQuery,
} from "../../types/user.types.js";

export const userController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const { user, temporaryPassword } = await userService.createUser(req.body);

    return ApiResponse(res, 201, {
      user,
      temporaryPassword,
    });
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const parseValue = (v: any) => {
      if (v === "true") return true;
      if (v === "false") return false;
      if (v === "" || v === null || v === undefined) return v;
      // numeric (ints and floats)
      if (!Number.isNaN(Number(v)) && v !== null && v !== "") return Number(v);
      return v;
    };

    const parseQuery = (q: Record<string, any>): ListUserQuery => {
      const out: Record<string, any> = {};
      for (const [key, value] of Object.entries(q)) {
        if (Array.isArray(value)) out[key] = value.map(parseValue);
        else out[key] = parseValue(value);
      }
      return out as ListUserQuery;
    };

    const query = parseQuery(req.query as unknown as Record<string, any>);
    const result = await userService.listUsers(query);
    return ApiResponse(res, 200, result.data, result.meta);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.getUserById(req.params.id as string);
    return ApiResponse(res, 200, user);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.updateUser(
      req.params.id as string,
      req.body,
    );
    return ApiResponse(res, 200, user);
  }),

  changeActivation: asyncHandler(async (req: Request, res: Response) => {
    const { isActive } = req.body ? req.body : undefined;
    const user = await userService.changeUserActivation(
      req.params.id as string,
      isActive,
    );
    return ApiResponse(res, 200, user);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await userService.deleteUser(req.params.id as string);
    return ApiResponse(res, 200, "User berhasil dihapus permanen");
  }),

  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    const result = await userService.resetPasswordUser(req.params.id as string);
    return ApiResponse(res, 200, result);
  }),
};
