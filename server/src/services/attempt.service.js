import crypto from "node:crypto";

import ExamAttempt from "../models/ExamAttempt.js";

import AppError from "../utils/AppError.js";

export const hashAttemptSecret = (value) => {
  return crypto.createHash("sha256").update(value).digest("hex");
};

export const createAttemptToken = () => {
  return crypto.randomBytes(32).toString("base64url");
};

const secureShuffle = (values) => {
  const result = [...values];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = crypto.randomInt(index + 1);

    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }

  return result;
};

export const buildAttemptQuestions = (version) => {
  let questions = [...version.questions];

  if (version.settings?.shuffleQuestions) {
    questions = secureShuffle(questions);
  }

  return questions.map((question) => {
    let optionOrder = question.options.map((_, index) => index);

    if (version.settings?.shuffleOptions) {
      optionOrder = secureShuffle(optionOrder);
    }

    return {
      questionId: question._id,

      optionOrder,

      selectedOptionIndex: null,

      answeredAt: null,
    };
  });
};

const createVersionQuestionMap = (version) => {
  return new Map(
    version.questions.map((question) => [question._id.toString(), question]),
  );
};

export const serializeAttemptState = (attempt, version) => {
  const questionMap = createVersionQuestionMap(version);

  const questions = attempt.questions.map((attemptQuestion, index) => {
    const question = questionMap.get(attemptQuestion.questionId.toString());

    if (!question) {
      throw new AppError(500, "Attempt question could not be resolved");
    }

    return {
      id: attemptQuestion.questionId.toString(),

      number: index + 1,

      questionText: question.questionText,

      options: attemptQuestion.optionOrder.map((sourceIndex, displayIndex) => ({
        index: displayIndex,

        text: question.options[sourceIndex].text,
      })),

      difficulty: question.difficulty,

      subjectName: question.subjectName,

      topicName: question.topicName,

      selectedOptionIndex: attemptQuestion.selectedOptionIndex,
    };
  });

  return {
    id: attempt.publicId,

    status: attempt.status,

    exam: {
      title: version.title,
      description: version.description,

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

    startedAt: attempt.startedAt,
    expiresAt: attempt.expiresAt,
    submittedAt: attempt.submittedAt,
    submissionReason: attempt.submissionReason,
    participantName: attempt.participantName,
    version: attempt.versionNumber,
    questionCount: questions.length,
    questions,
  };
};

export const finalizeAttempt = async (attempt, version, reason = "manual") => {
  if (attempt.status === "submitted") {
    return attempt;
  }

  const questionMap = createVersionQuestionMap(version);

  let correct = 0;
  let wrong = 0;
  let skipped = 0;

  for (const attemptQuestion of attempt.questions) {
    const question = questionMap.get(attemptQuestion.questionId.toString());

    if (!question) {
      throw new AppError(500, "Attempt question could not be resolved");
    }

    const selectedIndex = attemptQuestion.selectedOptionIndex;

    if (selectedIndex === null || selectedIndex === undefined) {
      skipped += 1;
      continue;
    }

    const sourceOptionIndex = attemptQuestion.optionOrder[selectedIndex];

    if (sourceOptionIndex === question.correctOptionIndex) {
      correct += 1;
    } else {
      wrong += 1;
    }
  }

  const total = attempt.questions.length;

  const percentage =
    total > 0 ? Math.round((correct / total) * 10000) / 100 : 0;

  attempt.status = "submitted";

  attempt.result = {
    total,
    correct,
    wrong,
    skipped,
    percentage,
  };

  attempt.submittedAt = new Date();

  attempt.submissionReason = reason;

  await attempt.save();

  return attempt;
};

export const buildAttemptResult = (attempt, version) => {
  const questionMap = createVersionQuestionMap(version);

  const questions = attempt.questions.map((attemptQuestion, index) => {
    const question = questionMap.get(attemptQuestion.questionId.toString());

    if (!question) {
      throw new AppError(500, "Attempt question could not be resolved");
    }

    const correctOptionIndex = attemptQuestion.optionOrder.indexOf(
      question.correctOptionIndex,
    );

    const selectedOptionIndex = attemptQuestion.selectedOptionIndex;

    const isSkipped =
      selectedOptionIndex === null || selectedOptionIndex === undefined;

    const isCorrect = !isSkipped && selectedOptionIndex === correctOptionIndex;

    return {
      id: attemptQuestion.questionId.toString(),

      number: index + 1,

      questionText: question.questionText,

      options: attemptQuestion.optionOrder.map((sourceIndex, displayIndex) => ({
        index: displayIndex,

        text: question.options[sourceIndex].text,
      })),

      selectedOptionIndex,

      correctOptionIndex,

      isCorrect,

      isSkipped,

      explanation: question.explanation || "",

      difficulty: question.difficulty,

      subjectName: question.subjectName,

      topicName: question.topicName,
    };
  });

  return {
    attemptId: attempt.publicId,

    exam: {
      title: version.title,

      version: version.version,
    },

    participantName: attempt.participantName,

    startedAt: attempt.startedAt,

    submittedAt: attempt.submittedAt,

    submissionReason: attempt.submissionReason,

    score: {
      total: attempt.result.total,

      correct: attempt.result.correct,

      wrong: attempt.result.wrong,

      skipped: attempt.result.skipped,

      percentage: attempt.result.percentage,
    },

    questions,
  };
};

export const findAttemptByToken = async (attemptId, rawToken) => {
  if (!rawToken) {
    throw new AppError(401, "Attempt access token is required");
  }

  const attempt = await ExamAttempt.findOne({
    publicId: attemptId,
  }).select("+attemptTokenHash");

  if (!attempt) {
    throw new AppError(404, "Attempt not found");
  }

  const incomingHash = hashAttemptSecret(rawToken);

  const storedBuffer = Buffer.from(attempt.attemptTokenHash, "hex");

  const incomingBuffer = Buffer.from(incomingHash, "hex");

  const matches =
    storedBuffer.length === incomingBuffer.length &&
    crypto.timingSafeEqual(storedBuffer, incomingBuffer);

  if (!matches) {
    throw new AppError(401, "Invalid attempt access token");
  }

  return attempt;
};

export const isAttemptExpired = (attempt) => {
  return Boolean(
    attempt.expiresAt && new Date() >= new Date(attempt.expiresAt),
  );
};
