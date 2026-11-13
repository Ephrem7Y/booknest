import { z } from "zod";

// Schema for creating a new book.
export const createBookSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().nullable().optional(),
  price: z.number().nonnegative(),
});

export type CreateBookInput = z.infer<typeof createBookSchema>;

const newBook: CreateBookInput = {
  title: "Clean Code",
  description: "A handbook of software craftsmanship",
  price: 25,
};

console.log("New book:", newBook);

// Schema for updating an existing book.
export const updateBookSchema = z
  .object({
    title: z.string().trim().min(1).optional(),
    price: z.number().nonnegative().optional(),
  })
  .refine((data) => data.title !== undefined || data.price !== undefined, {
    message: "Provide at least one field to update.",
  });

// TypeScript type inferred from the update schema.
export type UpdateBookInput = z.infer<typeof updateBookSchema>;

// Schema for validating book IDs from URL parameters.
export const bookIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// TypeScript type inferred from the book ID schema.
export type BookIdParams = z.infer<typeof bookIdParamSchema>;
