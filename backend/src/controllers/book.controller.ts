import type { Request, Response } from "express";

import {
  getAllBooks,
  createBook as createBookRecord,
  updateBook as updateBookRecord,
  deleteBook as deleteBookRecord,
} from "../services/book.service.js";

import { AppError } from "../utils/app-error.js";
import { catchAsync } from "../utils/catch-async.js";

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
export const getBooks = catchAsync(async (_req, res) => {
  const allBooks = await getAllBooks();

  return res.status(200).json({
    message: "Books retrieved successfully!",
    totalBooks: allBooks.length,
    books: allBooks,
  });
});

// POST /books
export const createBook = catchAsync(async (req, res) => {
  const { title, description, price } = req.body ?? {};

  if (
    typeof title !== "string" ||
    title.trim() === "" ||
    !isValidPrice(price)
  ) {
    throw new AppError(
      "A valid title and non-negative price are required.",
      400,
    );
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
});

// PUT /books/:id
export const updateBook = catchAsync(async (req, res) => {
  const bookId = Number(req.params.id);
  const { title, price } = req.body ?? {};

  if (
    !Number.isInteger(bookId) ||
    bookId <= 0 ||
    (title !== undefined &&
      (typeof title !== "string" || title.trim() === "")) ||
    (price !== undefined && !isValidPrice(price))
  ) {
    throw new AppError("Invalid book ID, title, or price.", 400);
  }

  if (title === undefined && price === undefined) {
    throw new AppError("Provide at least one field to update.", 400);
  }

  const updates: { title?: string; price?: string } = {};

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
});

// DELETE /books/:id
export const deleteBook = catchAsync(async (req, res) => {
  const bookId = Number(req.params.id);

  if (!Number.isInteger(bookId) || bookId <= 0) {
    throw new AppError("Invalid book ID.", 400);
  }

  const affectedRows = await deleteBookRecord(bookId);

  if (affectedRows === 0) {
    throw new AppError("Book not found.", 404);
  }

  return res.status(200).json({
    message: "Book deleted successfully!",
  });
});
