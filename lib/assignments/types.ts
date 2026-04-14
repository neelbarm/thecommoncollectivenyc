/**
 * Client-safe types for the cohort assignment engine.
 * No Prisma imports — safe for use in both server and client components.
 */

export type CandidateProfile = {
  userId: string;
  name: string;
  neighborhood: string | null;
  interests: string[];
  preferredVibe: string[];
  socialGoal: string | null;
  preferredNights: string | null;
  budgetComfort: string | null;
  ageRange: string | null;
  idealGroupEnergy: string | null;
};

export type TargetCohort = {
  cohortId: string;
  name: string;
  capacity: number;
  existingMemberCount: number;
};

export type AssignmentConfig = {
  weights: {
    neighborhoodDiversity: number;
    interestOverlap: number;
    vibeOverlap: number;
    socialGoalDiversity: number;
    nightsCompatibility: number;
    budgetHarmony: number;
  };
};

export const DEFAULT_ASSIGNMENT_CONFIG: AssignmentConfig = {
  weights: {
    neighborhoodDiversity: 0.2,
    interestOverlap: 0.25,
    vibeOverlap: 0.15,
    socialGoalDiversity: 0.15,
    nightsCompatibility: 0.15,
    budgetHarmony: 0.1,
  },
};

export type MemberPlacement = {
  userId: string;
  cohortId: string;
  signalBreakdown: Record<string, number>;
};

export type ProposalResult = {
  cohortId: string;
  score: number;
  members: MemberPlacement[];
};

export type AssignmentResult = {
  proposals: ProposalResult[];
  totalScore: number;
  error?: string;
};

export type AssignmentRunView = {
  id: string;
  seasonId: string;
  status: string;
  errorMessage: string | null;
  createdAt: string;
  createdByName: string;
  approvedAt: string | null;
  approvedByName: string | null;
  proposals: AssignmentProposalView[];
};

export type AssignmentProposalView = {
  id: string;
  cohortId: string;
  cohortName: string;
  cohortCapacity: number;
  score: number | null;
  members: AssignmentMemberView[];
};

export type AssignmentMemberView = {
  id: string;
  userId: string;
  name: string;
  neighborhood: string | null;
  interests: string[];
  socialGoal: string | null;
  decision: string;
  signalBreakdown: Record<string, number> | null;
};

export type AssignmentPageData = {
  seasons: { id: string; name: string; code: string; status: string }[];
  runs: AssignmentRunView[];
  candidateCount: number;
};
