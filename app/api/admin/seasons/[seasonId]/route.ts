import { SeasonStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

const updateSeasonSchema = z.object({
  status: z.nativeEnum(SeasonStatus),
});

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{ seasonId: string }>;
  },
) {
  const session = await requireAdmin();

  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { seasonId } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const parsed = updateSeasonSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid season update payload" },
      { status: 400 },
    );
  }

  try {
    const existing = await prisma.season.findUnique({
      where: { id: seasonId },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Season not found" }, { status: 404 });
    }

    const updated = await prisma.season.update({
      where: { id: seasonId },
      data: {
        status: parsed.data.status,
      },
      select: {
        id: true,
        status: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ ok: true, season: updated });
  } catch {
    return NextResponse.json({ error: "Unable to update season right now." }, { status: 500 });
  }
}
