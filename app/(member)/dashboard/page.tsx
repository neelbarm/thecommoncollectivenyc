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
        <div className="min-h-screen bg-background">
          <SiteHeader />
          <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
            <Card className="border-border/70 bg-card/90 shadow-soft">
              <CardHeader>
                <CardTitle>Member not found</CardTitle>
                <CardDescription>
                  We could not locate your member profile yet.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" size="sm">
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
        <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <MemberDashboard data={data} />
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
              <CardTitle>Dashboard is temporarily unavailable</CardTitle>
              <CardDescription>
                We are having trouble loading your member snapshot right now.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Please refresh in a moment. Your account and onboarding progress are safe.
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href="/onboarding">Return to onboarding</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <SiteFooter />
      </div>
    );
  }
}
