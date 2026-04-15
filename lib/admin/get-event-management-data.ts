import { prisma } from "@/lib/prisma";

export type EventManagementEvent = {
  id: string;
  title: string;
  description: string;
  status: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  seasonId: string;
  seasonName: string;
  cohortId: string | null;
  cohortName: string | null;
  venueId: string;
  venueName: string;
  rsvpGoing: number;
};

export type EventManagementData = {
  events: EventManagementEvent[];
  seasons: { id: string; name: string; code: string; startsAt: string; endsAt: string }[];
  cohorts: { id: string; name: string; seasonId: string }[];
  venues: { id: string; name: string; addressLine1: string; city: string }[];
};

export async function getEventManagementData(): Promise<EventManagementData> {
  const [events, seasons, cohorts, venues] = await Promise.all([
    prisma.event.findMany({
      orderBy: { startsAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        startsAt: true,
        endsAt: true,
        capacity: true,
        seasonId: true,
        cohortId: true,
        venueId: true,
        season: { select: { name: true } },
        cohort: { select: { name: true } },
        venue: { select: { name: true } },
        rsvps: { where: { status: "GOING" }, select: { id: true } },
      },
      take: 100,
    }),
    prisma.season.findMany({
      orderBy: { startsAt: "desc" },
      select: { id: true, name: true, code: true, startsAt: true, endsAt: true },
      take: 20,
    }),
    prisma.cohort.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, seasonId: true },
      take: 60,
    }),
    prisma.venue.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, addressLine1: true, city: true },
      take: 100,
    }),
  ]);

  return {
    events: events.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      status: e.status,
      startsAt: e.startsAt.toISOString(),
      endsAt: e.endsAt.toISOString(),
      capacity: e.capacity,
      seasonId: e.seasonId,
      seasonName: e.season.name,
      cohortId: e.cohortId,
      cohortName: e.cohort?.name ?? null,
      venueId: e.venueId,
      venueName: e.venue.name,
      rsvpGoing: e.rsvps.length,
    })),
    seasons: seasons.map((s) => ({
      id: s.id,
      name: s.name,
      code: s.code,
      startsAt: s.startsAt.toISOString(),
      endsAt: s.endsAt.toISOString(),
    })),
    cohorts,
    venues,
  };
}
