import { v2 as cloudinary } from "cloudinary";

import { env } from "./env.js";

let cloudinaryReady = false;

const configureCloudinary = () => {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,

    api_key: env.CLOUDINARY_API_KEY,

    api_secret: env.CLOUDINARY_API_SECRET,

    secure: true,
  });
};

const verifyCloudinaryConnection = async () => {
  await cloudinary.api.ping();

  cloudinaryReady = true;

  console.log(`Cloudinary connected: ${env.CLOUDINARY_CLOUD_NAME}`);
};

const isCloudinaryReady = () => {
  return cloudinaryReady;
};

export {
  cloudinary,
  configureCloudinary,
  verifyCloudinaryConnection,
  isCloudinaryReady,
};
