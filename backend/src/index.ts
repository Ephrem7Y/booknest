import express from "express";
import pool from "./db.js";

const app = express();

const PORT = 3000;

app.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT DATABASE() AS database_name");

    res.json({
      message: "Welcome to BookNest! how u doin? Can you hear me? Finally",
      database: rows,
    });
  } catch (error) {
    console.error("Database connection failed:", error);

    res.status(500).json({
      message: "Database connection failed",
    });
  }
});

app.listen(PORT, () => {
  console.log(`BookNest backend running on port ${PORT}`);
});