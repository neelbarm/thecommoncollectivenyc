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
    return (
      <Card className="border-border/70 bg-card/90 shadow-soft">
        <CardHeader>
          <CardTitle>No cohort yet</CardTitle>
          <CardDescription>
            When you are placed in a cohort, this page will show your group, roster, and upcoming
            cohort events.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/70 bg-card/90 shadow-soft">
        <CardHeader className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-muted-gold/40 bg-muted-gold/10">
              Your cohort
            </Badge>
            <Badge variant="outline">{data.cohort.status}</Badge>
            <Badge variant="outline">{data.cohort.membershipStatus}</Badge>
          </div>
          <CardTitle className="text-3xl leading-tight sm:text-4xl">{data.cohort.name}</CardTitle>
          <CardDescription className="max-w-3xl text-sm leading-7 text-muted-foreground">
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

      <Card className="border-border/70 bg-card/90 shadow-soft">
        <CardHeader>
          <CardTitle className="text-lg">Members</CardTitle>
          <CardDescription>Your cohort roster ({data.members.length}).</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border/60 rounded-lg border border-border/60">
            {data.members.map((m) => (
              <li key={m.id} className="flex flex-wrap items-baseline justify-between gap-2 px-3 py-2.5 text-sm">
                <span className="font-medium text-foreground">
                  {m.firstName} {m.lastName}
                </span>
                <span className="text-muted-foreground">{m.neighborhood ?? "—"}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/90 shadow-soft">
        <CardHeader>
          <CardTitle className="text-lg">Upcoming cohort events</CardTitle>
          <CardDescription>Published events tied to your cohort.</CardDescription>
        </CardHeader>
        <CardContent>
          {data.upcomingEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming published events yet.</p>
          ) : (
            <ul className="space-y-3">
              {data.upcomingEvents.map((ev) => (
                <li
                  key={ev.id}
                  className="rounded-lg border border-border/60 bg-background/40 p-3 text-sm"
                >
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
