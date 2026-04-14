import { prisma } from "@/lib/prisma";

/**
 * Promote an approved assignment run into live CohortMembership records.
 * Idempotent: running twice on an already-approved run returns success.
 */
export async function promoteAssignmentRun(
  runId: string,
  adminUserId: string,
): Promise<{ ok: boolean; error?: string }> {
  const run = await prisma.assignmentRun.findUnique({
    where: { id: runId },
    select: {
      id: true,
      status: true,
      seasonId: true,
      proposals: {
        select: {
          cohortId: true,
          members: {
            where: { decision: "PROPOSED" },
            select: {
              userId: true,
            },
          },
        },
      },
    },
  });

  if (!run) {
    return { ok: false, error: "Assignment run not found." };
  }

  if (run.status === "APPROVED") {
    return { ok: true };
  }

  if (run.status !== "PENDING_REVIEW") {
    return { ok: false, error: `Run cannot be approved from status "${run.status}".` };
  }

  const seasonCohortIds = await prisma.cohort.findMany({
    where: { seasonId: run.seasonId },
    select: { id: true },
  });
  const seasonCohortIdSet = new Set(seasonCohortIds.map((c) => c.id));

  const allUserIds = run.proposals.flatMap((p) => p.members.map((m) => m.userId));
  const existingMemberships = await prisma.cohortMembership.findMany({
    where: {
      userId: { in: allUserIds },
      cohortId: { in: [...seasonCohortIdSet] },
      status: { in: ["ACTIVE", "INVITED"] },
    },
    select: {
      userId: true,
      cohortId: true,
    },
  });

  const existingSet = new Set(
    existingMemberships.map((m) => `${m.userId}:${m.cohortId}`),
  );

  const upserts = run.proposals.flatMap((proposal) =>
    proposal.members
      .filter((m) => !existingSet.has(`${m.userId}:${proposal.cohortId}`))
      .map((m) =>
        prisma.cohortMembership.upsert({
          where: {
            userId_cohortId: {
              userId: m.userId,
              cohortId: proposal.cohortId,
            },
          },
          create: {
            userId: m.userId,
            cohortId: proposal.cohortId,
            status: "INVITED",
            joinedAt: new Date(),
          },
          update: {
            status: "INVITED",
            joinedAt: new Date(),
          },
        }),
      ),
  );

  await prisma.$transaction([
    ...upserts,
    prisma.assignmentRun.update({
      where: { id: runId },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
        approvedById: adminUserId,
      },
    }),
  ]);

  return { ok: true };
}
