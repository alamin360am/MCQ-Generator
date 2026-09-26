import { z } from "zod";

const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid question ID");

const settingsSchema = z.object({
  durationMinutes: z.number().int().min(1).max(600).nullable().optional(),

  shuffleQuestions: z.boolean().optional(),

  shuffleOptions: z.boolean().optional(),

  allowRetake: z.boolean().optional(),

  showResultImmediately: z.boolean().optional(),

  collectParticipantName: z.boolean().optional(),
});

export const createExamSchema = z.object({
  title: z.string().trim().min(2, "Exam title is too short").max(160),

  description: z.string().trim().max(3000).optional().default(""),

  questionIds: z
    .array(objectIdSchema)
    .min(1, "Select at least one question")
    .max(500, "Maximum 500 questions are allowed in one exam"),

  visibility: z.enum(["unlisted", "private", "public"]).default("unlisted"),

  settings: settingsSchema.optional().default({}),
});

export const updateExamSchema = z.object({
  title: z.string().trim().min(2).max(160).optional(),

  description: z.string().trim().max(3000).optional(),

  questionIds: z.array(objectIdSchema).min(1).max(500).optional(),

  visibility: z.enum(["unlisted", "private", "public"]).optional(),

  settings: settingsSchema.partial().optional(),
});
