import { EmailOutboxStatus, type EmailOutboxType, type NotificationAttemptStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const DAY_MS = 24 * 60 * 60 * 1000;

export type NotificationOpsWindow = "7d" | "30d";

export type NotificationOpsData = {
  generatedAt: string;
  window: NotificationOpsWindow;
  summary: {
    totalAttempts: number;
    totalOutboxRows: number;
    totalQueued: number;
    totalSent: number;
    totalFailed: number;
    totalDuplicatePrevented: number;
    totalSkipped: number;
  };
  attemptsByState: Array<{ state: string; count: number }>;
  attemptsByType: Array<{ type: EmailOutboxType; count: number }>;
  recentAttempts: Array<{
    id: string;
    createdAt: string;
      status: NotificationAttemptStatus;
      type: EmailOutboxType;
    recipientEmail: string | null;
    trigger: string | null;
    errorSummary: string | null;
    outboxId: string | null;
    sentAt: string | null;
  }>;
  recentOutboxRows: Array<{
    id: string;
    type: EmailOutboxType;
    status: EmailOutboxStatus;
    recipientEmail: string;
    attempts: number;
    createdAt: string;
    sentAt: string | null;
    lastError: string | null;
  }>;
};

export async function getNotificationOpsData(
  window: NotificationOpsWindow = "30d",
): Promise<NotificationOpsData> {
  const since = new Date(Date.now() - (window === "7d" ? 7 * DAY_MS : 30 * DAY_MS));

  const [attempts, outboxSummary, recentOutboxRows] = await Promise.all([
    prisma.notificationAttempt.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 120,
      select: {
        id: true,
        createdAt: true,
        status: true,
        type: true,
        recipientEmail: true,
        triggerSource: true,
        errorSummary: true,
        outboxId: true,
      },
    }),
    prisma.emailOutbox.groupBy({
      by: ["status"],
      _count: { _all: true },
      where: { createdAt: { gte: since } },
    }),
    prisma.emailOutbox.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 120,
      select: {
        id: true,
        type: true,
        status: true,
        recipientEmail: true,
        attempts: true,
        createdAt: true,
        sentAt: true,
        lastError: true,
      },
    }),
  ]);

  const stateCounts = new Map<string, number>();
  const typeCounts = new Map<EmailOutboxType, number>();

  for (const item of attempts) {
    stateCounts.set(item.status, (stateCounts.get(item.status) ?? 0) + 1);
    typeCounts.set(item.type, (typeCounts.get(item.type) ?? 0) + 1);
  }

  const outboxByStatus = new Map<EmailOutboxStatus, number>(
    outboxSummary.map((row) => [row.status, row._count._all]),
  );

  return {
    generatedAt: new Date().toISOString(),
    window,
    summary: {
      totalAttempts: attempts.length,
      totalOutboxRows:
        (outboxByStatus.get(EmailOutboxStatus.PENDING) ?? 0) +
        (outboxByStatus.get(EmailOutboxStatus.SENT) ?? 0) +
        (outboxByStatus.get(EmailOutboxStatus.FAILED) ?? 0),
      totalQueued: stateCounts.get("QUEUED") ?? 0,
      totalSent: stateCounts.get("SENT") ?? 0,
      totalFailed: stateCounts.get("FAILED") ?? 0,
      totalDuplicatePrevented: stateCounts.get("DUPLICATE_PREVENTED") ?? 0,
      totalSkipped: stateCounts.get("SKIPPED") ?? 0,
    },
    attemptsByState: Array.from(stateCounts.entries())
      .map(([state, count]) => ({ state, count }))
      .sort((a, b) => b.count - a.count),
    attemptsByType: Array.from(typeCounts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count),
    recentAttempts: attempts.map((item) => ({
      id: item.id,
      createdAt: item.createdAt.toISOString(),
      status: item.status,
      type: item.type,
      recipientEmail: item.recipientEmail,
      trigger: item.triggerSource,
      errorSummary: item.errorSummary,
      outboxId: item.outboxId,
      sentAt: null,
    })),
    recentOutboxRows: recentOutboxRows.map((item) => ({
      id: item.id,
      type: item.type,
      status: item.status,
      recipientEmail: item.recipientEmail,
      attempts: item.attempts,
      createdAt: item.createdAt.toISOString(),
      sentAt: item.sentAt ? item.sentAt.toISOString() : null,
      lastError: item.lastError,
    })),
  };
}
