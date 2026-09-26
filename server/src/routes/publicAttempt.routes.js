import express from "express";

import { rateLimit } from "express-rate-limit";

import {
  getAttemptResult,
  getAttemptState,
  saveAttemptAnswers,
  submitAttempt,
} from "../controllers/attempt.controller.js";

import { validateBody } from "../middleware/validate.middleware.js";

import { saveAnswersSchema } from "../validators/attempt.validator.js";

const router = express.Router();

const attemptApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  limit: 300,

  standardHeaders: "draft-7",

  legacyHeaders: false,

  message: {
    success: false,

    message: "Too many attempt requests. Please try again shortly.",
  },
});

router.use(attemptApiLimiter);

router.get("/:attemptId", getAttemptState);

router.patch(
  "/:attemptId/answers",
  validateBody(saveAnswersSchema),
  saveAttemptAnswers,
);

router.post("/:attemptId/submit", submitAttempt);

router.get("/:attemptId/result", getAttemptResult);

export default router;
