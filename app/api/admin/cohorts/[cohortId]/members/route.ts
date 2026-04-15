import { NextResponse } from "next/server";
import { z } from "zod";

import {
  cohortWelcomeEmailTemplate,
  enqueueEmailOutbox,
} from "@/lib/email/outbox";
import { logNotificationAttempt } from "@/lib/notifications/log";
import { trackEvent } from "@/lib/analytics/track";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

const addMemberSchema = z.object({
  userId: z.string().cuid(),
  status: z.enum(["INVITED", "ACTIVE", "PAUSED"]).default("INVITED"),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ cohortId: string }> },
) {
  const session = await requireAdmin();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { cohortId } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = addMemberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid member payload." },
      { status: 400 },
    );
  }

  try {
    const cohort = await prisma.cohort.findUnique({
      where: { id: cohortId },
      select: {
        id: true,
        name: true,
        season: { select: { name: true } },
        capacity: true,
        _count: {
          select: {
            memberships: { where: { status: { in: ["ACTIVE", "INVITED"] } } },
          },
        },
      },
    });
    if (!cohort) {
      return NextResponse.json({ error: "Cohort not found." }, { status: 404 });
    }

    if (cohort._count.memberships >= cohort.capacity) {
      return NextResponse.json({ error: "Cohort is at capacity." }, { status: 409 });
    }

    const user = await prisma.user.findUnique({
      where: { id: parsed.data.userId },
      select: { id: true, firstName: true, lastName: true, email: true },
    });
    if (!user) {
      return NextResponse.json({ error: "Member not found." }, { status: 404 });
    }

    const membership = await prisma.cohortMembership.upsert({
      where: {
        userId_cohortId: {
          userId: parsed.data.userId,
          cohortId,
        },
      },
      create: {
        userId: parsed.data.userId,
        cohortId,
        status: parsed.data.status,
        joinedAt: parsed.data.status === "ACTIVE" ? new Date() : null,
      },
      update: {
        status: parsed.data.status,
        joinedAt: parsed.data.status === "ACTIVE" ? new Date() : undefined,
        leftAt: null,
      },
      select: {
        id: true,
        userId: true,
        cohortId: true,
        status: true,
        joinedAt: true,
      },
    });

    const welcomeEmail = cohortWelcomeEmailTemplate({
      memberFirstName: user.firstName,
      cohortName: cohort.name,
      seasonName: cohort.season.name,
    });

    const outboxRecord = await enqueueEmailOutbox({
      type: "COHORT_WELCOME",
      recipientEmail: user.email,
      recipientName: `${user.firstName} ${user.lastName}`,
      subject: welcomeEmail.subject,
      htmlBody: welcomeEmail.htmlBody,
      dedupeKey: `cohort-welcome:${cohortId}:${user.id}:${membership.status}`,
    });

    await logNotificationAttempt({
      type: "COHORT_WELCOME",
      recipientEmail: user.email,
      triggerSource: "admin-cohort-member-add",
      status: outboxRecord ? "QUEUED" : "DUPLICATE_PREVENTED",
      dedupeKey: `cohort-welcome:${cohortId}:${user.id}:${membership.status}`,
      outboxId: outboxRecord?.id ?? null,
    });

    await trackEvent({
      name: "cohort_assigned",
      source: "SERVER",
      actorUserId: session.user.id,
      dedupeKey: `cohort-assigned:${cohortId}:${user.id}:${membership.status}`,
      metadata: {
        cohortId,
        memberUserId: user.id,
        membershipId: membership.id,
        membershipStatus: membership.status,
      },
    });

    return NextResponse.json({ ok: true, membership }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unable to add member right now." }, { status: 500 });
  }
}
