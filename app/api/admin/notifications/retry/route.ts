import { EmailOutboxStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { logNotificationAttempt } from "@/lib/notifications/log";
import { prisma } from "@/lib/prisma";

const retrySchema = z.object({
  outboxId: z.string().cuid(),
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

  const parsed = retrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid retry payload." },
      { status: 400 },
    );
  }

  try {
    const row = await prisma.emailOutbox.findUnique({
      where: { id: parsed.data.outboxId },
      select: {
        id: true,
        type: true,
        status: true,
        recipientEmail: true,
        dedupeKey: true,
      },
    });

    if (!row) {
      return NextResponse.json({ error: "Outbox row not found." }, { status: 404 });
    }

    if (row.status !== EmailOutboxStatus.FAILED) {
      return NextResponse.json({ error: "Only FAILED outbox rows can be retried." }, { status: 409 });
    }

    const updated = await prisma.emailOutbox.update({
      where: { id: row.id },
      data: {
        status: EmailOutboxStatus.PENDING,
        lastError: null,
        sentAt: null,
      },
      select: { id: true, status: true },
    });

    await logNotificationAttempt({
      outboxId: row.id,
      type: row.type,
      status: "QUEUED",
      triggerSource: "admin-retry",
      dedupeKey: row.dedupeKey,
      recipientEmail: row.recipientEmail,
    });

    return NextResponse.json({ ok: true, outbox: updated });
  } catch {
    return NextResponse.json({ error: "Unable to retry outbox row right now." }, { status: 500 });
  }
}
