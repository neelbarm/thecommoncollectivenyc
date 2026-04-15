import { Prisma } from "@prisma/client";
import type { AnalyticsEventName, AnalyticsEventSource } from "@prisma/client";

import { prisma } from "@/lib/prisma";

type TrackEventInput = {
  name: AnalyticsEventName;
  source?: AnalyticsEventSource;
  actorUserId?: string | null;
  anonymousId?: string | null;
  path?: string | null;
  metadata?: Record<string, unknown> | null;
  dedupeKey?: string | null;
};

function normalizeMetadata(metadata: TrackEventInput["metadata"]): Prisma.InputJsonValue | undefined {
  if (!metadata || Object.keys(metadata).length === 0) {
    return undefined;
  }
  return metadata as Prisma.InputJsonValue;
}

/**
 * Minimal durable analytics recorder.
 * Never throws to callers — instrumentation must not break product flows.
 */
export async function trackEvent(input: TrackEventInput) {
  try {
    await prisma.analyticsEvent.create({
      data: {
        name: input.name,
        source: input.source ?? "SERVER",
        actorUserId: input.actorUserId ?? null,
        anonymousId: input.anonymousId ?? null,
        path: input.path ?? null,
        metadata: normalizeMetadata(input.metadata),
        dedupeKey: input.dedupeKey ?? null,
      },
      select: { id: true },
    });
  } catch {
    // Swallow analytics failures. Core UX must stay unaffected.
  }
}
