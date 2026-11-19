import { eq } from "drizzle-orm";
import { env } from "../config/env.js";
import db from "../db.js";
import { users } from "../db/schema.js";
import type { LoginInput, RegisterInput } from "../schemas/auth.schema.js";
import { AppError } from "../utils/app-error.js";
import { signAccessToken } from "../utils/jwt.js";
import { hashPassword, verifyPassword } from "../utils/password.js";

const DUPLICATE_EMAIL_MESSAGE = "Email is already registered.";
// Detects MySQL's "duplicate entry" error (code ER_DUP_ENTRY).
// Drizzle can wrap the driver's error, so we also look inside nested causes.
function isDuplicateEntryError(error: unknown): boolean {
  let current: unknown = error;
  for (let depth = 0; depth < 3; depth++) {
    if (typeof current !== "object" || current === null) {
      return false;
    }
    if ("code" in current && current.code === "ER_DUP_ENTRY") {
      return true;
    }
    current = "cause" in current ? current.cause : undefined;
  }
  return false;
}

// Creates a new customer account and returns only the safe public fields.
export async function registerUser(input: RegisterInput) {
  // Friendly pre-check: a quick lookup lets us answer 409 without paying for a hash.
  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);
  if (existingUser) {
    throw new AppError(DUPLICATE_EMAIL_MESSAGE, 409);
  }
  const passwordHash = await hashPassword(input.password);
  try {
    const result = await db.insert(users).values({
      name: input.name,
      email: input.email,
      passwordHash,
      // Set by the server, never by the client.
      role: "customer",
    });
    return {
      id: result[0].insertId,
      name: input.name,
      email: input.email,
      role: "customer" as const,
    };
  } catch (error) {
    // Safety net: two simultaneous requests can both pass the pre-check,
    // but MySQL's UNIQUE constraint lets only one insert succeed.
    if (isDuplicateEntryError(error)) {
      throw new AppError(DUPLICATE_EMAIL_MESSAGE, 409);
    }
    throw error;
  }
}

const INVALID_CREDENTIALS_MESSAGE = "Invalid email or password.";
// A real Argon2id hash of a throwaway password, created once when the module loads.
// Login verifies against it when the email does not exist, so unknown emails cost the
// same time as wrong passwords. Creating it with hashPassword keeps its settings in
// sync with ours, even if we change them later.
const DUMMY_PASSWORD_HASH = await hashPassword(
  "not-a-real-password-used-only-for-timing",
);
// Checks credentials and returns a signed token plus the safe public user fields.

export async function loginUser(input: LoginInput) {
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);
  // Always run one verification, even when the email does not exist.
  const hashToCheck = user?.passwordHash ?? DUMMY_PASSWORD_HASH;
  const passwordMatches = await verifyPassword(hashToCheck, input.password);
  // Same error and message for "no such user" and "wrong password".
  if (!user || !passwordMatches) {
    throw new AppError(INVALID_CREDENTIALS_MESSAGE, 401);
  }
  const token = await signAccessToken({ id: user.id, role: user.role });
  return {
    token,
    expiresIn: env.JWT_EXPIRES_IN,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

// Returns the current public fields of a user, or throws if the account no longer exists.
export async function getUserById(userId: number) {
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!user) {
    throw new AppError("Account no longer exists.", 401);
  }
  return user;
}
