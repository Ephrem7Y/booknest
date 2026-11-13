import express from "express";
import { env } from "./config/env.js";
import bookRouter from "./routes/book.routes.js";
import { requestLogger } from "./middleware/request-logger.middleware.js";
import { errorHandler } from "./middleware/error-handler.middleware.js";
import { notFound } from "./middleware/not-found.middleware.js";
import { checkDatabaseConnection } from "./db.js";

const app = express();
const PORT = env.PORT;

// This is middleware that parses incoming JSON request bodies and makes the parsed data available through req.body.
app.use(express.json());
app.use(requestLogger);

// Health check endpoint
// Health check endpoint.
app.get("/", async (_req, res) => {
  const databaseHealthy = await checkDatabaseConnection();
  return res.status(databaseHealthy ? 200 : 503).json({
    message: "Welcome to BookNest API!",
    status: databaseHealthy ? "healthy" : "unhealthy",
    database: databaseHealthy ? "connected" : "disconnected",
  });
});

// Register application routes, express processes requests in the order they are registered, so the order of these calls matters.
app.use("/books", bookRouter);
app.use(notFound);
app.use(errorHandler);

// Start the server
app.listen(PORT, () => {
  console.log(`BookNest backend running on port ${PORT}`);
});
