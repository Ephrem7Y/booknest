import { z } from "zod";

// Define the environment variables our backend uses.
const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),

  DB_HOST: z.string().trim().min(1).default("mysql"),
  DB_PORT: z.coerce.number().int().positive().default(3306),
  DB_USER: z.string().trim().min(1).default("booknest"),
  DB_PASSWORD: z.string().min(1).default("booknestpassword"),
  DB_NAME: z.string().trim().min(1).default("booknest"),

  // Secret used to sign JWTs. There is deliberately NO default value:
  // if it is missing or too short, the app must refuse to start.
  JWT_SECRET: z.string().min(32),

  // How long an access token stays valid: a number plus s, m, h or d (e.g. 30s, 15m, 1h, 7d).
  JWT_EXPIRES_IN: z
    .string()
    .trim()
    .regex(/^\d+[smhd]$/, "must look like 30s, 15m, 1h or 7d")
    .default("15m"),

  // The "iss" (issuer) claim: who created the token.
  JWT_ISSUER: z.string().trim().min(1).default("booknest"),
});

// Read and validate environment variables.
export const env = envSchema.parse(process.env);
