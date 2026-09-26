import mongoose from "mongoose";

const practiceAnswerSchema = new mongoose.Schema(
  {
    question: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "Question",

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

    isCorrect: {
      type: Boolean,
      default: null,
    },
  },
  {
    _id: false,
  },
);

const practiceResultSchema = new mongoose.Schema(
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

const practiceSessionSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      required: true,

      index: true,
    },

    mode: {
      type: String,

      enum: ["random", "bookmarked", "wrong", "filtered"],

      required: true,
    },

    filters: {
      subject: {
        type: mongoose.Schema.Types.ObjectId,

        ref: "Subject",

        default: null,
      },

      topic: {
        type: mongoose.Schema.Types.ObjectId,

        ref: "Topic",

        default: null,
      },

      difficulty: {
        type: String,

        enum: ["easy", "medium", "hard", null],

        default: null,
      },
    },

    answers: {
      type: [practiceAnswerSchema],

      required: true,
    },

    status: {
      type: String,

      enum: ["in_progress", "submitted"],

      default: "in_progress",

      index: true,
    },

    result: {
      type: practiceResultSchema,

      default: () => ({}),
    },

    startedAt: {
      type: Date,
      required: true,
    },

    submittedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

practiceSessionSchema.index({
  owner: 1,
  createdAt: -1,
});

practiceSessionSchema.index({
  owner: 1,
  status: 1,
});

const PracticeSession = mongoose.model(
  "PracticeSession",
  practiceSessionSchema,
);

export default PracticeSession;
