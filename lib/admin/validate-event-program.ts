import { prisma } from "@/lib/prisma";

/**
 * Ensures event start/end fall within the season's program window (inclusive of boundaries).
 */
export async function assertEventTimesWithinSeason(
  seasonId: string,
  startsAt: Date,
  endsAt: Date,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const season = await prisma.season.findUnique({
    where: { id: seasonId },
    select: { startsAt: true, endsAt: true, name: true, code: true },
  });

  if (!season) {
    return { ok: false, error: "Season not found." };
  }

  const startMs = startsAt.getTime();
  const endMs = endsAt.getTime();
  const winStart = season.startsAt.getTime();
  const winEnd = season.endsAt.getTime();

  if (startMs < winStart || endMs > winEnd) {
    return {
      ok: false,
      error: `Event times must fall within this season (${season.code} · ${season.name}). Adjust dates or pick another season.`,
    };
  }

  return { ok: true };
}

/**
 * Counts events on this season that would fall outside a proposed [newStartsAt, newEndsAt] window.
 * Used before shrinking a season's dates.
 */
export async function countEventsOutsideProposedSeasonWindow(
  seasonId: string,
  newStartsAt: Date,
  newEndsAt: Date,
): Promise<number> {
  return prisma.event.count({
    where: {
      seasonId,
      OR: [{ startsAt: { lt: newStartsAt } }, { endsAt: { gt: newEndsAt } }],
    },
  });
}

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
