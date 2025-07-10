// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  console.error("Caught an error:", err.message);
  console.error(err.stack); // Log the stack trace for debugging

  const statusCode = err.statusCode || 500;
  const message = err.message || "An unexpected error occurred.";

  res.status(statusCode).json({
    message: message,
    error: process.env.NODE_ENV === "production" ? null : err.stack, // Send stack trace only in dev
  });
};

module.exports = errorHandler;
