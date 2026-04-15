import { ReminderChannel, ReminderStatus, RSVPStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { enqueueEmailOutbox, eventReminderEmailTemplate } from "@/lib/email/outbox";
import { prisma } from "@/lib/prisma";

const dispatchSchema = z.object({
  limit: z.number().int().min(1).max(200).optional().default(50),
});

function isAuthorized(request: Request) {
  const token = process.env.EMAIL_DISPATCH_TOKEN?.trim();
  if (!token) {
    return false;
  }
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${token}`;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown = {};
  try {
    if (request.headers.get("content-length") !== "0") {
      body = await request.json().catch(() => ({}));
    }
  } catch {
    body = {};
  }

  const parsed = dispatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid dispatch payload." },
      { status: 400 },
    );
  }

  const now = new Date();
  const dueReminders = await prisma.reminder.findMany({
    where: {
      channel: ReminderChannel.EMAIL,
      status: ReminderStatus.SCHEDULED,
      scheduledFor: { lte: now },
    },
    orderBy: { scheduledFor: "asc" },
    take: parsed.data.limit,
    select: {
      id: true,
      userId: true,
      eventId: true,
      scheduledFor: true,
      recipient: {
        select: { firstName: true, lastName: true, email: true, isActive: true },
      },
      event: {
        select: {
          title: true,
          startsAt: true,
          status: true,
          venue: { select: { name: true } },
          rsvps: {
            where: { status: RSVPStatus.GOING },
            select: { userId: true },
          },
        },
      },
    },
  });

  let enqueued = 0;
  let skipped = 0;
  let failed = 0;

  for (const reminder of dueReminders) {
    try {
      const isUpcoming = reminder.event.startsAt.getTime() > Date.now();
      const hasGoingRsvp = reminder.event.rsvps.some((rsvp) => rsvp.userId === reminder.userId);
      const isEligible =
        reminder.recipient.isActive && reminder.event.status === "PUBLISHED" && isUpcoming && hasGoingRsvp;

      if (!isEligible) {
        await prisma.reminder.update({
          where: { id: reminder.id },
          data: {
            status: ReminderStatus.FAILED,
            sentAt: null,
          },
        });
        skipped += 1;
        continue;
      }

      const email = eventReminderEmailTemplate({
        memberFirstName: reminder.recipient.firstName,
        eventTitle: reminder.event.title,
        startsAt: reminder.event.startsAt,
        venueName: reminder.event.venue.name,
      });

      const outbox = await enqueueEmailOutbox({
        type: "EVENT_REMINDER",
        recipientEmail: reminder.recipient.email,
        recipientName: `${reminder.recipient.firstName} ${reminder.recipient.lastName}`,
        subject: email.subject,
        htmlBody: email.htmlBody,
        dedupeKey: `event-reminder:${reminder.id}`,
      });

      await prisma.reminder.update({
        where: { id: reminder.id },
        data: {
          status: ReminderStatus.SENT,
          sentAt: new Date(),
        },
      });

      if (outbox) {
        enqueued += 1;
      } else {
        skipped += 1;
      }
    } catch {
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: {
          status: ReminderStatus.FAILED,
          sentAt: null,
        },
      });
      failed += 1;
    }
  }

  return NextResponse.json({
    ok: true,
    scanned: dueReminders.length,
    enqueued,
    skipped,
    failed,
  });
}
