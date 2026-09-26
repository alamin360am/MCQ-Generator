import mongoose from "mongoose";

import PracticeSession from "../models/PracticeSession.js";
import UserQuestionProgress from "../models/UserQuestionProgress.js";
import Question from "../models/Question.js";
import Exam from "../models/Exam.js";
import ExamAttempt from "../models/ExamAttempt.js";

const toObjectId = (value) => {
  if (value instanceof mongoose.Types.ObjectId) {
    return value;
  }

  return new mongoose.Types.ObjectId(value);
};

const round = (value, decimals = 2) => {
  const multiplier = 10 ** decimals;

  return Math.round((Number(value) + Number.EPSILON) * multiplier) / multiplier;
};

const percentage = (correct, attempted) => {
  if (!attempted) {
    return 0;
  }

  return round((correct / attempted) * 100);
};

const makeSubmittedMatch = ({ owner, from, to }) => {
  const match = {
    owner: toObjectId(owner),

    status: "submitted",
  };

  match.submittedAt = {
    $ne: null,
  };

  if (from) {
    match.submittedAt.$gte = from;
  }

  if (to) {
    match.submittedAt.$lte = to;
  }

  return match;
};

const getDateFormat = (bucket) => {
  if (bucket === "month") {
    return "%Y-%m";
  }

  return "%Y-%m-%d";
};

const normalizePerformanceRow = (row) => {
  const correct = Number(row.correct || 0);

  const wrong = Number(row.wrong || 0);

  const skipped = Number(row.skipped || 0);

  const attempted = correct + wrong;

  return {
    ...row,

    correct,
    wrong,
    skipped,
    attempted,

    total: attempted + skipped,

    accuracy: percentage(correct, attempted),
  };
};

