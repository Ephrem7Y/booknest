import type { Request, Response, NextFunction } from "express";

import { AppError } from "../utils/app-error.js";

// Handles requests that do not match any registered route.
export function notFound(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found.`, 404));
}
