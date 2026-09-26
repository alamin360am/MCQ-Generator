import PracticeSession from "../models/PracticeSession.js";
import Question from "../models/Question.js";
import UserQuestionProgress from "../models/UserQuestionProgress.js";

import {
  buildQuestionMap,
  getPracticeQuestions,
  serializePracticeQuestions,
  serializePracticeResult,
} from "../services/practice.service.js";

import { validateQuestionTaxonomy } from "../services/question.service.js";

import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";

export const startPractice = asyncHandler(async (req, res) => {
  const { mode, count, subjectId, topicId, difficulty } = req.body;

  if (subjectId || topicId) {
    await validateQuestionTaxonomy({
      owner: req.user._id,

      subjectId,

      topicId,
    });
  }

  const questions = await getPracticeQuestions({
    owner: req.user._id,

    mode,

    count,

    subjectId: subjectId || null,

    topicId: topicId || null,

    difficulty: difficulty || null,
  });

  if (questions.length === 0) {
    throw new AppError(
      404,
      mode === "wrong"
        ? "You have no wrong questions waiting for review."
        : mode === "bookmarked"
          ? "No bookmarked questions matched your filters."
          : "No questions matched your practice filters.",
    );
  }

  const startedAt = new Date();

  const session = await PracticeSession.create({
    owner: req.user._id,

    mode,

    filters: {
      subject: subjectId || null,

      topic: topicId || null,

      difficulty: difficulty || null,
    },

    answers: questions.map((question) => ({
      question: question._id,

      selectedOptionIndex: null,

      answeredAt: null,

      isCorrect: null,
    })),

    startedAt,
  });

  const questionMap = buildQuestionMap(questions);

  res.status(201).json({
    success: true,

    session: {
      id: session._id.toString(),

      mode: session.mode,

      status: session.status,

      startedAt: session.startedAt,

      questionCount: session.answers.length,

      questions: serializePracticeQuestions(session, questionMap),
    },
  });
});

export const getPracticeSession = asyncHandler(async (req, res) => {
  const session = await PracticeSession.findOne({
    _id: req.params.id,

    owner: req.user._id,
  });

  if (!session) {
    throw new AppError(404, "Practice session not found");
  }

  const questionIds = session.answers.map((answer) => answer.question);

  const questions = await Question.find({
    _id: {
      $in: questionIds,
    },

    owner: req.user._id,
  }).lean();

  const questionMap = buildQuestionMap(questions);

  if (session.status === "submitted") {
    return res.json({
      success: true,

      session: {
        id: session._id.toString(),

        mode: session.mode,

        status: session.status,

        startedAt: session.startedAt,

        submittedAt: session.submittedAt,

        result: serializePracticeResult(session, questionMap),
      },
    });
  }

  res.json({
    success: true,

    session: {
      id: session._id.toString(),

      mode: session.mode,

      status: session.status,

      startedAt: session.startedAt,

      questionCount: session.answers.length,

      questions: serializePracticeQuestions(session, questionMap),
    },
  });
});

export const savePracticeAnswers = asyncHandler(async (req, res) => {
  const session = await PracticeSession.findOne({
    _id: req.params.id,

    owner: req.user._id,
  });

  if (!session) {
    throw new AppError(404, "Practice session not found");
  }

  if (session.status !== "in_progress") {
    throw new AppError(409, "This practice session has already been submitted");
  }

  const answerMap = new Map(
    session.answers.map((answer, index) => [
      answer.question.toString(),
      {
        answer,
        index,
      },
    ]),
  );

  const questionIds = session.answers.map((answer) => answer.question);

  const questions = await Question.find({
    _id: {
      $in: questionIds,
    },

    owner: req.user._id,
  })
    .select("options")
    .lean();

  const questionMap = new Map(
    questions.map((question) => [question._id.toString(), question]),
  );

  const now = new Date();

  for (const incoming of req.body.answers) {
    const matched = answerMap.get(incoming.questionId);

    if (!matched) {
      throw new AppError(
        400,
        "One or more answers refer to an invalid question",
      );
    }

    const question = questionMap.get(incoming.questionId);

    if (!question) {
      throw new AppError(400, "Question not found");
    }

    if (
      incoming.selectedOptionIndex !== null &&
      incoming.selectedOptionIndex >= question.options.length
    ) {
      throw new AppError(400, "Invalid selected answer");
    }

    matched.answer.selectedOptionIndex = incoming.selectedOptionIndex;

    matched.answer.answeredAt =
      incoming.selectedOptionIndex === null ? null : now;
  }

  session.markModified("answers");

  await session.save();

  res.json({
    success: true,

    message: "Practice answers saved",
  });
});

