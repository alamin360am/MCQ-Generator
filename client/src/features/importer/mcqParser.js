const bengaliDigits = {
  "০": "0",
  "১": "1",
  "২": "2",
  "৩": "3",
  "৪": "4",
  "৫": "5",
  "৬": "6",
  "৭": "7",
  "৮": "8",
  "৯": "9",
};

const banglaOptionMap = {
  ক: 0,
  খ: 1,
  গ: 2,
  ঘ: 3,
  ঙ: 4,
  চ: 5,
};

const toEnglishDigits = (value) => {
  return String(value).replace(/[০-৯]/g, (digit) => bengaliDigits[digit]);
};

const createLocalId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()}`;
};

const answerToIndex = (rawAnswer, optionCount) => {
  if (rawAnswer === null || rawAnswer === undefined || rawAnswer === "") {
    return null;
  }

  const normalized = String(rawAnswer).trim();

  const upper = normalized.toUpperCase();

  if (/^[A-F]$/.test(upper)) {
    const index = upper.charCodeAt(0) - "A".charCodeAt(0);

    return index < optionCount ? index : null;
  }

  if (Object.prototype.hasOwnProperty.call(banglaOptionMap, normalized)) {
    const index = banglaOptionMap[normalized];

    return index < optionCount ? index : null;
  }

  const numericValue = Number(toEnglishDigits(normalized));

  if (Number.isInteger(numericValue)) {
    const index = numericValue - 1;

    return index >= 0 && index < optionCount ? index : null;
  }

  return null;
};

export const validateImportQuestion = (question) => {
  const errors = [];

  if (!question.questionText?.trim()) {
    errors.push("Question text is missing");
  }

  if (question.options.length < 2) {
    errors.push("At least 2 options are required");
  }

  if (question.options.length > 6) {
    errors.push("Maximum 6 options are allowed");
  }

  if (question.options.some((option) => !option.text?.trim())) {
    errors.push("One or more options are empty");
  }

  if (
    !Number.isInteger(question.correctOptionIndex) ||
    question.correctOptionIndex < 0 ||
    question.correctOptionIndex >= question.options.length
  ) {
    errors.push("Correct answer is missing or invalid");
  }

  return {
    ...question,

    errors,

    isValid: errors.length === 0,
  };
};

export const parseMcqText = (sourceText, defaultDifficulty = "medium") => {
  const text = sourceText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  const lines = text.split("\n");

  const parsed = [];

  let current = null;
  let readingExplanation = false;

  const createQuestion = (questionText = "") => ({
    localId: createLocalId(),

    questionText: questionText.trim(),

    options: [],

    rawAnswer: null,

    correctOptionIndex: null,

    explanation: "",

    difficulty: defaultDifficulty,

    tagsText: "",

    warnings: [],
  });

  const finalizeCurrent = () => {
    if (!current) {
      return;
    }

    const hasContent =
      current.questionText || current.options.length > 0 || current.rawAnswer;

    if (!hasContent) {
      current = null;
      return;
    }

    current.correctOptionIndex = answerToIndex(
      current.rawAnswer,
      current.options.length,
    );

    delete current.rawAnswer;

    parsed.push(validateImportQuestion(current));

    current = null;
    readingExplanation = false;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      if (readingExplanation && current?.explanation) {
        readingExplanation = false;
      }

      continue;
    }

    const numberedQuestion = line.match(
      /^\s*(?:Q(?:uestion)?\s*)?([0-9০-৯]+)[.)\-:।]\s*(.+)$/i,
    );

    const namedQuestion = line.match(/^\s*Q(?:uestion)?\s*[:\-]\s*(.+)$/i);

    if (numberedQuestion || namedQuestion) {
      finalizeCurrent();

      const questionText = numberedQuestion
        ? numberedQuestion[2]
        : namedQuestion[1];

      current = createQuestion(questionText);

      continue;
    }

    const optionMatch = line.match(
      /^\s*([A-Fa-f]|ক|খ|গ|ঘ|ঙ|চ)\s*[.)\-:।]\s*(.+)$/,
    );

    if (optionMatch) {
      if (!current) {
        current = createQuestion();
      }

      current.options.push({
        text: optionMatch[2].trim(),
      });

      readingExplanation = false;

      continue;
    }

    const answerMatch = line.match(
      /^\s*(?:ANSWER|ANS|CORRECT(?:\s+ANSWER)?|উত্তর|সঠিক\s*উত্তর)\s*[:\-：]\s*(?:OPTION\s*)?([A-Fa-f]|ক|খ|গ|ঘ|ঙ|চ|[0-9০-৯]+)\s*[.)]?\s*$/i,
    );

    if (answerMatch) {
      if (!current) {
        current = createQuestion();
      }

      current.rawAnswer = answerMatch[1];

      readingExplanation = false;

      continue;
    }

    const explanationMatch = line.match(
      /^\s*(?:EXPLANATION|EXPLAIN|ব্যাখ্যা)\s*[:\-：]\s*(.*)$/i,
    );

    if (explanationMatch) {
      if (!current) {
        current = createQuestion();
      }

      current.explanation = explanationMatch[1].trim();

      readingExplanation = true;

      continue;
    }

    if (current && readingExplanation) {
      current.explanation = [current.explanation, line]
        .filter(Boolean)
        .join(" ");

      continue;
    }

    if (current && current.options.length === 0 && !current.rawAnswer) {
      current.questionText = [current.questionText, line]
        .filter(Boolean)
        .join(" ");

      continue;
    }

    if (!current) {
      current = createQuestion(line);

      continue;
    }

    current.warnings.push(`Unrecognized line: ${line}`);
  }

  finalizeCurrent();

  return parsed;
};
