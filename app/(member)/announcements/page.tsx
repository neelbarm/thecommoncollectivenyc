import { CalendarClock } from "lucide-react";

import { auth } from "@/auth";
import { AppQuickLink, AppSection, MemberAppShell } from "@/components/layout/member-app-shell";
import { MemberAnnouncementsClient } from "@/components/member/member-announcements-client";
import { Badge } from "@/components/ui/badge";
import { getMemberAnnouncementsData } from "@/lib/announcements/get-member-announcements-data";

export default async function AnnouncementsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const data = await getMemberAnnouncementsData(session.user.id);
  if (!data) {
    return null;
  }

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
      <div className="rounded-[1.6rem] border border-primary/18 bg-[linear-gradient(180deg,_oklch(0.19_0.014_42),_oklch(0.155_0.014_42))] p-4 shadow-[0_26px_64px_-40px_oklch(0.03_0.02_45_/0.95)]">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="app-eyebrow text-[0.62rem]">Inbox status</p>
            <h2 className="text-[1.15rem] font-semibold tracking-[-0.02em] text-foreground">
              {data.unreadCount.toString().padStart(2, "0")} unread signals
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Cohort notes, event changes, and member notices all land here in a calmer feed.
            </p>
          </div>
          <Badge className="rounded-full border border-primary/25 bg-primary/12 px-3 py-1 text-[0.65rem] uppercase tracking-[0.22em] text-primary shadow-none">
            {data.cohortName ? "Cohort live" : "Getting ready"}
          </Badge>
        </div>
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

      <MemberAnnouncementsClient initialData={data} />

      <AppSection
        title="Use this feed"
        description="The most important announcement workflows are already represented in the navigation."
        tone="accent"
      >
        <div className="grid gap-3">
          <AppQuickLink
            href="/events"
            label="Review event timing"
            detail="Open the calendar to RSVP or check any updated details."
            icon="calendar"
          />
          <AppQuickLink
            href="/cohort/chat"
            label="Continue the conversation"
            detail="Move from announcements into your cohort room when coordination is needed."
            icon="spark"
          />
          <div className="rounded-[1.25rem] border border-border/50 bg-background/22 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="app-list-icon">
                <CalendarClock className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">Quiet by design</p>
                <p className="text-xs leading-5 text-muted-foreground">
                  This feed is intentionally reserved for useful, timely signals rather than social noise.
                </p>
              </div>
            </div>
          </div>
        </div>
      </AppSection>
    </MemberAppShell>
  );
}
