import { eq } from "drizzle-orm";

import db from "../db.js";
import { users } from "../db/schema.js";
import type { RegisterInput } from "../schemas/auth.schema.js";
import { AppError } from "../utils/app-error.js";
import { hashPassword } from "../utils/password.js";

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
