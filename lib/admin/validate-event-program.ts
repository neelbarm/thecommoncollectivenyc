import { prisma } from "@/lib/prisma";

/**
 * Ensures an event's cohort (if any) belongs to the given season.
 * Prevents admin mistakes where a cohort from season A is linked to an event in season B.
 */
export async function assertCohortBelongsToSeason(
  cohortId: string | null | undefined,
  seasonId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (cohortId == null || cohortId === "") {
    return { ok: true };
  }

  const cohort = await prisma.cohort.findFirst({
    where: { id: cohortId, seasonId },
    select: { id: true },
  });

  if (!cohort) {
    return {
      ok: false,
      error: "Cohort does not belong to the selected season. Pick a cohort from this season or clear the cohort.",
    };
  }

  return { ok: true };
}
