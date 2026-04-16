"use client";

import { useMemo, useState } from "react";

import type { AdminApplicationReviewData } from "@/lib/admin/get-application-review-data";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function statusTone(status: string) {
  if (status === "ACCEPTED" || status === "SUBMITTED" || status === "REVIEWING") {
    return "default" as const;
  }
  if (status === "REJECTED") {
    return "destructive" as const;
  }
  return "outline" as const;
}

const filterSelectClass = "luxury-select";

export function AdminApplicationsReviewClient({
  initialData,
}: {
  initialData: AdminApplicationReviewData;
}) {
  const [activeTab, setActiveTab] = useState<"applications" | "activities">("applications");
  const [seasonId, setSeasonId] = useState("ALL");
  const [status, setStatus] = useState<
    "ALL" | AdminApplicationReviewData["applications"][number]["status"]
  >("ALL");
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [applications, setApplications] = useState(initialData.applications);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return applications.filter((application) => {
      if (seasonId !== "ALL" && application.currentSeasonId !== seasonId) {
        return false;
      }
      if (status !== "ALL" && application.status !== status) {
        return false;
      }
      if (!q) return true;
      const haystack = [
        application.member.name,
        application.member.email,
        application.headline,
        application.aboutText,
        application.availability,
        application.currentCohortName ?? "",
        application.member.profile.neighborhood ?? "",
        application.member.profile.occupation ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [applications, query, seasonId, status]);

  const activityGroups = useMemo(() => {
    const map = new Map<string, Array<(typeof applications)[number]>>();
    for (const application of applications) {
      const interests = application.member.profile.interests;
      if (interests.length === 0) {
        const key = "No listed interests";
        const existing = map.get(key) ?? [];
        existing.push(application);
        map.set(key, existing);
        continue;
      }

      for (const interest of interests) {
        const key = interest.trim();
        if (!key) continue;
        const existing = map.get(key) ?? [];
        existing.push(application);
        map.set(key, existing);
      }
    }

    return Array.from(map.entries())
      .map(([interest, members]) => ({
        interest,
        members: members.sort((a, b) => a.member.name.localeCompare(b.member.name)),
      }))
      .sort((a, b) => b.members.length - a.members.length || a.interest.localeCompare(b.interest));
  }, [applications]);

  async function handleDeleteApplication(applicationId: string) {
    const confirmed = window.confirm(
      "Delete this application? This is best for removing duplicates and cannot be undone.",
    );
    if (!confirmed) {
      return;
    }

    setDeleteId(applicationId);
    try {
      const response = await fetch(`/api/admin/applications/${applicationId}`, {
        method: "DELETE",
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to delete application right now.");
      }

      setApplications((prev) => prev.filter((item) => item.id !== applicationId));
      setExpandedId((prev) => (prev === applicationId ? null : prev));
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to delete application right now.");
    } finally {
      setDeleteId(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="surface-panel">
        <CardContent className="flex flex-wrap gap-2 p-3">
          <button
            type="button"
            className={`rounded-full px-4 py-1.5 text-xs font-medium uppercase tracking-[0.14em] ${
              activeTab === "applications"
                ? "bg-foreground text-background"
                : "border border-border/60 text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("applications")}
          >
            Applications
          </button>
          <button
            type="button"
            className={`rounded-full px-4 py-1.5 text-xs font-medium uppercase tracking-[0.14em] ${
              activeTab === "activities"
                ? "bg-foreground text-background"
                : "border border-border/60 text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("activities")}
          >
            Activities
          </button>
        </CardContent>
      </Card>

      {activeTab === "applications" ? (
        <>
      <Card className="surface-panel">
        <CardHeader>
          <CardTitle>Application review filters</CardTitle>
          <CardDescription>
            Find the right applicants quickly by season, status, and preference keywords.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-3">
          <select
            value={seasonId}
            onChange={(event) => setSeasonId(event.target.value)}
            className={filterSelectClass}
            aria-label="Filter applications by season"
          >
            <option value="ALL">All seasons</option>
            {initialData.seasonFilters.map((season) => (
              <option key={season.id} value={season.id}>
                {season.label}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as typeof status)}
            className={filterSelectClass}
            aria-label="Filter applications by status"
          >
            <option value="ALL">All statuses</option>
            {initialData.statusOptions.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </select>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, email, preferences, text..."
            aria-label="Search applications"
          />
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Showing <span className="font-medium text-foreground">{filtered.length}</span> of{" "}
        <span className="font-medium text-foreground">{applications.length}</span> applications.
      </p>

      <div className="space-y-3">
        {filtered.map((application) => {
          const expanded = expandedId === application.id;
          return (
            <Card key={application.id} className="surface-panel">
              <CardContent className="space-y-4 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{application.member.name}</p>
                    <p className="text-xs text-muted-foreground">{application.member.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Submitted {formatDateTime(application.submittedAt)} · Reviewed {formatDateTime(application.reviewedAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={statusTone(application.status)}>{application.status}</Badge>
                    {application.currentCohortName ? (
                      <Badge variant="outline">Current cohort: {application.currentCohortName}</Badge>
                    ) : (
                      <Badge variant="outline">Not yet assigned</Badge>
                    )}
                    <button
                      type="button"
                      className="rounded-full border border-border/60 px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                      onClick={() => setExpandedId(expanded ? null : application.id)}
                    >
                      {expanded ? "Hide details" : "Review full application"}
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-destructive/40 px-3 py-1 text-xs font-medium text-destructive hover:bg-destructive/8 disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={() => handleDeleteApplication(application.id)}
                      disabled={deleteId === application.id}
                    >
                      {deleteId === application.id ? "Deleting..." : "Delete duplicate"}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Headline</p>
                  <p className="text-sm text-foreground">{application.headline}</p>
                </div>

                {expanded ? (
                  <div className="space-y-5 border-t border-border/45 pt-4">
                    <div className="grid gap-4 lg:grid-cols-2">
                      <Card className="surface-subtle">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Application</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                          <div>
                            <p className="eyebrow text-muted-foreground">About</p>
                            <p className="prose-calm">{application.aboutText}</p>
                          </div>
                          <div>
                            <p className="eyebrow text-muted-foreground">Availability</p>
                            <p className="prose-calm">{application.availability}</p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="surface-subtle">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Profile preferences</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <p>
                            <span className="text-muted-foreground">Neighborhood:</span>{" "}
                            {application.member.profile.neighborhood ?? "—"}
                          </p>
                          <p>
                            <span className="text-muted-foreground">Age range:</span>{" "}
                            {application.member.profile.ageRange ?? "—"}
                          </p>
                          <p>
                            <span className="text-muted-foreground">Occupation:</span>{" "}
                            {application.member.profile.occupation ?? "—"}
                          </p>
                          <p>
                            <span className="text-muted-foreground">Social goal:</span>{" "}
                            {application.member.profile.socialGoal ?? "—"}
                          </p>
                          <p>
                            <span className="text-muted-foreground">Preferred nights:</span>{" "}
                            {application.member.profile.preferredNights ?? "—"}
                          </p>
                          <p>
                            <span className="text-muted-foreground">Budget comfort:</span>{" "}
                            {application.member.profile.budgetComfort ?? "—"}
                          </p>
                          <p>
                            <span className="text-muted-foreground">Group energy:</span>{" "}
                            {application.member.profile.idealGroupEnergy ?? "—"}
                          </p>
                          <p>
                            <span className="text-muted-foreground">Interests:</span>{" "}
                            {application.member.profile.interests.length > 0
                              ? application.member.profile.interests.join(", ")
                              : "—"}
                          </p>
                          <p>
                            <span className="text-muted-foreground">Vibe:</span>{" "}
                            {application.member.profile.preferredVibe.length > 0
                              ? application.member.profile.preferredVibe.join(", ")
                              : "—"}
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    <Card className="surface-subtle">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Questionnaire responses</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {application.responses.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No questionnaire responses on file.</p>
                        ) : (
                          application.responses.map((response) => (
                            <div key={response.id} className="dense-row">
                              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                                {response.section} · {response.questionKey}
                              </p>
                              <p className="mt-1 text-sm text-foreground">{response.response}</p>
                            </div>
                          ))
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>
        </>
      ) : (
        <Card className="surface-panel">
          <CardHeader>
            <CardTitle>Activity preferences</CardTitle>
            <CardDescription>
              Grouped by listed interests so you can quickly see who belongs together.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activityGroups.length === 0 ? (
              <p className="text-sm text-muted-foreground">No application activity preferences available yet.</p>
            ) : (
              activityGroups.map((group) => (
                <div key={group.interest} className="dense-row space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-heading text-base text-foreground">{group.interest}</p>
                    <Badge variant="outline">{group.members.length} member(s)</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {group.members.map((application) => (
                      <span
                        key={`${group.interest}-${application.id}`}
                        className="rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs text-foreground"
                      >
                        {application.member.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
