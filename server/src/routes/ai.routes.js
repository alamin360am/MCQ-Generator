import express from "express";

import { rateLimit } from "express-rate-limit";

import multer from "multer";

import {
  deleteSourceImage,
  uploadSourceImages,
} from "../controllers/aiImage.controller.js";

import {
  generateImageMcqs,
  saveGeneratedImageMcqs,
} from "../controllers/aiMcq.controller.js";

import { protect } from "../middleware/auth.middleware.js";

import { validateBody } from "../middleware/validate.middleware.js";

import {
  generateImageMcqSchema,
  saveImageMcqsSchema,
} from "../validators/ai.validator.js";

import AppError from "../utils/AppError.js";

const router = express.Router();

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 8 * 1024 * 1024,

    files: 8,
  },

  fileFilter: (req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(
        new AppError(
          415,
          "Only JPEG, PNG, WebP, HEIC and HEIF images are supported",
        ),
      );

      return;
    }

    callback(null, true);
  },
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,

  limit: 40,

  standardHeaders: "draft-7",

  legacyHeaders: false,

  message: {
    success: false,

    message: "Too many image uploads. Please try again later.",
  },
});

const generationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,

  limit: 20,

  standardHeaders: "draft-7",

  legacyHeaders: false,

  message: {
    success: false,

    message: "Too many AI generation requests. Please try again later.",
  },
});

router.use(protect);

router.post(
  "/images",
  uploadLimiter,
  upload.array("images", 8),
  uploadSourceImages,
);

router.delete("/images/:id", deleteSourceImage);

router.post(
  "/generate-mcqs",
  generationLimiter,
  validateBody(generateImageMcqSchema),
  generateImageMcqs,
);

router.post(
  "/save-mcqs",
  validateBody(saveImageMcqsSchema),
  saveGeneratedImageMcqs,
);

export default router;
