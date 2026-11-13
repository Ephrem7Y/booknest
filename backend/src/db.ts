import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "./db/schema.js";
import { env } from "./config/env.js";

// Create a pool of reusable MySQL connections.
const pool = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  connectionLimit: 10,
});

// Initialize Drizzle ORM using our MySQL pool and schema.
const db = drizzle({
  client: pool,
  schema,
  mode: "default",
});

// Check whether MySQL is reachable.
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await pool.query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}

export default db;
