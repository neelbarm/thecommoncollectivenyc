import { prisma } from "@/lib/prisma";
import type { AssignmentPageData, AssignmentRunView } from "@/lib/assignments/types";

export async function getAssignmentData(seasonId?: string): Promise<AssignmentPageData> {
  const seasons = await prisma.season.findMany({
    orderBy: { startsAt: "desc" },
    select: {
      id: true,
      name: true,
      code: true,
      status: true,
    },
    take: 20,
  });

  const targetSeasonId = seasonId ?? seasons[0]?.id;

  if (!targetSeasonId) {
    return { seasons: seasons.map((s) => ({ ...s, status: s.status as string })), runs: [], candidateCount: 0 };
  }

  const seasonCohortIds = await prisma.cohort.findMany({
    where: { seasonId: targetSeasonId },
    select: { id: true },
  });
  const cohortIdSet = new Set(seasonCohortIds.map((c) => c.id));

  const candidateCount = await prisma.user.count({
    where: {
      role: "MEMBER",
      isActive: true,
      applications: {
        some: { status: "ACCEPTED" },
      },
      profile: {
        isNot: null,
        is: {
          onboardingCompletedAt: { not: null },
        },
      },
      cohortMemberships: {
        none: {
          status: { in: ["ACTIVE", "INVITED"] },
          cohortId: { in: [...cohortIdSet] },
        },
      },
    },
  });

  const rawRuns = await prisma.assignmentRun.findMany({
    where: { seasonId: targetSeasonId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      seasonId: true,
      status: true,
      errorMessage: true,
      createdAt: true,
      approvedAt: true,
      createdBy: {
        select: { firstName: true, lastName: true },
      },
      approvedBy: {
        select: { firstName: true, lastName: true },
      },
      proposals: {
        select: {
          id: true,
          cohortId: true,
          score: true,
          cohort: {
            select: { name: true, capacity: true },
          },
          members: {
            select: {
              id: true,
              userId: true,
              decision: true,
              signalBreakdown: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  profile: {
                    select: {
                      neighborhood: true,
                      interests: true,
                      socialGoal: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    take: 20,
  });

  const runs: AssignmentRunView[] = rawRuns.map((run) => ({
    id: run.id,
    seasonId: run.seasonId,
    status: run.status,
    errorMessage: run.errorMessage,
    createdAt: run.createdAt.toISOString(),
    createdByName: `${run.createdBy.firstName} ${run.createdBy.lastName}`.trim(),
    approvedAt: run.approvedAt?.toISOString() ?? null,
    approvedByName: run.approvedBy
      ? `${run.approvedBy.firstName} ${run.approvedBy.lastName}`.trim()
      : null,
    proposals: run.proposals.map((p) => ({
      id: p.id,
      cohortId: p.cohortId,
      cohortName: p.cohort.name,
      cohortCapacity: p.cohort.capacity,
      score: p.score,
      members: p.members.map((m) => ({
        id: m.id,
        userId: m.userId,
        name: `${m.user.firstName} ${m.user.lastName}`.trim(),
        neighborhood: m.user.profile?.neighborhood ?? null,
        interests: m.user.profile?.interests ?? [],
        socialGoal: m.user.profile?.socialGoal ?? null,
        decision: m.decision,
        signalBreakdown: m.signalBreakdown as Record<string, number> | null,
      })),
    })),
  }));

  return {
    seasons: seasons.map((s) => ({ ...s, status: s.status as string })),
    runs,
    candidateCount,
  };
}
