import express from "express";

import { rateLimit } from "express-rate-limit";

import {
  getDashboard,
  getExamsReport,
  getLearning,
  getQuestionsReport,
} from "../controllers/report.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

const reportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,

    message: "Too many report requests. Please try again shortly.",
  },
});

router.use(protect);

router.use(reportLimiter);

router.get("/dashboard", getDashboard);

router.get("/learning", getLearning);

router.get("/questions", getQuestionsReport);

router.get("/exams", getExamsReport);

export default router;
