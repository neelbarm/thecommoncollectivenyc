import { NextResponse } from "next/server";
import { z } from "zod";

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
      prisma.venue.findUnique({ where: { id: parsed.data.venueId }, select: { id: true } }),
    ]);
    if (!season) return NextResponse.json({ error: "Season not found." }, { status: 404 });
    if (!venue) return NextResponse.json({ error: "Venue not found." }, { status: 404 });

    // Unique slug
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

    return NextResponse.json({ ok: true, event }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unable to create event right now." }, { status: 500 });
  }
}
