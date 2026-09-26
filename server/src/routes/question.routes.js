import express from "express";

import {
  bulkImportQuestions,
  createQuestion,
  deleteQuestion,
  getQuestion,
  getQuestions,
  toggleBookmark,
  updateQuestion,
} from "../controllers/question.controller.js";

import { protect } from "../middleware/auth.middleware.js";

import { validateBody } from "../middleware/validate.middleware.js";

import {
  bulkImportQuestionSchema,
  createQuestionSchema,
  updateQuestionSchema,
} from "../validators/question.validator.js";

import { rateLimit } from "express-rate-limit";

const bulkImportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  limit: 30,

  standardHeaders: "draft-7",

  legacyHeaders: false,

  message: {
    success: false,

    message: "Too many bulk import requests. Please try again later.",
  },
});

const router = express.Router();

router.use(protect);

router.post(
  "/bulk-import",
  bulkImportLimiter,
  validateBody(bulkImportQuestionSchema),
  bulkImportQuestions,
);

router
  .route("/")
  .get(getQuestions)
  .post(validateBody(createQuestionSchema), createQuestion);

router.patch("/:id/bookmark", toggleBookmark);

router
  .route("/:id")
  .get(getQuestion)
  .patch(validateBody(updateQuestionSchema), updateQuestion)
  .delete(deleteQuestion);

export default router;
