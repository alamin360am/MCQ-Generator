import { cloudinary, configureCloudinary } from "./src/config/cloudinary.js";

configureCloudinary();

const tinyPng =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nZkAAAAASUVORK5CYII=";

try {
  console.log("Testing Cloudinary upload...");

  const result = await cloudinary.uploader.upload(tinyPng, {
    resource_type: "image",
  });

  console.log("UPLOAD SUCCESS:", {
    publicId: result.public_id,

    url: result.secure_url,
  });

  await cloudinary.uploader.destroy(result.public_id);
} catch (error) {
  console.error("UPLOAD FAILED:", {
    message: error?.message,

    httpCode: error?.http_code,

    name: error?.name,

    code: error?.code,
  });
}
