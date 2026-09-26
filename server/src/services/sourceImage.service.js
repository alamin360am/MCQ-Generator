import SourceImage from "../models/SourceImage.js";

import AppError from "../utils/AppError.js";

export const getOwnedSourceImagesInOrder = async ({ owner, imageIds }) => {
  const images = await SourceImage.find({
    _id: {
      $in: imageIds,
    },

    owner,
  });

  if (images.length !== imageIds.length) {
    throw new AppError(
      400,
      "One or more source images are invalid or unavailable",
    );
  }

  const imageMap = new Map(
    images.map((image) => [image._id.toString(), image]),
  );

  return imageIds.map((id) => imageMap.get(id));
};
