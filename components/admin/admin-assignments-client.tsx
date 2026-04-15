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
import type {
  AssignmentPageData,
  AssignmentRunView,
  AssignmentProposalView,
} from "@/lib/assignments/types";

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function statusColor(status: string) {
  switch (status) {
    case "APPROVED":
      return "border-emerald-400/60 bg-emerald-50 text-emerald-800";
    case "REJECTED":
    case "SUPERSEDED":
      return "border-red-400/60 bg-red-50 text-red-800";
    case "PENDING_REVIEW":
      return "border-amber-400/60 bg-amber-50 text-amber-800";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="surface-panel">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description ? (
          <CardDescription className="text-xs">{description}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function ProposalTable({ proposal }: { proposal: AssignmentProposalView }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground">
          {proposal.cohortName}{" "}
          <span className="text-xs text-muted-foreground">
            ({proposal.members.length}/{proposal.cohortCapacity} slots)
          </span>
        </h4>
        {proposal.score != null ? (
          <Badge variant="outline" className="text-xs">
            Score: {proposal.score.toFixed(3)}
          </Badge>
        ) : null}
      </div>
      {proposal.members.length === 0 ? (
        <p className="text-xs text-muted-foreground">No members assigned.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs [th]:font-medium [th]:tracking-wide [th]:text-muted-foreground/90">
            <thead>
              <tr className="border-b border-border/50 text-left text-muted-foreground">
                <th className="pb-2 pr-3 font-medium">Name</th>
                <th className="pb-2 pr-3 font-medium">Neighborhood</th>
                <th className="pb-2 pr-3 font-medium">Interests</th>
                <th className="pb-2 pr-3 font-medium">Social goal</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {proposal.members.map((member) => (
                <tr key={member.id} className="border-b border-border/30 transition-colors hover:bg-oat/35">
                  <td className="py-2 pr-3 font-medium text-foreground">{member.name}</td>
                  <td className="py-2 pr-3 text-muted-foreground">
                    {member.neighborhood ?? "—"}
                  </td>
                  <td className="py-2 pr-3">
                    <div className="flex flex-wrap gap-1">
                      {member.interests.slice(0, 4).map((interest) => (
                        <Badge key={interest} variant="outline" className="text-[10px]">
                          {interest}
                        </Badge>
                      ))}
                      {member.interests.length > 4 ? (
                        <span className="text-muted-foreground">
                          +{member.interests.length - 4}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="py-2 pr-3 text-muted-foreground">
                    {member.socialGoal ?? "—"}
                  </td>
                  <td className="py-2">
                    <Badge variant="outline" className="text-[10px]">
                      {member.decision}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function RunDetail({
  run,
  onApprove,
  onReject,
  isPending,
}: {
  run: AssignmentRunView;
  onApprove: (runId: string) => void;
  onReject: (runId: string) => void;
  isPending: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Badge className={statusColor(run.status)}>{run.status.replace("_", " ")}</Badge>
        <span className="text-xs text-muted-foreground">
          Created {formatDateTime(run.createdAt)} by {run.createdByName}
        </span>
        {run.approvedAt ? (
          <span className="text-xs text-muted-foreground">
            · Approved {formatDateTime(run.approvedAt)} by {run.approvedByName}
          </span>
        ) : null}
      </div>

      {run.errorMessage ? (
        <div className="status-banner border-red-300/60 bg-red-50/55 text-xs text-red-800" role="alert">
          {run.errorMessage}
        </div>
      ) : null}

      {run.status === "PENDING_REVIEW" ? (
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => onApprove(run.id)}
            disabled={isPending}
          >
            {isPending ? "Processing..." : "Approve & assign members"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onReject(run.id)}
            disabled={isPending}
          >
            Reject
          </Button>
        </div>
      ) : null}

      {run.proposals.length === 0 ? (
        <p className="text-sm text-muted-foreground">No proposals generated.</p>
      ) : (
        <div className="space-y-6">
          {run.proposals.map((proposal) => (
            <ProposalTable key={proposal.id} proposal={proposal} />
          ))}
        </div>
      )}
    </div>
  );
}

export function AdminAssignmentsClient({
  initialData,
}: {
  initialData: AssignmentPageData;
}) {
  const [data, setData] = useState(initialData);
  const [selectedSeasonId, setSelectedSeasonId] = useState(
    data.seasons[0]?.id ?? "",
  );
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function refreshData(seasonId: string) {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/assignments/data?seasonId=${seasonId}`);
        if (response.ok) {
          const newData = (await response.json()) as AssignmentPageData;
          setData(newData);
        }
      } catch {
        // Silently fail refresh — user still has stale data
      }
    });
  }

  function onGenerate() {
    setError(null);
    setFeedback(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/assignments/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ seasonId: selectedSeasonId }),
        });

        const body = (await response.json()) as {
          ok?: boolean;
          runId?: string;
          warning?: string;
          error?: string;
        };

        if (!response.ok) {
          throw new Error(body.error ?? "Unable to generate assignment run.");
        }

        if (body.warning) {
          setFeedback(`Run created with warning: ${body.warning}`);
        } else {
          setFeedback("Assignment run generated. Review proposals below.");
        }

        refreshData(selectedSeasonId);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unable to generate assignment run.");
      }
    });
  }

  function onApprove(runId: string) {
    setError(null);
    setFeedback(null);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/assignments/${runId}/approve`, {
          method: "POST",
        });

        if (!response.ok) {
          const body = (await response.json()) as { error?: string };
          throw new Error(body.error ?? "Unable to approve run.");
        }

        setFeedback("Run approved. Members have been assigned to cohorts.");
        refreshData(selectedSeasonId);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unable to approve run.");
      }
    });
  }

  function onReject(runId: string) {
    setError(null);
    setFeedback(null);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/assignments/${runId}/reject`, {
          method: "POST",
        });

        if (!response.ok) {
          const body = (await response.json()) as { error?: string };
          throw new Error(body.error ?? "Unable to reject run.");
        }

        setFeedback("Run rejected.");
        refreshData(selectedSeasonId);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unable to reject run.");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <SectionCard
        title="Generate cohort assignments"
        description={`${data.candidateCount} eligible candidate${data.candidateCount === 1 ? "" : "s"} for the selected season.`}
      >
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label htmlFor="season-select" className="text-xs font-medium text-muted-foreground">
              Season
            </label>
            <select
              id="season-select"
              value={selectedSeasonId}
              onChange={(e) => {
                setSelectedSeasonId(e.target.value);
                refreshData(e.target.value);
              }}
              className="luxury-select min-w-[240px]"
              aria-label="Select season"
            >
              {data.seasons.map((season) => (
                <option key={season.id} value={season.id}>
                  {season.code} · {season.name} ({season.status})
                </option>
              ))}
            </select>
          </div>

          <Button onClick={onGenerate} disabled={isPending || !selectedSeasonId} size="sm">
            {isPending ? "Generating..." : "Generate assignment run"}
          </Button>
        </div>
      </SectionCard>

      {/* Feedback */}
      {error ? (
        <div className="status-banner border-destructive/30 bg-destructive/6 text-destructive" role="alert">
          {error}
        </div>
      ) : null}
      {feedback ? (
        <div className="status-banner border-emerald-400/35 bg-emerald-50/55 text-emerald-800" role="status">
          {feedback}
        </div>
      ) : null}

      {/* Runs list */}
      <SectionCard
        title="Assignment runs"
        description="Previous and current assignment proposals for this season."
      >
        {data.runs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No assignment runs yet. Generate one above.
          </p>
        ) : (
          <div className="space-y-3">
            {data.runs.map((run) => (
              <div key={run.id} className="dense-row">
                <button
                  type="button"
                  className="flex w-full items-center justify-between text-left"
                  onClick={() =>
                    setExpandedRunId(expandedRunId === run.id ? null : run.id)
                  }
                >
                  <div className="flex items-center gap-2">
                    <Badge className={statusColor(run.status)}>
                      {run.status.replace("_", " ")}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(run.createdAt)} · {run.createdByName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      · {run.proposals.reduce((s, p) => s + p.members.length, 0)} members across{" "}
                      {run.proposals.length} cohorts
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {expandedRunId === run.id ? "▲" : "▼"}
                  </span>
                </button>

                {expandedRunId === run.id ? (
                  <div className="mt-4">
                    <RunDetail
                      run={run}
                      onApprove={onApprove}
                      onReject={onReject}
                      isPending={isPending}
                    />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
