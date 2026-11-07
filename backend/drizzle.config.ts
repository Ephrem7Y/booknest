
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  // Location of our database schema
  schema: "./src/db/schema.ts",

  // Where generated SQL migrations will be stored
  out: "./drizzle",

  // We are using MySQL
  dialect: "mysql",

  // Database connection information
  dbCredentials: {
    host: process.env.DB_HOST ?? "mysql",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? "booknest",
    password: process.env.DB_PASSWORD ?? "booknestpassword",
    database: process.env.DB_NAME ?? "booknest",
  },

  // Additional migration information
  verbose: true,
  strict: true,
});
