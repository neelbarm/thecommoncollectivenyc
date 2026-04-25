"use client";

import Link from "next/link";
import { CalendarDays, ChevronRight, MapPin, MessageCircleMore, Users } from "lucide-react";

import type { MemberCohortData } from "@/lib/member/get-member-cohort-data";
import {
  AppQuickLink,
  AppSection,
  AppStat,
} from "@/components/layout/member-app-shell";
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

function initials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
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
      <AppSection title={title} description={description} tone="accent">
        <Button asChild size="sm">
          <Link href={ctaHref}>{ctaLabel}</Link>
        </Button>
      </AppSection>
    );
  }

  return (
    <div className="space-y-4">
      <AppSection
        title={data.cohort.name}
        description={`${data.cohort.seasonName}${data.cohort.joinedAt ? ` · Joined ${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(data.cohort.joinedAt))}` : ""}`}
        tone="accent"
        action={
          <Badge variant="outline" className="border-primary/25 bg-primary/10 text-primary">
            {data.cohort.membershipStatus}
          </Badge>
        }
      >
        <div className="space-y-4">
          <p className="text-sm leading-7 text-foreground/90">{data.cohort.description}</p>

          <div className="grid grid-cols-3 gap-3">
            <AppStat label="Members" value={`${data.members.length}`} detail="Intimate group size" />
            <AppStat label="Status" value={data.cohort.status} detail="Live cohort state" />
            <AppStat
              label="Plans"
              value={`${data.upcomingEvents.length}`}
              detail="Upcoming shared moments"
            />
          </div>

          <div className="grid gap-2">
            <AppQuickLink
              href="/cohort/chat"
              label="Open cohort chat"
              detail="A warm, low-friction space for planning and checking in."
              icon="spark"
            />
            <AppQuickLink
              href="/events"
              label="See full event calendar"
              detail="RSVP, update your status, and view venue details."
              icon="calendar"
            />
          </div>
        </div>
      </AppSection>

      <AppSection
        title="The people in your room"
        description={`Your cohort roster (${data.members.length}).`}
        action={
          <AvatarGroup>
            {data.members.slice(0, 3).map((member) => (
              <Avatar key={member.id}>
                <AvatarFallback>{initials(member.firstName, member.lastName)}</AvatarFallback>
              </Avatar>
            ))}
            {data.members.length > 3 ? <AvatarGroupCount>+{data.members.length - 3}</AvatarGroupCount> : null}
          </AvatarGroup>
        }
      >
        <div className="space-y-3">
          {data.members.map((m) => (
            <div key={m.id} className="app-list-row">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>{initials(m.firstName, m.lastName)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {m.firstName} {m.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">{m.neighborhood ?? "Neighborhood shared soon"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                <span>{m.neighborhood ?? "NYC"}</span>
              </div>
            </div>
          ))}
        </div>
      </AppSection>

      <AppSection
        title="Upcoming cohort moments"
        description="Published events tied directly to your cohort."
        action={
          <Link
            href="/events"
            className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.22em] text-primary"
          >
            All events
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        }
      >
        {data.upcomingEvents.length === 0 ? (
          <div className="app-empty-state">
            <CalendarDays className="h-5 w-5 text-primary" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">No published plans yet</p>
              <p className="text-sm leading-6 text-muted-foreground">
                When your cohort&apos;s next gathering is live, it will appear here first.
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/events">Open events</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {data.upcomingEvents.map((ev) => (
              <div key={ev.id} className="app-list-row">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{ev.title}</p>
                    <Badge variant="outline" className="border-primary/20 bg-primary/8 text-primary">
                      {rsvpLabel(ev.rsvpStatus)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{formatWhen(ev.startsAt)}</p>
                  <p className="text-xs text-muted-foreground">{ev.venueName} · {ev.venueAddress}</p>
                </div>
                <Link
                  href="/events"
                  className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.22em] text-primary"
                >
                  Open
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="app-stat-card">
            <p className="app-eyebrow text-[0.6rem]">Chatroom</p>
            <p className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-foreground">
              <MessageCircleMore className="h-4 w-4 text-primary" />
              Ready for planning
            </p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Use cohort chat for soft coordination between events.
            </p>
          </div>
          <div className="app-stat-card">
            <p className="app-eyebrow text-[0.6rem]">Shared energy</p>
            <p className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-foreground">
              <Users className="h-4 w-4 text-primary" />
              Small, consistent group
            </p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Built for familiarity, comfort, and repeat connection.
            </p>
          </div>
        </div>
      </AppSection>
    </div>
  );
}
