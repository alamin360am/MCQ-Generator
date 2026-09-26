import app from "./app.js";

import {
  configureCloudinary,
  verifyCloudinaryConnection,
} from "./config/cloudinary.js";

import connectDB from "./config/db.js";
import { env } from "./config/env.js";

const startServer = async () => {
  try {
    await connectDB();

    configureCloudinary();

    await verifyCloudinaryConnection();

    app.listen(env.PORT, () => {
      console.log(`Server running on http://localhost:${env.PORT}`);

      console.log(`Environment: ${env.NODE_ENV}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);

    process.exit(1);
  }
};

startServer();
