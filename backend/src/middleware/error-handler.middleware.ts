import type { ErrorRequestHandler } from "express";
import { AppError } from "../utils/app-error.js";

// Safely reads a "code" property (like "ER_DUP_ENTRY" or "EAI_AGAIN") from an unknown value.
function readCode(value: unknown): unknown {
  return typeof value === "object" && value !== null && "code" in value
    ? value.code
    : undefined;
}

// Builds a log-safe summary of an unexpected error.
// We never print the error object itself: Drizzle puts the SQL query and its parameter
// values (emails, password hashes) into the error's message, params, and stack text.
function describeUnexpectedError(error: unknown) {
  if (!(error instanceof Error)) {
    return { name: "NonErrorValueThrown" };
  }

  // Keep only the stack frames (the "at ..." lines). The lines above them repeat the message.
  const frames = (error.stack ?? "")
    .split("\n")
    .filter((line) => line.trim().startsWith("at "))
    .slice(0, 6);

  return {
    name: error.name,
    code: readCode(error),
    causeCode: readCode(error.cause),
    frames,
  };
}

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

  // Log the error without exposing sensitive query data.
  if (isOperationalError) {
    // Our own AppError: its message is text we wrote, so it is safe to print.
    console.error("Error:", error);
  } else {
    console.error("Unexpected error:", describeUnexpectedError(error));
  }

  // Send a consistent JSON error response.
  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
};
