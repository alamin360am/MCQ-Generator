import asyncHandler from "../utils/asyncHandler.js";

import { getReportContext } from "../utils/reportRange.js";

import {
  getDashboardReport,
  getExamReport,
  getLearningActivity,
  getLearningBreakdown,
  getMostMissedQuestions,
  getPracticeModeReport,
  getQuestionBankReport,
  getReviewRecoveryReport,
} from "../services/report.service.js";

export const getDashboard = asyncHandler(async (req, res) => {
  const context = getReportContext(req.query);

  const report = await getDashboardReport({
    owner: req.user._id,

    ...context,
  });

  res.json({
    success: true,

    meta: {
      range: context.range,

      timezone: context.timeZone,

      from: context.from,

      to: context.to,
    },

    report,
  });
});

export const getLearning = asyncHandler(async (req, res) => {
  const context = getReportContext(req.query);

  const [activity, breakdown, practiceModes, reviewRecovery, mostMissed] =
    await Promise.all([
      getLearningActivity({
        owner: req.user._id,

        ...context,
      }),

      getLearningBreakdown({
        owner: req.user._id,

        ...context,
      }),

      getPracticeModeReport({
        owner: req.user._id,

        ...context,
      }),

      getReviewRecoveryReport({
        owner: req.user._id,
      }),

      getMostMissedQuestions({
        owner: req.user._id,

        ...context,

        limit: 10,
      }),
    ]);

  res.json({
    success: true,

    meta: {
      range: context.range,

      timezone: context.timeZone,

      from: context.from,

      to: context.to,
    },

    report: {
      activity,

      subjects: breakdown.subjects,

      topics: breakdown.topics,

      difficulty: breakdown.difficulty,

      practiceModes,

      reviewRecovery,

      mostMissed,
    },
  });
});

export const getQuestionsReport = asyncHandler(async (req, res) => {
  const report = await getQuestionBankReport({
    owner: req.user._id,
  });

  res.json({
    success: true,
    report,
  });
});

export const getExamsReport = asyncHandler(async (req, res) => {
  const context = getReportContext(req.query);

  const report = await getExamReport({
    owner: req.user._id,

    ...context,
  });

  res.json({
    success: true,

    meta: {
      range: context.range,

      timezone: context.timeZone,

      from: context.from,

      to: context.to,
    },

    report,
  });
});
