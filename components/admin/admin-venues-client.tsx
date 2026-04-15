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
import type { VenueManagementData, VenueManagementVenue } from "@/lib/admin/get-venue-management-data";
import { dialogBackdropClasses, dialogPanelEnterClasses } from "@/lib/motion";

export function AdminVenuesClient({ initialData }: { initialData: VenueManagementData }) {
  const [data, setData] = useState(initialData);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("New York");
  const [state, setState] = useState("NY");
  const [postalCode, setPostalCode] = useState("");
  const [capacity, setCapacity] = useState("30");
  const [notes, setNotes] = useState("");

  const [editing, setEditing] = useState<VenueManagementVenue | null>(null);
  const [editName, setEditName] = useState("");
  const [editAddressLine1, setEditAddressLine1] = useState("");
  const [editAddressLine2, setEditAddressLine2] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editState, setEditState] = useState("");
  const [editPostalCode, setEditPostalCode] = useState("");
  const [editCapacity, setEditCapacity] = useState("");
  const [editNotes, setEditNotes] = useState("");

  function refresh() {
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/venues/data");
        if (res.ok) setData((await res.json()) as VenueManagementData);
      } catch {
        /* ignore */
      }
    });
  }

  function onCreate() {
    setError(null);
    setFeedback(null);
    const cap = Number.parseInt(capacity, 10);
    if (!name.trim() || !addressLine1.trim() || !city.trim() || !state.trim() || !postalCode.trim()) {
      setError("Name, address, city, state, and postal code are required.");
      return;
    }
    if (Number.isNaN(cap) || cap < 2) {
      setError("Capacity must be a number of at least 2.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/venues", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            addressLine1: addressLine1.trim(),
            addressLine2: addressLine2.trim() || undefined,
            city: city.trim(),
            state: state.trim(),
            postalCode: postalCode.trim(),
            capacity: cap,
            notes: notes.trim() || undefined,
          }),
        });
        const body = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(body.error ?? "Unable to create venue.");
        setFeedback("Venue created.");
        setName("");
        setAddressLine1("");
        setAddressLine2("");
        setPostalCode("");
        setNotes("");
        refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unable to create venue.");
      }
    });
  }

  function openEdit(v: VenueManagementVenue) {
    setError(null);
    setFeedback(null);
    setEditing(v);
    setEditName(v.name);
    setEditAddressLine1(v.addressLine1);
    setEditAddressLine2(v.addressLine2 ?? "");
    setEditCity(v.city);
    setEditState(v.state);
    setEditPostalCode(v.postalCode);
    setEditCapacity(String(v.capacity));
    setEditNotes(v.notes ?? "");
  }

  function closeEdit() {
    setEditing(null);
  }

  function onSaveEdit() {
    if (!editing) return;
    setError(null);
    setFeedback(null);
    const cap = Number.parseInt(editCapacity, 10);
    if (!editName.trim() || !editAddressLine1.trim() || !editCity.trim() || !editState.trim() || !editPostalCode.trim()) {
      setError("Name, address, city, state, and postal code are required.");
      return;
    }
    if (Number.isNaN(cap) || cap < 2) {
      setError("Capacity must be a number of at least 2.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/venues/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editName.trim(),
            addressLine1: editAddressLine1.trim(),
            addressLine2: editAddressLine2.trim() || null,
            city: editCity.trim(),
            state: editState.trim(),
            postalCode: editPostalCode.trim(),
            capacity: cap,
            notes: editNotes.trim() || null,
          }),
        });
        const body = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(body.error ?? "Unable to save venue.");
        setFeedback("Venue updated.");
        closeEdit();
        refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unable to save venue.");
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
          aria-labelledby="admin-venue-edit-title"
        >
          <button type="button" className="absolute inset-0" onClick={closeEdit} aria-label="Close" />
          <Card
            className={`relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-t-2xl border-border/60 bg-card/98 shadow-lift lg:max-w-lg lg:rounded-2xl ${dialogPanelEnterClasses}`}
          >
            <CardHeader className="border-b border-border/60 pb-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle id="admin-venue-edit-title" className="text-lg">
                    Edit venue
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Slug updates automatically when the name changes.
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
                <label className="text-xs text-muted-foreground">Address line 1</label>
                <Input value={editAddressLine1} onChange={(e) => setEditAddressLine1(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Address line 2 (optional)</label>
                <Input value={editAddressLine2} onChange={(e) => setEditAddressLine2(e.target.value)} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">City</label>
                  <Input value={editCity} onChange={(e) => setEditCity(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">State</label>
                  <Input value={editState} onChange={(e) => setEditState(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Postal code</label>
                <Input value={editPostalCode} onChange={(e) => setEditPostalCode(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Venue capacity</label>
                <Input
                  type="number"
                  min={2}
                  max={500}
                  value={editCapacity}
                  onChange={(e) => setEditCapacity(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Notes (optional)</label>
                <Textarea rows={3} value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
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
          <CardTitle className="text-base">Add venue</CardTitle>
          <CardDescription className="text-xs">
            Manual places for events. Slug is generated from the name.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs text-muted-foreground">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs text-muted-foreground">Address line 1</label>
            <Input value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs text-muted-foreground">Address line 2 (optional)</label>
            <Input value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">City</label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">State</label>
            <Input value={state} onChange={(e) => setState(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Postal code</label>
            <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Capacity</label>
            <Input type="number" min={2} max={500} value={capacity} onChange={(e) => setCapacity(e.target.value)} />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs text-muted-foreground">Notes (optional)</label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Button size="sm" onClick={onCreate} disabled={isPending}>
              {isPending ? "Creating..." : "Create venue"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/90 shadow-soft">
        <CardHeader>
          <CardTitle className="text-base">Venues</CardTitle>
          <CardDescription className="text-xs">
            Venues in use by events cannot be deleted here (database restriction).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.venues.length === 0 ? (
            <p className="text-sm text-muted-foreground">No venues yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-2">Name</th>
                    <th className="pb-2 pr-2">Address</th>
                    <th className="pb-2 pr-2">Cap</th>
                    <th className="pb-2 pr-2">Events</th>
                    <th className="pb-2">Slug</th>
                    <th className="pb-2 pl-2"> </th>
                  </tr>
                </thead>
                <tbody>
                  {data.venues.map((v) => (
                    <tr key={v.id} className="border-b border-border/30">
                      <td className="py-2 pr-2 font-medium">{v.name}</td>
                      <td className="py-2 pr-2 text-muted-foreground">
                        {v.addressLine1}, {v.city} {v.state}
                      </td>
                      <td className="py-2 pr-2">{v.capacity}</td>
                      <td className="py-2 pr-2">
                        <Badge variant="outline">{v.eventCount}</Badge>
                      </td>
                      <td className="py-2 pr-2 font-mono text-[10px] text-muted-foreground">{v.slug}</td>
                      <td className="py-2 pl-2">
                        <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={() => openEdit(v)} disabled={isPending}>
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
