"use client";

import type { ReactNode } from "react";
import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import type {
  AdminApplicationStatus,
  AdminCohortStatus,
  AdminDropRequestStatus,
  AdminEventStatus,
  AdminOpsData,
  AdminSeasonStatus,
} from "@/lib/admin/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type FilterState = {
  seasonId: string;
  cohortId: string;
  query: string;
  applicationStatus: "ALL" | AdminApplicationStatus;
  eventStatus: "ALL" | AdminEventStatus;
  dropRequestStatus: "ALL" | AdminDropRequestStatus;
};

function isAdminApplicationStatus(value: string): value is AdminApplicationStatus {
  return ["DRAFT", "SUBMITTED", "REVIEWING", "ACCEPTED", "REJECTED"].includes(value);
}

function parseApplicationStatusOption(value: string): AdminApplicationStatus | null {
  const validStatuses: AdminApplicationStatus[] = [
    "DRAFT",
    "SUBMITTED",
    "REVIEWING",
    "ACCEPTED",
    "REJECTED",
  ];
  return isAdminApplicationStatus(value) && validStatuses.includes(value) ? value : null;
}

function isAdminCohortStatus(value: string): value is AdminCohortStatus {
  return ["FORMING", "ACTIVE", "COMPLETED"].includes(value);
}

function parseCohortStatusOption(value: string): AdminCohortStatus | null {
  return isAdminCohortStatus(value) ? value : null;
}

function isAdminSeasonStatus(value: string): value is AdminSeasonStatus {
  return ["PLANNING", "LIVE", "CLOSED"].includes(value);
}

function parseSeasonStatusOption(value: string): AdminSeasonStatus | null {
  return isAdminSeasonStatus(value) ? value : null;
}

function isAdminEventStatus(value: string): value is AdminEventStatus {
  return ["DRAFT", "PUBLISHED", "COMPLETED", "CANCELLED"].includes(value);
}

function parseEventStatusOption(value: string): AdminEventStatus | null {
  return isAdminEventStatus(value) ? value : null;
}

function isAdminDropRequestStatus(value: string): value is AdminDropRequestStatus {
  return ["OPEN", "MATCHED", "WITHDRAWN", "CLOSED"].includes(value);
}

function parseDropRequestStatusOption(value: string): AdminDropRequestStatus | null {
  return isAdminDropRequestStatus(value) ? value : null;
}

function parseApplicationStatus(value: string): FilterState["applicationStatus"] {
  if (value === "ALL") {
    return "ALL";
  }
  return parseApplicationStatusOption(value) ?? "ALL";
}

function parseEventStatus(value: string): FilterState["eventStatus"] {
  if (value === "ALL") {
    return "ALL";
  }
  return parseEventStatusOption(value) ?? "ALL";
}

function parseDropRequestStatus(value: string): FilterState["dropRequestStatus"] {
  if (value === "ALL") {
    return "ALL";
  }
  return parseDropRequestStatusOption(value) ?? "ALL";
}

function formatDate(dateIso: string | null) {
  if (!dateIso) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateIso));
}

function formatDateTime(dateIso: string | null) {
  if (!dateIso) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateIso));
}

