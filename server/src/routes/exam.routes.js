import express from "express";

import {
  archiveExam,
  createExam,
  deleteExam,
  getExam,
  getExams,
  publishExam,
  updateExam,
} from "../controllers/exam.controller.js";

import {
  getExamAttemptDetail,
  getExamAttempts,
} from "../controllers/attempt.controller.js";

import { getExamAnalytics } from "../controllers/examAnalytics.controller.js";

import { protect } from "../middleware/auth.middleware.js";

import { validateBody } from "../middleware/validate.middleware.js";

import {
  createExamSchema,
  updateExamSchema,
} from "../validators/exam.validator.js";

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(getExams)
  .post(validateBody(createExamSchema), createExam);

router.get("/:id/analytics", getExamAnalytics);

router.get("/:id/attempts", getExamAttempts);

router.get("/:id/attempts/:attemptId", getExamAttemptDetail);

router.post("/:id/publish", publishExam);

router.patch("/:id/archive", archiveExam);

router
  .route("/:id")
  .get(getExam)
  .patch(validateBody(updateExamSchema), updateExam)
  .delete(deleteExam);

export default router;
