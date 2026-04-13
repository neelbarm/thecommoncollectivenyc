import { EventStatus, RSVPStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

type BudgetTier = "Soft" | "Regular" | "Big";

export type MemberEvent = {
  id: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  venueName: string;
  venueNeighborhood: string;
  budgetTier: BudgetTier;
  cohortTag: string | null;
  capacity: number;
  goingCount: number;
  spotsLeft: number;
  isFull: boolean;
  rsvpStatus: RSVPStatus | null;
};

export type MemberEventsData = {
  memberName: string;
  firstName: string;
  hasCohort: boolean;
  cohortName: string | null;
  events: MemberEvent[];
  hasAnyPublishedEvents: boolean;
};

const venueNeighborhoodBySlug: Record<string, string> = {
  "atelier-mercer-loft": "SoHo",
  "riverside-studio": "Chelsea",
  "greenhouse-parlour": "NoHo",
};

function venueNeighborhood(slug: string, city: string) {
  return venueNeighborhoodBySlug[slug] ?? city;
}

function budgetTierFromCapacity(capacity: number): BudgetTier {
  if (capacity <= 16) {
    return "Soft";
  }

  if (capacity <= 22) {
    return "Regular";
  }

  return "Big";
}

function eventSort(a: MemberEvent, b: MemberEvent) {
  return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
}

export async function getMemberEventsData(userId: string): Promise<MemberEventsData | null> {
  const now = new Date();

  const [user, hasAnyPublishedEvents, upcomingEvents] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        firstName: true,
        lastName: true,
        cohortMemberships: {
          where: {
            status: {
              in: ["ACTIVE", "INVITED"],
            },
          },
          orderBy: [{ status: "asc" }, { createdAt: "asc" }],
          select: {
            status: true,
            cohort: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          take: 1,
        },
      },
    }),
    prisma.event.count({
      where: {
        status: EventStatus.PUBLISHED,
      },
    }),
    prisma.event.findMany({
      where: {
        status: EventStatus.PUBLISHED,
        startsAt: {
          gte: now,
        },
      },
      orderBy: {
        startsAt: "asc",
      },
      select: {
        id: true,
        title: true,
        description: true,
        startsAt: true,
        endsAt: true,
        capacity: true,
        cohortId: true,
        cohort: {
          select: {
            name: true,
          },
        },
        venue: {
          select: {
            name: true,
            slug: true,
            city: true,
          },
        },
        rsvps: {
          select: {
            userId: true,
            status: true,
          },
        },
      },
    }),
  ]);

  if (!user) {
    return null;
  }

  const memberCohort = user.cohortMemberships[0]?.cohort ?? null;

  const mappedEvents: MemberEvent[] = upcomingEvents.map((event) => {
    const currentRsvp = event.rsvps.find((rsvp) => rsvp.userId === userId) ?? null;
    const goingCount = event.rsvps.filter((rsvp) => rsvp.status === RSVPStatus.GOING).length;
    const isFull = goingCount >= event.capacity;

    return {
      id: event.id,
      title: event.title,
      description: event.description,
      startsAt: event.startsAt.toISOString(),
      endsAt: event.endsAt.toISOString(),
      venueName: event.venue.name,
      venueNeighborhood: venueNeighborhood(event.venue.slug, event.venue.city),
      budgetTier: budgetTierFromCapacity(event.capacity),
      cohortTag: event.cohort?.name ?? null,
      capacity: event.capacity,
      goingCount,
      spotsLeft: Math.max(0, event.capacity - goingCount),
      isFull,
      rsvpStatus: currentRsvp?.status ?? null,
    };
  });

  const sortedEvents = memberCohort
    ? [
        ...mappedEvents
          .filter((event) => event.cohortTag === memberCohort.name)
          .sort(eventSort),
        ...mappedEvents
          .filter((event) => event.cohortTag !== memberCohort.name)
          .sort(eventSort),
      ]
    : mappedEvents.sort(eventSort);

  return {
    memberName: `${user.firstName} ${user.lastName}`,
    firstName: user.firstName,
    hasCohort: Boolean(memberCohort),
    cohortName: memberCohort?.name ?? null,
    events: sortedEvents,
    hasAnyPublishedEvents: hasAnyPublishedEvents > 0,
  };
}
