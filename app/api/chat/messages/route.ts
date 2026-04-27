import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { getMemberChatData } from "@/lib/chat/get-member-chat-data";
import { fanoutChatPush } from "@/lib/push/fanout";
import { prisma } from "@/lib/prisma";

const createMessageSchema = z.object({
  roomId: z.string().cuid(),
  body: z.string().trim().min(1, "Message cannot be empty.").max(500, "Message is too long."),
});

function formatTimeLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function initials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await getMemberChatData(session.user.id);
    if (!data) {
      return NextResponse.json({ error: "Unable to load chat right now." }, { status: 500 });
    }
    return NextResponse.json({ ok: true, data });
  } catch {
    return NextResponse.json({ error: "Unable to load chat right now." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = createMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid message payload." },
      { status: 400 },
    );
  }
  const parsedData = parsed.data;

  try {
    const room = await prisma.chatRoom.findUnique({
      where: { id: parsed.data.roomId },
      select: {
        id: true,
        cohort: {
          select: {
            memberships: {
              where: {
                userId: session.user.id,
                status: {
                  in: ["ACTIVE", "INVITED"],
                },
              },
              select: {
                userId: true,
              },
              take: 1,
            },
          },
        },
      },
    });

    if (!room || room.cohort.memberships.length === 0) {
      return NextResponse.json({ error: "You do not have access to this room." }, { status: 403 });
    }
    const roomId = room.id;
    const senderUserId = session.user.id;

    const now = new Date();
    const message = await prisma.$transaction(async (tx) => {
      const created = await tx.chatMessage.create({
        data: {
          roomId,
          authorId: senderUserId,
          body: parsedData.body,
        },
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
      });

      await tx.chatRoomMemberState.upsert({
        where: {
          roomId_userId: {
            roomId,
            userId: senderUserId,
          },
        },
        create: {
          roomId,
          userId: senderUserId,
          lastReadAt: now,
        },
        update: {
          lastReadAt: now,
        },
      });

      return created;
    });

    return NextResponse.json({
      ok: true,
      message: {
        id: message.id,
        body: message.body,
        authorName: `${message.author.firstName} ${message.author.lastName}`,
        initials: initials(message.author.firstName, message.author.lastName),
        timeLabel: formatTimeLabel(message.createdAt),
        isCurrentUser: true,
      },
    });
    void fanoutChatPush({
      roomId,
      senderUserId,
      senderName: `${message.author.firstName} ${message.author.lastName}`,
      body: parsedData.body,
    });
  } catch {
    return NextResponse.json({ error: "Unable to send message right now." }, { status: 500 });
  }
}
