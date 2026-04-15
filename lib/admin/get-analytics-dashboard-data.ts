import { AnalyticsEventName } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const funnelOrder: AnalyticsEventName[] = [
  "signup_completed",
  "onboarding_started",
  "onboarding_completed",
  "cohort_assigned",
  "event_rsvped",
  "drop_posted",
];

function sinceDays(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function toCountMap(rows: Array<{ name: AnalyticsEventName; _count: { _all: number } }>) {
  const map = new Map<AnalyticsEventName, number>();
  for (const row of rows) {
    map.set(row.name, row._count._all);
  }
  return map;
}

function metadataPreview(input: unknown): string | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return null;
  }

  const entries = Object.entries(input as Record<string, unknown>).slice(0, 3);
  if (entries.length === 0) {
    return null;
  }

  return entries
    .map(([k, v]) => `${k}:${typeof v === "string" ? v : JSON.stringify(v)}`)
    .join(" · ");
}

export type AdminAnalyticsDashboardData = {
  generatedAt: string;
  windows: {
    last7dTotal: number;
    last30dTotal: number;
  };
  grouped30d: Array<{
    name: AnalyticsEventName;
    count: number;
  }>;
  funnel30d: Array<{
    name: AnalyticsEventName;
    count: number;
  }>;
  recentEvents: Array<{
    id: string;
    createdAt: string;
    name: AnalyticsEventName;
    source: "SERVER" | "CLIENT";
    actorLabel: string;
    path: string | null;
    metadataPreview: string | null;
  }>;
};

export async function getAdminAnalyticsDashboardData(): Promise<AdminAnalyticsDashboardData> {
  const [last30Grouped, last7Total, last30Total, recent] = await Promise.all([
    prisma.analyticsEvent.groupBy({
      by: ["name"],
      where: { createdAt: { gte: sinceDays(30) } },
      _count: { _all: true },
    }),
    prisma.analyticsEvent.count({ where: { createdAt: { gte: sinceDays(7) } } }),
    prisma.analyticsEvent.count({ where: { createdAt: { gte: sinceDays(30) } } }),
    prisma.analyticsEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 80,
      select: {
        id: true,
        createdAt: true,
        name: true,
        source: true,
        path: true,
        metadata: true,
        actorUser: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    }),
  ]);

  const grouped30d = last30Grouped
    .map((row) => ({ name: row.name, count: row._count._all }))
    .sort((a, b) => b.count - a.count);

  const funnelCountMap = toCountMap(last30Grouped);
  const funnel30d = funnelOrder.map((name) => ({
    name,
    count: funnelCountMap.get(name) ?? 0,
  }));

  return {
    generatedAt: new Date().toISOString(),
    windows: {
      last7dTotal: last7Total,
      last30dTotal: last30Total,
    },
    grouped30d,
    funnel30d,
    recentEvents: recent.map((event) => ({
      id: event.id,
      createdAt: event.createdAt.toISOString(),
      name: event.name,
      source: event.source,
      actorLabel: event.actorUser
        ? `${event.actorUser.firstName} ${event.actorUser.lastName}`
        : "Anonymous / system",
      path: event.path,
      metadataPreview: metadataPreview(event.metadata),
    })),
  };
}

