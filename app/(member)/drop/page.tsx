import Link from "next/link";

import { auth } from "@/auth";
import { DropPageClient } from "@/components/drop/drop-page-client";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getMemberDropData } from "@/lib/drop/get-member-drop-data";

export default async function DropPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  try {
    const dropData = await getMemberDropData(session.user.id);

    if (!dropData) {
      return (
        <div className="min-h-screen bg-background">
          <SiteHeader />
          <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
            <Card className="border-border/70 bg-card/90 shadow-soft">
              <CardHeader>
                <CardTitle>Member profile unavailable</CardTitle>
                <CardDescription>We couldn&apos;t load your Drop feed yet.</CardDescription>
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
                The Drop
              </Badge>
              {dropData.cohortName ? <Badge variant="outline">{dropData.cohortName}</Badge> : null}
            </div>
            <h1 className="font-heading text-4xl leading-tight text-foreground sm:text-5xl">
              Spontaneous plans, member to member.
            </h1>
            <p className="max-w-3xl text-base leading-7 text-muted-foreground">
              The Drop is a concierge feature for quick social windows — a short way to signal availability and find a
              matching plan inside the club.
            </p>
          </section>

          <DropPageClient initialData={dropData} />
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
              <CardTitle>The Drop is temporarily unavailable</CardTitle>
              <CardDescription>We&apos;re having trouble loading your Drop feed right now.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Please refresh in a moment. Any existing requests remain saved.
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
