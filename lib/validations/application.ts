import { QuestionnaireSection } from "@prisma/client";
import { z } from "zod";

const questionnaireSections = Object.values(QuestionnaireSection) as [
  QuestionnaireSection,
  ...QuestionnaireSection[],
];

export const applicationSchema = z.object({
  headline: z.string().trim().min(10).max(140),
  aboutText: z.string().trim().min(30).max(1200),
  availability: z.string().trim().min(10).max(280),
  responses: z
    .array(
      z.object({
        questionKey: z.string().trim().min(2),
        section: z.enum(questionnaireSections),
        response: z.string().trim().min(10).max(800),
      }),
    )
    .min(3),
});

export type ApplicationInput = z.infer<typeof applicationSchema>;
