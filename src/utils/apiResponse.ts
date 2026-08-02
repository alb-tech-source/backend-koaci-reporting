import type { Response } from "express";

// Custom replacer function to handle BigInt serialization
const bigintReplacer = (_key: string, value: any) => {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
};

export const ApiResponse = function (
  res: Response,
  code: number,
  data: any,
  meta?: any,
) {
  const response: any = {
    success: true,
    data: data,
  };

  if (meta) {
    response.meta = meta;
  }

  // Use JSON.stringify with the bigint replacer, then parse back to object
  const serialized = JSON.stringify(response, bigintReplacer);
  return res.status(code).send(JSON.parse(serialized));
};
