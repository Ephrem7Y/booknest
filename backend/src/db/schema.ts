import {
  mysqlTable,
  int,
  varchar,
  text,
  decimal,
  date,
  timestamp,
  uniqueIndex,
  mysqlEnum,
} from "drizzle-orm/mysql-core";

// ========================================
// 1. USERS TABLE
// ========================================

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),

  name: varchar("name", { length: 100 }).notNull(),

  email: varchar("email", { length: 255 }).notNull().unique(),

  passwordHash: varchar("password_hash", { length: 255 }).notNull(),

  role: mysqlEnum("role", ["customer", "admin"]).default("customer").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),

  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// ========================================
// 2. BOOKS TABLE
// ========================================

export const books = mysqlTable("books", {
  id: int("id").autoincrement().primaryKey(),

  title: varchar("title", { length: 255 }).notNull(),

  description: text("description"),

  isbn: varchar("isbn", { length: 20 }),

  price: decimal("price", { precision: 10, scale: 2 }).notNull(),

  coverImage: varchar("cover_image", { length: 500 }),

  publishedAt: date("published_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),

  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// ========================================
// 3. AUTHORS TABLE
// ========================================

export const authors = mysqlTable("authors", {
  id: int("id").autoincrement().primaryKey(),

  name: varchar("name", { length: 150 }).notNull(),

  biography: text("biography"),

  photo: varchar("photo", { length: 500 }),

  createdAt: timestamp("created_at").defaultNow().notNull(),

  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// ========================================
// 4. CATEGORIES TABLE
// ========================================

export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),

  name: varchar("name", { length: 100 }).notNull().unique(),

  description: text("description"),

  createdAt: timestamp("created_at").defaultNow().notNull(),

  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// ========================================
// 5. BOOK_AUTHORS TABLE
// ========================================

export const bookAuthors = mysqlTable(
  "book_authors",
  {
    bookId: int("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),

    authorId: int("author_id")
      .notNull()
      .references(() => authors.id, { onDelete: "cascade" }),
  },
  (table) => [
    uniqueIndex("book_author_unique").on(table.bookId, table.authorId),
  ],
);

// ========================================
// 6. BOOK_CATEGORIES TABLE
// ========================================

export const bookCategories = mysqlTable(
  "book_categories",
  {
    bookId: int("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),

    categoryId: int("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (table) => [
    uniqueIndex("book_category_unique").on(table.bookId, table.categoryId),
  ],
);

// ========================================
// 7. CARTS TABLE
// ========================================

export const carts = mysqlTable("carts", {
  id: int("id").autoincrement().primaryKey(),

  userId: int("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),

  createdAt: timestamp("created_at").defaultNow().notNull(),

  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// ========================================
// 8. CART_ITEMS TABLE
// ========================================

export const cartItems = mysqlTable(
  "cart_items",
  {
    id: int("id").autoincrement().primaryKey(),

    cartId: int("cart_id")
      .notNull()
      .references(() => carts.id, { onDelete: "cascade" }),

    bookId: int("book_id")
      .notNull()
      .references(() => books.id),

    quantity: int("quantity").notNull().default(1),
  },
  (table) => [uniqueIndex("cart_book_unique").on(table.cartId, table.bookId)],
);

// ========================================
// 9. ORDERS TABLE
// ========================================

export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),

  userId: int("user_id")
    .notNull()
    .references(() => users.id),

  status: varchar("status", { length: 30 }).notNull().default("pending"),

  totalAmount: decimal("total_amount", {
    precision: 10,
    scale: 2,
  }).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),

  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// ========================================
// 10. ORDER_ITEMS TABLE
// ========================================

export const orderItems = mysqlTable("order_items", {
  id: int("id").autoincrement().primaryKey(),

  orderId: int("order_id")
    .notNull()
    .references(() => orders.id),

  bookId: int("book_id")
    .notNull()
    .references(() => books.id),

  quantity: int("quantity").notNull().default(1),

  unitPrice: decimal("unit_price", {
    precision: 10,
    scale: 2,
  }).notNull(),
});

// ========================================
// 11. REVIEWS TABLE
// ========================================

export const reviews = mysqlTable(
  "reviews",
  {
    id: int("id").autoincrement().primaryKey(),

    userId: int("user_id")
      .notNull()
      .references(() => users.id),

    bookId: int("book_id")
      .notNull()
      .references(() => books.id),

    rating: int("rating").notNull(),

    comment: text("comment"),

    createdAt: timestamp("created_at").defaultNow().notNull(),

    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    uniqueIndex("user_book_review_unique").on(table.userId, table.bookId),
  ],
);

// ========================================
// 12. BOOK_FILES TABLE
// ========================================

export const bookFiles = mysqlTable("book_files", {
  id: int("id").autoincrement().primaryKey(),

  bookId: int("book_id")
    .notNull()
    .references(() => books.id, { onDelete: "cascade" }),

  fileType: varchar("file_type", { length: 20 }).notNull(),

  filePath: varchar("file_path", { length: 500 }).notNull(),

  fileSize: int("file_size"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ========================================
// 13. USER_BOOKS TABLE
// ========================================

export const userBooks = mysqlTable(
  "user_books",
  {
    id: int("id").autoincrement().primaryKey(),

    userId: int("user_id")
      .notNull()
      .references(() => users.id),

    bookId: int("book_id")
      .notNull()
      .references(() => books.id),

    orderItemId: int("order_item_id").references(() => orderItems.id, {
      onDelete: "set null",
    }),

    acquiredAt: timestamp("acquired_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("user_book_unique").on(table.userId, table.bookId)],
);
