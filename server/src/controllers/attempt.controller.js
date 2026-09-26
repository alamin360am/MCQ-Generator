import crypto from "node:crypto";

import { nanoid } from "nanoid";

import Exam from "../models/Exam.js";
import ExamVersion from "../models/ExamVersion.js";
import ExamAttempt from "../models/ExamAttempt.js";

import {
  buildAttemptQuestions,
  buildAttemptResult,
  createAttemptToken,
  finalizeAttempt,
  findAttemptByToken,
  hashAttemptSecret,
  isAttemptExpired,
  serializeAttemptState,
} from "../services/attempt.service.js";

import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";

import { env } from "../config/env.js";

const GUEST_COOKIE_NAME = "mcq_guest_id";

const getAttemptTokenFromRequest = (req) => {
  return req.get("x-attempt-token") || null;
};

const getOrCreateGuestId = (req, res) => {
  let guestId = req.cookies[GUEST_COOKIE_NAME];

  if (guestId) {
    return guestId;
  }

  guestId = crypto.randomBytes(24).toString("base64url");

  res.cookie(GUEST_COOKIE_NAME, guestId, {
    httpOnly: true,

    secure: env.NODE_ENV === "production",

    sameSite: "strict",

    maxAge: 365 * 24 * 60 * 60 * 1000,

    path: "/",
  });

  return guestId;
};

const getVersionForAttempt = async (attempt) => {
  const version = await ExamVersion.findById(attempt.examVersion);

  if (!version) {
    throw new AppError(404, "Exam version could not be found");
  }

  return version;
};

export const startAttempt = asyncHandler(async (req, res) => {
  const exam = await Exam.findOne({
    shareId: req.params.shareId,

    status: "published",

    visibility: {
      $in: ["unlisted", "public"],
    },
  });

  if (!exam) {
    throw new AppError(404, "Exam not found or unavailable");
  }

  const version = await ExamVersion.findOne({
    exam: exam._id,

    version: exam.currentVersion,
  });

  if (!version) {
    throw new AppError(404, "Published exam version could not be found");
  }

  const enteredName = req.body.participantName?.trim() || "";

  const effectiveName = enteredName || req.user?.name || "";

  if (version.settings?.collectParticipantName && effectiveName.length < 2) {
    throw new AppError(400, "Participant name is required");
  }

  let guestIdHash = null;

  if (!req.user) {
    const guestId = getOrCreateGuestId(req, res);

    guestIdHash = hashAttemptSecret(guestId);
  }

  if (version.settings?.allowRetake === false) {
    const previousAttemptFilter = {
      exam: exam._id,

      status: {
        $in: ["in_progress", "submitted"],
      },
    };

    if (req.user) {
      previousAttemptFilter.participantUser = req.user._id;
    } else {
      previousAttemptFilter.guestIdHash = guestIdHash;
    }

    const alreadyAttempted = await ExamAttempt.exists(previousAttemptFilter);

    if (alreadyAttempted) {
      throw new AppError(409, "This exam does not allow another attempt");
    }
  }

  const startedAt = new Date();

  let expiresAt = null;

  const durationMinutes = version.settings?.durationMinutes;

  if (Number.isFinite(durationMinutes) && durationMinutes > 0) {
    expiresAt = new Date(startedAt.getTime() + durationMinutes * 60 * 1000);
  }

  const attemptToken = createAttemptToken();

  const attempt = await ExamAttempt.create({
    publicId: nanoid(20),

    attemptTokenHash: hashAttemptSecret(attemptToken),

    exam: exam._id,

    examVersion: version._id,

    versionNumber: version.version,

    participantUser: req.user?._id || null,

    participantName: effectiveName,

    guestIdHash,

    questions: buildAttemptQuestions(version),

    startedAt,

    expiresAt,

    ip: req.ip || null,

    userAgent: req.get("user-agent")?.slice(0, 500) || null,
  });

  res.status(201).json({
    success: true,

    message: "Exam attempt started",

    attemptToken,

    exam: {
      shareId: exam.shareId,

      title: version.title,

      description: version.description,

      settings: {
        durationMinutes: version.settings?.durationMinutes ?? null,

        allowRetake: version.settings?.allowRetake ?? true,

        showResultImmediately: version.settings?.showResultImmediately ?? true,

        collectParticipantName:
          version.settings?.collectParticipantName ?? false,
      },
    },

    attempt: serializeAttemptState(attempt, version),
  });
});

