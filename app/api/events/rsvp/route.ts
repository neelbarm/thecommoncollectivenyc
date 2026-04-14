import { RSVPStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const rsvpSchema = z.object({
  eventId: z.string().cuid(),
  status: z.enum([RSVPStatus.GOING, RSVPStatus.MAYBE, RSVPStatus.DECLINED]),
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
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const parsed = rsvpSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          parsed.error.issues[0]?.message ??
          "Invalid RSVP payload. Please choose an event and status.",
      },
      { status: 400 },
    );
  }

  const { eventId, status } = parsed.data;

  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        capacity: true,
        startsAt: true,
        status: true,
      },
    });

    if (!event || event.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Event is unavailable." }, { status: 404 });
    }

    const existingRsvp = await prisma.rSVP.findUnique({
      where: {
        userId_eventId: {
          userId: session.user.id,
          eventId,
        },
      },
      select: {
        id: true,
        status: true,
      },
    });

    const goingCountExcludingUser = await prisma.rSVP.count({
      where: {
        eventId,
        status: RSVPStatus.GOING,
        userId: {
          not: session.user.id,
        },
      },
    });

    const seatsRemaining = event.capacity - goingCountExcludingUser;
    const shouldWaitlist =
      status === RSVPStatus.GOING &&
      existingRsvp?.status !== RSVPStatus.GOING &&
      seatsRemaining <= 0;

    const appliedStatus = shouldWaitlist ? RSVPStatus.WAITLISTED : status;

    await prisma.rSVP.upsert({
      where: {
        userId_eventId: {
          userId: session.user.id,
          eventId,
        },
      },
      create: {
        userId: session.user.id,
        eventId,
        status: appliedStatus,
        respondedAt: new Date(),
      },
      update: {
        status: appliedStatus,
        respondedAt: new Date(),
      },
    });

    const updatedGoingCount = await prisma.rSVP.count({
      where: {
        eventId,
        status: RSVPStatus.GOING,
      },
    });

    return NextResponse.json({
      ok: true,
      eventId,
      rsvpStatus: appliedStatus,
      goingCount: updatedGoingCount,
      spotsLeft: Math.max(0, event.capacity - updatedGoingCount),
      isFull: updatedGoingCount >= event.capacity,
    });
  } catch {
    return NextResponse.json({ error: "Unable to update RSVP right now." }, { status: 500 });
  }
}
