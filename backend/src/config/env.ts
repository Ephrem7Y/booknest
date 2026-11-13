import { z } from "zod";

// Define the environment variables our backend uses.
const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),

  DB_HOST: z.string().trim().min(1).default("mysql"),
  DB_PORT: z.coerce.number().int().positive().default(3306),
  DB_USER: z.string().trim().min(1).default("booknest"),
  DB_PASSWORD: z.string().min(1).default("booknestpassword"),
  DB_NAME: z.string().trim().min(1).default("booknest"),
});

// Read and validate environment variables.
export const env = envSchema.parse(process.env);
