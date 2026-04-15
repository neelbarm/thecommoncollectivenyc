import { EventStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  assertCohortBelongsToSeason,
  assertEventTimesWithinSeason,
} from "@/lib/admin/validate-event-program";
import {
  enqueueEmailOutbox,
  eventPublishedEmailTemplate,
} from "@/lib/email/outbox";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

const updateEventSchema = z.object({
  seasonId: z.string().cuid().optional(),
  status: z.nativeEnum(EventStatus).optional(),
  title: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().min(2).max(1200).optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  capacity: z.number().int().min(2).max(200).optional(),
  cohortId: z.string().cuid().nullable().optional(),
  venueId: z.string().cuid().optional(),
}).refine((d) => Object.values(d).some((v) => v !== undefined), {
  message: "At least one field must be provided.",
});

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{ eventId: string }>;
  },
) {
  const session = await requireAdmin();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const parsed = updateEventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid event update payload." },
      { status: 400 },
    );
  }

  const { eventId } = await context.params;

  try {
    const existing = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        seasonId: true,
        cohortId: true,
        startsAt: true,
        endsAt: true,
        status: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    const nextSeasonId =
      parsed.data.seasonId !== undefined ? parsed.data.seasonId : existing.seasonId;

    if (parsed.data.seasonId !== undefined) {
      const seasonRow = await prisma.season.findUnique({
        where: { id: parsed.data.seasonId },
        select: { id: true },
      });
      if (!seasonRow) {
        return NextResponse.json({ error: "Season not found." }, { status: 404 });
      }
    }

    const nextStarts =
      parsed.data.startsAt !== undefined ? new Date(parsed.data.startsAt) : existing.startsAt;
    const nextEnds =
      parsed.data.endsAt !== undefined ? new Date(parsed.data.endsAt) : existing.endsAt;

    if (parsed.data.startsAt !== undefined || parsed.data.endsAt !== undefined) {
      if (nextEnds.getTime() <= nextStarts.getTime()) {
        return NextResponse.json(
          { error: "End time must be after start time." },
          { status: 400 },
        );
      }
    }

    const timeCheck = await assertEventTimesWithinSeason(nextSeasonId, nextStarts, nextEnds);
    if (!timeCheck.ok) {
      return NextResponse.json({ error: timeCheck.error }, { status: 400 });
    }

    let effectiveCohortId =
      parsed.data.cohortId !== undefined ? parsed.data.cohortId : existing.cohortId;
    let autoClearedCohort = false;

    let cohortCheck = await assertCohortBelongsToSeason(effectiveCohortId, nextSeasonId);
    if (
      !cohortCheck.ok &&
      parsed.data.seasonId !== undefined &&
      parsed.data.seasonId !== existing.seasonId &&
      parsed.data.cohortId === undefined &&
      effectiveCohortId != null
    ) {
      effectiveCohortId = null;
      autoClearedCohort = true;
      cohortCheck = await assertCohortBelongsToSeason(null, nextSeasonId);
    }

    if (!cohortCheck.ok) {
      return NextResponse.json({ error: cohortCheck.error }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.data.seasonId !== undefined) updateData.seasonId = parsed.data.seasonId;
    if (autoClearedCohort) {
      updateData.cohortId = null;
    } else if (parsed.data.cohortId !== undefined) {
      updateData.cohortId = parsed.data.cohortId;
    }
    if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
    if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
    if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
    if (parsed.data.capacity !== undefined) updateData.capacity = parsed.data.capacity;
    if (parsed.data.venueId !== undefined) updateData.venueId = parsed.data.venueId;
    if (parsed.data.startsAt !== undefined) updateData.startsAt = new Date(parsed.data.startsAt);
    if (parsed.data.endsAt !== undefined) updateData.endsAt = new Date(parsed.data.endsAt);

    const updated = await prisma.event.update({
      where: { id: eventId },
      data: updateData,
      select: {
        id: true,
        title: true,
        status: true,
        startsAt: true,
        endsAt: true,
        capacity: true,
        cohortId: true,
        seasonId: true,
        venueId: true,
      },
    });

    const justPublished = existing.status !== "PUBLISHED" && updated.status === "PUBLISHED";

    if (justPublished) {
      const venue = await prisma.venue.findUnique({
        where: { id: updated.venueId },
        select: { name: true },
      });

      const recipients = await prisma.user.findMany({
        where: {
          isActive: true,
          ...(updated.cohortId
            ? {
                cohortMemberships: {
                  some: {
                    cohortId: updated.cohortId,
                    status: { in: ["ACTIVE", "INVITED"] },
                  },
                },
              }
            : {
                cohortMemberships: {
                  some: {
                    status: { in: ["ACTIVE", "INVITED"] },
                    cohort: { seasonId: updated.seasonId },
                  },
                },
              }),
        },
        select: { id: true, firstName: true, lastName: true, email: true },
      });

      await Promise.all(
        recipients.map((recipient) => {
          const email = eventPublishedEmailTemplate({
            memberFirstName: recipient.firstName,
            eventTitle: updated.title,
            startsAt: updated.startsAt,
            venueName: venue?.name ?? "your venue",
          });

          return enqueueEmailOutbox({
            type: "EVENT_PUBLISHED",
            recipientEmail: recipient.email,
            recipientName: `${recipient.firstName} ${recipient.lastName}`,
            subject: email.subject,
            htmlBody: email.htmlBody,
            dedupeKey: `event-published:${updated.id}:${recipient.id}`,
          });
        }),
      );
    }

    return NextResponse.json({ ok: true, event: updated });
  } catch {
    return NextResponse.json({ error: "Unable to update event right now." }, { status: 500 });
  }
}
