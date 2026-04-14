import type {
  AssignmentConfig,
  AssignmentResult,
  CandidateProfile,
  MemberPlacement,
  ProposalResult,
  TargetCohort,
} from "./types";

function jaccard(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function averagePairwiseJaccard(
  members: CandidateProfile[],
  field: "interests" | "preferredVibe",
): number {
  if (members.length < 2) return 0.4;
  let total = 0;
  let pairs = 0;
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      total += jaccard(members[i][field], members[j][field]);
      pairs++;
    }
  }
  return pairs === 0 ? 0.4 : total / pairs;
}

function neighborhoodDiversityScore(members: CandidateProfile[]): number {
  if (members.length === 0) return 0;
  const neighborhoods = new Set(
    members.map((m) => m.neighborhood ?? "Unknown"),
  );
  return neighborhoods.size / members.length;
}

function overlapScore(avg: number): number {
  // Target range: 0.2–0.6. Perfect at 0.4. Penalize outside range.
  if (avg >= 0.2 && avg <= 0.6) {
    const distFromCenter = Math.abs(avg - 0.4);
    return 1.0 - distFromCenter * 2;
  }
  if (avg < 0.2) return Math.max(0, avg / 0.2);
  return Math.max(0, 1.0 - (avg - 0.6) / 0.4);
}

function socialGoalDiversityScore(members: CandidateProfile[]): number {
  if (members.length === 0) return 0;
  const counts = new Map<string, number>();
  for (const m of members) {
    const goal = m.socialGoal ?? "Unknown";
    counts.set(goal, (counts.get(goal) ?? 0) + 1);
  }
  const maxFraction = Math.max(...[...counts.values()].map((c) => c / members.length));
  // Penalize if any single goal > 60%
  if (maxFraction > 0.6) return Math.max(0, 1.0 - (maxFraction - 0.6) / 0.4);
  return 1.0;
}

function nightsCompatibilityScore(members: CandidateProfile[]): number {
  if (members.length === 0) return 0;
  // "both" is compatible with everything
  let compatible = 0;
  const weekday = members.filter((m) => m.preferredNights === "weekdays" || m.preferredNights === "both").length;
  const weekend = members.filter((m) => m.preferredNights === "weekends" || m.preferredNights === "both").length;
  const majorityNight = Math.max(weekday, weekend);
  compatible = majorityNight;
  return compatible / members.length;
}

function budgetHarmonyScore(members: CandidateProfile[]): number {
  if (members.length === 0) return 0;
  const hasSoft = members.some((m) => m.budgetComfort === "Soft");
  const hasBig = members.some((m) => m.budgetComfort === "Big");
  const hasRegular = members.some((m) => m.budgetComfort === "Regular");
  if (hasSoft && hasBig && !hasRegular) return 0.3;
  if (hasSoft && hasBig && hasRegular) return 0.7;
  return 1.0;
}

function scoreCohort(
  members: CandidateProfile[],
  config: AssignmentConfig,
): { total: number; breakdown: Record<string, number> } {
  if (members.length === 0) return { total: 0, breakdown: {} };

  const w = config.weights;
  const nd = neighborhoodDiversityScore(members);
  const io = overlapScore(averagePairwiseJaccard(members, "interests"));
  const vo = overlapScore(averagePairwiseJaccard(members, "preferredVibe"));
  const sg = socialGoalDiversityScore(members);
  const nc = nightsCompatibilityScore(members);
  const bh = budgetHarmonyScore(members);

  const breakdown: Record<string, number> = {
    neighborhoodDiversity: nd,
    interestOverlap: io,
    vibeOverlap: vo,
    socialGoalDiversity: sg,
    nightsCompatibility: nc,
    budgetHarmony: bh,
  };

  const total =
    nd * w.neighborhoodDiversity +
    io * w.interestOverlap +
    vo * w.vibeOverlap +
    sg * w.socialGoalDiversity +
    nc * w.nightsCompatibility +
    bh * w.budgetHarmony;

  return { total, breakdown };
}

function memberSignalBreakdown(
  member: CandidateProfile,
  cohortMembers: CandidateProfile[],
  config: AssignmentConfig,
): Record<string, number> {
  const withMember = [...cohortMembers, member];
  const { breakdown } = scoreCohort(withMember, config);
  return breakdown;
}

