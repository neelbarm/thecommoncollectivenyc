import Link from "next/link";
import { Bell, CalendarDays, Clock3, Compass, MapPin, MessageCircleMore, Users } from "lucide-react";

import type { MemberDashboardData } from "@/lib/dashboard/get-member-dashboard-data";
import { Avatar, AvatarFallback, AvatarGroup } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  AppQuickLink,
  AppSection,
  AppStat,
  MemberAppShell,
} from "@/components/layout/member-app-shell";

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function rsvpLabel(status: MemberDashboardData["nextEvent"] extends infer T ? (T extends { rsvpStatus: infer R } ? R : null) : null) {
  if (!status) return "No RSVP yet";

  const labels: Record<string, string> = {
    GOING: "You are going",
    MAYBE: "Marked maybe",
    DECLINED: "Declined",
    WAITLISTED: "On waitlist",
  };

  return labels[status] ?? "No RSVP yet";
}

function initials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

export function MemberDashboard({ data }: { data: MemberDashboardData }) {
  const hasCohort = Boolean(data.cohort);
  const hasNextEvent = Boolean(data.nextEvent);
  const needsProfileRepair = !data.hasProfile;
  const needsOnboarding = data.hasProfile && !data.onboardingCompleted;
  const profileInterests = data.profile?.interests.slice(0, 4) ?? [];

  return (
    <MemberAppShell
      eyebrow="Member home"
      title={`Welcome back, ${data.firstName}.`}
      subtitle="Your curated view of cohort chemistry, upcoming plans, and the social rhythm unfolding around you."
      actions={[
        { href: "/cohort", label: hasCohort ? "View cohort" : "Cohort status" },
        { href: "/events", label: "Open calendar" },
        { href: "/drop", label: "Use The Drop" },
      ]}
    >
      <section className="app-hero-card">
        <div className="grid grid-cols-3 gap-3">
          <AppStat
            label="Status"
            value={data.onboardingCompleted ? "Ready" : "Setup"}
            detail={data.onboardingCompleted ? "Profile completed" : "Finish onboarding"}
          />
          <AppStat
            label="Cohort"
            value={hasCohort && data.cohort ? `${data.cohort.activeMemberCount}` : "—"}
            detail={hasCohort && data.cohort ? "Members in your circle" : "Pending assignment"}
          />
          <AppStat
            label="Next"
            value={hasNextEvent ? "Live" : "Soon"}
            detail={hasNextEvent ? "Upcoming gathering" : "Calendar still filling"}
          />
        </div>

        <div className="mt-5 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {hasCohort && data.cohort ? (
              <>
                <span className="app-chip bg-primary/12 text-foreground">{data.cohort.name}</span>
                <span className="app-chip">{data.cohort.seasonName}</span>
                <span className="app-chip">{data.cohort.seasonProgressLabel}</span>
              </>
            ) : (
              <span className="app-chip">Matching in progress</span>
            )}
            {data.profile?.neighborhood ? <span className="app-chip">{data.profile.neighborhood}</span> : null}
          </div>

          <p className="text-sm leading-7 text-muted-foreground">
            {needsProfileRepair
              ? "Your account is active, but we still need your member questionnaire before the full experience unlocks."
              : needsOnboarding
                ? "A few details are still open. Once your onboarding is complete, your cohort placement and more tailored plans can unlock."
                : hasCohort && data.cohort
                  ? data.cohort.description
                  : "We’re shaping a small group around your preferences. Check back soon for your roster, cadence, and next plans."}
          </p>

          {(needsProfileRepair || needsOnboarding) && (
            <Button asChild className="mt-1">
              <Link href="/onboarding">{needsProfileRepair ? "Set up my profile" : "Continue onboarding"}</Link>
            </Button>
          )}
        </div>
      </section>

      <AppSection
        title="Concierge"
        description={data.concierge.note}
        action={
          <Link href="/announcements" className="app-chip">
            <Bell className="h-3.5 w-3.5" />
            Updates
          </Link>
        }
        tone="accent"
      >
        <div className="grid gap-3">
          <AppQuickLink
            href="/drop"
            label={data.concierge.title}
            detail="Signal your energy, open a spontaneous plan, or let the concierge layer do the routing."
            icon="spark"
          />
          <AppQuickLink
            href="/cohort/chat"
            label="Cohort chat"
            detail="Keep the conversation warm between dinners, events, and spontaneous windows."
          />
        </div>
      </AppSection>

      <AppSection
        title="My cohort"
        description={
          hasCohort && data.cohort
            ? `${data.cohort.activeMemberCount} members building a recurring rhythm together.`
            : "Your private small-group space will appear here as soon as matching is complete."
        }
        action={
          <Link href={hasCohort ? "/cohort" : "/onboarding"} className="app-chip">
            <Users className="h-3.5 w-3.5" />
            {hasCohort ? "Open cohort" : "Complete setup"}
          </Link>
        }
      >
        {hasCohort && data.cohort ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-lg font-semibold tracking-[-0.02em] text-foreground">{data.cohort.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{data.cohort.seasonName}</p>
              </div>
              {data.cohort.memberPreview.length > 0 ? (
                <AvatarGroup>
                  {data.cohort.memberPreview.slice(0, 4).map((member) => (
                    <Avatar key={member.id} size="lg">
                      <AvatarFallback>{initials(member.firstName, member.lastName)}</AvatarFallback>
                    </Avatar>
                  ))}
                </AvatarGroup>
              ) : null}
            </div>

            <div className="space-y-2">
              {data.cohort.memberPreview.slice(0, 4).map((member) => (
                <div key={member.id} className="app-list-row">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{initials(member.firstName, member.lastName)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {member.firstName} {member.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">{member.neighborhood ?? "New York City"}</p>
                    </div>
                  </div>
                  <MessageCircleMore className="h-4 w-4 text-muted-foreground/75" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-[1.35rem] border border-dashed border-border/65 bg-background/55 px-4 py-5">
            <p className="text-sm font-medium text-foreground">No cohort assigned yet</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {data.onboardingCompleted
                ? "Your answers are in and the team is shaping the right group. You’ll see it here as soon as assignments land."
                : "Finish onboarding so we can place you in a group that fits your energy, interests, and social goals."}
            </p>
          </div>
        )}
      </AppSection>

      <AppSection
        title="Tonight and next"
        description="A polished view of your next live plan and the RSVP status attached to it."
        action={
          <Link href="/events" className="app-chip">
            <CalendarDays className="h-3.5 w-3.5" />
            Full calendar
          </Link>
        }
      >
        {hasNextEvent && data.nextEvent ? (
          <div className="rounded-[1.5rem] border border-primary/20 bg-primary/8 px-4 py-4 shadow-[inset_0_1px_0_oklch(1_0_0_/0.04)]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="app-chip bg-primary/12 text-foreground">{rsvpLabel(data.nextEvent.rsvpStatus)}</span>
              <span className="app-chip">{data.nextEvent.venueName}</span>
            </div>
            <p className="mt-3 text-xl font-semibold tracking-[-0.03em] text-foreground">{data.nextEvent.title}</p>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">{data.nextEvent.description}</p>
            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              <p className="inline-flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-primary" />
                {formatDateTime(data.nextEvent.startsAt)}
              </p>
              <p className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                {data.nextEvent.venueName} · {data.nextEvent.venueAddressLine1}, {data.nextEvent.venueCity},{" "}
                {data.nextEvent.venueState}
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-[1.35rem] border border-dashed border-border/65 bg-background/55 px-4 py-5">
            <p className="text-sm font-medium text-foreground">No upcoming gathering yet</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {hasCohort
                ? "Once your next cohort plan is published, it will surface here first."
                : "When your cohort and season planning are in place, upcoming experiences will appear here."}
            </p>
          </div>
        )}
      </AppSection>

      <AppSection
        title="Your taste profile"
        description="Signals that help shape your cohort chemistry and what lands in your orbit."
        action={
          <Link href="/profile" className="app-chip">
            <Compass className="h-3.5 w-3.5" />
            Profile
          </Link>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <AppStat
            label="Neighborhood"
            value={data.profile?.neighborhood ?? "NYC"}
            detail={data.profile?.socialGoal ?? "Member profile"}
          />
          <AppStat
            label="Interests"
            value={profileInterests.length ? `${profileInterests.length}` : "—"}
            detail={profileInterests.length ? profileInterests.join(" · ") : "Add preferences"}
          />
        </div>
      </AppSection>

      <AppSection title="Recent rhythm" description="A short history of gatherings already behind you.">
        {data.pastEvents.length > 0 ? (
          <div className="space-y-2">
            {data.pastEvents.map((event) => (
              <div key={event.id} className="app-list-row">
                <div>
                  <p className="text-sm font-medium text-foreground">{event.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(event.startsAt)}</p>
                </div>
                <span className="app-chip">{event.venueName}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[1.35rem] border border-dashed border-border/65 bg-background/55 px-4 py-5">
            <p className="text-sm font-medium text-foreground">No past gatherings yet</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              After your first events, a clean history of your season rhythm will live here.
            </p>
          </div>
        )}
      </AppSection>
    </MemberAppShell>
  );
}
