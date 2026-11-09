import type { Request, Response } from "express";

import {
  getAllBooks,
  createBook as createBookRecord,
  updateBook as updateBookRecord,
  deleteBook as deleteBookRecord,
} from "../services/book.service.js";

// Check whether a book price is valid.
function isValidPrice(price: unknown): boolean {
  if (typeof price !== "string" && typeof price !== "number") {
    return false;
  }

  if (typeof price === "string" && price.trim() === "") {
    return false;
  }

  const numericPrice = Number(price);

  return Number.isFinite(numericPrice) && numericPrice >= 0;
}

// GET /books
// Retrieve all books.
export async function getBooks(req: Request, res: Response) {
  try {
    const allBooks = await getAllBooks();

    return res.status(200).json({
      message: "Books retrieved successfully!",
      totalBooks: allBooks.length,
      books: allBooks,
    });
  } catch (error) {
    console.error("Book retrieval failed:", error);

    return res.status(500).json({
      message: "Failed to retrieve books.",
    });
  }
}

// POST /books
// Create a new book.
export async function createBook(req: Request, res: Response) {
  try {
    const { title, description, price } = req.body ?? {};

    if (
      typeof title !== "string" ||
      title.trim() === "" ||
      !isValidPrice(price)
    ) {
      return res.status(400).json({
        message: "A valid title and non-negative price are required.",
      });
    }

    const bookId = await createBookRecord({
      title: title.trim(),
      description: typeof description === "string" ? description : null,
      price: String(Number(price)),
    });

    return res.status(201).json({
      message: "Book created successfully!",
      bookId,
    });
  } catch (error) {
    console.error("Book creation failed:", error);

    return res.status(500).json({
      message: "Failed to create book.",
    });
  }
}

// PUT /books/:id
// Update an existing book.
export async function updateBook(req: Request, res: Response) {
  try {
    const bookId = Number(req.params.id);
    const { title, price } = req.body ?? {};

    if (
      !Number.isInteger(bookId) ||
      bookId <= 0 ||
      (title !== undefined &&
        (typeof title !== "string" || title.trim() === "")) ||
      (price !== undefined && !isValidPrice(price))
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

    if (title !== undefined) {
      updates.title = title.trim();
    }

    if (price !== undefined) {
      updates.price = String(Number(price));
    }

    const affectedRows = await updateBookRecord(bookId, updates);

    return res.status(200).json({
      message: "Book update request completed.",
      affectedRows,
    });
  } catch (error) {
    console.error("Book update failed:", error);

    return res.status(500).json({
      message: "Failed to update book.",
    });
  }
}

// DELETE /books/:id
// Delete an existing book.
export async function deleteBook(req: Request, res: Response) {
  try {
    const bookId = Number(req.params.id);

    if (!Number.isInteger(bookId) || bookId <= 0) {
      return res.status(400).json({
        message: "Invalid book ID.",
      });
    }

    const affectedRows = await deleteBookRecord(bookId);

    if (affectedRows === 0) {
      return res.status(404).json({
        message: "Book not found.",
      });
    }

    return res.status(200).json({
      message: "Book deleted successfully!",
    });
  } catch (error) {
    console.error("Book deletion failed:", error);

    return res.status(500).json({
      message: "Failed to delete book.",
    });
  }
}
