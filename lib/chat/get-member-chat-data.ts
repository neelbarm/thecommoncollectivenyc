import { prisma } from "@/lib/prisma";

export type MemberChatMessage = {
  id: string;
  authorName: string;
  initials: string;
  body: string;
  timeLabel: string;
  isCurrentUser: boolean;
};

export type MemberChatData = {
  firstName: string;
  cohort:
    | {
        id: string;
        name: string;
        roomId: string;
      }
    | null;
  pinnedMessages: Array<{
    id: string;
    title: string;
    body: string;
    publishedAt: string;
  }>;
  messages: MemberChatMessage[];
  unreadCount: number;
};

function initials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

function formatTimeLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export async function getMemberChatData(userId: string): Promise<MemberChatData | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      firstName: true,
      cohortMemberships: {
        where: { status: { in: ["ACTIVE", "INVITED"] } },
        orderBy: [{ status: "asc" }, { createdAt: "asc" }],
        take: 1,
        select: {
          cohort: {
            select: {
              id: true,
              name: true,
              chatRoom: {
                select: {
                  id: true,
                  messages: {
                    orderBy: { createdAt: "asc" },
                    take: 50,
                    select: {
                      id: true,
                      body: true,
                      createdAt: true,
                      author: {
                        select: {
                          id: true,
                          firstName: true,
                          lastName: true,
                        },
                      },
                    },
                  },
                  memberStates: {
                    where: { userId },
                    take: 1,
                    select: { lastReadAt: true },
                  },
                },
              },
              announcements: {
                where: { isPinned: true },
                orderBy: { publishedAt: "desc" },
                take: 3,
                select: {
                  id: true,
                  title: true,
                  body: true,
                  publishedAt: true,
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

  const cohort = user.cohortMemberships[0]?.cohort;
  if (!cohort) {
    return {
      firstName: user.firstName,
      cohort: null,
      pinnedMessages: [],
      messages: [],
      unreadCount: 0,
    };
  }

  const room =
    cohort.chatRoom ??
    (await prisma.chatRoom.create({
      data: {
        cohortId: cohort.id,
      },
      select: {
        id: true,
      },
    }));

  const roomData = await prisma.chatRoom.findUnique({
    where: { id: room.id },
    select: {
      id: true,
      messages: {
        orderBy: { createdAt: "asc" },
        take: 50,
        select: {
          id: true,
          body: true,
          createdAt: true,
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      memberStates: {
        where: { userId },
        take: 1,
        select: { lastReadAt: true },
      },
    },
  });

  if (!roomData) {
    return null;
  }

  const lastReadAt = roomData.memberStates[0]?.lastReadAt ?? null;
  const messages = roomData.messages.map((message) => ({
    id: message.id,
    authorName: `${message.author.firstName} ${message.author.lastName}`,
    initials: initials(message.author.firstName, message.author.lastName),
    body: message.body,
    timeLabel: formatTimeLabel(message.createdAt),
    isCurrentUser: message.author.id === userId,
  }));

  return {
    firstName: user.firstName,
    cohort: {
      id: cohort.id,
      name: cohort.name,
      roomId: roomData.id,
    },
    pinnedMessages: cohort.announcements.map((announcement) => ({
      id: announcement.id,
      title: announcement.title,
      body: announcement.body,
      publishedAt: announcement.publishedAt.toISOString(),
    })),
    messages,
    unreadCount: lastReadAt
      ? roomData.messages.filter((message) => message.createdAt > lastReadAt).length
      : messages.length,
  };
}
