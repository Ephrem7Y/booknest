import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST ?? "mysql",
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? "booknest",
  password: process.env.DB_PASSWORD ?? "booknestpassword",
  database: process.env.DB_NAME ?? "booknest",
});

export default pool;