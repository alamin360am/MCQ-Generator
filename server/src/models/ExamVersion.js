import mongoose from "mongoose";

const snapshotOptionSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
    },
  },
  {
    _id: false,
  },
);

const snapshotQuestionSchema = new mongoose.Schema(
  {
    sourceQuestion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      default: null,
    },

    questionText: {
      type: String,
      required: true,
    },

    options: {
      type: [snapshotOptionSchema],
      required: true,
    },

    correctOptionIndex: {
      type: Number,
      required: true,
    },

    explanation: {
      type: String,
      default: "",
    },

    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },

    subjectName: {
      type: String,
      default: "",
    },

    topicName: {
      type: String,
      default: "",
    },
  },
  {
    _id: true,
  },
);

const examVersionSchema = new mongoose.Schema(
  {
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
      index: true,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    version: {
      type: Number,
      required: true,
      min: 1,
    },

    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      default: "",
    },

    visibility: {
      type: String,
      enum: ["unlisted", "private", "public"],
      required: true,
    },

    settings: {
      durationMinutes: {
        type: Number,
        default: null,
      },

      shuffleQuestions: {
        type: Boolean,
        default: false,
      },

      shuffleOptions: {
        type: Boolean,
        default: false,
      },

      allowRetake: {
        type: Boolean,
        default: true,
      },

      showResultImmediately: {
        type: Boolean,
        default: true,
      },

      collectParticipantName: {
        type: Boolean,
        default: false,
      },
    },

    questions: {
      type: [snapshotQuestionSchema],
      required: true,
    },

    publishedAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

examVersionSchema.index(
  {
    exam: 1,
    version: 1,
  },
  {
    unique: true,
  },
);

const ExamVersion = mongoose.model("ExamVersion", examVersionSchema);

export default ExamVersion;
