import { getUserById } from "../services/auth.service.js";
import { AppError } from "../utils/app-error.js";
import { catchAsync } from "../utils/catch-async.js";
import type { AuthenticatedUser, UserRole } from "../utils/jwt.js";

// Creates middleware that only lets users with one of the allowed roles continue.
// It must run AFTER authenticate.
export function requireRole(...allowedRoles: UserRole[]) {
  return catchAsync(async (_req, res, next) => {
    const tokenUser = res.locals.user as AuthenticatedUser | undefined;
    // If authenticate did not run before us, fail closed instead of letting the request through.
    if (!tokenUser) {
      throw new AppError("Authentication required.", 401);
    }
    // The token's role may be stale, so ask the database for the current one.
    const currentUser = await getUserById(tokenUser.id);
    if (!allowedRoles.includes(currentUser.role)) {
      throw new AppError(
        "You do not have permission to perform this action.",
        403,
      );
    }
    // From here on, handlers see the fresh database role, not the one frozen in the token.
    const verifiedUser: AuthenticatedUser = {
      id: currentUser.id,
      role: currentUser.role,
    };
    res.locals.user = verifiedUser;
    next();
  });
}
