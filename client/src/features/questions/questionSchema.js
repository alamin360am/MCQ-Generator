import { z } from "zod";

const optionSchema = z.object({
  text: z.string().trim().min(1, "Option cannot be empty").max(1000),
});

export const questionFormSchema = z
  .object({
    questionText: z.string().trim().min(2, "Question is too short").max(5000),

    options: z
      .array(optionSchema)
      .min(2, "At least 2 options are required")
      .max(6, "Maximum 6 options are allowed"),

    correctOptionIndex: z.coerce.number().int().min(0),

    explanation: z.string().trim().max(5000).optional(),

    subjectId: z.string().optional(),

    topicId: z.string().optional(),

    difficulty: z.enum(["easy", "medium", "hard"]),

    tagsText: z.string().optional(),
  })
  .refine((data) => data.correctOptionIndex < data.options.length, {
    message: "Select a valid correct answer",

    path: ["correctOptionIndex"],
  });
