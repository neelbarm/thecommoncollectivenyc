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
import type { SeasonManagementData, SeasonManagementSeason } from "@/lib/admin/get-season-management-data";
import { dialogBackdropClasses, dialogPanelEnterClasses } from "@/lib/motion";

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

function formatWindow(isoStart: string, isoEnd: string) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${fmt.format(new Date(isoStart))} – ${fmt.format(new Date(isoEnd))}`;
}

export function AdminSeasonsClient({ initialData }: { initialData: SeasonManagementData }) {
  const [data, setData] = useState(initialData);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [startsLocal, setStartsLocal] = useState("");
  const [endsLocal, setEndsLocal] = useState("");
  const [createStatus, setCreateStatus] = useState<string>("PLANNING");

  const [editing, setEditing] = useState<SeasonManagementSeason | null>(null);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editStartsLocal, setEditStartsLocal] = useState("");
  const [editEndsLocal, setEditEndsLocal] = useState("");

  function refresh() {
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/seasons/data");
        if (res.ok) setData((await res.json()) as SeasonManagementData);
      } catch {
        /* ignore */
      }
    });
  }

  function onCreate() {
    setError(null);
    setFeedback(null);
    if (!name.trim() || !code.trim() || !startsLocal || !endsLocal) {
      setError("Name, code, start, and end are required.");
      return;
    }
    if (new Date(endsLocal).getTime() <= new Date(startsLocal).getTime()) {
      setError("End must be after start.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/seasons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            code: code.trim(),
            startsAt: toIso(startsLocal),
            endsAt: toIso(endsLocal),
            status: createStatus,
          }),
        });
        const body = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(body.error ?? "Unable to create season.");
        setFeedback("Season created.");
        setName("");
        setCode("");
        setStartsLocal("");
        setEndsLocal("");
        refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unable to create season.");
      }
    });
  }

  function openEdit(s: SeasonManagementSeason) {
    setError(null);
    setFeedback(null);
    setEditing(s);
    setEditName(s.name);
    setEditCode(s.code);
    setEditStatus(s.status);
    setEditStartsLocal(toDatetimeLocalValue(s.startsAt));
    setEditEndsLocal(toDatetimeLocalValue(s.endsAt));
  }

  function closeEdit() {
    setEditing(null);
  }

  function onSaveEdit() {
    if (!editing) return;
    setError(null);
    setFeedback(null);
    if (!editName.trim() || !editCode.trim() || !editStartsLocal || !editEndsLocal) {
      setError("Name, code, start, and end are required.");
      return;
    }
    if (new Date(editEndsLocal).getTime() <= new Date(editStartsLocal).getTime()) {
      setError("End must be after start.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/seasons/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editName.trim(),
            code: editCode.trim(),
            status: editStatus,
            startsAt: toIso(editStartsLocal),
            endsAt: toIso(editEndsLocal),
          }),
        });
        const body = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(body.error ?? "Unable to save season.");
        setFeedback("Season updated.");
        closeEdit();
        refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unable to save season.");
      }
    });
  }

  function onDeleteSeason(season: SeasonManagementSeason) {
    setError(null);
    setFeedback(null);

    if (season.cohortCount > 0 || season.eventCount > 0) {
      setError("This season still has cohorts/events. Delete or move those first.");
      return;
    }

    const confirmed = window.confirm(
      `Delete season ${season.code}? This cannot be undone.`,
    );
    if (!confirmed) return;

    setDeletingId(season.id);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/seasons/${season.id}`, { method: "DELETE" });
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        if (!res.ok) throw new Error(body?.error ?? "Unable to delete season.");
        setFeedback("Season deleted.");
        refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unable to delete season.");
      } finally {
        setDeletingId(null);
      }
    });
  }

  return (
    <div className="space-y-6">
      {editing ? (
        <div
          className={dialogBackdropClasses}
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-season-edit-title"
        >
          <button type="button" className="absolute inset-0" onClick={closeEdit} aria-label="Close" />
          <Card
            className={`relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-t-2xl border-border/60 bg-card/98 shadow-lift lg:max-w-lg lg:rounded-2xl ${dialogPanelEnterClasses}`}
          >
            <CardHeader className="border-b border-border/60 pb-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle id="admin-season-edit-title" className="text-lg">
                    Edit season
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Shrinking dates is blocked if events would fall outside the new window.
                  </CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={closeEdit} aria-label="Close">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 pt-4">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Name</label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Code (unique)</label>
                <Input value={editCode} onChange={(e) => setEditCode(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="luxury-select"
                >
                  <option value="PLANNING">PLANNING</option>
                  <option value="LIVE">LIVE</option>
                  <option value="CLOSED">CLOSED</option>
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
              <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={closeEdit} disabled={isPending}>
                  Cancel
                </Button>
                <Button type="button" size="sm" onClick={onSaveEdit} disabled={isPending}>
                  {isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {error ? (
        <p className="status-banner border-destructive/30 bg-destructive/6 text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {feedback ? (
        <p className="status-banner border-emerald-400/35 bg-emerald-50/55 text-emerald-800" role="status">
          {feedback}
        </p>
      ) : null}

      <Card className="surface-panel">
        <CardHeader>
          <CardTitle className="text-base">Create season</CardTitle>
          <CardDescription className="text-xs">
            Program window for cohorts and events. Code must be unique (e.g. SP27).
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Spring 2027" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Code</label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="SP27" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Status</label>
            <select
              value={createStatus}
              onChange={(e) => setCreateStatus(e.target.value)}
              className="luxury-select"
            >
              <option value="PLANNING">PLANNING</option>
              <option value="LIVE">LIVE</option>
              <option value="CLOSED">CLOSED</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Starts</label>
            <Input type="datetime-local" value={startsLocal} onChange={(e) => setStartsLocal(e.target.value)} />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs text-muted-foreground">Ends</label>
            <Input type="datetime-local" value={endsLocal} onChange={(e) => setEndsLocal(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Button size="sm" onClick={onCreate} disabled={isPending}>
              {isPending ? "Creating..." : "Create season"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="surface-panel">
        <CardHeader>
          <CardTitle className="text-base">Seasons</CardTitle>
          <CardDescription className="text-xs">Cohorts and events attach to a season.</CardDescription>
        </CardHeader>
        <CardContent>
          {data.seasons.length === 0 ? (
            <p className="text-sm text-muted-foreground">No seasons yet.</p>
          ) : (
            <div className="surface-subtle overflow-x-auto p-2">
              <table className="w-full text-xs [th]:font-medium [th]:tracking-wide [th]:text-muted-foreground/90">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-2">Code</th>
                    <th className="pb-2 pr-2">Name</th>
                    <th className="pb-2 pr-2">Window</th>
                    <th className="pb-2 pr-2">Status</th>
                    <th className="pb-2 pr-2">Cohorts</th>
                    <th className="pb-2 pr-2">Events</th>
                    <th className="pb-2"> </th>
                  </tr>
                </thead>
                <tbody>
                  {data.seasons.map((s) => (
                    <tr key={s.id} className="border-b border-border/30 transition-colors hover:bg-oat/35">
                      <td className="py-2 pr-2 font-mono font-medium">{s.code}</td>
                      <td className="py-2 pr-2">{s.name}</td>
                      <td className="py-2 pr-2 text-muted-foreground">{formatWindow(s.startsAt, s.endsAt)}</td>
                      <td className="py-2 pr-2">
                        <Badge variant="outline">{s.status}</Badge>
                      </td>
                      <td className="py-2 pr-2">{s.cohortCount}</td>
                      <td className="py-2 pr-2">{s.eventCount}</td>
                      <td className="py-2">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-7 text-xs"
                            onClick={() => openEdit(s)}
                            disabled={isPending}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-destructive hover:bg-destructive/8 disabled:opacity-50"
                            onClick={() => onDeleteSeason(s)}
                            disabled={
                              isPending ||
                              deletingId === s.id ||
                              s.cohortCount > 0 ||
                              s.eventCount > 0
                            }
                            aria-label={`Delete season ${s.code}`}
                          >
                            {deletingId === s.id ? "Deleting..." : "Delete"}
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
