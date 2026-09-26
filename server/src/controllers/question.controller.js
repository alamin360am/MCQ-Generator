import mongoose from "mongoose";

import Question from "../models/Question.js";
import Subject from "../models/Subject.js";
import Topic from "../models/Topic.js";
import {
  cleanQuestionTags,
  validateQuestionTaxonomy,
} from "../services/question.service.js";

import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";

const escapeRegex = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

export const createQuestion = asyncHandler(async (req, res) => {
  const {
    questionText,
    options,
    correctOptionIndex,
    explanation,
    subjectId,
    topicId,
    difficulty,
    tags,
  } = req.body;

  const { subject, topic } = await validateQuestionTaxonomy({
    owner: req.user._id,

    subjectId,

    topicId,
  });

  const question = await Question.create({
    owner: req.user._id,

    questionText,

    options,

    correctOptionIndex,

    explanation,

    subject: subject?._id || null,

    topic: topic?._id || null,

    difficulty,

    tags: cleanQuestionTags(tags),

    sourceType: "manual",
  });

  await question.populate([
    {
      path: "subject",
      select: "name",
    },

    {
      path: "topic",
      select: "name subject",
    },
  ]);

  res.status(201).json({
    success: true,
    question,
  });
});

export const getQuestions = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);

  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);

  const filter = {
    owner: req.user._id,
  };

  const search = req.query.search?.trim();

  if (search) {
    const safeSearch = escapeRegex(search);

    filter.$or = [
      {
        questionText: {
          $regex: safeSearch,

          $options: "i",
        },
      },

      {
        explanation: {
          $regex: safeSearch,

          $options: "i",
        },
      },

      {
        tags: {
          $regex: safeSearch,

          $options: "i",
        },
      },
    ];
  }

  if (req.query.subjectId) {
    if (!mongoose.isValidObjectId(req.query.subjectId)) {
      throw new AppError(400, "Invalid subject");
    }

    filter.subject = req.query.subjectId;
  }

  if (req.query.topicId) {
    if (!mongoose.isValidObjectId(req.query.topicId)) {
      throw new AppError(400, "Invalid topic");
    }

    filter.topic = req.query.topicId;
  }

  if (["easy", "medium", "hard"].includes(req.query.difficulty)) {
    filter.difficulty = req.query.difficulty;
  }

  if (
    ["manual", "import", "ai-image", "ai-text"].includes(req.query.sourceType)
  ) {
    filter.sourceType = req.query.sourceType;
  }

  if (req.query.bookmarked === "true") {
    filter.isBookmarked = true;
  }

  if (["active", "archived"].includes(req.query.status)) {
    filter.status = req.query.status;
  } else {
    filter.status = "active";
  }

  const skip = (page - 1) * limit;

  const [questions, total] = await Promise.all([
    Question.find(filter)
      .populate("subject", "name")
      .populate("topic", "name subject")
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(limit)
      .lean(),

    Question.countDocuments(filter),
  ]);

  res.json({
    success: true,

    questions,

    pagination: {
      page,

      limit,

      total,

      totalPages: Math.max(Math.ceil(total / limit), 1),

      hasNextPage: page * limit < total,

      hasPreviousPage: page > 1,
    },
  });
});

export const getQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findOne({
    _id: req.params.id,

    owner: req.user._id,
  })
    .populate("subject", "name")
    .populate("topic", "name subject");

  if (!question) {
    throw new AppError(404, "Question not found");
  }

  res.json({
    success: true,
    question,
  });
});

export const updateQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findOne({
    _id: req.params.id,

    owner: req.user._id,
  });

  if (!question) {
    throw new AppError(404, "Question not found");
  }

  const finalOptions =
    req.body.options ??
    question.options.map((option) => ({
      text: option.text,
    }));

  const finalCorrectOptionIndex =
    req.body.correctOptionIndex ?? question.correctOptionIndex;

  if (finalCorrectOptionIndex >= finalOptions.length) {
    throw new AppError(
      400,
      "Correct answer does not match the available options",
    );
  }

  const subjectId =
    req.body.subjectId !== undefined
      ? req.body.subjectId
      : question.subject?.toString() || null;

  const topicId =
    req.body.topicId !== undefined
      ? req.body.topicId
      : question.topic?.toString() || null;

  const { subject, topic } = await validateQuestionTaxonomy({
    owner: req.user._id,

    subjectId,

    topicId,
  });

  if (req.body.questionText !== undefined) {
    question.questionText = req.body.questionText;
  }

  if (req.body.options !== undefined) {
    question.options = req.body.options;
  }

  if (req.body.correctOptionIndex !== undefined) {
    question.correctOptionIndex = req.body.correctOptionIndex;
  }

  if (req.body.explanation !== undefined) {
    question.explanation = req.body.explanation;
  }

  if (req.body.difficulty !== undefined) {
    question.difficulty = req.body.difficulty;
  }

  if (req.body.tags !== undefined) {
    question.tags = cleanQuestionTags(req.body.tags);
  }

  if (req.body.status !== undefined) {
    question.status = req.body.status;
  }

  question.subject = subject?._id || null;

  question.topic = topic?._id || null;

  await question.save();

  await question.populate([
    {
      path: "subject",
      select: "name",
    },

    {
      path: "topic",
      select: "name subject",
    },
  ]);

  res.json({
    success: true,
    question,
  });
});

export const deleteQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findOne({
    _id: req.params.id,

    owner: req.user._id,
  });

  if (!question) {
    throw new AppError(404, "Question not found");
  }

  await question.deleteOne();

  res.json({
    success: true,

    message: "Question deleted successfully",
  });
});

export const toggleBookmark = asyncHandler(async (req, res) => {
  const question = await Question.findOne({
    _id: req.params.id,

    owner: req.user._id,
  });

  if (!question) {
    throw new AppError(404, "Question not found");
  }

  question.isBookmarked = !question.isBookmarked;

  await question.save();

  res.json({
    success: true,

    isBookmarked: question.isBookmarked,
  });
});

export const bulkImportQuestions = asyncHandler(async (req, res) => {
  const { questions, subjectId, topicId, difficulty } = req.body;

  const { subject, topic } = await validateQuestionTaxonomy({
    owner: req.user._id,

    subjectId,

    topicId,
  });

  const documents = questions.map((question, index) => {
    if (question.correctOptionIndex >= question.options.length) {
      throw new AppError(
        400,
        `Question ${index + 1} has an invalid correct answer`,
      );
    }

    return {
      owner: req.user._id,

      questionText: question.questionText,

      options: question.options,

      correctOptionIndex: question.correctOptionIndex,

      explanation: question.explanation || "",

      subject: subject?._id || null,

      topic: topic?._id || null,

      difficulty: question.difficulty || difficulty,

      tags: cleanQuestionTags(question.tags),

      sourceType: "import",

      isBookmarked: false,

      status: "active",
    };
  });

  const importedQuestions = await Question.insertMany(documents, {
    ordered: true,
  });

  res.status(201).json({
    success: true,

    message: `${importedQuestions.length} questions imported successfully`,

    importedCount: importedQuestions.length,

    questions: importedQuestions,
  });
});
