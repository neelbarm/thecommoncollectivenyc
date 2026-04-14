import { CohortStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

const updateCohortSchema = z.object({
  status: z.nativeEnum(CohortStatus),
  capacity: z.number().int().min(1).max(100).optional(),
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
  const payload = await request.json();
  const parsed = updateCohortSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid cohort update payload." },
      { status: 400 },
    );
  }

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
      status: parsed.data.status,
      capacity: parsed.data.capacity,
    },
    select: {
      id: true,
      status: true,
      capacity: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ cohort: updated });
}
