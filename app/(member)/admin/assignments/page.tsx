import Link from "next/link";

import { AdminAssignmentsClient } from "@/components/admin/admin-assignments-client";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getAssignmentData } from "@/lib/admin/get-assignment-data";

export default async function AdminAssignmentsPage() {
  await requireAdmin();

  try {
    const data = await getAssignmentData();

    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <section className="mb-6 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-muted-gold/40 bg-muted-gold/10">
                Admin
              </Badge>
              <Badge variant="outline">Cohort assignments</Badge>
            </div>
            <h1 className="font-heading text-4xl leading-tight text-foreground sm:text-5xl">
              Cohort assignment engine
            </h1>
            <p className="max-w-3xl text-base leading-7 text-muted-foreground">
              Optional helper: generate roster proposals from eligible members. For day-to-day
              operations, use{" "}
              <Link className="font-medium text-foreground underline underline-offset-4" href="/admin/cohorts">
                manual cohort management
              </Link>
              .
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href="/admin">Dashboard</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/admin/applications">Applications</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/admin/seasons">Seasons</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/admin/analytics">Analytics</Link>
              </Button>
            </div>
          </section>

          <AdminAssignmentsClient initialData={data} />
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
              <CardTitle>Assignments temporarily unavailable</CardTitle>
              <CardDescription>
                We hit an issue loading the assignment engine. Please refresh in a moment.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/assignments">Retry</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <SiteFooter />
      </div>
    );
  }
}
