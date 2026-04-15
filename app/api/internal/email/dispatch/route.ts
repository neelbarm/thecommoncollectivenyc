import { EmailOutboxStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { sendEmail } from "@/lib/email/sender";
import { prisma } from "@/lib/prisma";

const dispatchSchema = z.object({
  limit: z.number().int().min(1).max(100).optional().default(25),
});

function isAuthorized(request: Request) {
  const token = process.env.EMAIL_DISPATCH_TOKEN?.trim();
  if (!token) {
    return false;
  }
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${token}`;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown = {};
  try {
    if (request.headers.get("content-length") !== "0") {
      body = await request.json().catch(() => ({}));
    }
  } catch {
    body = {};
  }

  const parsed = dispatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid dispatch payload." },
      { status: 400 },
    );
  }

  const pending = await prisma.emailOutbox.findMany({
    where: { status: EmailOutboxStatus.PENDING },
    orderBy: { createdAt: "asc" },
    take: parsed.data.limit,
    select: {
      id: true,
      recipientEmail: true,
      subject: true,
      htmlBody: true,
      attempts: true,
    },
  });

  let sent = 0;
  let failed = 0;

  for (const item of pending) {
    try {
      await sendEmail({
        to: item.recipientEmail,
        subject: item.subject,
        html: item.htmlBody,
      });

      await prisma.emailOutbox.update({
        where: { id: item.id },
        data: {
          status: EmailOutboxStatus.SENT,
          sentAt: new Date(),
          attempts: item.attempts + 1,
          lastError: null,
        },
      });
      sent += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown email send error";
      await prisma.emailOutbox.update({
        where: { id: item.id },
        data: {
          status: EmailOutboxStatus.FAILED,
          attempts: item.attempts + 1,
          lastError: message.slice(0, 1000),
        },
      });
      failed += 1;
    }
  }

  return NextResponse.json({ ok: true, scanned: pending.length, sent, failed });
}
