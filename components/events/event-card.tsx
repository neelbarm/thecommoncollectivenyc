"use client";

import { CalendarDays, Clock3, MapPin, Users } from "lucide-react";

import type { MemberEvent } from "@/lib/events/get-member-events-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function formatDate(dateIso: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(dateIso));
}

function formatTime(dateIso: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateIso));
}

function rsvpDisplay(status: MemberEvent["rsvpStatus"]) {
  if (!status) return "No RSVP";

  const map: Record<string, string> = {
    GOING: "Joined",
    MAYBE: "Maybe",
    DECLINED: "Not going",
    WAITLISTED: "Waitlisted",
  };

  return map[status] ?? "No RSVP";
}

function ctaLabel(status: MemberEvent["rsvpStatus"]) {
  if (!status) return "RSVP";
  if (status === "GOING") return "Joined";
  return "Update RSVP";
}

export function EventCard({
  event,
  isPriority,
  isUpdating,
  onOpenDetail,
}: {
  event: MemberEvent;
  isPriority: boolean;
  isUpdating: boolean;
  onOpenDetail: () => void;
}) {
  return (
    <Card className="surface-panel">
      <CardHeader className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {isPriority ? <Badge variant="default">Cohort priority</Badge> : null}
          {event.cohortTag ? <Badge variant="outline">{event.cohortTag}</Badge> : <Badge variant="outline">Open event</Badge>}
          <Badge variant="outline">Budget: {event.budgetTier}</Badge>
          <Badge variant={event.rsvpStatus === "GOING" ? "default" : "outline"}>{rsvpDisplay(event.rsvpStatus)}</Badge>
        </div>
        <CardTitle className="text-2xl">{event.title}</CardTitle>
        <CardDescription className="prose-calm">{event.description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm text-muted-foreground">
          <p className="inline-flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            {formatDate(event.startsAt)}
          </p>
          <p className="inline-flex items-center gap-2">
            <Clock3 className="h-4 w-4" />
            {formatTime(event.startsAt)} - {formatTime(event.endsAt)}
          </p>
          <p className="inline-flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {event.venueName} · {event.venueNeighborhood}
          </p>
          <p className="inline-flex items-center gap-2">
            <Users className="h-4 w-4" />
            {event.goingCount}/{event.capacity} going · {event.isFull ? "Full" : `${event.spotsLeft} spots left`}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={onOpenDetail} disabled={isUpdating}>
            {ctaLabel(event.rsvpStatus)}
          </Button>
          {event.isFull && event.rsvpStatus !== "GOING" ? (
            <Badge variant="destructive">Full / Join waitlist</Badge>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