export const getDashboardReport = async ({ owner, from, to }) => {
  const ownerId = toObjectId(owner);

  const practiceMatch = makeSubmittedMatch({
    owner,
    from,
    to,
  });

  const [practiceSummary, questionSummary, reviewSummary, createdExams] =
    await Promise.all([
      PracticeSession.aggregate([
        {
          $match: practiceMatch,
        },

        {
          $group: {
            _id: null,

            sessions: {
              $sum: 1,
            },

            correct: {
              $sum: {
                $ifNull: ["$result.correct", 0],
              },
            },

            wrong: {
              $sum: {
                $ifNull: ["$result.wrong", 0],
              },
            },

            skipped: {
              $sum: {
                $ifNull: ["$result.skipped", 0],
              },
            },
          },
        },
      ]),

      Question.aggregate([
        {
          $match: {
            owner: ownerId,

            status: "active",
          },
        },

        {
          $group: {
            _id: null,

            total: {
              $sum: 1,
            },

            bookmarked: {
              $sum: {
                $cond: [
                  {
                    $or: [
                      {
                        $eq: ["$bookmark", true],
                      },

                      {
                        $eq: ["$isBookmarked", true],
                      },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]),

      UserQuestionProgress.aggregate([
        {
          $match: {
            user: ownerId,
          },
        },

        {
          $group: {
            _id: null,

            needsReview: {
              $sum: {
                $cond: ["$needsReview", 1, 0],
              },
            },

            everWrong: {
              $sum: {
                $cond: [
                  {
                    $gt: ["$wrong", 0],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]),

      Exam.countDocuments({
        owner: ownerId,
      }),
    ]);

  const practice = practiceSummary[0] || {};

  const questions = questionSummary[0] || {};

  const review = reviewSummary[0] || {};

  const correct = Number(practice.correct || 0);

  const wrong = Number(practice.wrong || 0);

  const skipped = Number(practice.skipped || 0);

  const attempted = correct + wrong;

  const needsReview = Number(review.needsReview || 0);

  const everWrong = Number(review.everWrong || 0);

  return {
    practice: {
      completedSessions: Number(practice.sessions || 0),

      attempted,
      correct,
      wrong,
      skipped,

      accuracy: percentage(correct, attempted),
    },

    questions: {
      total: Number(questions.total || 0),

      bookmarked: Number(questions.bookmarked || 0),

      needsReview,

      recovered: Math.max(everWrong - needsReview, 0),
    },

    exams: {
      created: createdExams,
    },
  };
};

export const getLearningActivity = async ({
  owner,
  from,
  to,
  timeZone,
  bucket,
}) => {
  const rows = await PracticeSession.aggregate([
    {
      $match: makeSubmittedMatch({
        owner,
        from,
        to,
      }),
    },

    {
      $group: {
        _id: {
          $dateToString: {
            format: getDateFormat(bucket),

            date: "$submittedAt",

            timezone: timeZone,
          },
        },

        sessions: {
          $sum: 1,
        },

        correct: {
          $sum: {
            $ifNull: ["$result.correct", 0],
          },
        },

        wrong: {
          $sum: {
            $ifNull: ["$result.wrong", 0],
          },
        },

        skipped: {
          $sum: {
            $ifNull: ["$result.skipped", 0],
          },
        },
      },
    },

    {
      $sort: {
        _id: 1,
      },
    },
  ]);

  return rows.map((row) => {
    const normalized = normalizePerformanceRow(row);

    return {
      period: row._id,

      sessions: Number(row.sessions || 0),

      attempted: normalized.attempted,

      correct: normalized.correct,

      wrong: normalized.wrong,

      skipped: normalized.skipped,

      accuracy: normalized.accuracy,
    };
  });
};

export const getPracticeModeReport = async ({ owner, from, to }) => {
  const rows = await PracticeSession.aggregate([
    {
      $match: makeSubmittedMatch({
        owner,
        from,
        to,
      }),
    },

    {
      $group: {
        _id: "$mode",

        sessions: {
          $sum: 1,
        },

        correct: {
          $sum: {
            $ifNull: ["$result.correct", 0],
          },
        },

        wrong: {
          $sum: {
            $ifNull: ["$result.wrong", 0],
          },
        },

        skipped: {
          $sum: {
            $ifNull: ["$result.skipped", 0],
          },
        },
      },
    },

    {
      $sort: {
        sessions: -1,
      },
    },
  ]);

  return rows.map((row) => {
    const normalized = normalizePerformanceRow(row);

    return {
      mode: row._id,

      sessions: Number(row.sessions),

      attempted: normalized.attempted,

      correct: normalized.correct,

      wrong: normalized.wrong,

      skipped: normalized.skipped,

      accuracy: normalized.accuracy,
    };
  });
};

export const getLearningBreakdown = async ({ owner, from, to }) => {
  const ownerId = toObjectId(owner);

  const result = await PracticeSession.aggregate([
    {
      $match: makeSubmittedMatch({
        owner,
        from,
        to,
      }),
    },

    {
      $unwind: "$answers",
    },

    {
      $lookup: {
        from: "questions",

        localField: "answers.question",

        foreignField: "_id",

        as: "question",
      },
    },

    {
      $unwind: "$question",
    },

    {
      $match: {
        "question.owner": ownerId,
      },
    },

    {
      $facet: {
        subjects: [
          {
            $group: {
              _id: "$question.subject",

              correct: {
                $sum: {
                  $cond: [
                    {
                      $eq: ["$answers.isCorrect", true],
                    },
                    1,
                    0,
                  ],
                },
              },

              wrong: {
                $sum: {
                  $cond: [
                    {
                      $eq: ["$answers.isCorrect", false],
                    },
                    1,
                    0,
                  ],
                },
              },

              skipped: {
                $sum: {
                  $cond: [
                    {
                      $eq: ["$answers.isCorrect", null],
                    },
                    1,
                    0,
                  ],
                },
              },
            },
          },

          {
            $lookup: {
              from: "subjects",

              localField: "_id",

              foreignField: "_id",

              as: "subject",
            },
          },

          {
            $unwind: {
              path: "$subject",

              preserveNullAndEmptyArrays: true,
            },
          },

          {
            $project: {
              _id: 0,

              id: {
                $cond: [
                  {
                    $eq: ["$_id", null],
                  },
                  null,
                  {
                    $toString: "$_id",
                  },
                ],
              },

              name: {
                $ifNull: ["$subject.name", "Uncategorized"],
              },

              correct: 1,
              wrong: 1,
              skipped: 1,
            },
          },

          {
            $sort: {
              correct: -1,
            },
          },
        ],

        topics: [
          {
            $group: {
              _id: "$question.topic",

              subjectId: {
                $first: "$question.subject",
              },

              correct: {
                $sum: {
                  $cond: [
                    {
                      $eq: ["$answers.isCorrect", true],
                    },
                    1,
                    0,
                  ],
                },
              },

              wrong: {
                $sum: {
                  $cond: [
                    {
                      $eq: ["$answers.isCorrect", false],
                    },
                    1,
                    0,
                  ],
                },
              },

              skipped: {
                $sum: {
                  $cond: [
                    {
                      $eq: ["$answers.isCorrect", null],
                    },
                    1,
                    0,
                  ],
                },
              },
            },
          },

          {
            $lookup: {
              from: "topics",

              localField: "_id",

              foreignField: "_id",

              as: "topic",
            },
          },

          {
            $unwind: {
              path: "$topic",

              preserveNullAndEmptyArrays: true,
            },
          },

          {
            $lookup: {
              from: "subjects",

              localField: "subjectId",

              foreignField: "_id",

              as: "subject",
            },
          },

          {
            $unwind: {
              path: "$subject",

              preserveNullAndEmptyArrays: true,
            },
          },

          {
            $project: {
              _id: 0,

              id: {
                $cond: [
                  {
                    $eq: ["$_id", null],
                  },
                  null,
                  {
                    $toString: "$_id",
                  },
                ],
              },

              name: {
                $ifNull: ["$topic.name", "Uncategorized"],
              },

              subjectId: {
                $cond: [
                  {
                    $eq: ["$subjectId", null],
                  },
                  null,
                  {
                    $toString: "$subjectId",
                  },
                ],
              },

              subjectName: {
                $ifNull: ["$subject.name", "Uncategorized"],
              },

              correct: 1,
              wrong: 1,
              skipped: 1,
            },
          },
        ],

        difficulty: [
          {
            $group: {
              _id: {
                $ifNull: ["$question.difficulty", "unknown"],
              },

              correct: {
                $sum: {
                  $cond: [
                    {
                      $eq: ["$answers.isCorrect", true],
                    },
                    1,
                    0,
                  ],
                },
              },

              wrong: {
                $sum: {
                  $cond: [
                    {
                      $eq: ["$answers.isCorrect", false],
                    },
                    1,
                    0,
                  ],
                },
              },

              skipped: {
                $sum: {
                  $cond: [
                    {
                      $eq: ["$answers.isCorrect", null],
                    },
                    1,
                    0,
                  ],
                },
              },
            },
          },
        ],
      },
    },
  ]);

  const data = result[0] || {
    subjects: [],
    topics: [],
    difficulty: [],
  };

  const normalizeRows = (rows) =>
    rows.map((row) => {
      const normalized = normalizePerformanceRow(row);

      return {
        ...row,

        attempted: normalized.attempted,

        total: normalized.total,

        accuracy: normalized.accuracy,
      };
    });

  return {
    subjects: normalizeRows(data.subjects),

    topics: normalizeRows(data.topics),

    difficulty: normalizeRows(data.difficulty).map((row) => ({
      ...row,

      difficulty: row._id,

      _id: undefined,
    })),
  };
};

export const getMostMissedQuestions = async ({
  owner,
  from,
  to,
  limit = 10,
}) => {
  const ownerId = toObjectId(owner);

  const rows = await PracticeSession.aggregate([
    {
      $match: makeSubmittedMatch({
        owner,
        from,
        to,
      }),
    },

    {
      $unwind: "$answers",
    },

    {
      $match: {
        "answers.isCorrect": {
          $in: [true, false],
        },
      },
    },

    {
      $lookup: {
        from: "questions",

        localField: "answers.question",

        foreignField: "_id",

        as: "question",
      },
    },

    {
      $unwind: "$question",
    },

    {
      $match: {
        "question.owner": ownerId,
      },
    },

    {
      $group: {
        _id: "$question._id",

        questionText: {
          $first: "$question.questionText",
        },

        difficulty: {
          $first: "$question.difficulty",
        },

        subject: {
          $first: "$question.subject",
        },

        correct: {
          $sum: {
            $cond: [
              {
                $eq: ["$answers.isCorrect", true],
              },
              1,
              0,
            ],
          },
        },

        wrong: {
          $sum: {
            $cond: [
              {
                $eq: ["$answers.isCorrect", false],
              },
              1,
              0,
            ],
          },
        },
      },
    },

    {
      $match: {
        wrong: {
          $gt: 0,
        },
      },
    },

    {
      $lookup: {
        from: "subjects",

        localField: "subject",

        foreignField: "_id",

        as: "subjectDoc",
      },
    },

    {
      $unwind: {
        path: "$subjectDoc",

        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $sort: {
        wrong: -1,
        correct: 1,
      },
    },

    {
      $limit: Math.min(Number(limit) || 10, 50),
    },
  ]);

  return rows.map((row) => {
    const attempted = row.correct + row.wrong;

    return {
      id: row._id.toString(),

      questionText: row.questionText,

      difficulty: row.difficulty,

      subjectName: row.subjectDoc?.name || "Uncategorized",

      attempts: attempted,

      correct: row.correct,

      wrong: row.wrong,

      accuracy: percentage(row.correct, attempted),
    };
  });
};

export const getReviewRecoveryReport = async ({ owner }) => {
  const ownerId = toObjectId(owner);

  const rows = await UserQuestionProgress.aggregate([
    {
      $match: {
        user: ownerId,

        wrong: {
          $gt: 0,
        },
      },
    },

    {
      $group: {
        _id: null,

        everWrong: {
          $sum: 1,
        },

        needsReview: {
          $sum: {
            $cond: ["$needsReview", 1, 0],
          },
        },

        totalWrongAnswers: {
          $sum: "$wrong",
        },

        totalCorrectAnswers: {
          $sum: "$correct",
        },
      },
    },
  ]);

  const summary = rows[0] || {};

  const everWrong = Number(summary.everWrong || 0);

  const needsReview = Number(summary.needsReview || 0);

  const recovered = Math.max(everWrong - needsReview, 0);

  return {
    everWrong,
    needsReview,
    recovered,

    recoveryRate: percentage(recovered, everWrong),

    lifetimeWrongAnswers: Number(summary.totalWrongAnswers || 0),

    lifetimeCorrectAnswers: Number(summary.totalCorrectAnswers || 0),
  };
};

export const getQuestionBankReport = async ({ owner }) => {
  const ownerId = toObjectId(owner);

  const result = await Question.aggregate([
    {
      $match: {
        owner: ownerId,

        status: "active",
      },
    },

    {
      $facet: {
        overview: [
          {
            $group: {
              _id: null,

              total: {
                $sum: 1,
              },

              bookmarked: {
                $sum: {
                  $cond: [
                    {
                      $or: [
                        {
                          $eq: ["$bookmark", true],
                        },

                        {
                          $eq: ["$isBookmarked", true],
                        },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
            },
          },
        ],

        difficulty: [
          {
            $group: {
              _id: {
                $ifNull: ["$difficulty", "unknown"],
              },

              count: {
                $sum: 1,
              },
            },
          },

          {
            $sort: {
              count: -1,
            },
          },
        ],

        source: [
          {
            $group: {
              _id: {
                $ifNull: ["$sourceType", "manual"],
              },

              count: {
                $sum: 1,
              },
            },
          },

          {
            $sort: {
              count: -1,
            },
          },
        ],

        subjects: [
          {
            $group: {
              _id: "$subject",

              count: {
                $sum: 1,
              },
            },
          },

          {
            $lookup: {
              from: "subjects",

              localField: "_id",

              foreignField: "_id",

              as: "subject",
            },
          },

          {
            $unwind: {
              path: "$subject",

              preserveNullAndEmptyArrays: true,
            },
          },

          {
            $project: {
              _id: 0,

              id: {
                $cond: [
                  {
                    $eq: ["$_id", null],
                  },
                  null,
                  {
                    $toString: "$_id",
                  },
                ],
              },

              name: {
                $ifNull: ["$subject.name", "Uncategorized"],
              },

              count: 1,
            },
          },

          {
            $sort: {
              count: -1,
            },
          },
        ],
      },
    },
  ]);

  const data = result[0] || {};

  const overview = data.overview?.[0] || {};

  return {
    overview: {
      total: Number(overview.total || 0),

      bookmarked: Number(overview.bookmarked || 0),
    },

    difficulty: (data.difficulty || []).map((item) => ({
      difficulty: item._id,

      count: item.count,
    })),

    sources: (data.source || []).map((item) => ({
      source: item._id,

      count: item.count,
    })),

    subjects: data.subjects || [],
  };
};

const getAttemptPercentage = (attempt) => {
  const direct = Number(attempt.result?.percentage);

  if (Number.isFinite(direct)) {
    return direct;
  }

  const correct = Number(attempt.result?.correct);

  const total = Number(attempt.result?.total);

  if (Number.isFinite(correct) && Number.isFinite(total) && total > 0) {
    return percentage(correct, total);
  }

  return 0;
};

export const getExamReport = async ({ owner, from, to }) => {
  const ownerId = toObjectId(owner);

  const exams = await Exam.find({
    owner: ownerId,
  })
    .select("_id title status visibility publishedAt createdAt")
    .lean();

  const examIds = exams.map((exam) => exam._id);

  if (examIds.length === 0) {
    return {
      overview: {
        totalExams: 0,
        publishedExams: 0,
        attempts: 0,
        averageScore: 0,
      },

      exams: [],
      recentTrend: [],
    };
  }

  const attemptFilter = {
    exam: {
      $in: examIds,
    },

    submittedAt: {
      $ne: null,
    },
  };

  if (from) {
    attemptFilter.submittedAt.$gte = from;
  }

  if (to) {
    attemptFilter.submittedAt.$lte = to;
  }

  const attempts = await ExamAttempt.find(attemptFilter)
    .select("exam result submittedAt status")
    .lean();

  const examMap = new Map(
    exams.map((exam) => [
      exam._id.toString(),
      {
        id: exam._id.toString(),

        title: exam.title,

        status: exam.status,

        visibility: exam.visibility,

        attempts: 0,

        totalScore: 0,
      },
    ]),
  );

  let totalScore = 0;

  for (const attempt of attempts) {
    const score = getAttemptPercentage(attempt);

    totalScore += score;

    const item = examMap.get(attempt.exam.toString());

    if (item) {
      item.attempts += 1;

      item.totalScore += score;
    }
  }

  const examRows = Array.from(examMap.values())
    .map((item) => ({
      id: item.id,
      title: item.title,

      status: item.status,

      visibility: item.visibility,

      attempts: item.attempts,

      averageScore:
        item.attempts > 0 ? round(item.totalScore / item.attempts) : 0,
    }))
    .sort((a, b) => b.attempts - a.attempts);

  return {
    overview: {
      totalExams: exams.length,

      publishedExams: exams.filter((exam) => exam.status === "published")
        .length,

      attempts: attempts.length,

      averageScore:
        attempts.length > 0 ? round(totalScore / attempts.length) : 0,
    },

    exams: examRows,
  };
};
