import { z } from "zod";

const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid question ID");

export const startAttemptSchema = z.object({
  participantName: z.string().trim().max(80).optional().default(""),
});

const answerSchema = z.object({
  questionId: objectIdSchema,

  selectedOptionIndex: z.number().int().min(0).max(5).nullable(),
});

export const saveAnswersSchema = z.object({
  answers: z.array(answerSchema).min(1).max(500),
});
