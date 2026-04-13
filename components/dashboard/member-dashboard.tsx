import Link from "next/link";
import { CalendarDays, Clock3, Compass, MapPin, Users } from "lucide-react";

import type { MemberDashboardData } from "@/lib/dashboard/get-member-dashboard-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarGroup } from "@/components/ui/avatar";

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

  return (
    <div className="space-y-6">
      <Card className="border-border/70 bg-card/90 shadow-soft">
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-muted-gold/40 bg-muted-gold/10">
              Member Dashboard
            </Badge>
            <Badge variant={data.onboardingCompleted ? "default" : "outline"}>
              {data.onboardingCompleted ? "Onboarding complete" : "Onboarding in progress"}
            </Badge>
          </div>
          <CardTitle className="text-3xl leading-tight sm:text-4xl">Welcome back, {data.firstName}.</CardTitle>
          <CardDescription className="max-w-3xl text-sm leading-7">
            Your living snapshot of cohort rhythm, upcoming experiences, and concierge support.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Card className="border-border/70 bg-card/90 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Users className="h-4 w-4 text-muted-gold" />
              Cohort
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasCohort ? (
              <>
                <div className="space-y-1">
                  <p className="font-heading text-2xl text-foreground">{data.cohort?.name}</p>
                  <p className="text-sm text-muted-foreground">{data.cohort?.description}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{data.cohort?.seasonName}</Badge>
                  <Badge variant="outline">{data.cohort?.seasonProgressLabel}</Badge>
                </div>

                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Member preview</p>
                  {data.cohort && data.cohort.memberPreview.length > 0 ? (
                    <div className="space-y-3">
                      <AvatarGroup>
                        {data.cohort.memberPreview.slice(0, 5).map((member) => (
                          <Avatar key={member.id}>
                            <AvatarFallback>
                              {initials(member.firstName, member.lastName)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </AvatarGroup>
                      <p className="text-sm text-muted-foreground">
                        {data.cohort.activeMemberCount} active members this season.
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Member preview will appear once cohort assignments finalize.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-3 rounded-xl border border-dashed border-border/70 bg-oat/50 p-4">
                <p className="font-medium text-foreground">No cohort assigned yet</p>
                <p className="text-sm text-muted-foreground">
                  Once your onboarding profile is complete, we will match you into a cohort with aligned energy and
                  social goals.
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link href="/onboarding">Complete onboarding</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/90 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Compass className="h-4 w-4 text-muted-gold" />
              Concierge note
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="font-medium text-foreground">{data.concierge.title}</p>
            <p className="text-sm leading-7 text-muted-foreground">{data.concierge.note}</p>
            <Button asChild variant="outline" size="sm">
              <Link href="/drop">Open The Drop</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Card className="border-border/70 bg-card/90 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <CalendarDays className="h-4 w-4 text-muted-gold" />
              Next upcoming event
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasNextEvent && data.nextEvent ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="font-heading text-2xl text-foreground">{data.nextEvent.title}</p>
                  <p className="text-sm leading-7 text-muted-foreground">{data.nextEvent.description}</p>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <p className="inline-flex items-center gap-2">
                    <Clock3 className="h-4 w-4" />
                    {formatDateTime(data.nextEvent.startsAt)}
                  </p>
                  <p className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {data.nextEvent.venueName} · {data.nextEvent.venueAddressLine1}, {data.nextEvent.venueCity},{" "}
                    {data.nextEvent.venueState}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="outline">{rsvpLabel(data.nextEvent.rsvpStatus)}</Badge>
                  <Button asChild size="sm">
                    <Link href="/events">
                      {data.nextEvent.rsvpStatus ? "Update RSVP" : "RSVP now"}
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 rounded-xl border border-dashed border-border/70 bg-oat/50 p-4">
                <p className="font-medium text-foreground">No upcoming event yet</p>
                <p className="text-sm text-muted-foreground">
                  New events unlock as cohorts settle. Check back soon for your next shared plan.
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link href="/events">Browse events</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/90 shadow-soft">
          <CardHeader>
            <CardTitle className="text-xl">The Drop</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm leading-7 text-muted-foreground">
              Looking for a spontaneous plan, an activity partner, or a social reset this week? Post or respond in The
              Drop.
            </p>
            <Button asChild size="sm">
              <Link href="/drop">Go to The Drop</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70 bg-card/90 shadow-soft">
        <CardHeader>
          <CardTitle className="text-xl">Past events</CardTitle>
          <CardDescription>Recent gatherings from your season rhythm.</CardDescription>
        </CardHeader>
        <CardContent>
          {data.pastEvents.length > 0 ? (
            <div className="space-y-3">
              {data.pastEvents.map((event) => (
                <div
                  key={event.id}
                  className="rounded-xl border border-border/60 bg-background/50 p-4"
                >
                  <p className="font-medium text-foreground">{event.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{formatDateTime(event.startsAt)}</p>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">{event.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border/70 bg-oat/50 p-4">
              <p className="font-medium text-foreground">No past events yet</p>
              <p className="text-sm text-muted-foreground">
                Your event history will appear here after your first gatherings.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
