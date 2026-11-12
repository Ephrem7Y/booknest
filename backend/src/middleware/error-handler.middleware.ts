import type { ErrorRequestHandler } from "express";
import { AppError } from "../utils/app-error.js";

// Centralized error-handling middleware.
export const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
  // If the response has already started, delegate to Express.
  if (res.headersSent) {
    return next(error);
  }

  // Determine whether this is an expected application error.
  const isOperationalError = error instanceof AppError;

  // Determine the appropriate HTTP status code.
  const statusCode = isOperationalError ? error.statusCode : 500;

  // Determine what message the client should receive.
  const message = isOperationalError ? error.message : "Internal server error.";

  // Log the original error for debugging.
  console.error("Error:", error);

  // Send a consistent JSON error response.
  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
};