export const getAttemptState = asyncHandler(async (req, res) => {
  const attempt = await findAttemptByToken(
    req.params.attemptId,

    getAttemptTokenFromRequest(req),
  );

  const version = await getVersionForAttempt(attempt);

  if (attempt.status === "in_progress" && isAttemptExpired(attempt)) {
    await finalizeAttempt(attempt, version, "time_expired");
  }

  res.json({
    success: true,

    attempt: serializeAttemptState(attempt, version),

    resultAvailable:
      attempt.status === "submitted" &&
      Boolean(version.settings?.showResultImmediately),
  });
});

export const saveAttemptAnswers = asyncHandler(async (req, res) => {
  const attempt = await findAttemptByToken(
    req.params.attemptId,

    getAttemptTokenFromRequest(req),
  );

  const version = await getVersionForAttempt(attempt);

  if (attempt.status !== "in_progress") {
    throw new AppError(409, "This attempt has already been submitted");
  }

  if (isAttemptExpired(attempt)) {
    await finalizeAttempt(attempt, version, "time_expired");

    throw new AppError(409, "The exam time limit has expired");
  }

  const questionMap = new Map(
    attempt.questions.map((question, index) => [
      question.questionId.toString(),
      {
        question,
        index,
      },
    ]),
  );

  const now = new Date();

  for (const answer of req.body.answers) {
    const matched = questionMap.get(answer.questionId);

    if (!matched) {
      throw new AppError(
        400,
        "One or more answers refer to an invalid question",
      );
    }

    if (
      answer.selectedOptionIndex !== null &&
      answer.selectedOptionIndex >= matched.question.optionOrder.length
    ) {
      throw new AppError(400, "One or more selected answers are invalid");
    }

    matched.question.selectedOptionIndex = answer.selectedOptionIndex;

    matched.question.answeredAt =
      answer.selectedOptionIndex === null ? null : now;
  }

  attempt.markModified("questions");

  await attempt.save();

  const answeredCount = attempt.questions.filter(
    (question) =>
      question.selectedOptionIndex !== null &&
      question.selectedOptionIndex !== undefined,
  ).length;

  res.json({
    success: true,

    savedAt: new Date(),

    answeredCount,
  });
});

export const submitAttempt = asyncHandler(async (req, res) => {
  const attempt = await findAttemptByToken(
    req.params.attemptId,

    getAttemptTokenFromRequest(req),
  );

  const version = await getVersionForAttempt(attempt);

  if (attempt.status !== "submitted") {
    const reason = isAttemptExpired(attempt) ? "time_expired" : "manual";

    await finalizeAttempt(attempt, version, reason);
  }

  const showResult = Boolean(version.settings?.showResultImmediately);

  if (!showResult) {
    return res.json({
      success: true,

      message: "Exam submitted successfully",

      resultAvailable: false,

      attempt: {
        id: attempt.publicId,

        status: attempt.status,

        submittedAt: attempt.submittedAt,
      },
    });
  }

  res.json({
    success: true,

    message: "Exam submitted successfully",

    resultAvailable: true,

    result: buildAttemptResult(attempt, version),
  });
});

export const getAttemptResult = asyncHandler(async (req, res) => {
  const attempt = await findAttemptByToken(
    req.params.attemptId,

    getAttemptTokenFromRequest(req),
  );

  const version = await getVersionForAttempt(attempt);

  if (attempt.status === "in_progress" && isAttemptExpired(attempt)) {
    await finalizeAttempt(attempt, version, "time_expired");
  }

  if (attempt.status !== "submitted") {
    throw new AppError(409, "Submit the exam before viewing the result");
  }

  if (!version.settings?.showResultImmediately) {
    return res.json({
      success: true,

      resultAvailable: false,

      message:
        "Your exam has been submitted. Results are not available immediately for this exam.",
    });
  }

  res.json({
    success: true,

    resultAvailable: true,

    result: buildAttemptResult(attempt, version),
  });
});

