import type { RequestHandler } from "express";
import { z } from "zod";

import { AppError } from "../utils/app-error.js";

// Specifies which part of the request we want to validate.
type RequestTarget = "body" | "params";

// Creates reusable request validation middleware.
export function validateRequest(
  schema: z.ZodType,
  target: RequestTarget = "body",
): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req[target]);

    // If validation fails, forward the error.
    if (!result.success) {
      const message = result.error.issues
        .map((issue) => {
          const field = issue.path.join(".") || target;
          return `${field}: ${issue.message}`;
        })
        .join("; ");

      return next(new AppError(message, 400));
    }

    // Replace the request body with the validated data.
    if (target === "body") {
      req.body = result.data;
    } else {
      // Keep the validated and transformed parameters available.
      res.locals.validatedParams = result.data;
    }

    next();
  };
}
