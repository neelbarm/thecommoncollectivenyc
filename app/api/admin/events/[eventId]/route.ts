import { EventStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

const updateEventSchema = z.object({
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
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
    if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
    if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
    if (parsed.data.capacity !== undefined) updateData.capacity = parsed.data.capacity;
    if (parsed.data.cohortId !== undefined) updateData.cohortId = parsed.data.cohortId;
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
        venueId: true,
      },
    });

    return NextResponse.json({ ok: true, event: updated });
  } catch {
    return NextResponse.json({ error: "Unable to update event right now." }, { status: 500 });
  }
}
