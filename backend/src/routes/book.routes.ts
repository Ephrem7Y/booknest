import { Router } from "express";
import {
  getBooks,
  createBook,
  updateBook,
  deleteBook,
} from "../controllers/book.controller.js";
import { authenticate } from "../middleware/authenticate.middleware.js";
import { requireRole } from "../middleware/require-role.middleware.js";
import { validateRequest } from "../middleware/validate-request.middleware.js";
import {
  createBookSchema,
  updateBookSchema,
  bookIdParamSchema,
} from "../schemas/book.schema.js";

const bookRouter = Router();
// Everything that changes the catalogue is admin-only. Authentication runs first, then the
// role check, and only then do we look at the request body.
const adminOnly = [authenticate, requireRole("admin")];

// Retrieve all books. Public: anyone can browse the catalogue.
bookRouter.get("/", getBooks);
// Create a book (admin only) after validating its request body.
bookRouter.post("/", adminOnly, validateRequest(createBookSchema), createBook);
// Update a book (admin only) after validating its ID and request body.
bookRouter.put(
  "/:id",
  adminOnly,
  validateRequest(bookIdParamSchema, "params"),
  validateRequest(updateBookSchema),
  updateBook,
);
// Delete a book (admin only) after validating its ID.
bookRouter.delete(
  "/:id",
  adminOnly,
  validateRequest(bookIdParamSchema, "params"),
  deleteBook,
);

export default bookRouter;
