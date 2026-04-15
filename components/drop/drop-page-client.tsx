"use client";

import Link from "next/link";
import { Clock3, X } from "lucide-react";
import { useMemo, useState, useTransition } from "react";

import {
  DROP_ACTIVITY_OPTIONS,
  DROP_TIMING_OPTIONS,
  type DropActivity,
  type DropTiming,
} from "@/lib/drop/constants";
import type { MemberDropData, MemberDropRequest } from "@/lib/drop/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function formatDateTime(dateIso: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateIso));
}

function parseTitle(title: string) {
  const [activityRaw, timingRaw] = title.split("|").map((part) => part.trim());
  return {
    activity: activityRaw || "Anything",
    timing: timingRaw || "tonight",
  };
}

function responseStatusLabel(status: MemberDropRequest["responses"][number]["status"]) {
  const map: Record<string, string> = {
    PENDING: "Pending",
    ACCEPTED: "Accepted",
    DECLINED: "Declined",
  };

  return map[status] ?? "Pending";
}

export function DropPageClient({ initialData }: { initialData: MemberDropData }) {
  const [activeRequest, setActiveRequest] = useState<MemberDropRequest | null>(initialData.activeRequest);
  const [recentRequests, setRecentRequests] = useState<MemberDropRequest[]>(initialData.recentRequests);
  const [isComposerOpen, setComposerOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<DropActivity>(DROP_ACTIVITY_OPTIONS[5]);
  const [selectedTiming, setSelectedTiming] = useState<DropTiming>(DROP_TIMING_OPTIONS[1]);
  const [note, setNote] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const hasAnyHistory = useMemo(
    () => Boolean(activeRequest || recentRequests.length > 0),
    [activeRequest, recentRequests],
  );

  const needsProfileRepair = !initialData.hasProfile;
  const needsOnboarding = initialData.hasProfile && !initialData.onboardingCompleted;
  const dropLocked = needsProfileRepair || needsOnboarding;

  function openComposer() {
    setError(null);
    setStatusMessage(null);
    setComposerOpen(true);
  }

  function closeComposer() {
    setError(null);
    setStatusMessage(null);
    setComposerOpen(false);
  }

  function createRequest() {
    setError(null);
    setStatusMessage(null);

    const trimmedNote = note.trim();
    if (trimmedNote.length > 280) {
      setError("Please keep the note under 280 characters.");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/drop/request", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            activityType: selectedActivity,
            timing: selectedTiming,
            note: trimmedNote,
          }),
        });

        if (!response.ok) {
          const body = (await response.json()) as { error?: string };
          throw new Error(body.error ?? "Unable to create your Drop request.");
        }

        const body = (await response.json()) as {
          request: {
            id: string;
            title: string;
            context: string;
            status: "OPEN";
            createdAt: string;
          };
        };

        const created: MemberDropRequest = {
          id: body.request.id,
          title: body.request.title,
          activityType: selectedActivity,
          timing: selectedTiming,
          note: body.request.context || null,
          status: body.request.status,
          createdAt: body.request.createdAt,
          responses: [],
        };

        setActiveRequest(created);
        setComposerOpen(false);
        setNote("");
        setSelectedActivity(DROP_ACTIVITY_OPTIONS[5]);
        setSelectedTiming(DROP_TIMING_OPTIONS[1]);
        setStatusMessage("Drop request created. We will surface matching responses as members reply.");
      } catch (createError) {
        setError(createError instanceof Error ? createError.message : "Unable to create Drop request.");
      }
    });
  }

  function cancelRequest(requestId: string) {
    setError(null);
    setStatusMessage(null);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/drop/request/${requestId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action: "cancel" }),
        });

        if (!response.ok) {
          const body = (await response.json()) as { error?: string };
          throw new Error(body.error ?? "Unable to cancel request.");
        }

        if (activeRequest?.id === requestId) {
          setRecentRequests((previous) => [{ ...activeRequest, status: "WITHDRAWN" }, ...previous]);
          setActiveRequest(null);
        }

        setStatusMessage("Request cancelled.");
      } catch (cancelError) {
        setError(cancelError instanceof Error ? cancelError.message : "Unable to cancel request.");
      }
    });
  }

  return (
    <div className="space-y-6">
      {dropLocked ? (
        <Card className="border-dashed border-muted-gold/40 bg-muted-gold/5 shadow-soft">
          <CardHeader className="space-y-2">
            <CardTitle className="text-lg">
              {needsProfileRepair ? "Set up your profile to use The Drop" : "Finish onboarding first"}
            </CardTitle>
            <CardDescription className="text-sm leading-7 text-muted-foreground">
              {needsProfileRepair
                ? "Your account is active, but we don’t have your member questionnaire on file yet."
                : "A few onboarding steps are still open. Once they’re done, you can post availability here."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="sm">
              <Link href="/onboarding">
                {needsProfileRepair ? "Set up my profile" : "Continue onboarding"}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-border/70 bg-card/90 shadow-soft">
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-muted-gold/40 bg-muted-gold/10">
              The Drop
            </Badge>
            {initialData.cohortName ? <Badge variant="outline">{initialData.cohortName}</Badge> : null}
          </div>
          <CardTitle className="text-3xl leading-tight sm:text-4xl">I&apos;m free right now</CardTitle>
          <CardDescription className="max-w-3xl leading-7">
            The Drop is a lightweight concierge layer for spontaneous member plans when your schedule opens up.
          </CardDescription>

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={openComposer} disabled={Boolean(activeRequest) || isPending || dropLocked}>
              I&apos;m free right now
            </Button>
            {dropLocked ? (
              <Badge variant="outline">Available after profile setup</Badge>
            ) : activeRequest ? (
              <Badge variant="outline">One active request at a time</Badge>
            ) : null}
          </div>
        </CardHeader>
      </Card>

      <Card className="border-border/70 bg-card/90 shadow-soft">
        <CardHeader>
          <CardTitle className="text-xl">Cohort context</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-7 text-muted-foreground">{initialData.cohortContext}</p>
        </CardContent>
      </Card>

      {statusMessage ? (
        <p role="status" aria-live="polite" className="text-sm text-emerald-700">
          {statusMessage}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {isPending ? (
        <p role="status" aria-live="polite" className="text-xs text-muted-foreground">
          Saving your request update...
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <Card className="border-border/70 bg-card/90 shadow-soft">
          <CardHeader>
            <CardTitle className="text-xl">Active request</CardTitle>
            <CardDescription>
              Your current request is visible to members now.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeRequest ? (
              <div className="space-y-4 rounded-xl border border-border/60 bg-background/40 p-4">
                <div className="flex flex-wrap gap-2">
                  <Badge>{parseTitle(activeRequest.title).activity}</Badge>
                  <Badge variant="outline">{parseTitle(activeRequest.title).timing}</Badge>
                  <Badge variant="outline">{activeRequest.status}</Badge>
                </div>
                {activeRequest.note ? (
                  <p className="text-sm leading-7 text-muted-foreground">{activeRequest.note}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">No note added.</p>
                )}
                <p className="text-xs text-muted-foreground">Posted {formatDateTime(activeRequest.createdAt)}</p>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Responses</p>
                  {activeRequest.responses.length > 0 ? (
                    <div className="space-y-2">
                      {activeRequest.responses.map((response) => (
                        <div
                          key={response.id}
                          className="rounded-lg border border-border/60 bg-card px-3 py-2"
                        >
                          <p className="text-sm font-medium text-foreground">{response.responderName}</p>
                          <p className="text-xs text-muted-foreground">
                            {responseStatusLabel(response.status)}
                            {response.respondedAt ? ` · ${formatDateTime(response.respondedAt)}` : ""}
                          </p>
                          {response.message ? (
                            <p className="mt-1 text-sm text-muted-foreground">{response.message}</p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No responses yet. We&apos;ll notify you when members reply.</p>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={() => cancelRequest(activeRequest.id)} disabled={isPending}>
                  Cancel request
                </Button>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border/70 bg-oat/50 p-4">
                <p className="font-medium text-foreground">No active Drop request</p>
                <p className="text-sm text-muted-foreground">
                  Tap &ldquo;I&apos;m free right now&rdquo; when you want a spontaneous social moment.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/90 shadow-soft">
          <CardHeader>
            <CardTitle className="text-xl">Recent requests</CardTitle>
            <CardDescription>Light activity history from your Drop feed.</CardDescription>
          </CardHeader>
          <CardContent>
            {recentRequests.length > 0 ? (
              <div className="space-y-3">
                {recentRequests.map((request) => {
                  const parsed = parseTitle(request.title);
                  return (
                    <div key={request.id} className="rounded-xl border border-border/60 bg-background/50 p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{parsed.activity}</Badge>
                        <Badge variant="outline">{parsed.timing}</Badge>
                        <Badge variant="outline">{request.status}</Badge>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">{formatDateTime(request.createdAt)}</p>
                    </div>
                  );
                })}
              </div>
            ) : hasAnyHistory ? null : (
              <div className="rounded-xl border border-dashed border-border/70 bg-oat/50 p-4">
                <p className="font-medium text-foreground">No Drop history yet</p>
                <p className="text-sm text-muted-foreground">
                  Your requests and response activity will appear here once you start using The Drop.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {isComposerOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/35 backdrop-blur-sm lg:items-center lg:justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="drop-composer-title"
        >
          <button
            className="absolute inset-0"
            type="button"
            onClick={closeComposer}
            aria-label="Close composer panel"
          />
          <Card className="relative z-10 w-full rounded-t-2xl border-border/70 bg-card/95 shadow-soft lg:max-w-xl lg:rounded-2xl">
            <CardHeader className="border-b border-border/60 pb-4">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle id="drop-composer-title" className="text-2xl">
                    New Drop request
                  </CardTitle>
                  <CardDescription>Share your free window in under a minute.</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={closeComposer} aria-label="Close composer">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label id="drop-activity-type-label">Activity type</Label>
                <div className="flex flex-wrap gap-2">
                  {DROP_ACTIVITY_OPTIONS.map((activity) => (
                    <button
                      key={activity}
                      type="button"
                      aria-pressed={selectedActivity === activity}
                      aria-labelledby="drop-activity-type-label"
                      className={`rounded-full border px-3 py-1.5 text-sm transition ${
                        selectedActivity === activity
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-background text-muted-foreground hover:text-foreground"
                      }`}
                      onClick={() => setSelectedActivity(activity)}
                    >
                      {activity}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label id="drop-timing-label">Timing</Label>
                <div className="flex flex-wrap gap-2">
                  {DROP_TIMING_OPTIONS.map((timing) => (
                    <button
                      key={timing}
                      type="button"
                      aria-pressed={selectedTiming === timing}
                      aria-labelledby="drop-timing-label"
                      className={`rounded-full border px-3 py-1.5 text-sm transition ${
                        selectedTiming === timing
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-background text-muted-foreground hover:text-foreground"
                      }`}
                      onClick={() => setSelectedTiming(timing)}
                    >
                      {timing}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="drop-note">Optional note</Label>
                <Textarea
                  id="drop-note"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={4}
                  maxLength={280}
                  placeholder="Add context, neighborhood, or energy so members can respond quickly."
                />
                <p className="text-xs text-muted-foreground" aria-live="polite">
                  {note.trim().length}/280
                </p>
              </div>

              <div className="rounded-lg border border-border/60 bg-oat/50 p-3 text-xs text-muted-foreground">
                <p className="inline-flex items-center gap-2">
                  <Clock3 className="h-3.5 w-3.5" />
                  We keep this concise and concierge-like — not chat, marketplace, or dating.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" onClick={closeComposer} disabled={isPending}>
                  Cancel
                </Button>
                <Button onClick={createRequest} disabled={isPending}>
                  {isPending ? "Posting..." : "Post Drop request"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
