import { Router } from "express";

import {
  getBooks,
  createBook,
  updateBook,
  deleteBook,
} from "../controllers/book.controller.js";

// Create a separate router for book-related endpoints.
const bookRouter = Router();

// GET /books
bookRouter.get("/", getBooks);

// POST /books
bookRouter.post("/", createBook);

// PUT /books/:id
bookRouter.put("/:id", updateBook);

// DELETE /books/:id
bookRouter.delete("/:id", deleteBook);

export default bookRouter;
