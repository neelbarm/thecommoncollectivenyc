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

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const createEventSchema = z.object({
  seasonId: z.string().cuid(),
  cohortId: z.string().cuid().nullable().optional(),
  venueId: z.string().cuid(),
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(120),
  description: z.string().trim().min(2, "Description is required").max(1200),
  startsAt: z.string().datetime({ message: "Invalid start date." }),
  endsAt: z.string().datetime({ message: "Invalid end date." }),
  capacity: z.number().int().min(2).max(200),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
});

export async function POST(request: Request) {
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

  const parsed = createEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid event payload." },
      { status: 400 },
    );
  }

  const startsAt = new Date(parsed.data.startsAt);
  const endsAt = new Date(parsed.data.endsAt);
  if (endsAt <= startsAt) {
    return NextResponse.json({ error: "End time must be after start time." }, { status: 400 });
  }

  const baseSlug = slugify(parsed.data.title);
  if (!baseSlug) {
    return NextResponse.json({ error: "Event title produces an invalid slug." }, { status: 400 });
  }

  try {
    const [season, venue] = await Promise.all([
      prisma.season.findUnique({ where: { id: parsed.data.seasonId }, select: { id: true } }),
      prisma.venue.findUnique({ where: { id: parsed.data.venueId }, select: { id: true, name: true } }),
    ]);
    if (!season) return NextResponse.json({ error: "Season not found." }, { status: 404 });
    if (!venue) return NextResponse.json({ error: "Venue not found." }, { status: 404 });

    const timeCheck = await assertEventTimesWithinSeason(parsed.data.seasonId, startsAt, endsAt);
    if (!timeCheck.ok) {
      return NextResponse.json({ error: timeCheck.error }, { status: 400 });
    }

    const cohortCheck = await assertCohortBelongsToSeason(
      parsed.data.cohortId ?? null,
      parsed.data.seasonId,
    );
    if (!cohortCheck.ok) {
      return NextResponse.json({ error: cohortCheck.error }, { status: 400 });
    }

    let slug = baseSlug;
    let attempt = 0;
    while (true) {
      const existing = await prisma.event.findUnique({ where: { slug }, select: { id: true } });
      if (!existing) break;
      attempt++;
      slug = `${baseSlug}-${attempt}`;
    }

    const event = await prisma.event.create({
      data: {
        seasonId: parsed.data.seasonId,
        cohortId: parsed.data.cohortId ?? null,
        venueId: parsed.data.venueId,
        title: parsed.data.title,
        slug,
        description: parsed.data.description,
        startsAt,
        endsAt,
        capacity: parsed.data.capacity,
        status: parsed.data.status,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        startsAt: true,
        endsAt: true,
        capacity: true,
        cohortId: true,
        seasonId: true,
        venueId: true,
      },
    });

    if (event.status === "PUBLISHED") {
      const recipients = await prisma.user.findMany({
        where: {
          isActive: true,
          ...(event.cohortId
            ? {
                cohortMemberships: {
                  some: {
                    cohortId: event.cohortId,
                    status: { in: ["ACTIVE", "INVITED"] },
                  },
                },
              }
            : {
                cohortMemberships: {
                  some: {
                    status: { in: ["ACTIVE", "INVITED"] },
                    cohort: { seasonId: event.seasonId },
                  },
                },
              }),
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      });

      await Promise.all(
        recipients.map((recipient) => {
          const email = eventPublishedEmailTemplate({
            memberFirstName: recipient.firstName,
            eventTitle: event.title,
            startsAt: event.startsAt,
            venueName: venue.name,
          });

          return enqueueEmailOutbox({
            type: "EVENT_PUBLISHED",
            recipientEmail: recipient.email,
            recipientName: `${recipient.firstName} ${recipient.lastName}`,
            subject: email.subject,
            htmlBody: email.htmlBody,
            dedupeKey: `event-published:${event.id}:${recipient.id}`,
          });
        }),
      );
    }

    return NextResponse.json({ ok: true, event }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unable to create event right now." }, { status: 500 });
  }
}
