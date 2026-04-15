"use client";

import Link from "next/link";

import type { MemberCohortData } from "@/lib/member/get-member-cohort-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function rsvpLabel(status: string | null) {
  if (!status) return "No RSVP yet";
  const labels: Record<string, string> = {
    GOING: "You are going",
    MAYBE: "Maybe",
    DECLINED: "Declined",
    WAITLISTED: "Waitlisted",
  };
  return labels[status] ?? "No RSVP yet";
}

export function MemberCohortPage({ data }: { data: MemberCohortData }) {
  const hasCohort = Boolean(data.cohort.id);

  if (!hasCohort) {
    const needsProfile = !data.hasProfile;
    const needsOnboarding = data.hasProfile && !data.onboardingCompleted;

    const title = needsProfile
      ? "We need your member profile first"
      : needsOnboarding
        ? "Finish onboarding to unlock your cohort"
        : "Your cohort is on the way";

    const description = needsProfile
      ? "You’re signed in, but your member questionnaire isn’t on file yet. A quick pass through onboarding fixes that."
      : needsOnboarding
        ? "A few questions are still open. Complete them so we can place you with the right small group."
        : "You’re in the club — the team will assign your cohort soon. Your roster and cohort-only events will show here when that happens.";

    const ctaHref = needsProfile || needsOnboarding ? "/onboarding" : "/dashboard";
    const ctaLabel = needsProfile ? "Set up my profile" : needsOnboarding ? "Continue onboarding" : "Back to dashboard";

    return (
      <Card className="surface-dashed">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription className="text-sm leading-7 text-muted-foreground">{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild size="sm">
            <Link href={ctaHref}>{ctaLabel}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-7">
      <Card className="surface-panel">
        <CardHeader className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-muted-gold/40 bg-muted-gold/10">
              Your cohort
            </Badge>
            <Badge variant="outline">{data.cohort.status}</Badge>
            <Badge variant="outline">{data.cohort.membershipStatus}</Badge>
          </div>
          <CardTitle className="text-3xl leading-tight sm:text-4xl">{data.cohort.name}</CardTitle>
          <CardDescription className="prose-calm max-w-3xl">
            {data.cohort.seasonName}
            {data.cohort.joinedAt
              ? ` · Joined ${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(data.cohort.joinedAt))}`
              : null}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm leading-7 text-foreground">{data.cohort.description}</p>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/events">RSVP on Events</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="surface-panel">
        <CardHeader>
          <CardTitle className="text-lg">Members</CardTitle>
          <CardDescription>Your cohort roster ({data.members.length}).</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="rounded-xl border border-border/60 bg-background/35">
            {data.members.map((m) => (
              <li
                key={m.id}
                className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border/45 px-4 py-3 text-sm last:border-b-0"
              >
                <span className="font-medium text-foreground">
                  {m.firstName} {m.lastName}
                </span>
                <span className="text-muted-foreground">{m.neighborhood ?? "—"}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="surface-panel">
        <CardHeader>
          <CardTitle className="text-lg">Upcoming cohort events</CardTitle>
          <CardDescription>Published events tied to your cohort.</CardDescription>
        </CardHeader>
        <CardContent>
          {data.upcomingEvents.length === 0 ? (
            <div className="surface-dashed space-y-3 p-4">
              <p className="font-medium text-foreground">No published plans yet</p>
              <p className="text-sm text-muted-foreground">
                When your cohort’s next gathering is live, it will appear here. You can also RSVP from the main events
                list.
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href="/events">Open events</Link>
              </Button>
            </div>
          ) : (
            <ul className="space-y-3">
              {data.upcomingEvents.map((ev) => (
                <li key={ev.id} className="dense-row text-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-foreground">{ev.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatWhen(ev.startsAt)} · {ev.venueName}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{ev.venueAddress}</p>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-xs">
                      {rsvpLabel(ev.rsvpStatus)}
                    </Badge>
                  </div>
                  <Button asChild size="sm" variant="link" className="mt-2 h-auto p-0 text-xs">
                    <Link href="/events">Open in Events</Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
