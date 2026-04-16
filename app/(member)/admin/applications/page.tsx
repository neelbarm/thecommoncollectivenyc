import Link from "next/link";

import { AdminApplicationsReviewClient } from "@/components/admin/admin-applications-review-client";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getApplicationReviewData } from "@/lib/admin/get-application-review-data";

export default async function AdminApplicationsPage() {
  const session = await requireAdmin();
  if (!session?.user?.id) {
    return null;
  }

  try {
    const data = await getApplicationReviewData();

    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <section className="mb-6 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-muted-gold/40 bg-muted-gold/10">
                Admin
              </Badge>
              <Badge variant="outline">Applications</Badge>
            </div>
            <h1 className="font-heading text-4xl leading-tight text-foreground sm:text-5xl">
              Application review
            </h1>
            <p className="max-w-3xl text-base leading-7 text-muted-foreground">
              Review each applicant’s full profile, onboarding preferences, and questionnaire responses before placing
              them into cohorts.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href="/admin">Dashboard</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/admin/cohorts">Cohorts</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/admin/assignments">Assignment proposals</Link>
              </Button>
            </div>
          </section>

          <AdminApplicationsReviewClient initialData={data} />
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
              <CardTitle>Application review is temporarily unavailable</CardTitle>
              <CardDescription>
                We hit an issue loading application review details. Please refresh in a moment.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/applications">Retry</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <SiteFooter />
      </div>
    );
  }
}
