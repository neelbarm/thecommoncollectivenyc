import Link from "next/link";

import { MemberAppShell } from "@/components/layout/member-app-shell";
import { MemberCohortPage } from "@/components/member/member-cohort-page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/auth";
import { getMemberCohortData } from "@/lib/member/get-member-cohort-data";

export default async function CohortPage() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  try {
    const data = await getMemberCohortData(session.user.id);
    if (!data) {
      return (
        <MemberAppShell
          eyebrow="Cohort"
          title="Cohort unavailable right now."
          subtitle="We could not reach your group details just yet."
          actions={[
            { href: "/dashboard", label: "Dashboard" },
            { href: "/onboarding", label: "Onboarding" },
          ]}
        >
            <Card className="border-dashed border-muted-gold/40 bg-muted-gold/5 shadow-soft">
              <CardHeader>
                <CardTitle>We could not load this page</CardTitle>
                <CardDescription className="text-sm leading-7">
                  Your sign-in is fine — something interrupted the cohort data. Try again, or open onboarding if you
                  recently joined.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href="/cohort">Try again</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/onboarding">Go to onboarding</Link>
                </Button>
              </CardContent>
            </Card>
        </MemberAppShell>
      );
    }

    return (
      <MemberAppShell
        eyebrow="Your cohort"
        title={`Hi, ${data.firstName}.`}
        subtitle="Your small-group home base for the season: who is in your cohort, what is coming up next, and how to coordinate."
        actions={[
          { href: "/cohort/chat", label: "Open cohort chat" },
          { href: "/events", label: "View gatherings" },
        ]}
      >
          <MemberCohortPage data={data} />
      </MemberAppShell>
    );
  } catch {
    return (
      <MemberAppShell
        eyebrow="Cohort"
        title="Having trouble loading your cohort."
        subtitle="Please wait a moment and try again."
        actions={[{ href: "/dashboard", label: "Dashboard" }]}
      >
          <Card className="border-border/70 bg-card/90 shadow-soft">
            <CardHeader>
              <CardTitle>Having trouble loading your cohort</CardTitle>
              <CardDescription>Please wait a moment and try again.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/cohort">Try again</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
      </MemberAppShell>
    );
  }
}
