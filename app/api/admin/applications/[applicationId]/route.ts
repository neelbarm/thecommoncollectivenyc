import { ApplicationStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

const updateApplicationSchema = z.object({
  status: z.nativeEnum(ApplicationStatus),
  preserveSubmittedAt: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ applicationId: string }> },
) {
  const session = await requireAdmin();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { applicationId } = await context.params;
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const parsed = updateApplicationSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid application update payload" },
      { status: 400 },
    );
  }

  const status = parsed.data.status;
  const now = new Date();

  const updated = await prisma.memberApplication.update({
    where: { id: applicationId },
    data: {
      status,
      reviewedById: session.user.id,
      reviewedAt: status === "REVIEWING" || status === "ACCEPTED" || status === "REJECTED" ? now : null,
      submittedAt:
        status === "SUBMITTED" && !parsed.data.preserveSubmittedAt ? now : undefined,
    },
    select: {
      id: true,
      status: true,
      reviewedAt: true,
      submittedAt: true,
      reviewedBy: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  return NextResponse.json({
    ok: true,
    application: {
      id: updated.id,
      status: updated.status,
      reviewedAt: updated.reviewedAt?.toISOString() ?? null,
      submittedAt: updated.submittedAt?.toISOString() ?? null,
      reviewerName: updated.reviewedBy
        ? `${updated.reviewedBy.firstName} ${updated.reviewedBy.lastName}`.trim()
        : null,
    },
  });
}
