import { z } from "zod";

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID");

export const subjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Subject name must contain at least 2 characters")
    .max(80, "Subject name is too long"),
});

export const topicSchema = z.object({
  subjectId: objectIdSchema,

  name: z
    .string()
    .trim()
    .min(2, "Topic name must contain at least 2 characters")
    .max(100, "Topic name is too long"),
});

const optionSchema = z.object({
  text: z.string().trim().min(1, "Option cannot be empty").max(1000),
});

export const createQuestionSchema = z
  .object({
    questionText: z.string().trim().min(2, "Question is too short").max(5000),

    options: z
      .array(optionSchema)
      .min(2, "At least 2 options are required")
      .max(6, "Maximum 6 options are allowed"),

    correctOptionIndex: z.number().int().min(0),

    explanation: z.string().trim().max(5000).optional().default(""),

    subjectId: objectIdSchema.nullable().optional(),

    topicId: objectIdSchema.nullable().optional(),

    difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),

    tags: z
      .array(z.string().trim().min(1).max(40))
      .max(20)
      .optional()
      .default([]),
  })
  .refine((data) => data.correctOptionIndex < data.options.length, {
    message: "Correct option must point to an existing option",

    path: ["correctOptionIndex"],
  });

export const updateQuestionSchema = z.object({
  questionText: z.string().trim().min(2).max(5000).optional(),

  options: z.array(optionSchema).min(2).max(6).optional(),

  correctOptionIndex: z.number().int().min(0).optional(),

  explanation: z.string().trim().max(5000).optional(),

  subjectId: objectIdSchema.nullable().optional(),

  topicId: objectIdSchema.nullable().optional(),

  difficulty: z.enum(["easy", "medium", "hard"]).optional(),

  tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),

  status: z.enum(["active", "archived"]).optional(),
});

const bulkQuestionItemSchema = z
  .object({
    questionText: z.string().trim().min(2, "Question is too short").max(5000),

    options: z
      .array(optionSchema)
      .min(2, "At least 2 options are required")
      .max(6, "Maximum 6 options are allowed"),

    correctOptionIndex: z.number().int().min(0),

    explanation: z.string().trim().max(5000).optional().default(""),

    difficulty: z.enum(["easy", "medium", "hard"]).optional(),

    tags: z
      .array(z.string().trim().min(1).max(40))
      .max(20)
      .optional()
      .default([]),
  })
  .refine((data) => data.correctOptionIndex < data.options.length, {
    message: "Correct option must point to an existing option",

    path: ["correctOptionIndex"],
  });

export const bulkImportQuestionSchema = z.object({
  subjectId: objectIdSchema.nullable().optional(),

  topicId: objectIdSchema.nullable().optional(),

  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),

  questions: z
    .array(bulkQuestionItemSchema)
    .min(1, "At least one question is required")
    .max(200, "Maximum 200 questions can be imported at once"),
});