function statusTone(status: string) {
  if (status === "ACCEPTED" || status === "LIVE" || status === "ACTIVE" || status === "PUBLISHED") {
    return "default" as const;
  }
  if (status === "REJECTED" || status === "CANCELLED" || status === "FAILED") {
    return "destructive" as const;
  }
  return "outline" as const;
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card className="border-border/70 bg-card/90 shadow-soft">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function AdminOpsDashboardClient({ initialData }: { initialData: AdminOpsData }) {
  const [data, setData] = useState(initialData);
  const [filters, setFilters] = useState<FilterState>({
    seasonId: "ALL",
    cohortId: "ALL",
    query: "",
    applicationStatus: "ALL",
    eventStatus: "ALL",
    dropRequestStatus: "ALL",
  });
  const [noteDraft, setNoteDraft] = useState("");
  const [noteSubjectUserId, setNoteSubjectUserId] = useState("NONE");
  const [noteApplicationId, setNoteApplicationId] = useState("NONE");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const normalizedQuery = filters.query.trim().toLowerCase();

  const filtered = useMemo(() => {
    const seasonFilteredSeasons = data.seasons.filter((season) => {
      if (filters.seasonId !== "ALL" && season.id !== filters.seasonId) {
        return false;
      }
      if (normalizedQuery) {
        const haystack = `${season.code} ${season.name} ${season.status}`.toLowerCase();
        if (!haystack.includes(normalizedQuery)) {
          return false;
        }
      }
      return true;
    });

    const seasonFilteredApplications = data.applications.filter((application) => {
      if (filters.seasonId !== "ALL" && application.memberSeasonId !== filters.seasonId) {
        return false;
      }
      if (filters.cohortId !== "ALL" && application.memberCohortId !== filters.cohortId) {
        return false;
      }
      if (filters.applicationStatus !== "ALL" && application.status !== filters.applicationStatus) {
        return false;
      }
      if (normalizedQuery) {
        const haystack =
          `${application.memberName} ${application.memberEmail} ${application.headline} ${application.availability}`.toLowerCase();
        if (!haystack.includes(normalizedQuery)) {
          return false;
        }
      }
      return true;
    });

    const seasonFilteredMembers = data.members.filter((member) => {
      if (filters.seasonId !== "ALL" && !member.seasonIds.includes(filters.seasonId)) {
        return false;
      }
      if (filters.cohortId !== "ALL" && !member.cohortIds.includes(filters.cohortId)) {
        return false;
      }
      if (normalizedQuery) {
        const haystack =
          `${member.name} ${member.email} ${member.neighborhood ?? ""} ${member.cohortNames.join(" ")}`.toLowerCase();
        if (!haystack.includes(normalizedQuery)) {
          return false;
        }
      }
      return true;
    });

    const seasonFilteredCohorts = data.cohorts.filter((cohort) => {
      if (filters.seasonId !== "ALL" && cohort.seasonId !== filters.seasonId) {
        return false;
      }
      if (filters.cohortId !== "ALL" && cohort.id !== filters.cohortId) {
        return false;
      }
      if (normalizedQuery) {
        const haystack = `${cohort.name} ${cohort.slug} ${cohort.seasonCode}`.toLowerCase();
        if (!haystack.includes(normalizedQuery)) {
          return false;
        }
      }
      return true;
    });

    const seasonFilteredEvents = data.events.filter((event) => {
      if (filters.seasonId !== "ALL" && event.seasonId !== filters.seasonId) {
        return false;
      }
      if (filters.cohortId !== "ALL" && event.cohortId !== filters.cohortId) {
        return false;
      }
      if (filters.eventStatus !== "ALL" && event.status !== filters.eventStatus) {
        return false;
      }
      if (normalizedQuery) {
        const haystack = `${event.title} ${event.venueName} ${event.seasonCode} ${event.cohortName ?? ""}`.toLowerCase();
        if (!haystack.includes(normalizedQuery)) {
          return false;
        }
      }
      return true;
    });

    const seasonFilteredDropRequests = data.dropRequests.filter((request) => {
      if (filters.seasonId !== "ALL" && request.seasonId !== filters.seasonId) {
        return false;
      }
      if (filters.cohortId !== "ALL" && request.cohortId !== filters.cohortId) {
        return false;
      }
      if (filters.dropRequestStatus !== "ALL" && request.status !== filters.dropRequestStatus) {
        return false;
      }
      if (normalizedQuery) {
        const haystack = `${request.title} ${request.requesterName} ${request.eventTitle ?? ""}`.toLowerCase();
        if (!haystack.includes(normalizedQuery)) {
          return false;
        }
      }
      return true;
    });

    const seasonFilteredRsvps = data.rsvpOverview.recent.filter((rsvp) => {
      if (filters.seasonId !== "ALL" && rsvp.seasonId !== filters.seasonId) {
        return false;
      }
      if (filters.cohortId !== "ALL" && rsvp.cohortId !== filters.cohortId) {
        return false;
      }
      if (normalizedQuery) {
        const haystack =
          `${rsvp.memberName} ${rsvp.eventTitle} ${rsvp.status} ${rsvp.seasonCode} ${rsvp.cohortName ?? ""}`.toLowerCase();
        if (!haystack.includes(normalizedQuery)) {
          return false;
        }
      }
      return true;
    });

    return {
      applications: seasonFilteredApplications,
      members: seasonFilteredMembers,
      seasons: seasonFilteredSeasons,
      cohorts: seasonFilteredCohorts,
      events: seasonFilteredEvents,
      dropRequests: seasonFilteredDropRequests,
      rsvps: seasonFilteredRsvps,
    };
  }, [data, filters, normalizedQuery]);

  function onUpdateApplicationStatus(applicationId: string, status: AdminApplicationStatus) {
    setError(null);
    setFeedback(null);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/applications/${applicationId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        });

        if (!response.ok) {
          const body = (await response.json()) as { error?: string };
          throw new Error(body.error ?? "Unable to update application.");
        }

        setData((previous) => ({
          ...previous,
          applications: previous.applications.map((application) =>
            application.id === applicationId
              ? {
                  ...application,
                  status,
                  reviewedAt: new Date().toISOString(),
                }
              : application,
          ),
        }));
        setFeedback("Application status updated.");
      } catch (updateError) {
        setError(updateError instanceof Error ? updateError.message : "Unable to update application.");
      }
    });
  }

  function onUpdateCohortStatus(cohortId: string, status: AdminCohortStatus) {
    setError(null);
    setFeedback(null);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/cohorts/${cohortId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        });

        if (!response.ok) {
          const body = (await response.json()) as { error?: string };
          throw new Error(body.error ?? "Unable to update cohort.");
        }

        setData((previous) => ({
          ...previous,
          cohorts: previous.cohorts.map((cohort) =>
            cohort.id === cohortId
              ? {
                  ...cohort,
                  status,
                }
              : cohort,
          ),
        }));
        setFeedback("Cohort status updated.");
      } catch (updateError) {
        setError(updateError instanceof Error ? updateError.message : "Unable to update cohort.");
      }
    });
  }

  function onUpdateSeasonStatus(seasonId: string, status: AdminSeasonStatus) {
    setError(null);
    setFeedback(null);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/seasons/${seasonId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        });

        if (!response.ok) {
          const body = (await response.json()) as { error?: string };
          throw new Error(body.error ?? "Unable to update season.");
        }

        setData((previous) => ({
          ...previous,
          seasons: previous.seasons.map((season) =>
            season.id === seasonId
              ? {
                  ...season,
                  status,
                }
              : season,
          ),
        }));
        setFeedback("Season status updated.");
      } catch (updateError) {
        setError(updateError instanceof Error ? updateError.message : "Unable to update season.");
      }
    });
  }

  function onUpdateEventStatus(eventId: string, status: AdminEventStatus) {
    setError(null);
    setFeedback(null);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/events/${eventId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        });

        if (!response.ok) {
          const body = (await response.json()) as { error?: string };
          throw new Error(body.error ?? "Unable to update event.");
        }

        setData((previous) => ({
          ...previous,
          events: previous.events.map((event) =>
            event.id === eventId
              ? {
                  ...event,
                  status,
                }
              : event,
          ),
        }));
        setFeedback("Event status updated.");
      } catch (updateError) {
        setError(updateError instanceof Error ? updateError.message : "Unable to update event.");
      }
    });
  }

  function onUpdateDropRequestStatus(requestId: string, status: AdminDropRequestStatus) {
    setError(null);
    setFeedback(null);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/drop-requests/${requestId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        });

        if (!response.ok) {
          const body = (await response.json()) as { error?: string };
          throw new Error(body.error ?? "Unable to update Drop request.");
        }

        setData((previous) => ({
          ...previous,
          dropRequests: previous.dropRequests.map((request) =>
            request.id === requestId
              ? {
                  ...request,
                  status,
                }
              : request,
          ),
        }));
        setFeedback("Drop request status updated.");
      } catch (updateError) {
        setError(updateError instanceof Error ? updateError.message : "Unable to update Drop request.");
      }
    });
  }

  function onCreateAdminNote() {
    const body = noteDraft.trim();
    if (!body) {
      setError("Note body cannot be empty.");
      return;
    }

    setError(null);
    setFeedback(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/notes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            body,
            subjectUserId: noteSubjectUserId === "NONE" ? undefined : noteSubjectUserId,
            applicationId: noteApplicationId === "NONE" ? undefined : noteApplicationId,
          }),
        });

        if (!response.ok) {
          const payload = (await response.json()) as { error?: string };
          throw new Error(payload.error ?? "Unable to create note.");
        }

        const payload = (await response.json()) as {
          note: {
            id: string;
            body: string;
            createdAt: string;
            applicationId: string | null;
            adminName: string;
            subjectUserId: string | null;
            subjectUserName: string | null;
          };
        };

        setData((previous) => ({
          ...previous,
          adminNotes: [payload.note, ...previous.adminNotes],
        }));
        setNoteDraft("");
        setNoteSubjectUserId("NONE");
        setNoteApplicationId("NONE");
        setFeedback("Admin note saved.");
      } catch (createError) {
        setError(createError instanceof Error ? createError.message : "Unable to create note.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Card className="border-border/70 bg-card/90">
          <CardHeader className="pb-2">
            <CardDescription>Total members</CardDescription>
            <CardTitle className="text-3xl">{data.overview.totalMembers}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border/70 bg-card/90">
          <CardHeader className="pb-2">
            <CardDescription>Total applications</CardDescription>
            <CardTitle className="text-3xl">{data.overview.totalApplications}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border/70 bg-card/90">
          <CardHeader className="pb-2">
            <CardDescription>Total cohorts</CardDescription>
            <CardTitle className="text-3xl">{data.overview.totalCohorts}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border/70 bg-card/90">
          <CardHeader className="pb-2">
            <CardDescription>Upcoming events</CardDescription>
            <CardTitle className="text-3xl">{data.overview.upcomingEvents}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border/70 bg-card/90">
          <CardHeader className="pb-2">
            <CardDescription>Active Drop requests</CardDescription>
            <CardTitle className="text-3xl">{data.overview.activeDropRequests}</CardTitle>
          </CardHeader>
        </Card>
      </section>

      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm" variant="outline">
          <Link href="/admin/assignments">Cohort assignment engine →</Link>
        </Button>
      </div>

      <Card className="border-border/70 bg-card/90 shadow-soft">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Slice by season, cohort, status, or quick text match.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-6">
          <select
            value={filters.seasonId}
            onChange={(event) => setFilters((previous) => ({ ...previous, seasonId: event.target.value }))}
            className="h-9 rounded-lg border border-input bg-transparent px-2 text-sm"
            aria-label="Filter by season"
          >
            <option value="ALL">All seasons</option>
            {data.filterOptions.seasons.map((season) => (
              <option key={season.id} value={season.id}>
                {season.label}
              </option>
            ))}
          </select>
          <select
            value={filters.cohortId}
            onChange={(event) => setFilters((previous) => ({ ...previous, cohortId: event.target.value }))}
            className="h-9 rounded-lg border border-input bg-transparent px-2 text-sm"
            aria-label="Filter by cohort"
          >
            <option value="ALL">All cohorts</option>
            {data.filterOptions.cohorts.map((cohort) => (
              <option key={cohort.id} value={cohort.id}>
                {cohort.label}
              </option>
            ))}
          </select>
          <select
            value={filters.applicationStatus}
            onChange={(event) =>
              setFilters((previous) => ({
                ...previous,
                applicationStatus: parseApplicationStatus(event.target.value),
              }))
            }
            className="h-9 rounded-lg border border-input bg-transparent px-2 text-sm"
            aria-label="Filter by application status"
          >
            <option value="ALL">All application statuses</option>
            {data.filterOptions.applicationStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <select
            value={filters.eventStatus}
            onChange={(event) =>
              setFilters((previous) => ({
                ...previous,
                eventStatus: parseEventStatus(event.target.value),
              }))
            }
            className="h-9 rounded-lg border border-input bg-transparent px-2 text-sm"
            aria-label="Filter by event status"
          >
            <option value="ALL">All event statuses</option>
            {data.filterOptions.eventStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <select
            value={filters.dropRequestStatus}
            onChange={(event) =>
              setFilters((previous) => ({
                ...previous,
                dropRequestStatus: parseDropRequestStatus(event.target.value),
              }))
            }
            className="h-9 rounded-lg border border-input bg-transparent px-2 text-sm"
            aria-label="Filter by Drop request status"
          >
            <option value="ALL">All Drop statuses</option>
            {data.filterOptions.dropRequestStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <Input
            value={filters.query}
            onChange={(event) => setFilters((previous) => ({ ...previous, query: event.target.value }))}
            placeholder="Search member, event, note..."
            aria-label="Search operations data"
          />
        </CardContent>
      </Card>

      {feedback ? (
        <p role="status" aria-live="polite" className="text-sm text-emerald-700">
          {feedback}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {isPending ? <p className="text-xs text-muted-foreground">Saving updates…</p> : null}

      <SectionCard
        title="Applications"
        description="Review and triage incoming applications with lightweight status updates."
      >
        {filtered.applications.length === 0 ? (
          <p className="text-sm text-muted-foreground">No applications match current filters.</p>
        ) : (
          <div className="space-y-3">
            {filtered.applications.map((application) => (
              <div key={application.id} className="rounded-lg border border-border/60 bg-background/40 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-foreground">{application.memberName}</p>
                    <p className="text-xs text-muted-foreground">{application.memberEmail}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={statusTone(application.status)}>{application.status}</Badge>
                    <select
                      value={application.status}
                      onChange={(event) => {
                        const nextStatus = parseApplicationStatusOption(event.target.value);
                        if (!nextStatus) return;
                        onUpdateApplicationStatus(application.id, nextStatus);
                      }}
                      disabled={isPending}
                      aria-label={`Update status for ${application.memberName}`}
                      className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
                    >
                      {data.filterOptions.applicationStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <p className="mt-2 text-sm text-foreground">{application.headline}</p>
                <p className="text-xs text-muted-foreground">
                  Submitted {formatDate(application.submittedAt)} · Reviewed {formatDate(application.reviewedAt)} ·
                  Responses {application.responseCount} · Notes {application.noteCount}
                </p>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Members"
        description="Current roster, onboarding completion, and cohort placement visibility."
      >
        {filtered.members.length === 0 ? (
          <p className="text-sm text-muted-foreground">No members match current filters.</p>
        ) : (
          <div className="space-y-3">
            {filtered.members.map((member) => (
              <div key={member.id} className="rounded-lg border border-border/60 bg-background/40 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-foreground">{member.name}</p>
                  <div className="flex gap-2">
                    <Badge variant={member.role === "ADMIN" ? "default" : "outline"}>{member.role}</Badge>
                    <Badge variant={member.isActive ? "outline" : "destructive"}>
                      {member.isActive ? "ACTIVE" : "INACTIVE"}
                    </Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {member.email} · {member.neighborhood ?? "No neighborhood"} · Onboarding{" "}
                  {member.onboardingCompletedAt ? "complete" : "pending"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Cohorts: {member.cohortNames.length > 0 ? member.cohortNames.join(", ") : "None"}
                </p>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard
          title="Questionnaire summary"
          description="Top-level response volume and section distribution."
        >
          <p className="text-sm text-muted-foreground">
            Total responses: <span className="font-medium text-foreground">{data.questionnaireSummary.totalResponses}</span>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {data.questionnaireSummary.sectionBreakdown.map((entry) => (
              <Badge key={entry.section} variant="outline">
                {entry.section}: {entry.count}
              </Badge>
            ))}
          </div>
          <div className="mt-3 space-y-1">
            {data.questionnaireSummary.topQuestionKeys.map((item) => (
              <p key={item.questionKey} className="text-xs text-muted-foreground">
                {item.questionKey} · {item.count}
              </p>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="RSVP overview" description="Recent RSVP stream and status mix.">
          <div className="flex flex-wrap gap-2">
            {Object.entries(data.rsvpOverview.totalsByStatus).map(([status, count]) => (
              <Badge key={status} variant="outline">
                {status}: {count}
              </Badge>
            ))}
          </div>
          <div className="mt-3 space-y-2">
            {filtered.rsvps.slice(0, 12).map((rsvp) => (
              <div key={rsvp.id} className="rounded-md border border-border/60 px-2 py-1.5 text-xs">
                <span className="font-medium">{rsvp.memberName}</span> · {rsvp.status} · {rsvp.eventTitle} ·{" "}
                {formatDateTime(rsvp.respondedAt)}
              </div>
            ))}
            {filtered.rsvps.length === 0 ? (
              <p className="text-sm text-muted-foreground">No RSVP activity matches current filters.</p>
            ) : null}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard
          title="Cohort management"
          description="Update cohort operational states while monitoring membership balance."
        >
          {filtered.cohorts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No cohorts match current filters.</p>
          ) : (
            <div className="space-y-2">
              {filtered.cohorts.map((cohort) => (
                <div key={cohort.id} className="rounded-lg border border-border/60 bg-background/40 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-foreground">{cohort.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {cohort.seasonCode} · Capacity {cohort.capacity}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusTone(cohort.status)}>{cohort.status}</Badge>
                      <select
                        value={cohort.status}
                        onChange={(event) => {
                          const nextStatus = parseCohortStatusOption(event.target.value);
                          if (!nextStatus) return;
                          onUpdateCohortStatus(cohort.id, nextStatus);
                        }}
                        disabled={isPending}
                        aria-label={`Update status for ${cohort.name}`}
                        className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
                      >
                        {data.filterOptions.cohortStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Invited {cohort.invitedCount} · Active {cohort.activeCount} · Paused {cohort.pausedCount} ·
                    Completed {cohort.completedCount}
                  </p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Season management"
          description="Set season lifecycle state and inspect cohort/event load."
        >
          {filtered.seasons.length === 0 ? (
            <p className="text-sm text-muted-foreground">No seasons match current filters.</p>
          ) : (
            <div className="space-y-2">
              {filtered.seasons.map((season) => (
                <div key={season.id} className="rounded-lg border border-border/60 bg-background/40 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-foreground">
                        {season.code} · {season.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(season.startsAt)} - {formatDate(season.endsAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusTone(season.status)}>{season.status}</Badge>
                      <select
                        value={season.status}
                        onChange={(event) => {
                          const nextStatus = parseSeasonStatusOption(event.target.value);
                          if (!nextStatus) return;
                          onUpdateSeasonStatus(season.id, nextStatus);
                        }}
                        disabled={isPending}
                        aria-label={`Update status for ${season.code}`}
                        className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
                      >
                        {data.filterOptions.seasonStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Cohorts {season.cohortCount} · Events {season.eventCount}
                  </p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="Events management"
        description="Operational event state, capacity, and RSVP pressure by event."
      >
        {filtered.events.length === 0 ? (
          <p className="text-sm text-muted-foreground">No events match current filters.</p>
        ) : (
          <div className="space-y-2">
            {filtered.events.map((event) => (
              <div key={event.id} className="rounded-lg border border-border/60 bg-background/40 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-foreground">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {event.seasonCode} · {event.cohortName ?? "Community-wide"} · {event.venueName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusTone(event.status)}>{event.status}</Badge>
                    <select
                      value={event.status}
                      onChange={(eventTarget) => {
                        const nextStatus = parseEventStatusOption(eventTarget.target.value);
                        if (!nextStatus) return;
                        onUpdateEventStatus(event.id, nextStatus);
                      }}
                      disabled={isPending}
                      aria-label={`Update status for ${event.title}`}
                      className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
                    >
                      {data.filterOptions.eventStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDateTime(event.startsAt)} · Capacity {event.capacity} · Going {event.goingCount} · Maybe{" "}
                  {event.maybeCount} · Waitlisted {event.waitlistedCount}
                </p>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Drop requests management"
        description="Track spontaneous activity requests and close or escalate as needed."
      >
        {filtered.dropRequests.length === 0 ? (
          <p className="text-sm text-muted-foreground">No Drop requests match current filters.</p>
        ) : (
          <div className="space-y-2">
            {filtered.dropRequests.map((request) => (
              <div key={request.id} className="rounded-lg border border-border/60 bg-background/40 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-foreground">{request.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {request.requesterName} · {request.eventTitle ?? "No linked event"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusTone(request.status)}>{request.status}</Badge>
                    <select
                      value={request.status}
                      onChange={(event) => {
                        const nextStatus = parseDropRequestStatusOption(event.target.value);
                        if (!nextStatus) return;
                        onUpdateDropRequestStatus(request.id, nextStatus);
                      }}
                      disabled={isPending}
                      aria-label={`Update status for Drop request by ${request.requesterName}`}
                      className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
                    >
                      {data.filterOptions.dropRequestStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Created {formatDateTime(request.createdAt)} · Responses {request.responseCount} (Accepted{" "}
                  {request.acceptedCount} / Pending {request.pendingCount} / Declined {request.declinedCount})
                </p>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard
          title="Booking and reminder status"
          description="Monitor booking health and communication delivery outcomes."
        >
          <div className="flex flex-wrap gap-2">
            {Object.entries(data.bookingReminderStatus.bookingsByStatus).map(([status, count]) => (
              <Badge key={status} variant="outline">
                Booking {status}: {count}
              </Badge>
            ))}
            {Object.entries(data.bookingReminderStatus.remindersByStatus).map(([status, count]) => (
              <Badge key={status} variant="outline">
                Reminder {status}: {count}
              </Badge>
            ))}
          </div>
          <div className="mt-3 space-y-1">
            {data.bookingReminderStatus.recentBookings.slice(0, 8).map((booking) => (
              <p key={booking.id} className="text-xs text-muted-foreground">
                {booking.memberName} · {booking.eventTitle} · {booking.status} · seats {booking.seats}
              </p>
            ))}
          </div>
          <div className="mt-4 space-y-1">
            {data.bookingReminderStatus.upcomingReminders.slice(0, 8).map((reminder) => (
              <p key={reminder.id} className="text-xs text-muted-foreground">
                {reminder.memberName} · {reminder.eventTitle} · {reminder.channel} · {reminder.status} ·{" "}
                {formatDateTime(reminder.scheduledFor)}
              </p>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Admin notes"
          description="Operational context and member/application annotations."
        >
          <div className="space-y-2 rounded-lg border border-border/60 bg-background/40 p-3">
            <Textarea
              value={noteDraft}
              onChange={(event) => setNoteDraft(event.target.value)}
              maxLength={420}
              rows={3}
              aria-label="Admin note body"
              placeholder="Add context for another admin..."
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <select
                value={noteSubjectUserId}
                onChange={(event) => setNoteSubjectUserId(event.target.value)}
                aria-label="Note subject member"
                className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
              >
                <option value="NONE">No subject member</option>
                {data.members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
              <select
                value={noteApplicationId}
                onChange={(event) => setNoteApplicationId(event.target.value)}
                aria-label="Linked application"
                className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
              >
                <option value="NONE">No linked application</option>
                {data.applications.map((application) => (
                  <option key={application.id} value={application.id}>
                    {application.memberName} · {application.status}
                  </option>
                ))}
              </select>
            </div>
            <Button size="sm" variant="outline" onClick={onCreateAdminNote} disabled={isPending}>
              Save note
            </Button>
          </div>

          <div className="mt-3 space-y-2">
            {data.adminNotes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No notes yet.</p>
            ) : (
              data.adminNotes.slice(0, 12).map((note) => (
                <div key={note.id} className="rounded-md border border-border/60 bg-background/40 p-2.5">
                  <p className="text-sm text-foreground">{note.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {note.adminName} · {formatDateTime(note.createdAt)} ·{" "}
                    {note.subjectUserName ? `about ${note.subjectUserName}` : "general"}
                  </p>
                </div>
              ))
            )}
          </div>
        </SectionCard>
      </div>

      <p className="text-xs text-muted-foreground">Snapshot generated {formatDateTime(data.generatedAt)}.</p>
    </div>
  );
}
