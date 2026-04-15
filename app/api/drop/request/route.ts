import { DropRequestStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { DROP_ACTIVITY_OPTIONS, DROP_TIMING_OPTIONS } from "@/lib/drop/constants";
import { prisma } from "@/lib/prisma";
import { trackEvent } from "@/lib/analytics/track";

const createDropRequestSchema = z.object({
  activityType: z.enum(DROP_ACTIVITY_OPTIONS),
  timing: z.enum(DROP_TIMING_OPTIONS),
  note: z.string().trim().max(280).optional(),
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request
    .json()
    .catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }
  const parsed = createDropRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid drop payload" },
      { status: 400 },
    );
  }

  try {
    const existingActive = await prisma.dropRequest.findFirst({
      where: {
        requesterId: session.user.id,
        status: {
          in: [DropRequestStatus.OPEN, DropRequestStatus.MATCHED],
        },
      },
      select: {
        id: true,
      },
    });

    if (existingActive) {
      return NextResponse.json(
        {
          error: "You already have an active Drop request.",
        },
        { status: 409 },
      );
    }

    const created = await prisma.dropRequest.create({
      data: {
        requesterId: session.user.id,
        title: `${parsed.data.activityType} | ${parsed.data.timing}`,
        context: parsed.data.note ?? "",
        status: DropRequestStatus.OPEN,
      },
      select: {
        id: true,
        title: true,
        context: true,
        status: true,
        createdAt: true,
      },
    });

    await trackEvent({
      name: "drop_posted",
      actorUserId: session.user.id,
      path: "/api/drop/request",
      metadata: {
        requestId: created.id,
        activityType: parsed.data.activityType,
        timing: parsed.data.timing,
        hasNote: Boolean(parsed.data.note?.trim()),
      },
      dedupeKey: `drop-posted:${created.id}`,
    });

    return NextResponse.json({ ok: true, request: created }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unable to create Drop request right now." }, { status: 500 });
  }
}
