import Exam from "../models/Exam.js";
import ExamVersion from "../models/ExamVersion.js";
import ExamAttempt from "../models/ExamAttempt.js";

import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";

const roundPercentage = (value) => {
  return Math.round(value * 100) / 100;
};

export const getExamAnalytics = asyncHandler(async (req, res) => {
  const exam = await Exam.findOne({
    _id: req.params.id,

    owner: req.user._id,
  }).lean();

  if (!exam) {
    throw new AppError(404, "Exam not found");
  }

  const attempts = await ExamAttempt.find({
    exam: exam._id,
  })
    .select(
      [
        "publicId",
        "versionNumber",
        "participantUser",
        "guestIdHash",
        "status",
        "result",
      ].join(" "),
    )
    .lean();

  const totalAttempts = attempts.length;

  const submittedAttempts = attempts.filter(
    (attempt) => attempt.status === "submitted",
  );

  const completedAttempts = submittedAttempts.length;

  const inProgressAttempts = totalAttempts - completedAttempts;

  const scores = submittedAttempts
    .map((attempt) => attempt.result?.percentage)
    .filter((value) => typeof value === "number");

  const averageScore =
    scores.length > 0
      ? roundPercentage(
          scores.reduce((total, score) => total + score, 0) / scores.length,
        )
      : null;

  const highestScore = scores.length > 0 ? Math.max(...scores) : null;

  const lowestScore = scores.length > 0 ? Math.min(...scores) : null;

  const completionRate =
    totalAttempts > 0
      ? roundPercentage((completedAttempts / totalAttempts) * 100)
      : 0;

  const participantKeys = new Set();

  attempts.forEach((attempt) => {
    if (attempt.participantUser) {
      participantKeys.add(`user:${attempt.participantUser.toString()}`);

      return;
    }

    if (attempt.guestIdHash) {
      participantKeys.add(`guest:${attempt.guestIdHash}`);

      return;
    }

    participantKeys.add(`attempt:${attempt.publicId}`);
  });

  const versionMap = new Map();

  attempts.forEach((attempt) => {
    const version = attempt.versionNumber;

    if (!versionMap.has(version)) {
      versionMap.set(version, {
        version,

        attempts: 0,

        completed: 0,

        inProgress: 0,

        scoreTotal: 0,

        scoredCount: 0,
      });
    }

    const stats = versionMap.get(version);

    stats.attempts += 1;

    if (attempt.status === "submitted") {
      stats.completed += 1;

      if (typeof attempt.result?.percentage === "number") {
        stats.scoreTotal += attempt.result.percentage;

        stats.scoredCount += 1;
      }
    } else {
      stats.inProgress += 1;
    }
  });

  const versionStats = Array.from(versionMap.values())
    .map((stats) => ({
      version: stats.version,

      attempts: stats.attempts,

      completed: stats.completed,

      inProgress: stats.inProgress,

      averageScore:
        stats.scoredCount > 0
          ? roundPercentage(stats.scoreTotal / stats.scoredCount)
          : null,
    }))
    .sort((a, b) => b.version - a.version);

  let questionPerformance = [];

  if (exam.currentVersion > 0) {
    const currentVersion = await ExamVersion.findOne({
      exam: exam._id,

      version: exam.currentVersion,
    }).lean();

    if (currentVersion) {
      const currentAttempts = await ExamAttempt.find({
        exam: exam._id,

        versionNumber: exam.currentVersion,

        status: "submitted",
      })
        .select("questions")
        .lean();

      questionPerformance = currentVersion.questions.map((question, index) => {
        let correct = 0;

        let wrong = 0;

        let skipped = 0;

        currentAttempts.forEach((attempt) => {
          const attemptQuestion = attempt.questions.find(
            (item) => item.questionId.toString() === question._id.toString(),
          );

          if (
            !attemptQuestion ||
            attemptQuestion.selectedOptionIndex === null ||
            attemptQuestion.selectedOptionIndex === undefined
          ) {
            skipped += 1;

            return;
          }

          const sourceOptionIndex =
            attemptQuestion.optionOrder[attemptQuestion.selectedOptionIndex];

          if (sourceOptionIndex === question.correctOptionIndex) {
            correct += 1;
          } else {
            wrong += 1;
          }
        });

        const answered = correct + wrong;

        const accuracyPercentage =
          answered > 0 ? roundPercentage((correct / answered) * 100) : null;

        return {
          id: question._id.toString(),

          number: index + 1,

          questionText: question.questionText,

          difficulty: question.difficulty,

          subjectName: question.subjectName,

          topicName: question.topicName,

          attempts: currentAttempts.length,

          answered,

          correct,

          wrong,

          skipped,

          accuracyPercentage,
        };
      });
    }
  }

  res.json({
    success: true,

    exam: {
      id: exam._id.toString(),

      title: exam.title,

      status: exam.status,

      currentVersion: exam.currentVersion,
    },

    summary: {
      totalAttempts,

      completedAttempts,

      inProgressAttempts,

      uniqueParticipants: participantKeys.size,

      completionRate,

      averageScore,

      highestScore,

      lowestScore,
    },

    versionStats,

    currentVersionAnalytics: {
      version: exam.currentVersion,

      submittedAttempts:
        questionPerformance.length > 0 ? questionPerformance[0].attempts : 0,

      questionPerformance,
    },
  });
});