type CohortBucket = {
  cohort: TargetCohort;
  members: CandidateProfile[];
  availableSlots: number;
};

export function generateAssignments(
  candidates: CandidateProfile[],
  cohorts: TargetCohort[],
  config: AssignmentConfig,
): AssignmentResult {
  const totalCapacity = cohorts.reduce(
    (sum, c) => sum + Math.max(0, c.capacity - c.existingMemberCount),
    0,
  );

  if (candidates.length > totalCapacity) {
    return {
      proposals: [],
      totalScore: 0,
      error: `Too many candidates (${candidates.length}) for available capacity (${totalCapacity}). Increase cohort capacity or reduce candidate pool.`,
    };
  }

  if (candidates.length === 0) {
    return {
      proposals: cohorts.map((c) => ({
        cohortId: c.cohortId,
        score: 0,
        members: [],
      })),
      totalScore: 0,
      error: "No eligible candidates found for this season.",
    };
  }

  // Initialize buckets
  const buckets: CohortBucket[] = cohorts.map((c) => ({
    cohort: c,
    members: [],
    availableSlots: Math.max(0, c.capacity - c.existingMemberCount),
  }));

  // Greedy round-robin: assign each candidate to the cohort that maximizes marginal score
  const shuffled = [...candidates].sort(() => Math.random() - 0.5);

  for (const candidate of shuffled) {
    let bestBucket: CohortBucket | null = null;
    let bestMarginalGain = -Infinity;

    for (const bucket of buckets) {
      if (bucket.members.length >= bucket.availableSlots) continue;

      const currentScore = scoreCohort(bucket.members, config).total;
      const newScore = scoreCohort([...bucket.members, candidate], config).total;
      const marginal = newScore - currentScore;

      if (marginal > bestMarginalGain) {
        bestMarginalGain = marginal;
        bestBucket = bucket;
      }
    }

    if (bestBucket) {
      bestBucket.members.push(candidate);
    }
  }

  // Hill-climbing swaps: up to 50 iterations
  const MAX_SWAPS = 50;
  for (let iter = 0; iter < MAX_SWAPS; iter++) {
    let improved = false;
    let bestSwapGain = 0;
    let bestSwapI = -1;
    let bestSwapJ = -1;
    let bestBucketA = -1;
    let bestBucketB = -1;

    for (let a = 0; a < buckets.length; a++) {
      for (let b = a + 1; b < buckets.length; b++) {
        for (let i = 0; i < buckets[a].members.length; i++) {
          for (let j = 0; j < buckets[b].members.length; j++) {
            const currentScoreA = scoreCohort(buckets[a].members, config).total;
            const currentScoreB = scoreCohort(buckets[b].members, config).total;

            const newMembersA = [...buckets[a].members];
            const newMembersB = [...buckets[b].members];
            const temp = newMembersA[i];
            newMembersA[i] = newMembersB[j];
            newMembersB[j] = temp;

            const newScoreA = scoreCohort(newMembersA, config).total;
            const newScoreB = scoreCohort(newMembersB, config).total;

            const gain = newScoreA + newScoreB - currentScoreA - currentScoreB;
            if (gain > bestSwapGain) {
              bestSwapGain = gain;
              bestSwapI = i;
              bestSwapJ = j;
              bestBucketA = a;
              bestBucketB = b;
              improved = true;
            }
          }
        }
      }
    }

    if (!improved) break;

    const temp = buckets[bestBucketA].members[bestSwapI];
    buckets[bestBucketA].members[bestSwapI] = buckets[bestBucketB].members[bestSwapJ];
    buckets[bestBucketB].members[bestSwapJ] = temp;
  }

  // Build results
  const proposals: ProposalResult[] = buckets.map((bucket) => {
    const { total } = scoreCohort(bucket.members, config);
    const members: MemberPlacement[] = bucket.members.map((m) => ({
      userId: m.userId,
      cohortId: bucket.cohort.cohortId,
      signalBreakdown: memberSignalBreakdown(m, bucket.members.filter((x) => x.userId !== m.userId), config),
    }));
    return {
      cohortId: bucket.cohort.cohortId,
      score: Math.round(total * 1000) / 1000,
      members,
    };
  });

  const totalScore = proposals.reduce((sum, p) => sum + p.score, 0);

  return {
    proposals,
    totalScore: Math.round(totalScore * 1000) / 1000,
  };
}
