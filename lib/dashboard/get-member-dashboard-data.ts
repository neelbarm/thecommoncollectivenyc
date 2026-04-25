import { CohortStatus, EventStatus, RSVPStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

type DashboardMemberPreview = {
  id: string;
  firstName: string;
  lastName: string;
  neighborhood: string | null;
};

type DashboardEvent = {
  id: string;
  title: string;
  description: string;
  startsAt: Date;
  endsAt: Date;
  venueName: string;
  venueAddressLine1: string;
  venueCity: string;
  venueState: string;
  rsvpStatus: RSVPStatus | null;
};

export type MemberDashboardData = {
  memberName: string;
  firstName: string;
  profile:
    | {
        neighborhood: string | null;
        socialGoal: string | null;
        interests: string[];
      }
    | null;
  /** False when the User row has no related Profile (data repair / partial signup). */
  hasProfile: boolean;
  onboardingCompleted: boolean;
  onboardingCompletedAt: Date | null;
  cohort:
    | {
        id: string;
        name: string;
        description: string;
        status: CohortStatus;
        seasonName: string;
        seasonProgressLabel: string;
        memberPreview: DashboardMemberPreview[];
        activeMemberCount: number;
      }
    | null;
  nextEvent: DashboardEvent | null;
  pastEvents: DashboardEvent[];
  concierge: {
    title: string;
    note: string;
  };
};

const cohortDescriptions: Record<string, string> = {
  "The Orchard Table": "A thoughtful dinner-forward cohort built around consistency, depth, and warm conversation.",
  "City Lanterns": "An active social cohort balancing culture nights, movement, and intentional city connection.",
  "West Village Atelier": "A curated creative-forward cohort for members shaping a stylish, social weekly rhythm.",
};

function getCohortDescription(name: string) {
  return (
    cohortDescriptions[name] ??
    "A recurring small-group experience designed for meaningful social continuity in New York City."
  );
}

function getSeasonProgressLabel(startsAt: Date, endsAt: Date, now: Date) {
  const msInDay = 86_400_000;
  const msInWeek = msInDay * 7;

  const seasonStart = startsAt.getTime();
  const seasonEnd = endsAt.getTime();
  const current = now.getTime();

  const totalWeeks = Math.max(1, Math.ceil((seasonEnd - seasonStart + msInDay) / msInWeek));
  const clamped = Math.min(Math.max(current, seasonStart), seasonEnd);
  const currentWeek = Math.max(1, Math.ceil((clamped - seasonStart + msInDay) / msInWeek));

  return `Week ${currentWeek} of ${totalWeeks}`;
}

function buildConciergeNote({
  socialGoal,
  interests,
  neighborhood,
  cohortName,
}: {
  socialGoal: string | null | undefined;
  interests: string[];
  neighborhood: string | null | undefined;
  cohortName: string | null;
}) {
  const focus = socialGoal ?? "Build";
  const interestsPreview = interests.slice(0, 2).join(" + ") || "new city rituals";

  if (!cohortName) {
    return {
      title: "Concierge recommendation",
      note: `Finish onboarding and we will place you in a cohort tuned to your ${focus.toLowerCase()} goal and ${interestsPreview} preferences.`,
    };
  }

  return {
    title: "Concierge recommendation",
    note: `For ${cohortName}, we suggest one low-pressure plan this week near ${neighborhood ?? "your neighborhood"} and one shared table moment tied to ${interestsPreview}.`,
  };
}

function mapEventWithRsvp(
  event: {
    id: string;
    title: string;
    description: string;
    startsAt: Date;
    endsAt: Date;
    venue: {
      name: string;
      addressLine1: string;
      city: string;
      state: string;
    };
    rsvps: { status: RSVPStatus }[];
  },
): DashboardEvent {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    venueName: event.venue.name,
    venueAddressLine1: event.venue.addressLine1,
    venueCity: event.venue.city,
    venueState: event.venue.state,
    rsvpStatus: event.rsvps[0]?.status ?? null,
  };
}

