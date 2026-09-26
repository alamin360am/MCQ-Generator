import {
  env,
} from "./src/config/env.js";

const tinyPngBase64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nZkAAAAASUVORK5CYII=";

const fileBuffer =
  Buffer.from(
    tinyPngBase64,
    "base64",
  );

const formData =
  new FormData();

formData.append(
  "file",
  new Blob(
    [fileBuffer],
    {
      type:
        "image/png",
    },
  ),
  "test.png",
);

const basicAuth =
  Buffer.from(
    `${env.CLOUDINARY_API_KEY}:${env.CLOUDINARY_API_SECRET}`,
  ).toString(
    "base64",
  );

const url =
  `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/upload`;

try {
  const response =
    await fetch(
      url,
      {
        method:
          "POST",

        headers: {
          Authorization:
            `Basic ${basicAuth}`,
        },

        body:
          formData,
      },
    );

  const responseText =
    await response.text();

  console.log(
    "STATUS:",
    response.status,
  );

  console.log(
    "X-CLD-ERROR:",
    response.headers.get(
      "x-cld-error",
    ),
  );

  console.log(
    "RESPONSE:",
    responseText,
  );
} catch (error) {
  console.error(
    "REQUEST FAILED:",
    error,
  );
}