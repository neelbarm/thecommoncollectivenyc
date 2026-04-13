import Link from "next/link";

import { auth } from "@/auth";
import { EventsPageClient } from "@/components/events/events-page-client";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getMemberEventsData } from "@/lib/events/get-member-events-data";

export default async function EventsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  try {
    const eventsData = await getMemberEventsData(session.user.id);

    if (!eventsData) {
      return (
        <div className="min-h-screen bg-background">
          <SiteHeader />
          <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
            <Card className="border-border/70 bg-card/90 shadow-soft">
              <CardHeader>
                <CardTitle>Member profile unavailable</CardTitle>
                <CardDescription>We couldn&apos;t load your member profile for events yet.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" size="sm">
                  <Link href="/dashboard">Back to dashboard</Link>
                </Button>
              </CardContent>
            </Card>
          </main>
          <SiteFooter />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <section className="mb-6 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-muted-gold/40 bg-muted-gold/10">
                Events
              </Badge>
              {eventsData.hasCohort && eventsData.cohortName ? (
                <Badge variant="outline">Prioritizing {eventsData.cohortName}</Badge>
              ) : null}
            </div>
            <h1 className="font-heading text-4xl leading-tight text-foreground sm:text-5xl">
              Upcoming experiences for {eventsData.firstName}
            </h1>
            <p className="max-w-3xl text-base leading-7 text-muted-foreground">
              Discover what&apos;s next, update your RSVP in seconds, and plan your season rhythm with confidence.
            </p>
          </section>

          <EventsPageClient initialData={eventsData} />
        </main>
        <SiteFooter />
      </div>
    );
  } catch {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <Card className="border-border/70 bg-card/90 shadow-soft">
            <CardHeader>
              <CardTitle>Events are temporarily unavailable</CardTitle>
              <CardDescription>
                We&apos;re having trouble loading your event feed right now.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Please refresh in a moment. Your RSVP history remains saved.
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard">Back to dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <SiteFooter />
      </div>
    );
  }
}
