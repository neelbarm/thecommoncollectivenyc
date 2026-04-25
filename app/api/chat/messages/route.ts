import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const createMessageSchema = z.object({
  roomId: z.string().cuid(),
  body: z.string().trim().min(1, "Message cannot be empty.").max(500, "Message is too long."),
});

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

    const now = new Date();
    const message = await prisma.$transaction(async (tx) => {
      const created = await tx.chatMessage.create({
        data: {
          roomId: room.id,
          authorId: session.user.id,
          body: parsed.data.body,
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
            roomId: room.id,
            userId: session.user.id,
          },
        },
        create: {
          roomId: room.id,
          userId: session.user.id,
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
        createdAt: message.createdAt.toISOString(),
        author: {
          id: message.author.id,
          firstName: message.author.firstName,
          lastName: message.author.lastName,
        },
      },
    });
  } catch {
    return NextResponse.json({ error: "Unable to send message right now." }, { status: 500 });
  }
}
