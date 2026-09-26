import express from "express";

import {
  createSubject,
  createTopic,
  deleteSubject,
  deleteTopic,
  getSubjects,
  getTopics,
  updateSubject,
  updateTopic,
} from "../controllers/taxonomy.controller.js";

import { protect } from "../middleware/auth.middleware.js";

import { validateBody } from "../middleware/validate.middleware.js";

import {
  subjectSchema,
  topicSchema,
} from "../validators/question.validator.js";

const router = express.Router();

router.use(protect);

router
  .route("/subjects")
  .get(getSubjects)
  .post(validateBody(subjectSchema), createSubject);

router
  .route("/subjects/:id")
  .patch(validateBody(subjectSchema), updateSubject)
  .delete(deleteSubject);

router
  .route("/topics")
  .get(getTopics)
  .post(validateBody(topicSchema), createTopic);

router
  .route("/topics/:id")
  .patch(validateBody(topicSchema), updateTopic)
  .delete(deleteTopic);

export default router;
