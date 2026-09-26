import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce.number().default(5000),

  CORS_ORIGINS: z.string().default("http://localhost:5173"),

  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),

  CLOUDINARY_CLOUD_NAME: z.string().trim().min(1),

  CLOUDINARY_API_KEY: z.string().trim().min(1),

  CLOUDINARY_API_SECRET: z.string().trim().min(1),

  JWT_ACCESS_SECRET: z
    .string()
    .min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),

  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),

  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),

  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  AUTH_COOKIE_NAME: z.string().default("mcq_refresh_token"),

  GEMINI_API_KEY: z.string().trim().optional().default(""),

  GEMINI_MODEL: z.string().trim().min(1).default("gemini-3.8-flash"),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error("❌ Invalid environment configuration:");

  console.error(result.error.flatten().fieldErrors);

  process.exit(1);
}

export const env = result.data;
