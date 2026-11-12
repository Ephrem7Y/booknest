import type { Request, Response, NextFunction } from "express";

// Describes an asynchronous Express controller.
type AsyncController = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<unknown>;

// Wraps an asynchronous controller and forwards errors to Express.
export function catchAsync(fn: AsyncController) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}
