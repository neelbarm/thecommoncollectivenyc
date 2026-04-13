import { z } from "zod";

import {
  AGE_RANGE_OPTIONS,
  BUDGET_COMFORT_OPTIONS,
  DRINKING_PREFERENCE_OPTIONS,
  GROUP_ENERGY_OPTIONS,
  INTEREST_OPTIONS,
  PHYSICAL_ACTIVITY_OPTIONS,
  PLAN_FREQUENCY_OPTIONS,
  PREFERRED_NIGHTS_OPTIONS,
  SMOKING_PREFERENCE_OPTIONS,
  SOCIAL_GOAL_OPTIONS,
  TIME_PREFERENCE_OPTIONS,
  VIBE_OPTIONS,
} from "@/lib/onboarding/constants";

const ageRange = z.enum(AGE_RANGE_OPTIONS);
const socialGoal = z.enum(SOCIAL_GOAL_OPTIONS);
const preferredNights = z.enum(PREFERRED_NIGHTS_OPTIONS);
const budgetComfort = z.enum(BUDGET_COMFORT_OPTIONS);
const drinkingPreference = z.enum(DRINKING_PREFERENCE_OPTIONS);
const smokingPreference = z.enum(SMOKING_PREFERENCE_OPTIONS);
const physicalActivityComfort = z.enum(PHYSICAL_ACTIVITY_OPTIONS);
const timePreference = z.enum(TIME_PREFERENCE_OPTIONS);
const plansFrequency = z.enum(PLAN_FREQUENCY_OPTIONS);
const idealGroupEnergy = z.enum(GROUP_ENERGY_OPTIONS);

export const onboardingSchema = z.object({
  firstName: z.string().trim().min(2, "First name is required").max(50),
  lastName: z.string().trim().min(2, "Last name is required").max(50),
  email: z.string().trim().email("Enter a valid email"),
  neighborhood: z.string().trim().min(2, "Neighborhood is required").max(80),
  ageRange,
  occupation: z.string().trim().min(2, "Occupation or role is required").max(120),
  socialGoal,
  interests: z.array(z.enum(INTEREST_OPTIONS)).min(1, "Choose at least one interest").max(10),
  preferredNights,
  preferredVibe: z.array(z.enum(VIBE_OPTIONS)).min(1, "Choose at least one vibe").max(3),
  budgetComfort,
  drinkingPreference,
  smokingPreference,
  physicalActivityComfort,
  timePreference,
  plansFrequency,
  idealGroupEnergy,
  peopleToMeet: z
    .string()
    .trim()
    .min(20, "Tell us a bit more about who you hope to meet")
    .max(800),
  idealWeek: z
    .string()
    .trim()
    .min(20, "Tell us what your ideal NYC week looks like")
    .max(800),
});

export const onboardingDraftSchema = onboardingSchema.partial();

export const onboardingStepSchemas = [
  onboardingSchema.pick({
    firstName: true,
    lastName: true,
    email: true,
    neighborhood: true,
    ageRange: true,
    occupation: true,
    socialGoal: true,
  }),
  onboardingSchema.pick({
    interests: true,
    preferredNights: true,
    preferredVibe: true,
  }),
  onboardingSchema.pick({
    budgetComfort: true,
    drinkingPreference: true,
    smokingPreference: true,
    physicalActivityComfort: true,
    timePreference: true,
    plansFrequency: true,
    idealGroupEnergy: true,
  }),
  onboardingSchema.pick({
    peopleToMeet: true,
    idealWeek: true,
  }),
] as const;

export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type OnboardingDraftInput = z.infer<typeof onboardingDraftSchema>;
