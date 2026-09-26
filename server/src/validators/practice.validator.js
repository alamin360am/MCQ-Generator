import { z } from "zod";

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID");

export const startPracticeSchema = z.object({
  mode: z.enum(["random", "bookmarked", "wrong", "filtered"]),

  count: z.number().int().min(1).max(100).default(10),

  subjectId: objectIdSchema.nullable().optional(),

  topicId: objectIdSchema.nullable().optional(),

  difficulty: z.enum(["easy", "medium", "hard"]).nullable().optional(),
});

export const savePracticeAnswersSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: objectIdSchema,

        selectedOptionIndex: z.number().int().min(0).max(5).nullable(),
      }),
    )
    .min(1)
    .max(100),
});
