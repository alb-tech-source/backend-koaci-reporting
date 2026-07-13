import type { Request, Response } from "express";

export const ApiResponse = function (
  res: Response,
  code: number,
  data: any,
  meta?: any,
) {
  return res.status(code).json({
    success: true,
    data: data,
  });
};
