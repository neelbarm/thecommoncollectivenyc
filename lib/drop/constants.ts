export const DROP_ACTIVITY_OPTIONS = [
  "Walk",
  "Coffee",
  "Drink",
  "Pickleball",
  "Late dinner",
  "Anything",
] as const;

export const DROP_TIMING_OPTIONS = [
  "next 2 hours",
  "tonight",
  "tomorrow morning",
] as const;

export type DropActivity = (typeof DROP_ACTIVITY_OPTIONS)[number];
export type DropTiming = (typeof DROP_TIMING_OPTIONS)[number];
