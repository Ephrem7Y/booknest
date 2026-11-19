import { eq } from "drizzle-orm";

import db from "../db.js";
import { users } from "../db/schema.js";
import { registerSchema } from "../schemas/auth.schema.js";
import { hashPassword } from "../utils/password.js";

// Reads everything piped into the script. The password arrives this way so it never
// appears in the command line, the process list, or the shell history.
async function readStdin(): Promise<string> {
  process.stdin.setEncoding("utf8");

  let data = "";
  for await (const chunk of process.stdin) {
    data += chunk;
  }

  // Remove a single trailing newline, if there is one.
  return data.replace(/\r?\n$/, "");
}

try {
  // Reuse the registration rules, so an admin password must meet the same policy.
  const parsed = registerSchema.safeParse({
    name: process.env.ADMIN_NAME,
    email: process.env.ADMIN_EMAIL,
    password: await readStdin(),
  });

  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    console.error("Invalid input:", message);
    process.exit(1);
  }

  const { name, email, password } = parsed.data;

  // Never silently promote an existing account. Creating an admin must be explicit.
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) {
    console.error(
      "An account with that email already exists. Nothing was changed.",
    );
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);

  const result = await db.insert(users).values({
    name,
    email,
    passwordHash,
    role: "admin",
  });

  console.log(`Admin created: id ${result[0].insertId}, email ${email}`);
  process.exit(0);
} catch (error) {
  // Print only the error's name. Database errors can contain the query values, including the hash.
  console.error(
    "Failed:",
    error instanceof Error ? error.name : "unknown error",
  );
  process.exit(1);
}
