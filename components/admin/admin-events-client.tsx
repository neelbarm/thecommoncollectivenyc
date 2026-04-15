"use client";

import { X } from "lucide-react";
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
import type { EventManagementData, EventManagementEvent } from "@/lib/admin/get-event-management-data";

function toIso(local: string) {
  return new Date(local).toISOString();
}

function toDatetimeLocalValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${y}-${m}-${day}T${h}:${min}`;
}

function formatSeasonWindow(isoStart: string, isoEnd: string) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${fmt.format(new Date(isoStart))} – ${fmt.format(new Date(isoEnd))}`;
}

function seasonWindowError(
  season: { startsAt: string; endsAt: string } | undefined,
  startLocal: string,
  endLocal: string,
): string | null {
  if (!season) return null;
  const w0 = new Date(season.startsAt).getTime();
  const w1 = new Date(season.endsAt).getTime();
  const s = new Date(startLocal).getTime();
  const e = new Date(endLocal).getTime();
  if (s < w0 || e > w1) {
    return "Start and end must fall within the selected season window.";
  }
  return null;
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

  const [editingEvent, setEditingEvent] = useState<EventManagementEvent | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editVenueId, setEditVenueId] = useState("");
  const [editCohortId, setEditCohortId] = useState("");
  const [editCapacity, setEditCapacity] = useState("");
  const [editStartsLocal, setEditStartsLocal] = useState("");
  const [editEndsLocal, setEditEndsLocal] = useState("");
  const [editStatus, setEditStatus] = useState<string>("DRAFT");
  const [editSeasonId, setEditSeasonId] = useState("");

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
    if (new Date(endsLocal).getTime() <= new Date(startsLocal).getTime()) {
      setError("End time must be after start time.");
      return;
    }
    const createSeason = data.seasons.find((s) => s.id === seasonId);
    const winErr = seasonWindowError(createSeason, startsLocal, endsLocal);
    if (winErr) {
      setError(winErr);
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

  function openEdit(ev: EventManagementEvent) {
    setError(null);
    setFeedback(null);
    setEditingEvent(ev);
    setEditSeasonId(ev.seasonId);
    setEditTitle(ev.title);
    setEditDescription(ev.description);
    setEditVenueId(ev.venueId);
    setEditCohortId(ev.cohortId ?? "");
    setEditCapacity(String(ev.capacity));
    setEditStartsLocal(toDatetimeLocalValue(ev.startsAt));
    setEditEndsLocal(toDatetimeLocalValue(ev.endsAt));
    setEditStatus(ev.status);
  }

  function closeEdit() {
    setEditingEvent(null);
  }

  function onSaveEdit() {
    if (!editingEvent) return;
    setError(null);
    setFeedback(null);

    const titleTrim = editTitle.trim();
    const descTrim = editDescription.trim();
    if (titleTrim.length < 2 || titleTrim.length > 120) {
      setError("Title must be between 2 and 120 characters.");
      return;
    }
    if (descTrim.length < 2 || descTrim.length > 1200) {
      setError("Description must be between 2 and 1200 characters.");
      return;
    }
    if (!editVenueId || !editStartsLocal || !editEndsLocal) {
      setError("Venue, start, and end are required.");
      return;
    }
    const cap = Number.parseInt(editCapacity, 10);
    if (Number.isNaN(cap) || cap < 2 || cap > 200) {
      setError("Capacity must be a number from 2 to 200.");
      return;
    }
    if (new Date(editEndsLocal).getTime() <= new Date(editStartsLocal).getTime()) {
      setError("End time must be after start time.");
      return;
    }
    const editSeason = data.seasons.find((s) => s.id === editSeasonId);
    const editWinErr = seasonWindowError(editSeason, editStartsLocal, editEndsLocal);
    if (editWinErr) {
      setError(editWinErr);
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/events/${editingEvent.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            seasonId: editSeasonId,
            title: titleTrim,
            description: descTrim,
            venueId: editVenueId,
            cohortId: editCohortId || null,
            capacity: cap,
            startsAt: toIso(editStartsLocal),
            endsAt: toIso(editEndsLocal),
            status: editStatus,
          }),
        });
        const body = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(body.error ?? "Unable to save event.");
        setFeedback("Event updated.");
        closeEdit();
        refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unable to save event.");
      }
    });
  }

  const cohortsForSeason = data.cohorts.filter((c) => c.seasonId === seasonId);
  const cohortsForEditSeason = data.cohorts.filter((c) => c.seasonId === editSeasonId);
  const createSeasonMeta = data.seasons.find((s) => s.id === seasonId);
  const editSeasonMeta = data.seasons.find((s) => s.id === editSeasonId);

  return (
    <div className="space-y-6">
      {editingEvent ? (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/35 backdrop-blur-sm lg:items-center lg:justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-event-edit-title"
        >
          <button type="button" className="absolute inset-0" onClick={closeEdit} aria-label="Close edit panel" />
          <Card className="relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-t-2xl border-border/70 bg-card/95 shadow-soft lg:max-w-2xl lg:rounded-2xl">
            <CardHeader className="border-b border-border/60 pb-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle id="admin-event-edit-title" className="text-lg">
                    Edit event
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {editSeasonMeta
                      ? `${editSeasonMeta.code} · ${formatSeasonWindow(editSeasonMeta.startsAt, editSeasonMeta.endsAt)} · `
                      : `${editingEvent.seasonName} · `}
                    RSVPs going: {editingEvent.rsvpGoing}
                  </CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={closeEdit} aria-label="Close">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 pt-4 md:grid-cols-2">
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs text-muted-foreground">Season</label>
                <select
                  value={editSeasonId}
                  onChange={(e) => {
                    setEditSeasonId(e.target.value);
                    setEditCohortId("");
                  }}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm"
                >
                  {data.seasons.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} · {s.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Changing season may clear the cohort if it does not belong to the new season.
                </p>
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs text-muted-foreground">Title</label>
                <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs text-muted-foreground">Description</label>
                <Textarea rows={4} value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs text-muted-foreground">Venue</label>
                <select
                  value={editVenueId}
                  onChange={(e) => setEditVenueId(e.target.value)}
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
                <label className="text-xs text-muted-foreground">Cohort (optional)</label>
                <select
                  value={editCohortId}
                  onChange={(e) => setEditCohortId(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm"
                >
                  <option value="">All season / no cohort</option>
                  {cohortsForEditSeason.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Capacity</label>
                <Input
                  type="number"
                  min={2}
                  max={200}
                  value={editCapacity}
                  onChange={(e) => setEditCapacity(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm"
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="PUBLISHED">PUBLISHED</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Starts</label>
                <Input type="datetime-local" value={editStartsLocal} onChange={(e) => setEditStartsLocal(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Ends</label>
                <Input type="datetime-local" value={editEndsLocal} onChange={(e) => setEditEndsLocal(e.target.value)} />
              </div>
              <div className="flex flex-wrap justify-end gap-2 md:col-span-2">
                <Button type="button" variant="outline" size="sm" onClick={closeEdit} disabled={isPending}>
                  Cancel
                </Button>
                <Button type="button" size="sm" onClick={onSaveEdit} disabled={isPending}>
                  {isPending ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

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
          {createSeasonMeta ? (
            <p className="text-xs text-muted-foreground md:col-span-2">
              Season window: {formatSeasonWindow(createSeasonMeta.startsAt, createSeasonMeta.endsAt)}
            </p>
          ) : null}
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
          <CardDescription className="text-xs">
            Edit details, venue, cohort, and timing. Use Publish / Unpublish for a quick draft toggle.
          </CardDescription>
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
                    <th className="pb-2 pr-2">Status</th>
                    <th className="pb-2">Actions</th>
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
                      <td className="py-2 pr-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">{ev.status}</Badge>
                          {(ev.status === "DRAFT" || ev.status === "PUBLISHED") ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => onTogglePublish(ev.id, ev.status)}
                              disabled={isPending}
                            >
                              {ev.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                            </Button>
                          ) : null}
                        </div>
                      </td>
                      <td className="py-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-7 text-xs"
                          onClick={() => openEdit(ev)}
                          disabled={isPending}
                        >
                          Edit
                        </Button>
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
