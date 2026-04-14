"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

import { EventCard } from "@/components/events/event-card";
import { EventDetailPanel } from "@/components/events/event-detail-panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { MemberEvent, MemberEventsData } from "@/lib/events/get-member-events-data";

export function EventsPageClient({ initialData }: { initialData: MemberEventsData }) {
  const [events, setEvents] = useState<MemberEvent[]>(initialData.events);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const activeEvent = useMemo(
    () => events.find((event) => event.id === activeEventId) ?? null,
    [activeEventId, events],
  );

  function applyEventUpdate(eventId: string, next: Partial<MemberEvent>) {
    setEvents((previous) =>
      previous.map((event) => (event.id === eventId ? { ...event, ...next } : event)),
    );
  }

  function updateRsvp(eventId: string, status: "GOING" | "MAYBE" | "DECLINED") {
    setError(null);

    const currentEvent = events.find((event) => event.id === eventId);
    if (!currentEvent) {
      return;
    }

    const optimisticStatus = currentEvent.isFull && status === "GOING" ? "WAITLISTED" : status;
    const previousEvent = { ...currentEvent };

    applyEventUpdate(eventId, { rsvpStatus: optimisticStatus });

    startTransition(async () => {
      try {
        const response = await fetch("/api/events/rsvp", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ eventId, status }),
        });

        if (!response.ok) {
          const body = (await response.json()) as { error?: string };
          throw new Error(body.error ?? "Unable to update RSVP.");
        }

        const body = (await response.json()) as {
          rsvpStatus: MemberEvent["rsvpStatus"];
          goingCount: number;
          spotsLeft: number;
          isFull: boolean;
        };

        applyEventUpdate(eventId, {
          rsvpStatus: body.rsvpStatus,
          goingCount: body.goingCount,
          spotsLeft: body.spotsLeft,
          isFull: body.isFull,
        });
      } catch (fetchError) {
        applyEventUpdate(eventId, previousEvent);
        setError(fetchError instanceof Error ? fetchError.message : "Unable to update RSVP.");
      }
    });
  }

  function clearError() {
    setError(null);
  }

  if (events.length === 0) {
    if (!initialData.hasAnyPublishedEvents) {
      return (
        <Card className="border-border/70 bg-card/90 shadow-soft">
          <CardHeader>
            <CardTitle>No events yet</CardTitle>
            <CardDescription>
              New gathering drops are on the way. As each season unfolds, events will appear here first.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              We are curating intimate dinners, movement sessions, and social rituals tailored to member energy.
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="border-border/70 bg-card/90 shadow-soft">
        <CardHeader>
          <CardTitle>No upcoming events for you yet</CardTitle>
          <CardDescription>
            You&apos;ll unlock more relevant events once your cohort is matched and season planning is finalized.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link className="text-sm text-foreground underline underline-offset-4" href="/dashboard">
            Return to dashboard
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {!initialData.hasCohort ? (
        <Card className="border-border/70 bg-oat/70 shadow-soft">
          <CardContent className="pt-4">
            <p className="text-sm leading-7 text-muted-foreground">
              You&apos;re seeing open community events first. Once you&apos;re matched into a cohort, this page will prioritize
              gatherings tailored to your group rhythm.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {isPending ? <p className="text-xs text-muted-foreground">Updating RSVP...</p> : null}

      <div className="space-y-4">
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            isPriority={Boolean(initialData.cohortName && event.cohortTag === initialData.cohortName)}
            isUpdating={isPending}
            onOpenDetail={() => setActiveEventId(event.id)}
          />
        ))}
      </div>

      <EventDetailPanel
        event={activeEvent}
        open={Boolean(activeEvent)}
        onClose={() => {
          setActiveEventId(null);
          clearError();
        }}
        onRsvp={(status) => {
          if (!activeEvent) return;
          updateRsvp(activeEvent.id, status);
        }}
        pending={isPending}
      />
    </div>
  );
}
