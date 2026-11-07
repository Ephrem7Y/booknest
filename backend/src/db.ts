import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "./db/schema.js";

// Create a pool of reusable MySQL connections.
const pool = mysql.createPool({
  host: process.env.DB_HOST ?? "mysql",
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? "booknest",
  password: process.env.DB_PASSWORD ?? "booknestpassword",
  database: process.env.DB_NAME ?? "booknest",
  connectionLimit: 10,
});

// Initialize Drizzle ORM using our MySQL pool and schema.
const db = drizzle({
  client: pool,
  schema,
  mode: "default",
});

export default db;
