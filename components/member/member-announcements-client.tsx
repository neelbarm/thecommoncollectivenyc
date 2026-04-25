"use client";

import { BellRing, CheckCheck, Pin } from "lucide-react";
import { useMemo, useState, useTransition } from "react";

import { AppQuickLink, AppSection } from "@/components/layout/member-app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MemberAnnouncementsData } from "@/lib/announcements/get-member-announcements-data";

function formatDate(dateIso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(dateIso));
}

export function MemberAnnouncementsClient({
  initialData,
}: {
  initialData: MemberAnnouncementsData;
}) {
  const [announcements, setAnnouncements] = useState(initialData.items);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const unreadCount = useMemo(
    () => announcements.filter((announcement) => !announcement.isRead).length,
    [announcements],
  );

  function markAsRead(announcementId: string) {
    setError(null);
    setStatusMessage(null);

    const target = announcements.find((announcement) => announcement.id === announcementId);
    if (!target || target.isRead) {
      return;
    }

    setAnnouncements((current) =>
      current.map((announcement) =>
        announcement.id === announcementId
          ? { ...announcement, isRead: true }
          : announcement,
      ),
    );

    startTransition(async () => {
      try {
        const response = await fetch(`/api/announcements/${announcementId}/read`, {
          method: "POST",
        });

        if (!response.ok) {
          const body = (await response.json()) as { error?: string };
          throw new Error(body.error ?? "Unable to update announcement.");
        }

        setStatusMessage("Announcement marked as read.");
      } catch (markError) {
        setAnnouncements((current) =>
          current.map((announcement) =>
            announcement.id === announcementId
              ? { ...announcement, isRead: false }
              : announcement,
          ),
        );
        setError(
          markError instanceof Error
            ? markError.message
            : "Unable to update announcement.",
        );
      }
    });
  }

  return (
    <>
      <div className="rounded-[1.6rem] border border-primary/18 bg-[linear-gradient(180deg,_oklch(0.19_0.014_42),_oklch(0.155_0.014_42))] p-4 shadow-[0_26px_64px_-40px_oklch(0.03_0.02_45_/0.95)]">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="app-eyebrow text-[0.62rem]">Inbox status</p>
            <h2 className="text-[1.15rem] font-semibold tracking-[-0.02em] text-foreground">
              {unreadCount.toString().padStart(2, "0")} unread signals
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Cohort notes, event changes, and member notices all land here in a calmer feed.
            </p>
          </div>
          <Badge className="rounded-full border border-primary/25 bg-primary/12 px-3 py-1 text-[0.65rem] uppercase tracking-[0.22em] text-primary shadow-none">
            {initialData.cohortName ? "Cohort live" : "Getting ready"}
          </Badge>
        </div>
      </div>

      {statusMessage ? (
        <p className="status-banner border-emerald-400/35 bg-emerald-500/8 text-emerald-200">
          {statusMessage}
        </p>
      ) : null}
      {error ? (
        <p className="status-banner border-destructive/30 bg-destructive/10 text-destructive">
          {error}
        </p>
      ) : null}
      {isPending ? (
        <p className="status-banner border-border/55 bg-card/55 text-xs text-muted-foreground">
          Updating your inbox…
        </p>
      ) : null}

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
            detail="Your private room for live cohort coordination"
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
        description="Persistent member announcements from the app backend."
      >
        <div className="space-y-3">
          {announcements.length > 0 ? (
            announcements.map((announcement) => (
              <article key={announcement.id} className="app-list-row items-start">
                <div className="flex w-full items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="app-list-icon mt-0.5">
                      {announcement.isPinned ? (
                        <Pin className="h-4 w-4" />
                      ) : (
                        <BellRing className="h-4 w-4" />
                      )}
                    </span>
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={announcement.isPinned ? "default" : "outline"}>
                          {announcement.audienceLabel}
                        </Badge>
                        {announcement.isPinned ? (
                          <Badge variant="outline">Pinned</Badge>
                        ) : null}
                        {!announcement.isRead ? (
                          <Badge variant="outline">Unread</Badge>
                        ) : null}
                        <span className="text-xs text-muted-foreground">
                          {formatDate(announcement.publishedAt)}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <h2 className="text-sm font-semibold text-foreground">
                          {announcement.title}
                        </h2>
                        <p className="text-sm leading-6 text-muted-foreground">
                          {announcement.body}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Posted by {announcement.authorName}
                        </p>
                      </div>
                    </div>
                  </div>
                  {!announcement.isRead ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => markAsRead(announcement.id)}
                      disabled={isPending}
                      className="shrink-0"
                    >
                      <CheckCheck className="h-4 w-4" />
                      Mark read
                    </Button>
                  ) : null}
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-[1.25rem] border border-border/50 bg-background/22 px-4 py-3">
              <p className="text-sm font-medium text-foreground">No announcements yet</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Admin-posted updates will appear here as soon as they are published.
              </p>
            </div>
          )}
        </div>
      </AppSection>

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
        </div>
      </AppSection>
    </>
  );
}
