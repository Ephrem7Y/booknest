import { argon2id, hash, verify, type HashOptions } from "argon2";

// We choose the algorithm explicitly instead of trusting a library default.
// timeCost, memoryCost and parallelism stay at the library defaults (3, 64 MiB, 4).
const HASH_OPTIONS: HashOptions = {
  type: argon2id,
};

// Turns a plaintext password into a salted Argon2id hash that is safe to store.
export async function hashPassword(plainPassword: string): Promise<string> {
  return hash(plainPassword, HASH_OPTIONS);
}

// Checks a plaintext password against a stored hash.
// Note the argument order: stored hash first, plaintext second (same as the library).
export async function verifyPassword(
  passwordHash: string,
  plainPassword: string,
): Promise<boolean> {
  return verify(passwordHash, plainPassword);
}
