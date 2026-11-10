import express from "express";
import bookRouter from "./routes/book.routes.js";

const app = express();

const PORT = Number(process.env.PORT ?? 3000);

// Middleware
app.use(express.json());

// Health check endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to BookNest API!",
    status: "healthy",
  });
});

// Register application routes
app.use("/books", bookRouter);

// Start the server
app.listen(PORT, () => {
  console.log(`BookNest backend running on port ${PORT}`);
});