export const submitPractice = asyncHandler(async (req, res) => {
  const session = await PracticeSession.findOne({
    _id: req.params.id,

    owner: req.user._id,
  });

  if (!session) {
    throw new AppError(404, "Practice session not found");
  }

  const questionIds = session.answers.map((answer) => answer.question);

  const questions = await Question.find({
    _id: {
      $in: questionIds,
    },

    owner: req.user._id,
  });

  const questionMap = buildQuestionMap(questions);

  if (session.status === "submitted") {
    return res.json({
      success: true,

      result: serializePracticeResult(session, questionMap),
    });
  }

  let correct = 0;
  let wrong = 0;
  let skipped = 0;

  const progressOperations = [];

  const questionOperations = [];

  for (const answer of session.answers) {
    const question = questionMap.get(answer.question.toString());

    if (!question) {
      throw new AppError(500, "Practice question could not be resolved");
    }

    const selected = answer.selectedOptionIndex;

    const isSkipped = selected === null || selected === undefined;

    if (isSkipped) {
      skipped += 1;

      answer.isCorrect = null;

      progressOperations.push({
        updateOne: {
          filter: {
            user: req.user._id,

            question: question._id,
          },

          update: {
            $inc: {
              attempts: 1,
              skipped: 1,
            },

            $set: {
              lastWasCorrect: null,

              lastSelectedOptionIndex: null,

              lastAttemptAt: new Date(),
            },
          },

          upsert: true,
        },
      });

      continue;
    }

    const isCorrect = selected === question.correctOptionIndex;

    answer.isCorrect = isCorrect;

    if (isCorrect) {
      correct += 1;
    } else {
      wrong += 1;
    }

    progressOperations.push({
      updateOne: {
        filter: {
          user: req.user._id,

          question: question._id,
        },

        update: {
          $inc: {
            attempts: 1,

            correct: isCorrect ? 1 : 0,

            wrong: isCorrect ? 0 : 1,
          },

          $set: {
            needsReview: !isCorrect,

            lastWasCorrect: isCorrect,

            lastSelectedOptionIndex: selected,

            lastAttemptAt: new Date(),
          },
        },

        upsert: true,
      },
    });

    questionOperations.push({
      updateOne: {
        filter: {
          _id: question._id,

          owner: req.user._id,
        },

        update: {
          $inc: {
            "stats.attempts": 1,

            "stats.correct": isCorrect ? 1 : 0,

            "stats.wrong": isCorrect ? 0 : 1,
          },
        },
      },
    });
  }

  const total = session.answers.length;

  const percentage =
    total > 0 ? Math.round((correct / total) * 10000) / 100 : 0;

  session.result = {
    total,
    correct,
    wrong,
    skipped,
    percentage,
  };

  session.status = "submitted";

  session.submittedAt = new Date();

  session.markModified("answers");

  await session.save();

  if (progressOperations.length > 0) {
    await UserQuestionProgress.bulkWrite(progressOperations);
  }

  if (questionOperations.length > 0) {
    await Question.bulkWrite(questionOperations);
  }

  res.json({
    success: true,

    message: "Practice submitted successfully",

    result: serializePracticeResult(session, questionMap),
  });
});

export const getPracticeHistory = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);

  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);

  const skip = (page - 1) * limit;

  const filter = {
    owner: req.user._id,
  };

  if (["in_progress", "submitted"].includes(req.query.status)) {
    filter.status = req.query.status;
  }

  const [sessions, total] = await Promise.all([
    PracticeSession.find(filter)
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(limit)
      .lean(),

    PracticeSession.countDocuments(filter),
  ]);

  res.json({
    success: true,

    sessions: sessions.map((session) => ({
      id: session._id.toString(),

      mode: session.mode,

      status: session.status,

      questionCount: session.answers.length,

      answeredCount: session.answers.filter(
        (answer) =>
          answer.selectedOptionIndex !== null &&
          answer.selectedOptionIndex !== undefined,
      ).length,

      result: session.status === "submitted" ? session.result : null,

      startedAt: session.startedAt,

      submittedAt: session.submittedAt,
    })),

    pagination: {
      page,
      limit,
      total,

      totalPages: Math.max(Math.ceil(total / limit), 1),
    },
  });
});

export const getPracticeStats = asyncHandler(async (req, res) => {
  const [progress, completedSessions, inProgressSessions, bookmarkedQuestions] =
    await Promise.all([
      UserQuestionProgress.find({
        user: req.user._id,
      }).lean(),

      PracticeSession.find({
        owner: req.user._id,

        status: "submitted",
      })
        .select("result submittedAt")
        .lean(),

      PracticeSession.countDocuments({
        owner: req.user._id,

        status: "in_progress",
      }),

      Question.countDocuments({
        owner: req.user._id,

        status: "active",

        bookmark: true,
      }),
    ]);

  const totalAnswered = progress.reduce(
    (total, item) => total + item.correct + item.wrong,
    0,
  );

  const totalCorrect = progress.reduce(
    (total, item) => total + item.correct,
    0,
  );

  const totalWrong = progress.reduce((total, item) => total + item.wrong, 0);

  const totalSkipped = progress.reduce(
    (total, item) => total + item.skipped,
    0,
  );

  const accuracy =
    totalAnswered > 0
      ? Math.round((totalCorrect / totalAnswered) * 10000) / 100
      : 0;

  const needsReview = progress.filter((item) => item.needsReview).length;

  const recentSessions = completedSessions
    .slice()
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
    .slice(0, 5)
    .map((session) => ({
      id: session._id.toString(),

      percentage: session.result.percentage,

      correct: session.result.correct,

      total: session.result.total,

      submittedAt: session.submittedAt,
    }));

  res.json({
    success: true,

    stats: {
      completedSessions: completedSessions.length,

      inProgressSessions,

      bookmarkedQuestions,

      needsReview,

      totalCorrect,

      totalWrong,

      totalSkipped,

      accuracy,

      recentSessions,
    },
  });
});
