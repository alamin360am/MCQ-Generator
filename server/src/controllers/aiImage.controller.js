import { v2 as cloudinary } from "cloudinary";

import { nanoid } from "nanoid";

import SourceImage from "../models/SourceImage.js";
import Question from "../models/Question.js";

import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";

const uploadBuffer = (buffer, options) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload_stream error:", {
            message: error.message,

            http_code: error.http_code,

            name: error.name,

            code: error.code,

            error,
          });

          reject(error);

          return;
        }

        resolve(result);
      },
    );

    stream.end(buffer);
  });
};

const serializeSourceImage = (image) => ({
  id: image._id.toString(),

  url: image.secureUrl,

  originalName: image.originalName,

  mimeType: image.originalMimeType,

  width: image.width,

  height: image.height,

  bytes: image.bytes,

  createdAt: image.createdAt,
});

export const uploadSourceImages = asyncHandler(async (req, res) => {
  const files = req.files || [];

  if (files.length === 0) {
    throw new AppError(400, "Select at least one image");
  }

  const uploadedPublicIds = [];

  const createdIds = [];

  const images = [];

  try {
    for (const file of files) {
      const cloudinaryResult = await uploadBuffer(file.buffer, {
        resource_type: "image",

        folder: "mcq-generator/ai-sources",

        public_id: nanoid(24),

        overwrite: false,
      });

      uploadedPublicIds.push(cloudinaryResult.public_id);

      const image = await SourceImage.create({
        owner: req.user._id,

        cloudinaryPublicId: cloudinaryResult.public_id,

        secureUrl: cloudinaryResult.secure_url,

        originalName: file.originalname,

        originalMimeType: file.mimetype,

        format: cloudinaryResult.format || "",

        bytes: cloudinaryResult.bytes,

        width: cloudinaryResult.width || null,

        height: cloudinaryResult.height || null,
      });

      createdIds.push(image._id);

      images.push(serializeSourceImage(image));
    }
  } catch (error) {
    console.error("Cloudinary image upload failed:", {
      message: error?.message,

      httpCode: error?.http_code,

      name: error?.name,

      code: error?.code,
    });

    if (createdIds.length > 0) {
      await SourceImage.deleteMany({
        _id: {
          $in: createdIds,
        },
      });
    }

    await Promise.allSettled(
      uploadedPublicIds.map((publicId) =>
        cloudinary.uploader.destroy(publicId, {
          invalidate: true,
        }),
      ),
    );

    if (error?.http_code === 403) {
      throw new AppError(
        502,
        "Cloudinary rejected the image upload. Check the server terminal for the Cloudinary error message.",
      );
    }

    throw error;
  }

  res.status(201).json({
    success: true,

    images,
  });
});

export const deleteSourceImage = asyncHandler(async (req, res) => {
  const image = await SourceImage.findOne({
    _id: req.params.id,

    owner: req.user._id,
  });

  if (!image) {
    throw new AppError(404, "Source image not found");
  }

  const isUsed = await Question.exists({
    owner: req.user._id,

    sourceImage: image._id,
  });

  if (isUsed) {
    throw new AppError(
      409,
      "This source image is already linked to saved questions and cannot be deleted.",
    );
  }

  await cloudinary.uploader.destroy(image.cloudinaryPublicId, {
    invalidate: true,
  });

  await image.deleteOne();

  res.json({
    success: true,

    message: "Source image deleted successfully",
  });
});
