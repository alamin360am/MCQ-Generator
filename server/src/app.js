import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import { rateLimit } from "express-rate-limit";

import { env } from "./config/env.js";
import { isCloudinaryReady } from "./config/cloudinary.js";
import authRoutes from "./routes/auth.routes.js";
import questionRoutes from "./routes/question.routes.js";
import taxonomyRoutes from "./routes/taxonomy.routes.js";
import examRoutes from "./routes/exam.routes.js";
import publicExamRoutes from "./routes/publicExam.routes.js";
import publicAttemptRoutes from "./routes/publicAttempt.routes.js";
import practiceRoutes from "./routes/practice.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import reportRoutes from "./routes/report.routes.js";

import { notFound, errorHandler } from "./middleware/error.middleware.js";

const app = express();

app.set("trust proxy", 1);

app.disable("x-powered-by");

app.use(helmet());

app.use(compression());

const allowedOrigins = env.CORS_ORIGINS.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Server-to-server / Postman / curl requests
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      const error = new Error("Origin not allowed by CORS");

      error.statusCode = 403;

      return callback(error);
    },

    credentials: true,
  }),
);

app.use(
  express.json({
    limit: "1mb",
  }),
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb",
  }),
);

app.use(cookieParser());

app.get("/", (req, res) => {
  res.json({
    success: true,
    app: "MCQ Generator",
    message: "MCQ Generator API is running",
  });
});

app.get("/api/health", (req, res) => {
  const mongoConnected = mongoose.connection.readyState === 1;

  const cloudinaryConnected = isCloudinaryReady();

  const healthy = mongoConnected && cloudinaryConnected;

  res.status(healthy ? 200 : 503).json({
    success: healthy,

    app: "MCQ Generator",

    services: {
      api: "connected",

      mongodb: mongoConnected ? "connected" : "disconnected",

      cloudinary: cloudinaryConnected ? "connected" : "disconnected",
    },

    timestamp: new Date().toISOString(),
  });
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  limit: 500,

  standardHeaders: "draft-7",

  legacyHeaders: false,

  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

app.use("/api", apiLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/taxonomy", taxonomyRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/practice", practiceRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/public/exams", publicExamRoutes);
app.use("/api/public/attempts", publicAttemptRoutes);

app.use(notFound);

app.use(errorHandler);

export default app;
