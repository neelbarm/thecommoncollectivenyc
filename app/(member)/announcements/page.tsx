import Link from "next/link";
import { BellRing, CalendarClock, Pin, Sparkles } from "lucide-react";

import { auth } from "@/auth";
import { AppQuickLink, AppSection, AppStat, MemberAppShell } from "@/components/layout/member-app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getMemberDashboardData } from "@/lib/dashboard/get-member-dashboard-data";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export default async function AnnouncementsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const data = await getMemberDashboardData(session.user.id);
  if (!data) {
    return null;
  }

  const updates = [
    {
      id: "season-note",
      title: "Season notes are moving into the app",
      body:
        "Announcements now live in a dedicated member surface so cohort logistics, event reminders, and editorial updates feel closer to a proper concierge product.",
      tag: "Product update",
      pinned: true,
      date: formatDate(new Date()),
    },
    {
      id: "cohort-update",
      title: data.cohort
        ? `${data.cohort.name} concierge update`
        : "Cohort assignments are being prepared",
      body: data.cohort
        ? `Your cohort page and future chat space are now designed to feel more intimate and mobile-first. Expect planning, roster visibility, and announcements to center around ${data.cohort.name}.`
        : "Once your profile is complete, this feed will carry your cohort welcome, introductions, and next-step logistics.",
      tag: data.cohort ? "Cohort" : "Assignment",
      pinned: false,
      date: formatDate(new Date(Date.now() - 1000 * 60 * 60 * 18)),
    },
    {
      id: "event-update",
      title: data.nextEvent ? `${data.nextEvent.title} is coming up` : "Event rhythm will show up here",
      body: data.nextEvent
        ? `We’ll use announcements for host notes, dress cues, changes in timing, and RSVP reminders ahead of ${data.nextEvent.title}.`
        : "As soon as the next gathering goes live, a short announcement can highlight what matters before you RSVP.",
      tag: "Events",
      pinned: false,
      date: formatDate(new Date(Date.now() - 1000 * 60 * 60 * 42)),
    },
  ];

  return (
    <MemberAppShell
      eyebrow="Member updates"
      title="Announcements, notes, and quiet signals."
      subtitle="A premium feed for cohort messages, member notices, and event timing changes."
      actions={[
        { href: "/dashboard", label: "Home" },
        { href: "/events", label: "Calendar" },
      ]}
    >
      <div className="grid grid-cols-3 gap-3">
        <AppStat
          label="Unread"
          value="03"
          detail="Pinned notes and event signals"
        />
        <AppStat
          label="Cohort"
          value={data.cohort ? "Live" : "Soon"}
          detail={data.cohort ? data.cohort.name : "Awaiting assignment"}
        />
        <AppStat
          label="Cadence"
          value="Weekly"
          detail="Designed for lightweight updates"
        />
      </div>

      <AppSection
        title="Pinned shortcuts"
        description="Shortcuts that make this feed feel like a member control center."
      >
        <div className="space-y-2">
          <AppQuickLink
            href="/cohort"
            label="Open cohort space"
            detail="Roster, gatherings, and cohort-specific context"
            icon="book"
          />
          <AppQuickLink
            href="/cohort/chat"
            label="Open cohort chat"
            detail="A modern conversation layer for your small group"
          />
          <AppQuickLink
            href="/events"
            label="Review upcoming events"
            detail="See invitations and update your RSVP quickly"
            icon="calendar"
          />
        </div>
      </AppSection>

      <AppSection
        title="Latest feed"
        description="This is the first pass of the announcements surface; it is designed to feel editorial and calm."
        action={
          <Button asChild size="sm" variant="outline">
            <Link href="/dashboard">Back home</Link>
          </Button>
        }
      >
        <div className="space-y-3">
          {updates.map((update) => (
            <article key={update.id} className="app-list-row items-start">
              <div className="flex items-start gap-3">
                <span className="app-list-icon mt-0.5">
                  {update.pinned ? <Pin className="h-4 w-4" /> : <BellRing className="h-4 w-4" />}
                </span>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={update.pinned ? "default" : "outline"}>
                      {update.tag}
                    </Badge>
                    {update.pinned ? <Badge variant="outline">Pinned</Badge> : null}
                    <span className="text-xs text-muted-foreground">{update.date}</span>
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-sm font-semibold text-foreground">{update.title}</h2>
                    <p className="text-sm leading-6 text-muted-foreground">{update.body}</p>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </AppSection>

      <AppSection
        title="What this becomes next"
        description="The structure is ready for real admin-authored announcements once we add persistence."
        tone="accent"
      >
        <div className="grid gap-3">
          <div className="app-list-row">
            <div className="flex items-center gap-3">
              <span className="app-list-icon">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">Pinned cohort welcome</p>
                <p className="text-xs leading-5 text-muted-foreground">
                  Perfect for first introductions, etiquette, and your opening plan.
                </p>
              </div>
            </div>
          </div>
          <div className="app-list-row">
            <div className="flex items-center gap-3">
              <span className="app-list-icon">
                <CalendarClock className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">Event change signals</p>
                <p className="text-xs leading-5 text-muted-foreground">
                  Small but high-value notices: timing changes, venue confirmations, and reminders.
                </p>
              </div>
            </div>
          </div>
        </div>
      </AppSection>
    </MemberAppShell>
  );
}