export const getExamAttempts = asyncHandler(async (req, res) => {
  const exam = await Exam.findOne({
    _id: req.params.id,

    owner: req.user._id,
  });

  if (!exam) {
    throw new AppError(404, "Exam not found");
  }

  const page = Math.max(Number(req.query.page) || 1, 1);

  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);

  const filter = {
    exam: exam._id,
  };

  if (["in_progress", "submitted"].includes(req.query.status)) {
    filter.status = req.query.status;
  }

  const skip = (page - 1) * limit;

  const [attempts, total] = await Promise.all([
    ExamAttempt.find(filter)
      .select(
        [
          "publicId",
          "versionNumber",
          "participantUser",
          "participantName",
          "status",
          "result",
          "questions",
          "startedAt",
          "expiresAt",
          "submittedAt",
          "submissionReason",
          "createdAt",
        ].join(" "),
      )
      .populate("participantUser", "name email")
      .skip(skip)
      .limit(limit)
      .lean(),

    ExamAttempt.countDocuments(filter),
  ]);

  res.json({
    success: true,

    attempts: attempts.map((attempt) => ({
      id: attempt.publicId,

      version: attempt.versionNumber,

      participant: attempt.participantUser
        ? {
            type: "user",

            name: attempt.participantUser.name,

            email: attempt.participantUser.email,
          }
        : {
            type: "guest",

            name: attempt.participantName || "Guest",
          },

      status: attempt.status,

      questionCount: attempt.questions.length,

      answeredCount: attempt.questions.filter(
        (question) =>
          question.selectedOptionIndex !== null &&
          question.selectedOptionIndex !== undefined,
      ).length,

      score: attempt.status === "submitted" ? attempt.result : null,

      startedAt: attempt.startedAt,

      submittedAt: attempt.submittedAt,

      submissionReason: attempt.submissionReason,
    })),

    pagination: {
      page,
      limit,
      total,

      totalPages: Math.max(Math.ceil(total / limit), 1),
    },
  });
});

export const getExamAttemptDetail = asyncHandler(async (req, res) => {
  const exam = await Exam.findOne({
    _id: req.params.id,

    owner: req.user._id,
  });

  if (!exam) {
    throw new AppError(404, "Exam not found");
  }

  const attempt = await ExamAttempt.findOne({
    publicId: req.params.attemptId,

    exam: exam._id,
  }).populate("participantUser", "name email");

  if (!attempt) {
    throw new AppError(404, "Attempt not found");
  }

  const version = await getVersionForAttempt(attempt);

  if (attempt.status === "in_progress" && isAttemptExpired(attempt)) {
    await finalizeAttempt(attempt, version, "time_expired");
  }

  const answeredCount = attempt.questions.filter(
    (question) =>
      question.selectedOptionIndex !== null &&
      question.selectedOptionIndex !== undefined,
  ).length;

  res.json({
    success: true,

    attempt: {
      id: attempt.publicId,

      participant: attempt.participantUser
        ? {
            type: "user",

            name: attempt.participantUser.name,

            email: attempt.participantUser.email,
          }
        : {
            type: "guest",

            name: attempt.participantName || "Guest",
          },

      status: attempt.status,

      version: attempt.versionNumber,

      progress: {
        questionCount: attempt.questions.length,

        answeredCount,
      },

      startedAt: attempt.startedAt,

      expiresAt: attempt.expiresAt,

      submittedAt: attempt.submittedAt,

      submissionReason: attempt.submissionReason,

      result:
        attempt.status === "submitted"
          ? buildAttemptResult(attempt, version)
          : null,
    },
  });
});
