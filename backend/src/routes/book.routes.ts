import { Router } from "express";

import {
  getBooks,
  createBook,
  updateBook,
  deleteBook,
} from "../controllers/book.controller.js";

import { validateRequest } from "../middleware/validate-request.middleware.js";

import {
  createBookSchema,
  updateBookSchema,
  bookIdParamSchema,
} from "../schemas/book.schema.js";

const bookRouter = Router();

// Retrieve all books.
bookRouter.get("/", getBooks);

// Create a book after validating its request body.
bookRouter.post("/", validateRequest(createBookSchema), createBook);

// Update a book after validating its ID and request body.
bookRouter.put(
  "/:id",
  validateRequest(bookIdParamSchema, "params"),
  validateRequest(updateBookSchema),
  updateBook,
);

// Delete a book after validating its ID.
bookRouter.delete(
  "/:id",
  validateRequest(bookIdParamSchema, "params"),
  deleteBook,
);

export default bookRouter;
