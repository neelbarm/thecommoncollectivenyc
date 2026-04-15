import Link from "next/link";

import { MemberCohortPage } from "@/components/member/member-cohort-page";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { Badge } from "@/components/ui/badge";
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
        <div className="min-h-screen bg-background">
          <SiteHeader />
          <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
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
          </main>
          <SiteFooter />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <section className="mb-6 space-y-3">
            <Badge variant="outline" className="border-muted-gold/40 bg-muted-gold/10">
              Cohort
            </Badge>
            <h1 className="font-heading text-4xl leading-tight text-foreground sm:text-5xl">
              Hi, {data.firstName}.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">
              Your small-group home base for the season: who is in your cohort and what is coming
              up next.
            </p>
          </section>
          <MemberCohortPage data={data} />
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
        </main>
        <SiteFooter />
      </div>
    );
  }
}
