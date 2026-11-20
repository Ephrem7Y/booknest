import express from "express";
import { checkDatabaseConnection } from "./db.js";
import { errorHandler } from "./middleware/error-handler.middleware.js";
import { notFound } from "./middleware/not-found.middleware.js";
import { requestLogger } from "./middleware/request-logger.middleware.js";
import authRouter from "./routes/auth.routes.js";
import bookRouter from "./routes/book.routes.js";

// Builds the Express application. It does NOT start listening, so tests can import it.
const app = express();
// Parse incoming JSON request bodies and make them available through req.body.
app.use(express.json());
app.use(requestLogger);

// Health check endpoint.
app.get("/", async (_req, res) => {
  const databaseHealthy = await checkDatabaseConnection();
  return res.status(databaseHealthy ? 200 : 503).json({
    message: "Welcome to BookNest API!",
    status: databaseHealthy ? "healthy" : "unhealthy",
    database: databaseHealthy ? "connected" : "disconnected",
  });
});

// Express processes routes in the order they are registered, so the order matters.
app.use("/books", bookRouter);
app.use("/auth", authRouter);
app.use(notFound);
app.use(errorHandler);

export default app;
