import db from "../db.js";
import { books } from "../db/schema.js";
import { eq } from "drizzle-orm";

// Retrieve all books, limited to 10 results. And use export to use this func in other files like import {getAllBooks} from "../services/book.service.js"; in other files
export async function getAllBooks() {
  return await db.select().from(books).limit(10);
}

// Create a new book.
export async function createBook(data: {
  title: string;
  description: string | null;
  price: string;
}) {
  const result = await db.insert(books).values(data);

  return result[0].insertId;
}

// Update an existing book.
export async function updateBook(
  bookId: number,
  updates: {
    title?: string;
    price?: string;
  },
) {
  const result = await db
    .update(books)
    .set(updates)
    .where(eq(books.id, bookId));

  return result[0].affectedRows;
}

// Delete a book.
export async function deleteBook(bookId: number) {
  const result = await db.delete(books).where(eq(books.id, bookId));

  return result[0].affectedRows;
}
