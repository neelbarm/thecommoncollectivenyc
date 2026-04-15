"use client";

import { useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { EventManagementData } from "@/lib/admin/get-event-management-data";

function toIso(local: string) {
  return new Date(local).toISOString();
}

export function AdminEventsClient({ initialData }: { initialData: EventManagementData }) {
  const [data, setData] = useState(initialData);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [seasonId, setSeasonId] = useState(data.seasons[0]?.id ?? "");
  const [cohortId, setCohortId] = useState<string>("");
  const [venueId, setVenueId] = useState(data.venues[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [capacity, setCapacity] = useState("18");
  const [startsLocal, setStartsLocal] = useState("");
  const [endsLocal, setEndsLocal] = useState("");
  const [createStatus, setCreateStatus] = useState<"DRAFT" | "PUBLISHED">("DRAFT");

  function refresh() {
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/events/data");
        if (res.ok) setData((await res.json()) as EventManagementData);
      } catch {
        /* ignore */
      }
    });
  }

  function onCreate() {
    setError(null);
    setFeedback(null);
    const cap = Number.parseInt(capacity, 10);
    if (!seasonId || !venueId || !title.trim() || !description.trim() || !startsLocal || !endsLocal) {
      setError("Fill season, venue, title, description, start, and end.");
      return;
    }
    if (Number.isNaN(cap)) {
      setError("Capacity must be a number.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            seasonId,
            cohortId: cohortId || null,
            venueId,
            title: title.trim(),
            description: description.trim(),
            startsAt: toIso(startsLocal),
            endsAt: toIso(endsLocal),
            capacity: cap,
            status: createStatus,
          }),
        });
        const body = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(body.error ?? "Unable to create event.");
        setFeedback("Event created.");
        setTitle("");
        setDescription("");
        refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unable to create event.");
      }
    });
  }

  function onTogglePublish(eventId: string, current: string) {
    if (current !== "DRAFT" && current !== "PUBLISHED") {
      setError("Only draft or published events can be toggled from this list.");
      return;
    }
    const next = current === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    setError(null);
    setFeedback(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/events/${eventId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: next }),
        });
        const body = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(body.error ?? "Unable to update event.");
        setFeedback(`Event set to ${next}.`);
        refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unable to update event.");
      }
    });
  }

  const cohortsForSeason = data.cohorts.filter((c) => c.seasonId === seasonId);

  return (
    <div className="space-y-6">
      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {feedback ? (
        <p className="rounded-md border border-emerald-400/30 bg-emerald-50/50 px-3 py-2 text-sm text-emerald-800" role="status">
          {feedback}
        </p>
      ) : null}

      <Card className="border-border/70 bg-card/90 shadow-soft">
        <CardHeader>
          <CardTitle className="text-base">Create event</CardTitle>
          <CardDescription className="text-xs">
            Draft or publish. Use local date/time fields (browser timezone).
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Season</label>
            <select
              value={seasonId}
              onChange={(e) => {
                setSeasonId(e.target.value);
                setCohortId("");
              }}
              className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm"
            >
              {data.seasons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} · {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Cohort (optional)</label>
            <select
              value={cohortId}
              onChange={(e) => setCohortId(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm"
            >
              <option value="">All season / no cohort</option>
              {cohortsForSeason.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs text-muted-foreground">Venue</label>
            <select
              value={venueId}
              onChange={(e) => setVenueId(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm"
            >
              {data.venues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} — {v.addressLine1}, {v.city}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs text-muted-foreground">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs text-muted-foreground">Description</label>
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Capacity</label>
            <Input type="number" min={2} max={200} value={capacity} onChange={(e) => setCapacity(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Initial status</label>
            <select
              value={createStatus}
              onChange={(e) => setCreateStatus(e.target.value as typeof createStatus)}
              className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm"
            >
              <option value="DRAFT">DRAFT</option>
              <option value="PUBLISHED">PUBLISHED</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Starts</label>
            <Input type="datetime-local" value={startsLocal} onChange={(e) => setStartsLocal(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Ends</label>
            <Input type="datetime-local" value={endsLocal} onChange={(e) => setEndsLocal(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Button size="sm" onClick={onCreate} disabled={isPending}>
              {isPending ? "Creating..." : "Create event"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/90 shadow-soft">
        <CardHeader>
          <CardTitle className="text-base">Recent events</CardTitle>
          <CardDescription className="text-xs">Toggle draft / published. Full edit in a follow-up if needed.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-2">Title</th>
                    <th className="pb-2 pr-2">When</th>
                    <th className="pb-2 pr-2">Cohort</th>
                    <th className="pb-2 pr-2">Going</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.events.map((ev) => (
                    <tr key={ev.id} className="border-b border-border/30">
                      <td className="py-2 pr-2 font-medium">{ev.title}</td>
                      <td className="py-2 pr-2 text-muted-foreground">
                        {new Intl.DateTimeFormat("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        }).format(new Date(ev.startsAt))}
                      </td>
                      <td className="py-2 pr-2">{ev.cohortName ?? "—"}</td>
                      <td className="py-2 pr-2">{ev.rsvpGoing}</td>
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{ev.status}</Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => onTogglePublish(ev.id, ev.status)}
                            disabled={isPending}
                          >
                            {ev.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
