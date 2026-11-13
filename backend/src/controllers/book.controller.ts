import type { Request, Response } from "express";

import {
  getAllBooks,
  createBook as createBookRecord,
  updateBook as updateBookRecord,
  deleteBook as deleteBookRecord,
} from "../services/book.service.js";

import {
  type CreateBookInput,
  type UpdateBookInput,
  type BookIdParams,
} from "../schemas/book.schema.js";

import { AppError } from "../utils/app-error.js";
import { catchAsync } from "../utils/catch-async.js";

export const getBooks = catchAsync(async (_req, res) => {
  const allBooks = await getAllBooks();

  return res.status(200).json({
    message: "Books retrieved successfully!",
    totalBooks: allBooks.length,
    books: allBooks,
  });
});

export const createBook = catchAsync(async (req, res) => {
  const { title, description, price } = req.body as CreateBookInput;

  const bookId = await createBookRecord({
    title,
    description: description ?? null,
    price: String(price),
  });

  return res.status(201).json({
    message: "Book created successfully!",
    bookId,
  });
});

export const updateBook = catchAsync(async (req, res) => {
  const bookId = (res.locals.validatedParams as BookIdParams).id;
  const { title, price } = req.body as UpdateBookInput;

  const updates: { title?: string; price?: string } = {};

  if (title !== undefined) {
    updates.title = title;
  }

  if (price !== undefined) {
    updates.price = String(price);
  }

  const affectedRows = await updateBookRecord(bookId, updates);

  return res.status(200).json({
    message: "Book update request completed.",
    affectedRows,
  });
});

export const deleteBook = catchAsync(async (_req, res) => {
  const bookId = (res.locals.validatedParams as BookIdParams).id;

  const affectedRows = await deleteBookRecord(bookId);

  if (affectedRows === 0) {
    throw new AppError("Book not found.", 404);
  }

  return res.status(200).json({
    message: "Book deleted successfully!",
  });
});
