import mongoose from "mongoose";

const topicSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
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

topicSchema.index(
  {
    owner: 1,
    subject: 1,
    normalizedName: 1,
  },
  {
    unique: true,
  },
);

topicSchema.index({
  owner: 1,
  subject: 1,
  createdAt: -1,
});

const Topic = mongoose.model("Topic", topicSchema);

export default Topic;
