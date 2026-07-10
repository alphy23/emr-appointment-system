const ApiError = require("../utils/ApiError");

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid resource ID";
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
  }

  // Duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    message = `Duplicate value for field: ${Object.keys(err.keyValue)}`;
  }

  console.error(`[ERROR] ${statusCode} - ${message}`);

  res.status(statusCode).json({
    success: false,
    message,
    data: {},
    meta: process.env.NODE_ENV === "development" ? { stack: err.stack } : {},
  });
};

module.exports = errorHandler;