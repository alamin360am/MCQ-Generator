import express from "express";

import { rateLimit } from "express-rate-limit";

import { getPublicExam } from "../controllers/exam.controller.js";

import { startAttempt } from "../controllers/attempt.controller.js";

import { optionalAuth } from "../middleware/auth.middleware.js";

import { validateBody } from "../middleware/validate.middleware.js";

import { startAttemptSchema } from "../validators/attempt.validator.js";

const router = express.Router();

const publicExamLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  limit: 300,

  standardHeaders: "draft-7",

  legacyHeaders: false,

  message: {
    success: false,

    message: "Too many requests. Please try again later.",
  },
});

const startAttemptLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,

  limit: 30,

  standardHeaders: "draft-7",

  legacyHeaders: false,

  message: {
    success: false,

    message: "Too many exam attempts. Please try again later.",
  },
});

router.use(publicExamLimiter);

router.get("/:shareId", getPublicExam);

router.post(
  "/:shareId/attempts",
  startAttemptLimiter,
  optionalAuth,
  validateBody(startAttemptSchema),
  startAttempt,
);

export default router;
