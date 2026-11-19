import { errors } from "jose";

import { AppError } from "../utils/app-error.js";
import { catchAsync } from "../utils/catch-async.js";
import { verifyAccessToken } from "../utils/jwt.js";

// Protects a route: only requests carrying a valid access token continue.
// On success, the verified identity is stored in res.locals.user.
export const authenticate = catchAsync(async (req, res, next) => {
  // Expected header: Authorization: Bearer <token>
  const parts = (req.headers.authorization ?? "").split(" ");
  const token = parts[1];

  if (parts.length !== 2 || parts[0] !== "Bearer" || !token) {
    throw new AppError("Authentication required.", 401);
  }

  try {
    res.locals.user = await verifyAccessToken(token);
  } catch (error) {
    // Expiry gets its own message so a legitimate client knows to log in again.
    if (error instanceof errors.JWTExpired) {
      throw new AppError("Token expired. Please log in again.", 401);
    }

    // Every other failure looks the same to the client.
    throw new AppError("Invalid token.", 401);
  }

  next();
});
