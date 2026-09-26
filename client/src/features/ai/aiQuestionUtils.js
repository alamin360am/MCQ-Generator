const createLocalId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()}`;
};

export const validateAiQuestion = (question, imageCount) => {
  const errors = [];

  if (!question.questionText?.trim()) {
    errors.push("Question text is required");
  }

  if (question.questionText?.trim().length > 5000) {
    errors.push("Question is too long");
  }

  if (!Array.isArray(question.options) || question.options.length < 2) {
    errors.push("At least 2 options are required");
  }

  if (question.options?.length > 6) {
    errors.push("Maximum 6 options are allowed");
  }

  if (question.options?.some((option) => !option.text?.trim())) {
    errors.push("One or more options are empty");
  }

  if (
    !Number.isInteger(question.correctOptionIndex) ||
    question.correctOptionIndex < 0 ||
    question.correctOptionIndex >= question.options.length
  ) {
    errors.push("Select a valid correct answer");
  }

  if (!["easy", "medium", "hard"].includes(question.difficulty)) {
    errors.push("Invalid difficulty");
  }

  if (
    !Number.isInteger(question.sourcePage) ||
    question.sourcePage < 1 ||
    question.sourcePage > imageCount
  ) {
    errors.push("Select a valid source page");
  }

  if ((question.explanation || "").length > 5000) {
    errors.push("Explanation is too long");
  }

  return {
    ...question,

    errors,

    isValid: errors.length === 0,
  };
};

export const prepareGeneratedQuestions = (questions, imageCount) => {
  return questions.map((question) =>
    validateAiQuestion(
      {
        ...question,

        localId: createLocalId(),

        selected: true,

        tagsText: "",

        options: question.options.map((option) => ({
          ...option,

          localId: createLocalId(),
        })),
      },

      imageCount,
    ),
  );
};

export const questionToSavePayload = (question) => {
  return {
    questionText: question.questionText.trim(),

    options: question.options.map((option) => ({
      text: option.text.trim(),
    })),

    correctOptionIndex: question.correctOptionIndex,

    explanation: question.explanation?.trim() || "",

    difficulty: question.difficulty,

    sourcePage: question.sourcePage,

    tags: question.tagsText
      ? question.tagsText
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      : [],
  };
};
