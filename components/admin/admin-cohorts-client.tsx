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
import type { CohortManagementData } from "@/lib/admin/get-cohort-management-data";

export function AdminCohortsClient({ initialData }: { initialData: CohortManagementData }) {
  const [data, setData] = useState(initialData);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [newSeasonId, setNewSeasonId] = useState(data.seasons[0]?.id ?? "");
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCapacity, setNewCapacity] = useState("8");
  const [newStatus, setNewStatus] = useState<"FORMING" | "ACTIVE" | "COMPLETED">("FORMING");

  const [addUserByCohort, setAddUserByCohort] = useState<Record<string, string>>({});

  function refresh() {
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/cohorts/data");
        if (res.ok) {
          setData((await res.json()) as CohortManagementData);
        }
      } catch {
        /* ignore */
      }
    });
  }

  function onCreateCohort() {
    setError(null);
    setFeedback(null);
    const capacity = Number.parseInt(newCapacity, 10);
    if (!newSeasonId || !newName.trim() || Number.isNaN(capacity)) {
      setError("Season, name, and valid capacity are required.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/cohorts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            seasonId: newSeasonId,
            name: newName.trim(),
            description: newDescription.trim() || undefined,
            capacity,
            status: newStatus,
          }),
        });
        const body = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(body.error ?? "Unable to create cohort.");
        setFeedback("Cohort created.");
        setNewName("");
        setNewDescription("");
        refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unable to create cohort.");
      }
    });
  }

  function onUpdateCohort(cohortId: string, patch: Record<string, unknown>) {
    setError(null);
    setFeedback(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/cohorts/${cohortId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        const body = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(body.error ?? "Unable to update cohort.");
        setFeedback("Cohort updated.");
        refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unable to update cohort.");
      }
    });
  }

  function onAddMember(cohortId: string) {
    const userId = addUserByCohort[cohortId];
    if (!userId) {
      setError("Select a member to add.");
      return;
    }
    setError(null);
    setFeedback(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/cohorts/${cohortId}/members`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, status: "INVITED" }),
        });
        const body = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(body.error ?? "Unable to add member.");
        setFeedback("Member added.");
        setAddUserByCohort((p) => ({ ...p, [cohortId]: "" }));
        refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unable to add member.");
      }
    });
  }

  function onMembershipStatus(cohortId: string, membershipId: string, status: string) {
    setError(null);
    setFeedback(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/cohorts/${cohortId}/members/${membershipId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        const body = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(body.error ?? "Unable to update membership.");
        setFeedback("Membership updated.");
        refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unable to update membership.");
      }
    });
  }

  function onRemoveMember(cohortId: string, membershipId: string) {
    if (!window.confirm("Remove this member from the cohort?")) return;
    setError(null);
    setFeedback(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/cohorts/${cohortId}/members/${membershipId}`, {
          method: "DELETE",
        });
        const body = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(body.error ?? "Unable to remove member.");
        setFeedback("Member removed.");
        refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unable to remove member.");
      }
    });
  }

  return (
    <div className="space-y-6">
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
          <CardTitle className="text-base">Create cohort</CardTitle>
          <CardDescription className="text-xs">New cohort in a season. Slug is generated from the name.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground" htmlFor="new-season">
              Season
            </label>
            <select
              id="new-season"
              value={newSeasonId}
              onChange={(e) => setNewSeasonId(e.target.value)}
              className="luxury-select"
            >
              {data.seasons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} · {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground" htmlFor="new-name">
              Name
            </label>
            <Input id="new-name" value={newName} onChange={(e) => setNewName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground" htmlFor="new-capacity">
              Capacity
            </label>
            <Input
              id="new-capacity"
              type="number"
              min={2}
              max={100}
              value={newCapacity}
              onChange={(e) => setNewCapacity(e.target.value)}
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs text-muted-foreground" htmlFor="new-desc">
              Description (shown to members)
            </label>
            <Textarea
              id="new-desc"
              rows={2}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              maxLength={400}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground" htmlFor="new-status">
              Status
            </label>
            <select
              id="new-status"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as typeof newStatus)}
              className="luxury-select"
            >
              <option value="FORMING">FORMING</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button size="sm" onClick={onCreateCohort} disabled={isPending}>
              {isPending ? "Creating..." : "Create cohort"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="surface-panel">
        <CardHeader>
          <CardTitle className="text-base">All cohorts</CardTitle>
          <CardDescription className="text-xs">{data.cohorts.length} cohorts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.cohorts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No cohorts yet.</p>
          ) : (
            data.cohorts.map((c) => (
              <div key={c.id} className="dense-row">
                <button
                  type="button"
                  className="flex w-full items-start justify-between gap-2 text-left"
                  onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                >
                  <div>
                    <p className="font-medium text-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.seasonCode} · {c.memberCount}/{c.capacity} members · {c.slug}
                    </p>
                  </div>
                  <Badge variant="outline">{c.status}</Badge>
                </button>

                {expandedId === c.id ? (
                  <div className="mt-4 space-y-4 border-t border-border/50 pt-4">
                    <div className="grid gap-2 md:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Description</label>
                        <Textarea
                          rows={2}
                          defaultValue={c.description ?? ""}
                          id={`desc-${c.id}`}
                          maxLength={400}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">Capacity</label>
                          <Input type="number" min={1} max={100} defaultValue={c.capacity} id={`cap-${c.id}`} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">Status</label>
                          <select
                            className="luxury-select"
                            defaultValue={c.status}
                            id={`st-${c.id}`}
                          >
                            <option value="FORMING">FORMING</option>
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="COMPLETED">COMPLETED</option>
                          </select>
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isPending}
                          onClick={() => {
                            const desc = (
                              document.getElementById(`desc-${c.id}`) as HTMLTextAreaElement
                            ).value.trim();
                            const cap = Number.parseInt(
                              (document.getElementById(`cap-${c.id}`) as HTMLInputElement).value,
                              10,
                            );
                            const st = (document.getElementById(`st-${c.id}`) as HTMLSelectElement)
                              .value;
                            onUpdateCohort(c.id, {
                              description: desc || null,
                              capacity: Number.isNaN(cap) ? undefined : cap,
                              status: st,
                            });
                          }}
                        >
                          Save cohort details
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Add member</p>
                      <div className="flex flex-wrap gap-2">
                        <select
                          className="luxury-select min-w-[220px]"
                          value={addUserByCohort[c.id] ?? ""}
                          onChange={(e) =>
                            setAddUserByCohort((p) => ({ ...p, [c.id]: e.target.value }))
                          }
                          aria-label="Member to add"
                        >
                          <option value="">Select member…</option>
                          {data.allMembers.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} ({m.email})
                            </option>
                          ))}
                        </select>
                        <Button size="sm" variant="outline" onClick={() => onAddMember(c.id)} disabled={isPending}>
                          Add to cohort
                        </Button>
                      </div>
                    </div>

                    <div className="surface-subtle overflow-x-auto p-2">
                      <table className="w-full text-xs [th]:font-medium [th]:tracking-wide [th]:text-muted-foreground/90">
                        <thead>
                          <tr className="border-b text-left text-muted-foreground">
                            <th className="pb-2 pr-2">Member</th>
                            <th className="pb-2 pr-2">Status</th>
                            <th className="pb-2">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {c.members.map((m) => (
                            <tr key={m.membershipId} className="border-b border-border/30 transition-colors hover:bg-oat/35">
                              <td className="py-2 pr-2">
                                <span className="font-medium">{m.name}</span>
                                <span className="block text-muted-foreground">{m.email}</span>
                              </td>
                              <td className="py-2 pr-2">
                                <select
                                  className="luxury-select h-8 px-2 text-xs"
                                  value={m.status}
                                  onChange={(e) =>
                                    onMembershipStatus(c.id, m.membershipId, e.target.value)
                                  }
                                  aria-label={`Status for ${m.name}`}
                                >
                                  <option value="INVITED">INVITED</option>
                                  <option value="ACTIVE">ACTIVE</option>
                                  <option value="PAUSED">PAUSED</option>
                                  <option value="COMPLETED">COMPLETED</option>
                                </select>
                              </td>
                              <td className="py-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-xs text-destructive hover:bg-destructive/8"
                                  onClick={() => onRemoveMember(c.id, m.membershipId)}
                                  disabled={isPending}
                                >
                                  Remove
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
