"use client";

import { CalendarDays, Clock3, MapPin, Users, X } from "lucide-react";

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

function formatDateTime(dateIso: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateIso));
}

export function EventDetailPanel({
  event,
  open,
  onClose,
  onRsvp,
  pending,
}: {
  event: MemberEvent | null;
  open: boolean;
  onClose: () => void;
  onRsvp: (status: "GOING" | "MAYBE" | "DECLINED") => void;
  pending: boolean;
}) {
  if (!open || !event) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Event details for ${event.title}`}
      className="fixed inset-0 z-50 flex items-end bg-black/35 backdrop-blur-sm lg:items-center lg:justify-center"
    >
      <button
        aria-label="Close event details"
        className="absolute inset-0"
        onClick={onClose}
        type="button"
      />

      <Card className="relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-t-2xl border-border/70 bg-card/95 shadow-soft lg:max-w-2xl lg:rounded-2xl">
        <CardHeader className="space-y-3 border-b border-border/60 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-2xl">{event.title}</CardTitle>
              <CardDescription>{formatDateTime(event.startsAt)}</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close event details">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {event.cohortTag ? <Badge variant="outline">{event.cohortTag}</Badge> : <Badge variant="outline">Open event</Badge>}
            <Badge variant="outline">Budget: {event.budgetTier}</Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 pt-4">
          <p className="text-sm leading-7 text-muted-foreground">{event.description}</p>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              {formatDateTime(event.startsAt)}
            </p>
            <p className="inline-flex items-center gap-2">
              <Clock3 className="h-4 w-4" />
              Ends {formatDateTime(event.endsAt)}
            </p>
            <p className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {event.venueName} · {event.venueNeighborhood}
            </p>
            <p className="inline-flex items-center gap-2">
              <Users className="h-4 w-4" />
              {event.goingCount}/{event.capacity} going · {event.isFull ? "Full / Join waitlist" : `${event.spotsLeft} spots left`}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              disabled={pending}
              onClick={() => onRsvp("GOING")}
              aria-label={`RSVP going for ${event.title}`}
            >
              Yes, I&apos;m in
            </Button>
            <Button
              disabled={pending}
              variant="outline"
              onClick={() => onRsvp("MAYBE")}
              aria-label={`RSVP maybe for ${event.title}`}
            >
              Maybe
            </Button>
            <Button
              disabled={pending}
              variant="outline"
              onClick={() => onRsvp("DECLINED")}
              aria-label={`Decline RSVP for ${event.title}`}
            >
              Not this time
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
