import { z } from "zod";

// Schema for public registration.
// Only these three fields are accepted. Anything else in the request body is dropped.
export const registerSchema = z.object({
  // Trim whitespace, then require 1-100 characters (matches varchar(100)).
  name: z.string().trim().min(1).max(100),
  // Normalize first (trim + lowercase), then validate the result as an email.
  // .pipe() feeds the cleaned string into the email validator, so the order is explicit.
  email: z.string().trim().toLowerCase().pipe(z.email().max(255)),
  // Deliberately NOT trimmed: spaces in a password may be intentional.
  // The upper limit stops someone from sending a huge string to waste CPU and memory.
  password: z.string().min(8).max(128),
});
// TypeScript type inferred from the registration schema.
export type RegisterInput = z.infer<typeof registerSchema>;

// Schema for login.
export const loginSchema = z.object({
  // Same normalization as registration, so the lookup matches the stored email.
  email: z.string().trim().toLowerCase().pipe(z.email().max(255)),
  // No minimum length here: the 8-character rule is a policy for NEW passwords.
  // Login only checks that something was sent, and caps the size to protect the server.
  // Like registration, the password is deliberately NOT trimmed.
  password: z.string().min(1).max(128),
});
// TypeScript type inferred from the login schema.
export type LoginInput = z.infer<typeof loginSchema>;
