import multer from "multer";
import { env } from "../config/env.js";

export const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
};

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;

  let message = err.message || "Internal server error";

  if (err instanceof multer.MulterError) {
    const statusCode = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;

    return res.status(statusCode).json({
      success: false,

      message:
        err.code === "LIMIT_FILE_SIZE"
          ? "Each image must be 8 MB or smaller"
          : err.message,
    });
  }

  if (err.code === 11000) {
    statusCode = 409;

    message = "A record with this value already exists";
  }

  if (statusCode >= 500 && env.NODE_ENV === "production") {
    message = "Internal server error";
  }

  const response = {
    success: false,
    message,
  };

  if (err.details) {
    response.details = err.details;
  }

  if (env.NODE_ENV === "development") {
    response.error = err.message;

    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};
