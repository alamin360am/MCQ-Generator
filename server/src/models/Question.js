import mongoose from "mongoose";

const optionSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
  },
  {
    _id: false,
  },
);

const questionSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    questionText: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 5000,
    },

    options: {
      type: [optionSchema],
      required: true,

      validate: {
        validator(value) {
          return value.length >= 2 && value.length <= 6;
        },

        message: "A question must contain between 2 and 6 options",
      },
    },

    correctOptionIndex: {
      type: Number,
      required: true,
      min: 0,
    },

    explanation: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: "",
    },

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
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },

    sourceType: {
      type: String,
      enum: ["manual", "import", "ai-image", "ai-text"],
      default: "manual",
    },

    sourceImage: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "SourceImage",

      default: null,
    },

    sourcePage: {
      type: Number,
      min: 1,
      default: null,
    },

    aiModel: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },

    tags: {
      type: [String],
      default: [],
    },

    isBookmarked: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
    },

    stats: {
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
    },
  },
  {
    timestamps: true,
  },
);

questionSchema.pre("validate", function () {
  if (!Array.isArray(this.options)) {
    return;
  }

  if (typeof this.correctOptionIndex !== "number") {
    return;
  }

  if (this.correctOptionIndex >= this.options.length) {
    this.invalidate(
      "correctOptionIndex",
      "Correct option must point to an existing option",
    );
  }
});

questionSchema.index({
  owner: 1,
  createdAt: -1,
});

questionSchema.index({
  owner: 1,
  subject: 1,
  topic: 1,
});

questionSchema.index({
  owner: 1,
  difficulty: 1,
});

questionSchema.index({
  owner: 1,
  isBookmarked: 1,
});

questionSchema.index({
  owner: 1,
  sourceImage: 1,
});

const Question = mongoose.model("Question", questionSchema);

export default Question;
