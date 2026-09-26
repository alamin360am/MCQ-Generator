import express from "express";

import { rateLimit } from "express-rate-limit";

import {
  getPracticeHistory,
  getPracticeSession,
  getPracticeStats,
  savePracticeAnswers,
  startPractice,
  submitPractice,
} from "../controllers/practice.controller.js";

import { protect } from "../middleware/auth.middleware.js";

import { validateBody } from "../middleware/validate.middleware.js";

import {
  savePracticeAnswersSchema,
  startPracticeSchema,
} from "../validators/practice.validator.js";

const router = express.Router();

const practiceLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  limit: 300,

  standardHeaders: "draft-7",

  legacyHeaders: false,

  message: {
    success: false,

    message: "Too many practice requests. Please try again shortly.",
  },
});

router.use(protect);

router.use(practiceLimiter);

router.get("/stats", getPracticeStats);

router.get("/history", getPracticeHistory);

router.post("/sessions", validateBody(startPracticeSchema), startPractice);

router.get("/sessions/:id", getPracticeSession);

router.patch(
  "/sessions/:id/answers",
  validateBody(savePracticeAnswersSchema),
  savePracticeAnswers,
);

router.post("/sessions/:id/submit", submitPractice);

export default router;
