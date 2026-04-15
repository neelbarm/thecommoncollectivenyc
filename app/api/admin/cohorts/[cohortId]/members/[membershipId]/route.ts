import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

const updateMembershipSchema = z.object({
  status: z.enum(["INVITED", "ACTIVE", "PAUSED", "COMPLETED"]),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ cohortId: string; membershipId: string }> },
) {
  const session = await requireAdmin();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { cohortId, membershipId } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = updateMembershipSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid payload." },
      { status: 400 },
    );
  }

  try {
    const existing = await prisma.cohortMembership.findUnique({
      where: { id: membershipId },
      select: { id: true, cohortId: true },
    });
    if (!existing || existing.cohortId !== cohortId) {
      return NextResponse.json({ error: "Membership not found." }, { status: 404 });
    }

    const status = parsed.data.status;
    const updated = await prisma.cohortMembership.update({
      where: { id: membershipId },
      data: {
        status,
        joinedAt: status === "ACTIVE" ? new Date() : undefined,
        leftAt: status === "COMPLETED" || status === "PAUSED" ? new Date() : null,
      },
      select: { id: true, status: true, joinedAt: true, leftAt: true },
    });

    return NextResponse.json({ ok: true, membership: updated });
  } catch {
    return NextResponse.json({ error: "Unable to update membership right now." }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ cohortId: string; membershipId: string }> },
) {
  const session = await requireAdmin();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { cohortId, membershipId } = await context.params;

  try {
    const existing = await prisma.cohortMembership.findUnique({
      where: { id: membershipId },
      select: { id: true, cohortId: true },
    });
    if (!existing || existing.cohortId !== cohortId) {
      return NextResponse.json({ error: "Membership not found." }, { status: 404 });
    }

    await prisma.cohortMembership.delete({ where: { id: membershipId } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to remove member right now." }, { status: 500 });
  }
}
