import { logNotificationAttempt } from "@/lib/notifications/log";
import { prisma } from "@/lib/prisma";

type PushAudience = {
  userIds?: string[];
  cohortId?: string | null;
  seasonId?: string | null;
};

type QueuePushInput = PushAudience & {
  title: string;
  body: string;
  deepLinkPath: string;
  triggerSource: string;
  dedupeKey: string;
};

function resolveBaseUrl() {
  const value = process.env.NEXTAUTH_URL?.trim() || "http://localhost:3000";
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function toAbsoluteDeepLink(path: string) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${resolveBaseUrl()}${normalized}`;
}

function getPushDispatchToken() {
  return process.env.PUSH_DISPATCH_TOKEN?.trim() || null;
}

export function isPushDispatchConfigured() {
  return Boolean(getPushDispatchToken());
}

function compact(text: string, limit: number) {
  const trimmed = text.trim();
  if (trimmed.length <= limit) {
    return trimmed;
  }
  return `${trimmed.slice(0, limit - 1)}…`;
}

export async function queuePushNotification(input: QueuePushInput) {
  const recipients = await prisma.devicePushToken.findMany({
    where: {
      isActive: true,
      userId: input.userIds?.length ? { in: input.userIds } : undefined,
      user: {
        cohortMemberships: {
          some: {
            cohortId: input.cohortId ?? undefined,
            cohort: {
              seasonId: input.seasonId ?? undefined,
            },
          },
        },
      },
    },
    select: {
      userId: true,
      token: true,
      platform: true,
    },
    take: 1500,
  });

  if (recipients.length === 0) {
    return { queued: 0, sent: 0, failed: 0, skipped: true };
  }

  const payload = {
    title: compact(input.title, 120),
    body: compact(input.body, 240),
    url: toAbsoluteDeepLink(input.deepLinkPath),
    dedupeKey: input.dedupeKey,
    notifications: recipients.map((recipient) => ({
      token: recipient.token,
      platform: recipient.platform,
      userId: recipient.userId,
    })),
  };

  const dispatchToken = getPushDispatchToken();

  if (!dispatchToken) {
    for (const recipient of recipients) {
      await logNotificationAttempt({
        type: "PUSH_NOTIFICATION",
        status: "SKIPPED",
        recipientEmail: `${recipient.userId}@push.local`,
        dedupeKey: input.dedupeKey,
        triggerSource: input.triggerSource,
        errorSummary: "Missing PUSH_DISPATCH_TOKEN env; push dispatch skipped.",
      });
    }
    return { queued: recipients.length, sent: 0, failed: 0, skipped: true };
  }

  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${dispatchToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Push dispatch failed.");
    for (const recipient of recipients) {
      await logNotificationAttempt({
        type: "PUSH_NOTIFICATION",
        status: "FAILED",
        recipientEmail: `${recipient.userId}@push.local`,
        dedupeKey: input.dedupeKey,
        triggerSource: input.triggerSource,
        errorSummary: compact(errorText, 800),
      });
    }
    return { queued: recipients.length, sent: 0, failed: recipients.length, skipped: false };
  }

  for (const recipient of recipients) {
    await logNotificationAttempt({
      type: "PUSH_NOTIFICATION",
      status: "SENT",
      recipientEmail: `${recipient.userId}@push.local`,
      dedupeKey: input.dedupeKey,
      triggerSource: input.triggerSource,
    });
  }

  return { queued: recipients.length, sent: recipients.length, failed: 0, skipped: false };
}
