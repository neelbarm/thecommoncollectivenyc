import { logNotificationAttempt } from "@/lib/notifications/log";
import { getApnsConfig } from "@/lib/push/apns-env";
import { getInboxUnreadTotalForUser } from "@/lib/push/get-inbox-unread-total";
import { normalizeApnsDeviceToken } from "@/lib/push/normalize-apns-device-token";
import { prisma } from "@/lib/prisma";

type FanoutTarget = { id: string; token: string; userId: string };

type FanoutPayload = {
  title: string;
  body: string;
  data: Record<string, string>;
};

function compact(text: string, limit: number) {
  const trimmed = text.trim();
  if (trimmed.length <= limit) {
    return trimmed;
  }
  return `${trimmed.slice(0, limit - 1)}…`;
}

const INVALID_TOKEN_REASONS = new Set([
  "Unregistered",
  "BadDeviceToken",
  "DeviceTokenNotForTopic",
]);

async function deactivateToken(token: string, reason: string) {
  try {
    await prisma.devicePushToken.updateMany({
      where: { token },
      data: { isActive: false, lastError: reason.slice(0, 500) },
    });
  } catch {
    // ignore
  }
}

type ApnModule = typeof import("apn");

async function loadApn(): Promise<ApnModule> {
  const mod = await import("apn");
  if (mod && typeof mod === "object" && "Provider" in mod && "Notification" in mod) {
    return mod as ApnModule;
  }
  const withDefault = mod as { default?: ApnModule };
  if (withDefault.default) {
    return withDefault.default;
  }
  return mod as ApnModule;
}

export async function dispatchPushFanout(input: {
  targets: FanoutTarget[];
  payload: FanoutPayload;
  dedupeKey: string;
  triggerSource: string;
}) {
  const config = getApnsConfig();

  if (input.targets.length === 0) {
    await logNotificationAttempt({
      type: "PUSH_NOTIFICATION",
      status: "SKIPPED",
      recipientEmail: "push:no-targets@thecommoncollective.space",
      dedupeKey: input.dedupeKey,
      triggerSource: input.triggerSource,
      errorSummary: "No active push targets for fanout.",
    });
    return { sent: 0, failed: 0, skipped: true as const };
  }

  if (!config) {
    for (const recipient of input.targets) {
      await logNotificationAttempt({
        type: "PUSH_NOTIFICATION",
        status: "SKIPPED",
        recipientEmail: `${recipient.userId}@push.local`,
        dedupeKey: input.dedupeKey,
        triggerSource: input.triggerSource,
        errorSummary:
          "APNs not configured (set APNS_AUTH_KEY_ID, APNS_TEAM_ID, APNS_PRIVATE_KEY, APNS_USE_SANDBOX).",
      });
    }
    return { sent: 0, failed: 0, skipped: true as const };
  }

  const apn = await loadApn();
  const provider = new apn.Provider({
    token: {
      key: config.key,
      keyId: config.keyId,
      teamId: config.teamId,
    },
    production: config.production,
  });

  let sent = 0;
  let failed = 0;

  try {
    for (const recipient of input.targets) {
      const hex = normalizeApnsDeviceToken(recipient.token);
      if (!hex) {
        failed += 1;
        await logNotificationAttempt({
          type: "PUSH_NOTIFICATION",
          status: "FAILED",
          recipientEmail: `${recipient.userId}@push.local`,
          dedupeKey: input.dedupeKey,
          triggerSource: input.triggerSource,
          errorSummary: "Invalid device token format.",
        });
        continue;
      }

      const title = compact(input.payload.title, 120);
      const body = compact(input.payload.body, 240);
      let badge = 1;
      try {
        badge = await getInboxUnreadTotalForUser(recipient.userId);
      } catch {
        badge = 1;
      }

      const notification = new apn.Notification();
      notification.topic = config.bundleId;
      notification.expiry = Math.floor(Date.now() / 1000) + 86_400;
      notification.sound = "default";
      notification.badge = badge;
      notification.alert = { title, body };
      notification.payload = { cc: input.payload.data };

      try {
        const result = await provider.send(notification, hex);
        if (result.failed?.length) {
          failed += 1;
          const failure = result.failed[0];
          const reason = failure.response?.reason ?? failure.error?.message ?? "APNs send failed.";
          if (INVALID_TOKEN_REASONS.has(reason)) {
            await deactivateToken(recipient.token, reason);
          }
          await logNotificationAttempt({
            type: "PUSH_NOTIFICATION",
            status: "FAILED",
            recipientEmail: `${recipient.userId}@push.local`,
            dedupeKey: input.dedupeKey,
            triggerSource: input.triggerSource,
            errorSummary: reason.slice(0, 800),
          });
        } else {
          sent += 1;
          await logNotificationAttempt({
            type: "PUSH_NOTIFICATION",
            status: "SENT",
            recipientEmail: `${recipient.userId}@push.local`,
            dedupeKey: input.dedupeKey,
            triggerSource: input.triggerSource,
          });
        }
      } catch (error) {
        failed += 1;
        const message = error instanceof Error ? error.message : "APNs send error.";
        await logNotificationAttempt({
          type: "PUSH_NOTIFICATION",
          status: "FAILED",
          recipientEmail: `${recipient.userId}@push.local`,
          dedupeKey: input.dedupeKey,
          triggerSource: input.triggerSource,
          errorSummary: message.slice(0, 800),
        });
      }
    }
  } finally {
    provider.shutdown();
  }

  return { sent, failed, skipped: false as const };
}
