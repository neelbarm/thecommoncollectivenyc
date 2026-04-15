import Link from "next/link";

import { auth } from "@/auth";
import { MemberDashboard } from "@/components/dashboard/member-dashboard";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getMemberDashboardData } from "@/lib/dashboard/get-member-dashboard-data";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  try {
    const data = await getMemberDashboardData(session.user.id);

    if (!data) {
      return (
        <div className="flex min-h-screen flex-col bg-background">
          <SiteHeader />
          <main className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
            <Card className="border-dashed border-muted-gold/40 bg-muted-gold/5 shadow-soft">
              <CardHeader>
                <CardTitle>We could not load your account</CardTitle>
                <CardDescription className="text-sm leading-7">
                  Something interrupted the connection to your member record. This is usually temporary.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  If this keeps happening, sign out and back in, or continue onboarding to refresh your profile.
                </p>
                <Button asChild size="sm">
                  <Link href="/onboarding">Continue to onboarding</Link>
                </Button>
              </CardContent>
            </Card>
          </main>
          <SiteFooter />
        </div>
      );
    }

    return (
      <div className="flex min-h-screen flex-col bg-background">
        <SiteHeader />
        <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
          <MemberDashboard data={data} />
        </main>
        <SiteFooter />
      </div>
    );
  } catch {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <SiteHeader />
        <main className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
          <Card className="border-border/70 bg-card/90 shadow-soft">
            <CardHeader>
              <CardTitle>Having trouble loading the dashboard</CardTitle>
              <CardDescription>
                Please try again in a moment — your sign-in and saved answers are still there.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                If the problem continues, refresh the page or open onboarding to confirm your profile is complete.
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard">Try again</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <SiteFooter />
      </div>
    );
  }
}
