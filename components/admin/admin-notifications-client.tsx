"use client";

import { useMemo, useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { NotificationOpsData } from "@/lib/admin/get-notification-ops-data";

function formatDateTime(value: string | null) {
  if (!value) {
    return "—";
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatRelativeDate(value: string) {
  const now = Date.now();
  const ts = new Date(value).getTime();
  const diffDays = Math.max(0, Math.floor((now - ts) / (1000 * 60 * 60 * 24)));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return `${diffDays}d ago`;
}

const filterSelectClass = "luxury-select";

type Props = {
  initialData: NotificationOpsData;
};

export function AdminNotificationsClient({ initialData }: Props) {
  const [attempts] = useState(initialData.recentAttempts);
  const [outboxRows, setOutboxRows] = useState(initialData.recentOutboxRows);
  const [statusFilter, setStatusFilter] = useState<"ALL" | string>("ALL");
  const [typeFilter, setTypeFilter] = useState<"ALL" | string>("ALL");
  const [windowDays, setWindowDays] = useState<7 | 30>(30);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const visibleAttempts = useMemo(() => {
    return attempts.filter((attempt) => {
      if (statusFilter !== "ALL" && attempt.status !== statusFilter) {
        return false;
      }
      if (typeFilter !== "ALL" && attempt.type !== typeFilter) {
        return false;
      }

      const createdAtTs = new Date(attempt.createdAt).getTime();
      const cutoff = Date.now() - windowDays * 24 * 60 * 60 * 1000;
      return createdAtTs >= cutoff;
    });
  }, [attempts, statusFilter, typeFilter, windowDays]);

  const statusCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const attempt of visibleAttempts) {
      counts.set(attempt.status, (counts.get(attempt.status) ?? 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [visibleAttempts]);

  const typeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const attempt of visibleAttempts) {
      counts.set(attempt.type, (counts.get(attempt.type) ?? 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [visibleAttempts]);

  function onRetryOutbox(outboxId: string) {
    setFeedback(null);
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/notifications/retry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ outboxId }),
        });
        const payload = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to retry notification.");
        }

        setOutboxRows((previous) =>
          previous.map((row) =>
            row.id === outboxId
              ? {
                  ...row,
                  status: "PENDING",
                  lastError: null,
                }
              : row,
          ),
        );
        setFeedback("Retry queued. Run email dispatch to send it.");
      } catch (retryError) {
        setError(retryError instanceof Error ? retryError.message : "Unable to retry notification.");
      }
    });
  }

  return (
    <div className="space-y-7">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="surface-panel">
          <CardHeader className="pb-2">
            <CardDescription>Attempts (window)</CardDescription>
            <CardTitle className="text-3xl">{initialData.summary.totalAttempts}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="surface-panel">
          <CardHeader className="pb-2">
            <CardDescription>Outbox rows (window)</CardDescription>
            <CardTitle className="text-3xl">{initialData.summary.totalOutboxRows}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="surface-panel">
          <CardHeader className="pb-2">
            <CardDescription>Queued / Sent</CardDescription>
            <CardTitle className="text-3xl">
              {initialData.summary.totalQueued} / {initialData.summary.totalSent}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="surface-panel">
          <CardHeader className="pb-2">
            <CardDescription>Failed / Dedupe / Skipped</CardDescription>
            <CardTitle className="text-3xl">
              {initialData.summary.totalFailed} / {initialData.summary.totalDuplicatePrevented} /{" "}
              {initialData.summary.totalSkipped}
            </CardTitle>
          </CardHeader>
        </Card>
      </section>

      <Card className="surface-panel">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Review notification operations by status, type, and recent window.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className={filterSelectClass}
            aria-label="Filter attempts by status"
          >
            <option value="ALL">All statuses</option>
            {initialData.attemptsByState.map(({ state }) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className={filterSelectClass}
            aria-label="Filter attempts by type"
          >
            <option value="ALL">All types</option>
            {initialData.attemptsByType.map(({ type }) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <select
            value={String(windowDays)}
            onChange={(event) => setWindowDays(event.target.value === "7" ? 7 : 30)}
            className={filterSelectClass}
            aria-label="Filter attempts by window"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
          </select>
        </CardContent>
      </Card>

      {feedback ? (
        <p className="status-banner border-emerald-700/20 bg-emerald-700/8 text-emerald-800 dark:text-emerald-300">
          {feedback}
        </p>
      ) : null}
      {error ? (
        <p className="status-banner border-destructive/30 bg-destructive/6 text-destructive">{error}</p>
      ) : null}
      {isPending ? (
        <p className="status-banner border-border/55 bg-card/55 text-xs text-muted-foreground">Saving update…</p>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="surface-panel">
          <CardHeader>
            <CardTitle>Attempt status mix</CardTitle>
            <CardDescription>Durable delivery attempt states over the selected window.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {statusCounts.map(([status, count]) => (
              <div key={status} className="dense-row flex items-center justify-between text-sm">
                <span>{status}</span>
                <Badge variant="outline">{count}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="surface-panel">
          <CardHeader>
            <CardTitle>Attempt type mix</CardTitle>
            <CardDescription>Operational volume by notification type.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {typeCounts.map(([type, count]) => (
              <div key={type} className="dense-row flex items-center justify-between text-sm">
                <span>{type}</span>
                <Badge variant="outline">{count}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Card className="surface-panel">
        <CardHeader>
          <CardTitle>Recent notification attempts</CardTitle>
          <CardDescription>
            Includes queue creation, sends, failures, skips, and duplicate prevention events.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {visibleAttempts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notification attempts match these filters.</p>
          ) : (
            <div className="space-y-2">
              {visibleAttempts.map((attempt) => (
                <div key={attempt.id} className="dense-row">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{attempt.type}</Badge>
                      <Badge
                        variant={
                          attempt.status === "SENT"
                            ? "default"
                            : attempt.status === "FAILED"
                              ? "destructive"
                              : "outline"
                        }
                      >
                        {attempt.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{attempt.trigger ?? "—"}</span>
                    </div>
                    <span className="text-xs text-muted-foreground" title={attempt.createdAt}>
                      {formatRelativeDate(attempt.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-foreground">{attempt.recipientEmail}</p>
                  <p className="text-xs text-muted-foreground">
                    created {formatDateTime(attempt.createdAt)} · sent {formatDateTime(attempt.sentAt)}
                  </p>
                  {attempt.errorSummary ? (
                    <p className="mt-1 text-xs text-destructive">{attempt.errorSummary}</p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="surface-panel">
        <CardHeader>
          <CardTitle>Recent outbox rows</CardTitle>
          <CardDescription>Use retry on failed rows when resend is appropriate.</CardDescription>
        </CardHeader>
        <CardContent>
          {outboxRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No outbox rows found.</p>
          ) : (
            <div className="space-y-2">
              {outboxRows.map((row) => (
                <div key={row.id} className="dense-row">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{row.type}</Badge>
                      <Badge
                        variant={
                          row.status === "SENT"
                            ? "default"
                            : row.status === "FAILED"
                              ? "destructive"
                              : "outline"
                        }
                      >
                        {row.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">attempts {row.attempts}</span>
                      {row.status === "FAILED" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onRetryOutbox(row.id)}
                          disabled={isPending}
                        >
                          Retry
                        </Button>
                      ) : null}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {row.recipientEmail} · created {formatDateTime(row.createdAt)} · sent {formatDateTime(row.sentAt)}
                  </p>
                  {row.lastError ? <p className="mt-1 text-xs text-destructive">{row.lastError}</p> : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
