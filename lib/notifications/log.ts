import type { EmailOutboxType, NotificationAttemptStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

type LogNotificationAttemptInput = {
  outboxId?: string | null;
  dedupeKey?: string | null;
  type: EmailOutboxType;
  triggerSource?: string | null;
  status: NotificationAttemptStatus;
  recipientEmail: string;
  errorSummary?: string | null;
};

/**
 * Durable notification delivery audit log.
 * Never throws to callers — logging must not break core product flows.
 */
export async function logNotificationAttempt(input: LogNotificationAttemptInput) {
  try {
    await prisma.notificationAttempt.create({
      data: {
        outboxId: input.outboxId ?? null,
        dedupeKey: input.dedupeKey ?? null,
        type: input.type,
        triggerSource: input.triggerSource ?? null,
        status: input.status,
        recipientEmail: input.recipientEmail.trim().toLowerCase(),
        errorSummary: input.errorSummary ?? null,
      },
      select: { id: true },
    });
  } catch {
    // Intentionally swallow: delivery logging should not block operations.
  }
}
