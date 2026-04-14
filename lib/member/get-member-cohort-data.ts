import { EventStatus, RSVPStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type MemberCohortEvent = {
  id: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  venueName: string;
  venueAddress: string;
  status: string;
  rsvpStatus: RSVPStatus | null;
};

export type MemberCohortData = {
  firstName: string;
  cohort: {
    id: string;
    name: string;
    description: string;
    status: string;
    seasonName: string;
    membershipStatus: string;
    joinedAt: string | null;
  };
  members: { id: string; firstName: string; lastName: string; neighborhood: string | null }[];
  upcomingEvents: MemberCohortEvent[];
};

const cohortDescriptions: Record<string, string> = {
  "The Orchard Table": "A thoughtful dinner-forward cohort built around consistency, depth, and warm conversation.",
  "City Lanterns": "An active social cohort balancing culture nights, movement, and intentional city connection.",
  "West Village Atelier": "A curated creative-forward cohort for members shaping a stylish, social weekly rhythm.",
};

function fallbackDescription(name: string) {
  return (
    cohortDescriptions[name] ??
    "A recurring small-group experience designed for meaningful social continuity in New York City."
  );
}

export async function getMemberCohortData(userId: string): Promise<MemberCohortData | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      firstName: true,
      cohortMemberships: {
        where: { status: { in: ["ACTIVE", "INVITED"] } },
        orderBy: [{ status: "asc" }, { createdAt: "asc" }],
        take: 1,
        select: {
          status: true,
          joinedAt: true,
          cohort: {
            select: {
              id: true,
              name: true,
              description: true,
              status: true,
              season: { select: { name: true } },
              memberships: {
                where: { status: { in: ["ACTIVE", "INVITED"] } },
                orderBy: { createdAt: "asc" },
                select: {
                  user: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      profile: { select: { neighborhood: true } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user) return null;

  const membership = user.cohortMemberships[0];
  const cohort = membership?.cohort;
  if (!cohort) {
    return {
      firstName: user.firstName,
      cohort: {
        id: "",
        name: "",
        description: "",
        status: "",
        seasonName: "",
        membershipStatus: "",
        joinedAt: null,
      },
      members: [],
      upcomingEvents: [],
    };
  }

  const now = new Date();
  const upcomingEvents = await prisma.event.findMany({
    where: {
      cohortId: cohort.id,
      status: EventStatus.PUBLISHED,
      startsAt: { gte: now },
    },
    orderBy: { startsAt: "asc" },
    take: 12,
    select: {
      id: true,
      title: true,
      description: true,
      startsAt: true,
      endsAt: true,
      status: true,
      venue: { select: { name: true, addressLine1: true, city: true } },
      rsvps: {
        where: { userId },
        select: { status: true },
        take: 1,
      },
    },
  });

  return {
    firstName: user.firstName,
    cohort: {
      id: cohort.id,
      name: cohort.name,
      description: cohort.description?.trim() || fallbackDescription(cohort.name),
      status: cohort.status,
      seasonName: cohort.season.name,
      membershipStatus: membership.status,
      joinedAt: membership.joinedAt?.toISOString() ?? null,
    },
    members: cohort.memberships.map((m) => ({
      id: m.user.id,
      firstName: m.user.firstName,
      lastName: m.user.lastName,
      neighborhood: m.user.profile?.neighborhood ?? null,
    })),
    upcomingEvents: upcomingEvents.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      startsAt: e.startsAt.toISOString(),
      endsAt: e.endsAt.toISOString(),
      venueName: e.venue.name,
      venueAddress: `${e.venue.addressLine1}, ${e.venue.city}`,
      status: e.status,
      rsvpStatus: e.rsvps[0]?.status ?? null,
    })),
  };
}
