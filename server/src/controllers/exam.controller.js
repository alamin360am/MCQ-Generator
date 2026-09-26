import { nanoid } from "nanoid";

import Exam from "../models/Exam.js";
import ExamVersion from "../models/ExamVersion.js";

import {
  createExamQuestionSnapshots,
  getOwnedQuestions,
} from "../services/exam.service.js";

import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";

const PUBLIC_SHARE_ID_LENGTH = 14;

const createUniqueShareId = async () => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const shareId = nanoid(PUBLIC_SHARE_ID_LENGTH);

    const exists = await Exam.exists({
      shareId,
    });

    if (!exists) {
      return shareId;
    }
  }

  throw new AppError(500, "Could not generate a share link");
};

const serializeExam = (exam) => ({
  id: exam._id.toString(),

  title: exam.title,

  description: exam.description,

  questionIds: exam.questionIds.map((question) => {
    if (question && typeof question === "object" && question._id) {
      return question._id.toString();
    }

    return question.toString();
  }),

  questionCount: exam.questionIds.length,

  status: exam.status,

  visibility: exam.visibility,

  shareId: exam.shareId,

  currentVersion: exam.currentVersion,

  settings: exam.settings,

  publishedAt: exam.publishedAt,

  createdAt: exam.createdAt,

  updatedAt: exam.updatedAt,
});

export const createExam = asyncHandler(async (req, res) => {
  const { title, description, questionIds, visibility, settings } = req.body;

  const questions = await getOwnedQuestions({
    owner: req.user._id,

    questionIds,
  });

  const exam = await Exam.create({
    owner: req.user._id,

    title,

    description,

    questionIds: questions.map((question) => question._id),

    visibility,

    settings,
  });

  res.status(201).json({
    success: true,

    message: "Exam created successfully",

    exam: serializeExam(exam),
  });
});

export const getExams = asyncHandler(async (req, res) => {
  const filter = {
    owner: req.user._id,
  };

  if (["draft", "published", "archived"].includes(req.query.status)) {
    filter.status = req.query.status;
  }

  const exams = await Exam.find(filter)
    .sort({
      updatedAt: -1,
    })
    .lean();

  res.json({
    success: true,

    exams: exams.map(serializeExam),
  });
});

export const getExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findOne({
    _id: req.params.id,

    owner: req.user._id,
  }).populate({
    path: "questionIds",

    select:
      "questionText options correctOptionIndex explanation difficulty subject topic tags",

    populate: [
      {
        path: "subject",

        select: "name",
      },

      {
        path: "topic",

        select: "name",
      },
    ],
  });

  if (!exam) {
    throw new AppError(404, "Exam not found");
  }

  res.json({
    success: true,

    exam: {
      ...serializeExam(exam),

      questions: exam.questionIds,
    },
  });
});

export const updateExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findOne({
    _id: req.params.id,

    owner: req.user._id,
  });

  if (!exam) {
    throw new AppError(404, "Exam not found");
  }

  if (req.body.title !== undefined) {
    exam.title = req.body.title;
  }

  if (req.body.description !== undefined) {
    exam.description = req.body.description;
  }

  if (req.body.visibility !== undefined) {
    exam.visibility = req.body.visibility;
  }

  if (req.body.questionIds !== undefined) {
    const questions = await getOwnedQuestions({
      owner: req.user._id,

      questionIds: req.body.questionIds,
    });

    exam.questionIds = questions.map((question) => question._id);
  }

  if (req.body.settings) {
    const settings = req.body.settings;

    for (const [key, value] of Object.entries(settings)) {
      exam.settings[key] = value;
    }
  }

  await exam.save();

  res.json({
    success: true,

    message: "Exam updated successfully",

    exam: serializeExam(exam),
  });
});

export const publishExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findOne({
    _id: req.params.id,

    owner: req.user._id,
  });

  if (!exam) {
    throw new AppError(404, "Exam not found");
  }

  if (exam.questionIds.length === 0) {
    throw new AppError(400, "An exam must contain at least one question");
  }

  const questions = await getOwnedQuestions({
    owner: req.user._id,

    questionIds: exam.questionIds.map(String),
  });

  const nextVersion = exam.currentVersion + 1;

  const now = new Date();

  const snapshots = createExamQuestionSnapshots(questions);

  await ExamVersion.create({
    exam: exam._id,

    owner: req.user._id,

    version: nextVersion,

    title: exam.title,

    description: exam.description,

    visibility: exam.visibility,

    settings: exam.settings.toObject ? exam.settings.toObject() : exam.settings,

    questions: snapshots,

    publishedAt: now,
  });

  if (!exam.shareId) {
    exam.shareId = await createUniqueShareId();
  }

  exam.status = "published";

  exam.currentVersion = nextVersion;

  exam.publishedAt = now;

  await exam.save();

  res.json({
    success: true,

    message: `Exam published as version ${nextVersion}`,

    exam: serializeExam(exam),
  });
});

export const archiveExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findOne({
    _id: req.params.id,

    owner: req.user._id,
  });

  if (!exam) {
    throw new AppError(404, "Exam not found");
  }

  exam.status = "archived";

  await exam.save();

  res.json({
    success: true,

    message: "Exam archived successfully",

    exam: serializeExam(exam),
  });
});

export const deleteExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findOne({
    _id: req.params.id,

    owner: req.user._id,
  });

  if (!exam) {
    throw new AppError(404, "Exam not found");
  }

  if (exam.currentVersion > 0) {
    throw new AppError(
      409,
      "Published exams cannot be permanently deleted. Archive the exam instead.",
    );
  }

  await exam.deleteOne();

  res.json({
    success: true,

    message: "Draft exam deleted successfully",
  });
});

export const getPublicExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findOne({
    shareId: req.params.shareId,

    status: "published",

    visibility: {
      $in: ["unlisted", "public"],
    },
  }).lean();

  if (!exam) {
    throw new AppError(404, "Exam not found or unavailable");
  }

  const version = await ExamVersion.findOne({
    exam: exam._id,

    version: exam.currentVersion,
  }).lean();

  if (!version) {
    throw new AppError(404, "Published exam version could not be found");
  }

  res.json({
    success: true,

    exam: {
      shareId: exam.shareId,

      version: version.version,

      title: version.title,

      description: version.description,

      questionCount: version.questions.length,

      settings: {
        durationMinutes: version.settings?.durationMinutes ?? null,

        shuffleQuestions: version.settings?.shuffleQuestions ?? false,

        shuffleOptions: version.settings?.shuffleOptions ?? false,

        allowRetake: version.settings?.allowRetake ?? true,

        showResultImmediately: version.settings?.showResultImmediately ?? true,

        collectParticipantName:
          version.settings?.collectParticipantName ?? false,
      },
    },
  });
});
