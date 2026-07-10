const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const ApiResponse = require("./utils/ApiResponse");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

// Core middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true, // needed since refresh token will live in httpOnly cookie
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check
app.get("/api/v1/health", (req, res) => {
  res.status(200).json(new ApiResponse(true, "API is running"));
});

app.use("/api/v1", require("./routes/v1/index"));

// 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json(new ApiResponse(false, "Route not found"));
});

// Centralized error handler — must be last
app.use(errorHandler);

module.exports = app;