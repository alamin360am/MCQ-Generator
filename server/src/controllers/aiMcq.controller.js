import Question from "../models/Question.js";
import SourceImage from "../models/SourceImage.js";

import { env } from "../config/env.js";

import { generateMcqsFromSourceImages } from "../services/gemini.service.js";

import { getOwnedSourceImagesInOrder } from "../services/sourceImage.service.js";

import {
  cleanQuestionTags,
  validateQuestionTaxonomy,
} from "../services/question.service.js";

import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";

export const generateImageMcqs = asyncHandler(async (req, res) => {
  const { imageIds, questionCount, language, difficulty, customInstructions } =
    req.body;

  const images = await getOwnedSourceImagesInOrder({
    owner: req.user._id,

    imageIds,
  });

  const generation = await generateMcqsFromSourceImages({
    images,

    questionCount,

    language,

    difficulty,

    customInstructions,
  });

  res.json({
    success: true,

    generation,
  });
});

export const saveGeneratedImageMcqs = asyncHandler(async (req, res) => {
  const { imageIds, subjectId, topicId, questions } = req.body;

  const images = await getOwnedSourceImagesInOrder({
    owner: req.user._id,

    imageIds,
  });

  const { subject, topic } = await validateQuestionTaxonomy({
    owner: req.user._id,

    subjectId,

    topicId,
  });

  const documents = questions.map((question, index) => {
    if (question.sourcePage > images.length) {
      throw new AppError(
        400,
        `Question ${index + 1} has an invalid source page`,
      );
    }

    if (question.correctOptionIndex >= question.options.length) {
      throw new AppError(
        400,
        `Question ${index + 1} has an invalid correct answer`,
      );
    }

    const sourceImage = images[question.sourcePage - 1];

    return {
      owner: req.user._id,

      questionText: question.questionText,

      options: question.options,

      correctOptionIndex: question.correctOptionIndex,

      explanation: question.explanation || "",

      subject: subject?._id || null,

      topic: topic?._id || null,

      difficulty: question.difficulty,

      tags: cleanQuestionTags(question.tags),

      sourceType: "ai-image",

      sourceImage: sourceImage._id,

      sourcePage: question.sourcePage,

      aiModel: env.GEMINI_MODEL,

      status: "active",

      isBookmarked: false,
    };
  });

  const savedQuestions = await Question.insertMany(documents, {
    ordered: true,
  });

  try {
    await SourceImage.updateMany(
      {
        _id: {
          $in: images.map((image) => image._id),
        },
      },

      {
        $set: {
          usedAt: new Date(),
        },
      },
    );
  } catch (error) {
    console.error("Could not mark source images as used:", error);
  }

  res.status(201).json({
    success: true,

    message: `${savedQuestions.length} AI-generated questions saved successfully`,

    savedCount: savedQuestions.length,

    questions: savedQuestions,
  });
});
