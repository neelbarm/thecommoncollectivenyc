import Link from "next/link";

import { AdminSeasonsClient } from "@/components/admin/admin-seasons-client";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getSeasonManagementData } from "@/lib/admin/get-season-management-data";

export default async function AdminSeasonsPage() {
  const session = await requireAdmin();
  if (!session?.user?.id) {
    return null;
  }

  try {
    const data = await getSeasonManagementData();
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <section className="mb-6 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-muted-gold/40 bg-muted-gold/10">
                Admin
              </Badge>
              <Badge variant="outline">Seasons</Badge>
            </div>
            <h1 className="font-heading text-4xl leading-tight text-foreground sm:text-5xl">
              Program seasons
            </h1>
            <p className="max-w-3xl text-base leading-7 text-muted-foreground">
              Define the club year windows used by cohorts and events. Edit dates carefully — shrinking
              a window is blocked if events would fall outside it.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href="/admin">Dashboard</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/admin/cohorts">Cohorts</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/admin/events">Events</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/admin/venues">Venues</Link>
              </Button>
            </div>
          </section>
          <AdminSeasonsClient initialData={data} />
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
              <CardTitle>Seasons temporarily unavailable</CardTitle>
              <CardDescription>Please refresh in a moment.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/seasons">Retry</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <SiteFooter />
      </div>
    );
  }
}
