 "use client";

import type { AnalyticsEventName } from "@prisma/client";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminAnalyticsDashboardData } from "@/lib/admin/get-analytics-dashboard-data";

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function eventLabel(name: AnalyticsEventName) {
  return name.replaceAll("_", " ");
}

export function AdminAnalyticsClient({ data }: { data: AdminAnalyticsDashboardData }) {
  const [windowDays, setWindowDays] = useState<7 | 30>(30);
  const windowLabel = windowDays === 7 ? "7 days" : "30 days";

  const groupedForWindow = useMemo(() => {
    if (windowDays === 30) {
      return data.grouped30d;
    }

    const keyEvents = new Set<AnalyticsEventName>([
      "signup_started",
      "signup_completed",
      "onboarding_started",
      "onboarding_step_completed",
      "onboarding_completed",
      "cohort_assigned",
      "event_published",
      "event_rsvped",
      "drop_posted",
    ]);

    const counts = new Map<AnalyticsEventName, number>();
    const sinceMs = Date.now() - 7 * 24 * 60 * 60 * 1000;

    for (const event of data.recentEvents) {
      const createdMs = new Date(event.createdAt).getTime();
      if (createdMs < sinceMs) continue;
      if (!keyEvents.has(event.name)) continue;
      counts.set(event.name, (counts.get(event.name) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [data.grouped30d, data.recentEvents, windowDays]);

  const funnelForWindow = useMemo(() => {
    if (windowDays === 30) {
      return data.funnel30d;
    }

    const byName = new Map<AnalyticsEventName, number>();
    const sinceMs = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const funnelOrder: AnalyticsEventName[] = [
      "signup_completed",
      "onboarding_started",
      "onboarding_completed",
      "cohort_assigned",
      "event_rsvped",
      "drop_posted",
    ];

    for (const event of data.recentEvents) {
      const createdMs = new Date(event.createdAt).getTime();
      if (createdMs < sinceMs) continue;
      if (!funnelOrder.includes(event.name)) continue;
      byName.set(event.name, (byName.get(event.name) ?? 0) + 1);
    }

    return funnelOrder.map((name) => ({ name, count: byName.get(name) ?? 0 }));
  }, [data.funnel30d, data.recentEvents, windowDays]);

  const recentEventsForWindow = useMemo(() => {
    if (windowDays === 30) {
      return data.recentEvents;
    }

    const sinceMs = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return data.recentEvents.filter((event) => new Date(event.createdAt).getTime() >= sinceMs);
  }, [data.recentEvents, windowDays]);

  return (
    <div className="space-y-7">
      <Card className="surface-panel">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Window</CardTitle>
          <CardDescription>Switch between the most recent 7-day and 30-day analytics views.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="surface-subtle inline-flex gap-1 p-1">
            <button
              type="button"
              className={`rounded-full px-4 py-1.5 text-xs font-medium tracking-wide transition-[color,background-color,border-color] duration-300 ${
                windowDays === 7
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-oat/70 hover:text-foreground"
              }`}
              onClick={() => setWindowDays(7)}
              aria-pressed={windowDays === 7}
            >
              Last 7 days
            </button>
            <button
              type="button"
              className={`rounded-full px-4 py-1.5 text-xs font-medium tracking-wide transition-[color,background-color,border-color] duration-300 ${
                windowDays === 30
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-oat/70 hover:text-foreground"
              }`}
              onClick={() => setWindowDays(30)}
              aria-pressed={windowDays === 30}
            >
              Last 30 days
            </button>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="surface-panel">
          <CardHeader className="pb-2">
            <CardDescription>Events (last 7 days)</CardDescription>
            <CardTitle className="text-3xl">{data.windows.last7dTotal}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="surface-panel">
          <CardHeader className="pb-2">
            <CardDescription>Events (last 30 days)</CardDescription>
            <CardTitle className="text-3xl">{data.windows.last30dTotal}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="surface-panel sm:col-span-2">
          <CardHeader className="pb-2">
            <CardDescription>Tracked launch events</CardDescription>
            <div className="mt-1 flex flex-wrap gap-2">
              {[
                "signup_completed",
                "onboarding_started",
                "onboarding_completed",
                "cohort_assigned",
                "event_rsvped",
                "drop_posted",
              ].map((name) => (
                <Badge key={name} variant="outline">
                  {eventLabel(name as AnalyticsEventName)}
                </Badge>
              ))}
            </div>
          </CardHeader>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="surface-panel">
          <CardHeader>
            <CardTitle className="text-xl">Activation funnel ({windowLabel})</CardTitle>
            <CardDescription>Counts by milestone event in launch order.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {funnelForWindow.map((entry) => (
              <div key={entry.name} className="dense-row flex items-center justify-between px-3 py-2.5">
                <p className="text-sm text-foreground">{eventLabel(entry.name)}</p>
                <Badge variant="outline">{entry.count}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="surface-panel">
          <CardHeader>
            <CardTitle className="text-xl">Event counts by name ({windowLabel})</CardTitle>
            <CardDescription>Quick volume snapshot across all tracked events.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {groupedForWindow.length === 0 ? (
              <div className="surface-dashed p-4">
                <p className="text-sm text-muted-foreground">No analytics events recorded yet.</p>
              </div>
            ) : (
              groupedForWindow.map((entry) => (
                <div key={entry.name} className="dense-row flex items-center justify-between px-3 py-2.5">
                  <p className="text-sm text-foreground">{eventLabel(entry.name)}</p>
                  <Badge variant="outline">{entry.count}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <Card className="surface-panel">
        <CardHeader>
          <CardTitle className="text-xl">Recent analytics events ({windowLabel})</CardTitle>
          <CardDescription>
            Latest instrumentation records across signup, onboarding, cohort, RSVP, and Drop.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentEventsForWindow.length === 0 ? (
            <div className="surface-dashed p-4">
              <p className="text-sm text-muted-foreground">No recent events yet.</p>
            </div>
          ) : (
            <div className="surface-subtle overflow-x-auto p-2">
              <table className="w-full text-xs [th]:font-medium [th]:tracking-wide [th]:text-muted-foreground/90">
                <thead>
                  <tr className="border-b border-border/50 text-left">
                    <th className="pb-2 pr-3">When</th>
                    <th className="pb-2 pr-3">Event</th>
                    <th className="pb-2 pr-3">Source</th>
                    <th className="pb-2 pr-3">Actor</th>
                    <th className="pb-2 pr-3">Path</th>
                    <th className="pb-2">Metadata</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEventsForWindow.map((event) => (
                    <tr key={event.id} className="border-b border-border/30 transition-colors hover:bg-oat/35">
                      <td className="py-2 pr-3 text-muted-foreground">{formatDateTime(event.createdAt)}</td>
                      <td className="py-2 pr-3 font-medium text-foreground">{eventLabel(event.name)}</td>
                      <td className="py-2 pr-3">
                        <Badge variant="outline">{event.source}</Badge>
                      </td>
                      <td className="py-2 pr-3 text-muted-foreground">{event.actorLabel}</td>
                      <td className="py-2 pr-3 text-muted-foreground">{event.path ?? "—"}</td>
                      <td className="py-2 text-muted-foreground">{event.metadataPreview ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">Snapshot generated {formatDateTime(data.generatedAt)}.</p>
    </div>
  );
}

