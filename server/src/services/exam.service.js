import Question from "../models/Question.js";

import AppError from "../utils/AppError.js";

export const getOwnedQuestions = async ({ owner, questionIds }) => {
  const uniqueIds = [...new Set(questionIds.map(String))];

  if (uniqueIds.length !== questionIds.length) {
    throw new AppError(400, "Duplicate questions are not allowed in an exam");
  }

  const questions = await Question.find({
    _id: {
      $in: uniqueIds,
    },

    owner,

    status: "active",
  })
    .populate("subject", "name")
    .populate("topic", "name");

  if (questions.length !== uniqueIds.length) {
    throw new AppError(
      400,
      "One or more selected questions are invalid or unavailable",
    );
  }

  const questionMap = new Map(
    questions.map((question) => [question._id.toString(), question]),
  );

  return uniqueIds.map((id) => questionMap.get(id));
};

export const createExamQuestionSnapshots = (questions) => {
  return questions.map((question) => ({
    sourceQuestion: question._id,

    questionText: question.questionText,

    options: question.options.map((option) => ({
      text: option.text,
    })),

    correctOptionIndex: question.correctOptionIndex,

    explanation: question.explanation || "",

    difficulty: question.difficulty,

    subjectName: question.subject?.name || "",

    topicName: question.topic?.name || "",
  }));
};