export async function getMemberDashboardData(userId: string): Promise<MemberDashboardData | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      profile: {
        select: {
          id: true,
          onboardingCompletedAt: true,
          socialGoal: true,
          interests: true,
          neighborhood: true,
        },
      },
      cohortMemberships: {
        where: {
          status: {
            in: ["ACTIVE", "INVITED", "PAUSED"],
          },
        },
        select: {
          status: true,
          createdAt: true,
          cohort: {
            select: {
              id: true,
              name: true,
              description: true,
              status: true,
              season: {
                select: {
                  id: true,
                  name: true,
                  startsAt: true,
                  endsAt: true,
                },
              },
              memberships: {
                where: {
                  status: "ACTIVE",
                },
                take: 8,
                select: {
                  user: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      profile: {
                        select: {
                          neighborhood: true,
                        },
                      },
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

  if (!user) {
    return null;
  }

  const sortedMemberships = [...user.cohortMemberships].sort((a, b) => {
    if (a.status === b.status) {
      return a.createdAt.getTime() - b.createdAt.getTime();
    }
    return a.status === "ACTIVE" ? -1 : 1;
  });

  const currentMembership = sortedMemberships[0];
  const currentCohort = currentMembership?.cohort ?? null;

  const now = new Date();

  let nextEvent: DashboardEvent | null = null;
  let pastEvents: DashboardEvent[] = [];

  if (currentCohort) {
    const [next, past] = await Promise.all([
      prisma.event.findFirst({
        where: {
          status: EventStatus.PUBLISHED,
          startsAt: { gte: now },
          OR: [{ cohortId: currentCohort.id }, { cohortId: null, seasonId: currentCohort.season.id }],
        },
        orderBy: { startsAt: "asc" },
        select: {
          id: true,
          title: true,
          description: true,
          startsAt: true,
          endsAt: true,
          venue: {
            select: {
              name: true,
              addressLine1: true,
              city: true,
              state: true,
            },
          },
          rsvps: {
            where: { userId },
            select: { status: true },
            take: 1,
          },
        },
      }),
      prisma.event.findMany({
        where: {
          status: {
            in: [EventStatus.PUBLISHED, EventStatus.COMPLETED],
          },
          startsAt: { lt: now },
          OR: [{ cohortId: currentCohort.id }, { cohortId: null, seasonId: currentCohort.season.id }],
        },
        orderBy: { startsAt: "desc" },
        take: 4,
        select: {
          id: true,
          title: true,
          description: true,
          startsAt: true,
          endsAt: true,
          venue: {
            select: {
              name: true,
              addressLine1: true,
              city: true,
              state: true,
            },
          },
          rsvps: {
            where: { userId },
            select: { status: true },
            take: 1,
          },
        },
      }),
    ]);

    nextEvent = next ? mapEventWithRsvp(next) : null;
    pastEvents = past.map(mapEventWithRsvp);
  }

  const cohortData = currentCohort
    ? {
        id: currentCohort.id,
        name: currentCohort.name,
        description:
          currentCohort.description?.trim() || getCohortDescription(currentCohort.name),
        status: currentCohort.status,
        seasonName: currentCohort.season.name,
        seasonProgressLabel: getSeasonProgressLabel(
          currentCohort.season.startsAt,
          currentCohort.season.endsAt,
          now,
        ),
        memberPreview: currentCohort.memberships.map((membership) => ({
          id: membership.user.id,
          firstName: membership.user.firstName,
          lastName: membership.user.lastName,
          neighborhood: membership.user.profile?.neighborhood ?? null,
        })),
        activeMemberCount: currentCohort.memberships.length,
      }
    : null;

  return {
    memberName: `${user.firstName} ${user.lastName}`,
    firstName: user.firstName,
    profile: user.profile
      ? {
          neighborhood: user.profile.neighborhood ?? null,
          socialGoal: user.profile.socialGoal ?? null,
          interests: user.profile.interests,
        }
      : null,
    hasProfile: Boolean(user.profile),
    onboardingCompleted: Boolean(user.profile?.onboardingCompletedAt),
    onboardingCompletedAt: user.profile?.onboardingCompletedAt ?? null,
    cohort: cohortData,
    nextEvent,
    pastEvents,
    concierge: buildConciergeNote({
      socialGoal: user.profile?.socialGoal,
      interests: user.profile?.interests ?? [],
      neighborhood: user.profile?.neighborhood,
      cohortName: currentCohort?.name ?? null,
    }),
  };
}
