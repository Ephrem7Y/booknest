import { SignJWT, jwtVerify } from "jose";

import { env } from "../config/env.js";
import type { users } from "../db/schema.js";

// The role type comes straight from the users table, so it can never drift from the schema.
export type UserRole = (typeof users.$inferSelect)["role"];

// The identity we extract from a verified token.
export type AuthenticatedUser = {
  id: number;
  role: UserRole;
};

// jose wants the secret as bytes, not as a string. We convert it once, when the module loads.
const secretKey = new TextEncoder().encode(env.JWT_SECRET);

// Creates a signed access token for a user who has just logged in.
export async function signAccessToken(
  user: AuthenticatedUser,
): Promise<string> {
  return new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setIssuer(env.JWT_ISSUER)
    .setIssuedAt()
    .setExpirationTime(env.JWT_EXPIRES_IN)
    .sign(secretKey);
}

// Checks a token and returns the identity inside it. Throws if anything is wrong.
export async function verifyAccessToken(
  token: string,
): Promise<AuthenticatedUser> {
  const { payload } = await jwtVerify(token, secretKey, {
    // Accept only the algorithm we sign with.
    algorithms: ["HS256"],
    // Reject tokens that came from somewhere else.
    issuer: env.JWT_ISSUER,
    // A validly signed token with no "exp" would never expire, so we insist on both claims.
    requiredClaims: ["sub", "exp"],
  });

  // The signature proves nobody changed the payload, but we still check its shape.
  const id = Number(payload.sub);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Token subject is not a valid user id.");
  }

  const role = payload.role;
  if (role !== "customer" && role !== "admin") {
    throw new Error("Token role is not valid.");
  }

  return { id, role };
}
