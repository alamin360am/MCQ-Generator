import express from "express";

import { rateLimit } from "express-rate-limit";

import {
  getCurrentUser,
  login,
  logout,
  logoutAll,
  refreshSession,
  register,
} from "../controllers/auth.controller.js";

import { protect } from "../middleware/auth.middleware.js";

import { validateBody } from "../middleware/validate.middleware.js";

import { loginSchema, registerSchema } from "../validators/auth.validator.js";

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  limit: 10,

  skipSuccessfulRequests: true,

  standardHeaders: "draft-7",

  legacyHeaders: false,

  message: {
    success: false,

    message: "Too many login attempts. Please try again later.",
  },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,

  limit: 10,

  standardHeaders: "draft-7",

  legacyHeaders: false,

  message: {
    success: false,

    message: "Too many account creation attempts. Please try again later.",
  },
});

router.post(
  "/register",
  registerLimiter,
  validateBody(registerSchema),
  register,
);

router.post("/login", loginLimiter, validateBody(loginSchema), login);

router.post("/refresh", refreshSession);

router.post("/logout", logout);

router.post("/logout-all", protect, logoutAll);

router.get("/me", protect, getCurrentUser);

export default router;
