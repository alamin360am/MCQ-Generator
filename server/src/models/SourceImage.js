import mongoose from "mongoose";

const sourceImageSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      required: true,

      index: true,
    },

    cloudinaryPublicId: {
      type: String,
      required: true,
      unique: true,
    },

    secureUrl: {
      type: String,
      required: true,
    },

    originalName: {
      type: String,
      trim: true,
      maxlength: 255,
      default: "",
    },

    originalMimeType: {
      type: String,
      trim: true,
      default: "",
    },

    format: {
      type: String,
      trim: true,
      default: "",
    },

    bytes: {
      type: Number,
      required: true,
      min: 0,
    },

    width: {
      type: Number,
      default: null,
    },

    height: {
      type: Number,
      default: null,
    },

    usedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

sourceImageSchema.index({
  owner: 1,
  createdAt: -1,
});

const SourceImage = mongoose.model("SourceImage", sourceImageSchema);

export default SourceImage;
