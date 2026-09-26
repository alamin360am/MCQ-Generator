import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },

    normalizedName: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

subjectSchema.index(
  {
    owner: 1,
    normalizedName: 1,
  },
  {
    unique: true,
  },
);

subjectSchema.index({
  owner: 1,
  createdAt: -1,
});

const Subject = mongoose.model("Subject", subjectSchema);

export default Subject;
