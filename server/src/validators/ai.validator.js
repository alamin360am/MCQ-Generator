import { z } from "zod";

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID");

const uniqueImageIds = (ids) => {
  return new Set(ids).size === ids.length;
};

export const generateImageMcqSchema = z
  .object({
    imageIds: z
      .array(objectIdSchema)
      .min(1, "At least one image is required")
      .max(8, "Maximum 8 images can be processed at once"),

    questionCount: z.number().int().min(1).max(40),

    language: z.enum(["auto", "bn", "en"]).default("auto"),

    difficulty: z.enum(["mixed", "easy", "medium", "hard"]).default("mixed"),

    customInstructions: z.string().trim().max(1000).optional().default(""),
  })
  .refine((data) => uniqueImageIds(data.imageIds), {
    message: "Duplicate images are not allowed",

    path: ["imageIds"],
  });

const reviewedOptionSchema = z.object({
  text: z.string().trim().min(1).max(1000),
});

const reviewedAiQuestionSchema = z
  .object({
    questionText: z.string().trim().min(2).max(5000),

    options: z.array(reviewedOptionSchema).min(2).max(6),

    correctOptionIndex: z.number().int().min(0),

    explanation: z.string().trim().max(5000).optional().default(""),

    difficulty: z.enum(["easy", "medium", "hard"]),

    sourcePage: z.number().int().min(1),

    tags: z
      .array(z.string().trim().min(1).max(40))
      .max(20)
      .optional()
      .default([]),
  })
  .refine((data) => data.correctOptionIndex < data.options.length, {
    message: "Correct option is invalid",

    path: ["correctOptionIndex"],
  });

export const saveImageMcqsSchema = z
  .object({
    imageIds: z.array(objectIdSchema).min(1).max(8),

    subjectId: objectIdSchema.nullable().optional(),

    topicId: objectIdSchema.nullable().optional(),

    questions: z.array(reviewedAiQuestionSchema).min(1).max(40),
  })
  .refine((data) => uniqueImageIds(data.imageIds), {
    message: "Duplicate images are not allowed",

    path: ["imageIds"],
  });
