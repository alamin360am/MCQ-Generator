import Question from "../models/Question.js";

import UserQuestionProgress from "../models/UserQuestionProgress.js";

import AppError from "../utils/AppError.js";

export const getPracticeQuestions = async ({
  owner,
  mode,
  count,
  subjectId,
  topicId,
  difficulty,
}) => {
  const questionFilter = {
    owner,

    status: "active",
  };

  if (subjectId) {
    questionFilter.subject = subjectId;
  }

  if (topicId) {
    questionFilter.topic = topicId;
  }

  if (difficulty) {
    questionFilter.difficulty = difficulty;
  }

  if (mode === "bookmarked") {
    questionFilter.bookmark = true;
  }

  if (mode === "wrong") {
    const progress = await UserQuestionProgress.find({
      user: owner,

      needsReview: true,
    })
      .select("question")
      .lean();

    const questionIds = progress.map((item) => item.question);

    if (questionIds.length === 0) {
      return [];
    }

    questionFilter._id = {
      $in: questionIds,
    };
  }

  const questions = await Question.aggregate([
    {
      $match: questionFilter,
    },

    {
      $sample: {
        size: count,
      },
    },

    {
      $project: {
        questionText: 1,
        options: 1,
        difficulty: 1,
        subject: 1,
        topic: 1,
      },
    },
  ]);

  return questions;
};

export const serializePracticeQuestions = (session, questionMap) => {
  return session.answers.map((answer, index) => {
    const question = questionMap.get(answer.question.toString());

    if (!question) {
      throw new AppError(500, "Practice question could not be resolved");
    }

    return {
      id: question._id.toString(),

      number: index + 1,

      questionText: question.questionText,

      options: question.options.map((option, optionIndex) => ({
        index: optionIndex,

        text: option.text,
      })),

      difficulty: question.difficulty,

      selectedOptionIndex: answer.selectedOptionIndex,
    };
  });
};

export const buildQuestionMap = (questions) => {
  return new Map(
    questions.map((question) => [question._id.toString(), question]),
  );
};

export const serializePracticeResult = (session, questionMap) => {
  const questions = session.answers.map((answer, index) => {
    const question = questionMap.get(answer.question.toString());

    if (!question) {
      throw new AppError(500, "Practice question could not be resolved");
    }

    const skipped =
      answer.selectedOptionIndex === null ||
      answer.selectedOptionIndex === undefined;

    const isCorrect =
      !skipped && answer.selectedOptionIndex === question.correctOptionIndex;

    return {
      id: question._id.toString(),

      number: index + 1,

      questionText: question.questionText,

      options: question.options.map((option, optionIndex) => ({
        index: optionIndex,

        text: option.text,
      })),

      selectedOptionIndex: answer.selectedOptionIndex,

      correctOptionIndex: question.correctOptionIndex,

      isCorrect,

      isSkipped: skipped,

      explanation: question.explanation || "",

      difficulty: question.difficulty,
    };
  });

  return {
    sessionId: session._id.toString(),

    mode: session.mode,

    startedAt: session.startedAt,

    submittedAt: session.submittedAt,

    score: {
      total: session.result.total,

      correct: session.result.correct,

      wrong: session.result.wrong,

      skipped: session.result.skipped,

      percentage: session.result.percentage,
    },

    questions,
  };
};
