import { AnnouncementAudience } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type MemberAnnouncementItem = {
  id: string;
  title: string;
  body: string;
  audienceLabel: string;
  authorName: string;
  audience: AnnouncementAudience;
  isPinned: boolean;
  publishedAt: string;
  isRead: boolean;
};

export type MemberAnnouncementsData = {
  firstName: string;
  cohortName: string | null;
  unreadCount: number;
  items: MemberAnnouncementItem[];
};

function audienceLabel(
  audience: AnnouncementAudience,
  cohortName: string | null,
  seasonName: string | null,
) {
  if (audience === AnnouncementAudience.COHORT) {
    return cohortName ?? "Cohort";
  }
  if (audience === AnnouncementAudience.SEASON) {
    return seasonName ?? "Season";
  }
  return "Members";
}

export async function getMemberAnnouncementsData(
  userId: string,
): Promise<MemberAnnouncementsData | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      firstName: true,
      cohortMemberships: {
        where: {
          status: {
            in: ["ACTIVE", "INVITED", "PAUSED"],
          },
        },
        orderBy: [{ status: "asc" }, { createdAt: "asc" }],
        take: 1,
        select: {
          cohort: {
            select: {
              id: true,
              name: true,
              season: {
                select: {
                  id: true,
                  name: true,
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

  const currentCohort = user.cohortMemberships[0]?.cohort ?? null;
  const currentSeason = currentCohort?.season ?? null;

  const announcements = await prisma.announcement.findMany({
    where: {
      OR: [
        { audience: AnnouncementAudience.ALL_MEMBERS },
        ...(currentSeason ? [{ audience: AnnouncementAudience.SEASON, seasonId: currentSeason.id }] : []),
        ...(currentCohort ? [{ audience: AnnouncementAudience.COHORT, cohortId: currentCohort.id }] : []),
      ],
    },
    orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
    take: 30,
    select: {
      id: true,
      title: true,
      body: true,
      audience: true,
      isPinned: true,
      publishedAt: true,
      cohort: {
        select: {
          name: true,
        },
      },
      season: {
        select: {
          name: true,
        },
      },
      reads: {
        where: { userId },
        select: {
          userId: true,
        },
        take: 1,
      },
    },
  });

  const items = announcements.map((announcement) => ({
    id: announcement.id,
    title: announcement.title,
    body: announcement.body,
    audienceLabel: audienceLabel(
      announcement.audience,
      announcement.cohort?.name ?? null,
      announcement.season?.name ?? null,
    ),
    authorName: "Common Collective",
    audience: announcement.audience,
    isPinned: announcement.isPinned,
    publishedAt: announcement.publishedAt.toISOString(),
    isRead: announcement.reads.length > 0,
  }));

  return {
    firstName: user.firstName,
    cohortName: currentCohort?.name ?? null,
    unreadCount: items.filter((item) => !item.isRead).length,
    items,
  };
}
