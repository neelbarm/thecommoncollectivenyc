import { prisma } from "@/lib/prisma";

export type SeasonManagementSeason = {
  id: string;
  name: string;
  code: string;
  status: string;
  startsAt: string;
  endsAt: string;
  cohortCount: number;
  eventCount: number;
};

export type SeasonManagementData = {
  seasons: SeasonManagementSeason[];
};

export async function getSeasonManagementData(): Promise<SeasonManagementData> {
  const rows = await prisma.season.findMany({
    orderBy: { startsAt: "desc" },
    select: {
      id: true,
      name: true,
      code: true,
      status: true,
      startsAt: true,
      endsAt: true,
      _count: {
        select: { cohorts: true, events: true },
      },
    },
    take: 40,
  });

  return {
    seasons: rows.map((s) => ({
      id: s.id,
      name: s.name,
      code: s.code,
      status: s.status,
      startsAt: s.startsAt.toISOString(),
      endsAt: s.endsAt.toISOString(),
      cohortCount: s._count.cohorts,
      eventCount: s._count.events,
    })),
  };
}
