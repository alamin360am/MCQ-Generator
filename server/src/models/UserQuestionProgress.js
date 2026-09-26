import mongoose from "mongoose";

const userQuestionProgressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      required: true,

      index: true,
    },

    question: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "Question",

      required: true,

      index: true,
    },

    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },

    correct: {
      type: Number,
      default: 0,
      min: 0,
    },

    wrong: {
      type: Number,
      default: 0,
      min: 0,
    },

    skipped: {
      type: Number,
      default: 0,
      min: 0,
    },

    needsReview: {
      type: Boolean,
      default: false,
      index: true,
    },

    lastWasCorrect: {
      type: Boolean,
      default: null,
    },

    lastSelectedOptionIndex: {
      type: Number,
      default: null,
    },

    lastAttemptAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

userQuestionProgressSchema.index(
  {
    user: 1,
    question: 1,
  },
  {
    unique: true,
  },
);

userQuestionProgressSchema.index({
  user: 1,
  needsReview: 1,
  lastAttemptAt: -1,
});

const UserQuestionProgress = mongoose.model(
  "UserQuestionProgress",
  userQuestionProgressSchema,
);

export default UserQuestionProgress;
