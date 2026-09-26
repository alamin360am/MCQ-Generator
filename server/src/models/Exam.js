import mongoose from "mongoose";

const examSettingsSchema = new mongoose.Schema(
  {
    durationMinutes: {
      type: Number,
      default: null,
      min: 1,
      max: 600,
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
  {
    _id: false,
  },
);

const examSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 160,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: "",
    },

    questionIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
      },
    ],

    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },

    visibility: {
      type: String,
      enum: ["unlisted", "private", "public"],
      default: "unlisted",
    },

    shareId: {
      type: String,
      default: null,
    },

    currentVersion: {
      type: Number,
      default: 0,
      min: 0,
    },

    settings: {
      type: examSettingsSchema,
      default: () => ({}),
    },

    publishedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

examSchema.index(
  {
    shareId: 1,
  },
  {
    unique: true,
    sparse: true,
  },
);

examSchema.index({
  owner: 1,
  createdAt: -1,
});

examSchema.index({
  owner: 1,
  status: 1,
});

const Exam = mongoose.model("Exam", examSchema);

export default Exam;
