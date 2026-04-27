import Link from "next/link";
import { CalendarDays, Clock3, MapPin, Users } from "lucide-react";

import { AppQuickLink, AppSection, MemberAppShell } from "@/components/layout/member-app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireMemberSession } from "@/lib/auth/require-member-session";
import { getMemberDashboardData } from "@/lib/dashboard/get-member-dashboard-data";
import { redirect } from "next/navigation";

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function rsvpLabel(status: string | null) {
  if (!status) return "No RSVP yet";

  const labels: Record<string, string> = {
    GOING: "You are going",
    MAYBE: "Marked maybe",
    DECLINED: "Declined",
    WAITLISTED: "Waitlisted",
  };

  return labels[status] ?? "No RSVP yet";
}

export default async function NextEventPage() {
  const session = await requireMemberSession();

  const data = await getMemberDashboardData(session.user.id);
  if (!data) {
    redirect("/dashboard");
  }

  const nextEvent = data.nextEvent;

  return (
    <MemberAppShell
      eyebrow="NEXT COHORT EVENT"
      title={nextEvent ? "Your next plan is lined up." : "Your next cohort event will land here."}
      subtitle={
        nextEvent
          ? "A focused view for the one event that matters most right now: where it is, when it starts, and whether you are in."
          : "As soon as your next cohort or season event is published, this tab becomes your quick briefing screen."
      }
      actions={[
        { href: "/events", label: "Open calendar" },
        { href: "/cohort", label: "View cohort" },
      ]}
    >
      {nextEvent ? (
        <>
          <div className="rounded-[1.75rem] border border-primary/18 bg-[linear-gradient(180deg,_oklch(0.19_0.014_42),_oklch(0.15_0.012_42))] p-5 shadow-[0_28px_72px_-42px_oklch(0.03_0.02_45_/0.98)]">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="rounded-full border border-primary/25 bg-primary/12 px-3 py-1 text-[0.65rem] uppercase tracking-[0.22em] text-primary shadow-none">
                  Next event
                </Badge>
                {data.cohort ? (
                  <Badge variant="outline" className="rounded-full">
                    {data.cohort.name}
                  </Badge>
                ) : null}
                <Badge variant="outline" className="rounded-full">
                  {rsvpLabel(nextEvent.rsvpStatus)}
                </Badge>
              </div>

              <div className="space-y-2">
                <h2 className="font-heading text-[2rem] leading-[1.02] tracking-[-0.04em] text-foreground">
                  {nextEvent.title}
                </h2>
                <p className="text-sm leading-7 text-muted-foreground">{nextEvent.description}</p>
              </div>
            </div>
          </div>

          <AppSection title="Event briefing" description="Everything you need before you head out.">
            <div className="space-y-3">
              <div className="app-list-row">
                <div className="flex items-center gap-3">
                  <span className="app-list-icon">
                    <CalendarDays className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">Start time</p>
                    <p className="text-xs leading-5 text-muted-foreground">
                      {formatDateTime(nextEvent.startsAt)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="app-list-row">
                <div className="flex items-center gap-3">
                  <span className="app-list-icon">
                    <Clock3 className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">Ends</p>
                    <p className="text-xs leading-5 text-muted-foreground">
                      {formatDateTime(nextEvent.endsAt)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="app-list-row">
                <div className="flex items-center gap-3">
                  <span className="app-list-icon">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">Venue</p>
                    <p className="text-xs leading-5 text-muted-foreground">
                      {nextEvent.venueName} · {nextEvent.venueAddressLine1}, {nextEvent.venueCity},{" "}
                      {nextEvent.venueState}
                    </p>
                  </div>
                </div>
              </div>

              <div className="app-list-row">
                <div className="flex items-center gap-3">
                  <span className="app-list-icon">
                    <Users className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">Cohort context</p>
                    <p className="text-xs leading-5 text-muted-foreground">
                      {data.cohort
                        ? `${data.cohort.activeMemberCount} active members in ${data.cohort.name}.`
                        : "This event is tied to your current season rhythm."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </AppSection>

          <AppSection
            title="Quick actions"
            description="Fast paths into RSVP, chat, and cohort context."
            tone="accent"
          >
            <div className="space-y-3">
              <Button asChild className="w-full justify-center">
                <Link href="/events">{nextEvent.rsvpStatus ? "Update RSVP" : "RSVP now"}</Link>
              </Button>
              <AppQuickLink
                href="/cohort/chat"
                label="Coordinate in cohort chat"
                detail="Move the event plan into the room for quick check-ins."
                icon="spark"
              />
              <AppQuickLink
                href="/cohort"
                label="See your cohort roster"
                detail="Open the people and context around this event."
                icon="book"
              />
            </div>
          </AppSection>
        </>
      ) : (
        <>
          <AppSection
            title="Nothing scheduled yet"
            description="Your next published cohort or season event will surface here automatically."
          >
            <div className="space-y-3 rounded-[1.35rem] border border-dashed border-border/55 bg-background/24 px-4 py-4">
              <p className="text-sm font-medium text-foreground">No next event yet</p>
              <p className="text-sm leading-6 text-muted-foreground">
                If you already completed onboarding, check back after the next event is published. If not, finishing your
                profile is the fastest way to unlock the right event rhythm.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm">
                  <Link href={data.onboardingCompleted ? "/events" : "/onboarding"}>
                    {data.onboardingCompleted ? "Open events" : "Finish onboarding"}
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href="/dashboard">Back home</Link>
                </Button>
              </div>
            </div>
          </AppSection>

          <AppSection title="Useful shortcuts" description="Stay close to the rest of your member rhythm.">
            <div className="space-y-3">
              <AppQuickLink
                href="/events"
                label="Browse all events"
                detail="See every upcoming published event in your season."
                icon="calendar"
              />
              <AppQuickLink
                href="/cohort"
                label="Open your cohort"
                detail="Check your roster and upcoming cohort-only plans."
                icon="book"
              />
            </div>
          </AppSection>
        </>
      )}
    </MemberAppShell>
  );
}
