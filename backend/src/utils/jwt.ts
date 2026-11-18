import { SignJWT } from "jose";
import { env } from "../config/env.js";
import type { users } from "../db/schema.js";

// The role type comes straight from the users table, so it can never drift from the schema.
export type UserRole = (typeof users.$inferSelect)["role"];
// jose wants the secret as bytes, not as a string. We convert it once, when the module loads.
const secretKey = new TextEncoder().encode(env.JWT_SECRET);

// Creates a signed access token for a user who has just logged in.
export async function signAccessToken(user: {
  id: number;
  role: UserRole;
}): Promise<string> {
  return new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setIssuer(env.JWT_ISSUER)
    .setIssuedAt()
    .setExpirationTime(env.JWT_EXPIRES_IN)
    .sign(secretKey);
}
