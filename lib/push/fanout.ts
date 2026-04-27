import { AnnouncementAudience, CohortMembershipStatus, EmailOutboxType } from "@prisma/client";

import { logNotificationAttempt } from "@/lib/notifications/log";
import { prisma } from "@/lib/prisma";

const ACTIVE_MEMBER_STATUSES: CohortMembershipStatus[] = [
  CohortMembershipStatus.ACTIVE,
  CohortMembershipStatus.INVITED,
];

type PushAudience = {
  audience: AnnouncementAudience;
  seasonId?: string | null;
  cohortId?: string | null;
};

function dedupeTokens(tokens: Array<{ id: string; token: string; userId: string }>) {
  const seen = new Set<string>();
  const deduped: Array<{ id: string; token: string; userId: string }> = [];
  for (const entry of tokens) {
    const key = entry.token.trim();
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    deduped.push(entry);
  }
  return deduped;
}

export async function getPushTargetsForAudience(input: PushAudience) {
  const whereMembership =
    input.audience === AnnouncementAudience.ALL_MEMBERS
      ? {
          user: {
            role: "MEMBER" as const,
            isActive: true,
          },
        }
      : input.audience === AnnouncementAudience.SEASON
        ? {
            user: {
              role: "MEMBER" as const,
              isActive: true,
              cohortMemberships: {
                some: {
                  cohort: { seasonId: input.seasonId ?? undefined },
                  status: { in: ACTIVE_MEMBER_STATUSES },
                },
              },
            },
          }
        : {
            user: {
              role: "MEMBER" as const,
              isActive: true,
              cohortMemberships: {
                some: {
                  cohortId: input.cohortId ?? undefined,
                  status: { in: ACTIVE_MEMBER_STATUSES },
                },
              },
            },
          };

  const rows = await prisma.devicePushToken.findMany({
    where: {
      isActive: true,
      ...whereMembership,
    },
    select: {
      id: true,
      token: true,
      userId: true,
    },
  });

  return dedupeTokens(rows);
}

export async function fanoutAnnouncementPush(options: {
  title: string;
  body: string;
  announcementId: string;
  audience: AnnouncementAudience;
  seasonId?: string | null;
  cohortId?: string | null;
}) {
  const targets = await getPushTargetsForAudience({
    audience: options.audience,
    seasonId: options.seasonId,
    cohortId: options.cohortId,
  });

  return {
    type: EmailOutboxType.PUSH_NOTIFICATION,
    targets,
    payload: {
      title: options.title,
      body: options.body,
      data: {
        type: "announcement",
        announcementId: options.announcementId,
        route: "/announcements",
      },
    },
  };
}

export async function fanoutChatPush(options: {
  roomId: string;
  senderUserId: string;
  senderName: string;
  body: string;
}) {
  const memberStates = await prisma.chatRoomMemberState.findMany({
    where: {
      roomId: options.roomId,
      userId: { not: options.senderUserId },
      user: {
        role: "MEMBER",
        isActive: true,
      },
    },
    select: {
      userId: true,
    },
  });

  if (memberStates.length === 0) {
    return {
      type: EmailOutboxType.PUSH_NOTIFICATION,
      targets: [] as Array<{ id: string; token: string; userId: string }>,
      payload: {
        title: `${options.senderName}`,
        body: options.body,
        data: {
          type: "chat",
          roomId: options.roomId,
          route: "/cohort/chat",
        },
      },
    };
  }

  const userIds = memberStates.map((state) => state.userId);
  const tokens = await prisma.devicePushToken.findMany({
    where: {
      isActive: true,
      userId: { in: userIds },
    },
    select: {
      id: true,
      token: true,
      userId: true,
    },
  });

  return {
    type: EmailOutboxType.PUSH_NOTIFICATION,
    targets: dedupeTokens(tokens),
    payload: {
      title: `${options.senderName}`,
      body: options.body,
      data: {
        type: "chat",
        roomId: options.roomId,
        route: "/cohort/chat",
      },
    },
  };
}

export async function logPushNoTargets(triggerSource: string) {
  await logNotificationAttempt({
    type: EmailOutboxType.PUSH_NOTIFICATION,
    status: "SKIPPED",
    recipientEmail: "push:no-targets@thecommoncollective.space",
    triggerSource,
    errorSummary: "No active push targets for fanout.",
  });
}
