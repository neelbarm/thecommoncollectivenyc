import { EventStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

const updateEventSchema = z.object({
  status: z.nativeEnum(EventStatus),
});

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{ eventId: string }>;
  },
) {
  const session = await requireAdmin();

  if (!session) {
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

    const updated = await prisma.event.update({
      where: { id: eventId },
      data: {
        status: parsed.data.status,
      },
      select: {
        id: true,
        status: true,
      },
    });

    return NextResponse.json({ ok: true, event: updated });
  } catch {
    return NextResponse.json({ error: "Unable to update event right now." }, { status: 500 });
  }
}
