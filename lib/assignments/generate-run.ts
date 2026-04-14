import { prisma } from "@/lib/prisma";
import { generateAssignments } from "./scorer";
import { DEFAULT_ASSIGNMENT_CONFIG } from "./types";
import type { CandidateProfile, TargetCohort } from "./types";

/**
 * Candidate eligibility:
 * - MemberApplication.status = ACCEPTED
 * - Profile.onboardingCompletedAt is not null
 * - No CohortMembership with status ACTIVE or INVITED for any Cohort in this season
 */
export async function generateAssignmentRun(
  seasonId: string,
  adminUserId: string,
): Promise<{ runId: string; error?: string }> {
  const season = await prisma.season.findUnique({
    where: { id: seasonId },
    select: { id: true, name: true },
  });

  if (!season) {
    return { runId: "", error: "Season not found." };
  }

  const seasonCohortIds = await prisma.cohort.findMany({
    where: { seasonId },
    select: { id: true },
  });
  const cohortIdSet = new Set(seasonCohortIds.map((c) => c.id));

  const eligibleUsers = await prisma.user.findMany({
    where: {
      role: "MEMBER",
      isActive: true,
      applications: {
        some: {
          status: "ACCEPTED",
        },
      },
      profile: {
        isNot: null,
        is: {
          onboardingCompletedAt: { not: null },
        },
      },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      profile: {
        select: {
          neighborhood: true,
          interests: true,
          preferredVibe: true,
          socialGoal: true,
          preferredNights: true,
          budgetComfort: true,
          ageRange: true,
          idealGroupEnergy: true,
        },
      },
      cohortMemberships: {
        where: {
          status: { in: ["ACTIVE", "INVITED"] },
        },
        select: {
          cohortId: true,
        },
      },
    },
  });

  const candidates: CandidateProfile[] = eligibleUsers
    .filter((u) => {
      const hasSeasonMembership = u.cohortMemberships.some((m) => cohortIdSet.has(m.cohortId));
      return !hasSeasonMembership;
    })
    .map((u) => ({
      userId: u.id,
      name: `${u.firstName} ${u.lastName}`,
      neighborhood: u.profile?.neighborhood ?? null,
      interests: u.profile?.interests ?? [],
      preferredVibe: u.profile?.preferredVibe ?? [],
      socialGoal: u.profile?.socialGoal ?? null,
      preferredNights: u.profile?.preferredNights ?? null,
      budgetComfort: u.profile?.budgetComfort ?? null,
      ageRange: u.profile?.ageRange ?? null,
      idealGroupEnergy: u.profile?.idealGroupEnergy ?? null,
    }));

  const cohorts = await prisma.cohort.findMany({
    where: {
      seasonId,
      status: { in: ["FORMING", "ACTIVE"] },
    },
    select: {
      id: true,
      name: true,
      capacity: true,
      _count: {
        select: {
          memberships: {
            where: { status: { in: ["ACTIVE", "INVITED"] } },
          },
        },
      },
    },
  });

  const targetCohorts: TargetCohort[] = cohorts.map((c) => ({
    cohortId: c.id,
    name: c.name,
    capacity: c.capacity,
    existingMemberCount: c._count.memberships,
  }));

  const config = DEFAULT_ASSIGNMENT_CONFIG;
  const result = generateAssignments(candidates, targetCohorts, config);

  const run = await prisma.assignmentRun.create({
    data: {
      seasonId,
      status: result.error ? "DRAFT" : "PENDING_REVIEW",
      configJson: config,
      scoreSnapshot: {
        totalScore: result.totalScore,
        candidateCount: candidates.length,
        cohortCount: targetCohorts.length,
      },
      errorMessage: result.error ?? null,
      createdById: adminUserId,
      proposals: {
        create: result.proposals.map((p) => ({
          cohortId: p.cohortId,
          score: p.score,
          rationaleJson: {
            memberCount: p.members.length,
          },
          members: {
            create: p.members.map((m) => ({
              userId: m.userId,
              decision: "PROPOSED",
              signalBreakdown: m.signalBreakdown,
            })),
          },
        })),
      },
    },
    select: { id: true },
  });

  return { runId: run.id, error: result.error };
}
