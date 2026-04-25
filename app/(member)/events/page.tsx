import { auth } from "@/auth";
import { EventsPageClient } from "@/components/events/events-page-client";
import { MemberAppShell } from "@/components/layout/member-app-shell";
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
        <MemberAppShell
          eyebrow="Events"
          title="We couldn't load your calendar."
          subtitle="Your profile is signed in, but your event feed is temporarily unavailable."
        >
            <Card className="border-border/70 bg-card/90 shadow-soft">
              <CardHeader>
                <CardTitle>Member profile unavailable</CardTitle>
                <CardDescription>We couldn&apos;t load your member profile for events yet.</CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
        </MemberAppShell>
      );
    }

    return (
      <MemberAppShell
        eyebrow="Calendar"
        title={`Upcoming experiences for ${eventsData.firstName}.`}
        subtitle="Discover what is next, update your RSVP in seconds, and plan your season rhythm with confidence."
        actions={
          eventsData.hasCohort && eventsData.cohortName
            ? [{ href: "/cohort", label: eventsData.cohortName }]
            : [{ href: "/dashboard", label: "Back to home" }]
        }
      >
          <EventsPageClient initialData={eventsData} />
      </MemberAppShell>
    );
  } catch {
    return (
      <MemberAppShell
        eyebrow="Calendar"
        title="Events are temporarily unavailable."
        subtitle="Refresh in a moment. Your RSVP history remains saved."
      >
          <Card className="border-border/70 bg-card/90 shadow-soft">
            <CardHeader>
              <CardTitle>Events are temporarily unavailable</CardTitle>
              <CardDescription>
                We&apos;re having trouble loading your event feed right now.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3" />
          </Card>
      </MemberAppShell>
    );
  }
}
