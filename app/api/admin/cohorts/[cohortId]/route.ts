import { CohortStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

const updateCohortSchema = z.object({
  status: z.nativeEnum(CohortStatus).optional(),
  capacity: z.number().int().min(1).max(100).optional(),
  name: z.string().trim().min(2).max(80).optional(),
  description: z.string().trim().max(400).nullable().optional(),
}).refine((d) => Object.values(d).some((v) => v !== undefined), {
  message: "At least one field must be provided.",
});

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{ cohortId: string }>;
  },
) {
  const session = await requireAdmin();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { cohortId } = await context.params;
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const parsed = updateCohortSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid cohort update payload." },
      { status: 400 },
    );
  }

  try {
    const existing = await prisma.cohort.findUnique({
      where: { id: cohortId },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Cohort not found." }, { status: 404 });
    }

    const updated = await prisma.cohort.update({
      where: { id: cohortId },
      data: {
        ...(parsed.data.status !== undefined && { status: parsed.data.status }),
        ...(parsed.data.capacity !== undefined && { capacity: parsed.data.capacity }),
        ...(parsed.data.name !== undefined && { name: parsed.data.name }),
        ...(parsed.data.description !== undefined && { description: parsed.data.description }),
      },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        capacity: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ cohort: updated });
  } catch {
    return NextResponse.json({ error: "Unable to update cohort right now." }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  context: {
    params: Promise<{ cohortId: string }>;
  },
) {
  const session = await requireAdmin();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { cohortId } = await context.params;

  try {
    const existing = await prisma.cohort.findUnique({
      where: { id: cohortId },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Cohort not found." }, { status: 404 });
    }

    const [membershipCount, eventCount] = await Promise.all([
      prisma.cohortMembership.count({ where: { cohortId } }),
      prisma.event.count({ where: { cohortId } }),
    ]);

    if (membershipCount > 0 || eventCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete cohort while it has attached records. Remove ${membershipCount} member(s) and ${eventCount} event(s) first.`,
        },
        { status: 400 },
      );
    }

    await prisma.cohort.delete({ where: { id: cohortId } });
    return NextResponse.json({ ok: true, deletedCohortId: cohortId });
  } catch {
    return NextResponse.json({ error: "Unable to delete cohort right now." }, { status: 500 });
  }
}
