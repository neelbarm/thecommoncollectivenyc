import { QuestionnaireSection } from "@prisma/client";

export const AGE_RANGE_OPTIONS = [
  "21-25",
  "26-30",
  "31-35",
  "36-40",
  "41+",
] as const;

export const SOCIAL_GOAL_OPTIONS = ["Reset", "Build", "Expand"] as const;

export const INTEREST_OPTIONS = [
  "Dinners",
  "Runs",
  "Pickleball",
  "Coffee",
  "Walks",
  "Creatives",
  "Founders",
  "Wellness",
  "New-to-NYC",
  "Hidden NYC",
  "Art",
  "Book club",
  "Sober social",
  "Late night",
  "Pilates",
  "Clubbing",
  "Bar Hopping",
  "Yoga",
  "Volunteering",
  "Nature",
  "Hiking",
  "Cooking",
  "Art / Painting",
  "Dancing",
  "Shopping",
] as const;

export const PREFERRED_NIGHTS_OPTIONS = ["weekdays", "weekends", "both"] as const;

export const VIBE_OPTIONS = [
  "calm",
  "active",
  "social",
  "spontaneous",
  "low-key",
  "stylish",
] as const;

export const BUDGET_COMFORT_OPTIONS = ["Soft", "Regular", "Big"] as const;

export const DRINKING_PREFERENCE_OPTIONS = [
  "Sober",
  "Occasionally",
  "Socially",
  "Often",
  "Prefer not to say",
] as const;

export const SMOKING_PREFERENCE_OPTIONS = [
  "Non-smoker",
  "Social smoker",
  "420 friendly",
  "Prefer smoke-free",
  "Prefer not to say",
] as const;

export const PHYSICAL_ACTIVITY_OPTIONS = ["Low", "Moderate", "High", "Flexible"] as const;

export const TIME_PREFERENCE_OPTIONS = [
  "Mornings",
  "Daytime",
  "Evenings",
  "Late night",
  "Flexible",
] as const;

export const PLAN_FREQUENCY_OPTIONS = [
  "1-2 times per month",
  "Weekly",
  "Twice weekly",
  "Flexible",
] as const;

export const GROUP_ENERGY_OPTIONS = [
  "Intimate",
  "Balanced",
  "Lively",
  "High-energy",
] as const;

export const ONBOARDING_RESPONSE_DEFINITIONS = {
  ageRange: { questionKey: "onboarding_age_range", section: QuestionnaireSection.VALUES },
  socialGoal: { questionKey: "onboarding_social_goal", section: QuestionnaireSection.VALUES },
  preferredNights: { questionKey: "onboarding_preferred_nights", section: QuestionnaireSection.EXPERIENCE },
  preferredVibe: { questionKey: "onboarding_preferred_vibe", section: QuestionnaireSection.EXPERIENCE },
  budgetComfort: { questionKey: "onboarding_budget_comfort", section: QuestionnaireSection.EXPERIENCE },
  drinkingPreference: { questionKey: "onboarding_drinking_preference", section: QuestionnaireSection.COMMUNITY },
  smokingPreference: { questionKey: "onboarding_smoking_preference", section: QuestionnaireSection.COMMUNITY },
  physicalActivityComfort: {
    questionKey: "onboarding_physical_activity_comfort",
    section: QuestionnaireSection.EXPERIENCE,
  },
  timePreference: { questionKey: "onboarding_time_preference", section: QuestionnaireSection.EXPERIENCE },
  plansFrequency: { questionKey: "onboarding_plans_frequency", section: QuestionnaireSection.COMMUNITY },
  idealGroupEnergy: { questionKey: "onboarding_ideal_group_energy", section: QuestionnaireSection.COMMUNITY },
  peopleToMeet: { questionKey: "onboarding_people_to_meet", section: QuestionnaireSection.COMMUNITY },
  idealWeek: { questionKey: "onboarding_ideal_nyc_week", section: QuestionnaireSection.COMMUNITY },
  interests: { questionKey: "onboarding_interests", section: QuestionnaireSection.VALUES },
} as const;

export const ONBOARDING_RESPONSE_KEYS = Object.values(ONBOARDING_RESPONSE_DEFINITIONS).map(
  (definition) => definition.questionKey,
);
