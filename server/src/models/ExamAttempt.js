import mongoose from "mongoose";

const attemptQuestionSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    optionOrder: {
      type: [Number],
      required: true,
    },

    selectedOptionIndex: {
      type: Number,
      default: null,
      min: 0,
    },

    answeredAt: {
      type: Date,
      default: null,
    },
  },
  {
    _id: false,
  },
);

const resultSchema = new mongoose.Schema(
  {
    total: {
      type: Number,
      default: null,
    },

    correct: {
      type: Number,
      default: null,
    },

    wrong: {
      type: Number,
      default: null,
    },

    skipped: {
      type: Number,
      default: null,
    },

    percentage: {
      type: Number,
      default: null,
    },
  },
  {
    _id: false,
  },
);

const examAttemptSchema = new mongoose.Schema(
  {
    publicId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    attemptTokenHash: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },

    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
      index: true,
    },

    examVersion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExamVersion",
      required: true,
    },

    versionNumber: {
      type: Number,
      required: true,
    },

    participantUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    participantName: {
      type: String,
      trim: true,
      maxlength: 80,
      default: "",
    },

    guestIdHash: {
      type: String,
      default: null,
      index: true,
    },

    status: {
      type: String,
      enum: ["in_progress", "submitted"],
      default: "in_progress",
      index: true,
    },

    questions: {
      type: [attemptQuestionSchema],
      required: true,
    },

    result: {
      type: resultSchema,
      default: () => ({}),
    },

    startedAt: {
      type: Date,
      required: true,
    },

    expiresAt: {
      type: Date,
      default: null,
    },

    submittedAt: {
      type: Date,
      default: null,
    },

    submissionReason: {
      type: String,
      enum: ["manual", "time_expired"],
      default: null,
    },

    ip: {
      type: String,
      default: null,
    },

    userAgent: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

examAttemptSchema.index({
  exam: 1,
  createdAt: -1,
});

examAttemptSchema.index({
  exam: 1,
  participantUser: 1,
  status: 1,
});

examAttemptSchema.index({
  exam: 1,
  guestIdHash: 1,
  status: 1,
});

const ExamAttempt = mongoose.model("ExamAttempt", examAttemptSchema);

export default ExamAttempt;
