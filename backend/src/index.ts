import express from "express";
import db from "./db.js";
import { books } from "./db/schema.js";
import { eq } from "drizzle-orm";

const app = express();

app.use(express.json());

const PORT = 3000;

app.get("/", async (req, res) => {
  try {
    const allBooks = await db.select().from(books).limit(10);

    res.json({
      message: "Welcome to BookNest!",
      totalBooks: allBooks.length,
      books: allBooks,
    });
  } catch (error) {
    console.error("Database query failed:", error);

    res.status(500).json({
      message: "Database query failed",
    });
  }
});

app.post("/books", async (req, res) => {
  try {
    const { title, description, price } = req.body;

    // Basic input validation
    if (
      typeof title !== "string" ||
      title.trim() === "" ||
      (typeof price !== "string" && typeof price !== "number") ||
      !Number.isFinite(Number(price)) ||
      Number(price) < 0
    ) {
      return res.status(400).json({
        message: "A valid title and non-negative price are required.",
      });
    }

    const result = await db.insert(books).values({
      title: title.trim(),
      description: typeof description === "string" ? description : null,
      price: String(price),
    });

    res.status(201).json({
      message: "Book created successfully!",
      bookId: result[0].insertId,
    });
  } catch (error) {
    console.error("Book creation failed:", error);

    res.status(500).json({
      message: "Failed to create book.",
    });
  }
});

app.put("/books/:id", async (req, res) => {
  try {
    const bookId = Number(req.params.id);
    const { title, price } = req.body;

    if (
      !Number.isInteger(bookId) ||
      bookId <= 0 ||
      (title !== undefined &&
        (typeof title !== "string" || title.trim() === "")) ||
      (price !== undefined &&
        (!Number.isFinite(Number(price)) || Number(price) < 0))
    ) {
      return res.status(400).json({
        message: "Invalid book ID, title, or price.",
      });
    }

    if (title === undefined && price === undefined) {
      return res.status(400).json({
        message: "Provide at least one field to update.",
      });
    }

    const updates: {
      title?: string;
      price?: string;
    } = {};

    if (title !== undefined) updates.title = title.trim();
    if (price !== undefined) updates.price = String(price);

    const result = await db
      .update(books)
      .set(updates)
      .where(eq(books.id, bookId));

    res.json({
      message: "Book update request completed.",
      affectedRows: result[0].affectedRows,
    });
  } catch (error) {
    console.error("Book update failed:", error);

    res.status(500).json({
      message: "Failed to update book.",
    });
  }
});

app.delete("/books/:id", async (req, res) => {
  try {
    const bookId = Number(req.params.id);

    if (!Number.isInteger(bookId) || bookId <= 0) {
      return res.status(400).json({
        message: "Invalid book ID.",
      });
    }

    const result = await db.delete(books).where(eq(books.id, bookId));

    if (result[0].affectedRows === 0) {
      return res.status(404).json({
        message: "Book not found.",
      });
    }

    res.json({
      message: "Book deleted successfully!",
    });
  } catch (error) {
    console.error("Book deletion failed:", error);

    res.status(500).json({
      message: "Failed to delete book.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`BookNest backend running on port ${PORT}`);
});
