import type { AnalyticsEventName } from "@prisma/client";

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
  return (
    <div className="space-y-7">
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
            <CardTitle className="text-xl">Activation funnel (30 days)</CardTitle>
            <CardDescription>Counts by milestone event in launch order.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.funnel30d.map((entry) => (
              <div key={entry.name} className="dense-row flex items-center justify-between px-3 py-2.5">
                <p className="text-sm text-foreground">{eventLabel(entry.name)}</p>
                <Badge variant="outline">{entry.count}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="surface-panel">
          <CardHeader>
            <CardTitle className="text-xl">Event counts by name (30 days)</CardTitle>
            <CardDescription>Quick volume snapshot across all tracked events.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.grouped30d.length === 0 ? (
              <div className="surface-dashed p-4">
                <p className="text-sm text-muted-foreground">No analytics events recorded yet.</p>
              </div>
            ) : (
              data.grouped30d.map((entry) => (
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
          <CardTitle className="text-xl">Recent analytics events</CardTitle>
          <CardDescription>
            Latest instrumentation records across signup, onboarding, cohort, RSVP, and Drop.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.recentEvents.length === 0 ? (
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
                  {data.recentEvents.map((event) => (
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

