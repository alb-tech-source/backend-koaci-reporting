import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { ApiError } from "../utils/apiError.js";

export const validate = (schema: z.Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const message = result.error.issues
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join(", ");
      return next(new ApiError(400, message));
    }

    req.body = result.data;
    next();
  };
};

export const validateQuery = (schema: z.Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const message = result.error.issues
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join(", ");
      return next(new ApiError(400, message));
    }

    Object.assign(req.query, result.data);
    (req as any).validatedQuery = result.data;
    next();
  };
};

export function validateParams(schema: z.Schema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      const message = result.error.issues
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join(", ");
      return next(new ApiError(400, message));
    }

    req.params = result.data as any;
    next();
  };
}
