import { AdminNotificationsClient } from "@/components/admin/admin-notifications-client";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getNotificationOpsData } from "@/lib/admin/get-notification-ops-data";

export default async function AdminNotificationsPage() {
  await requireAdmin();

  try {
    const data = await getNotificationOpsData("30d");

    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <section className="mb-6 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-muted-gold/40 bg-muted-gold/10">
                Notification ops
              </Badge>
              <Badge variant="outline">Admin only</Badge>
            </div>
            <h1 className="font-heading text-4xl leading-tight text-foreground sm:text-5xl">
              Notification delivery operations
            </h1>
            <p className="max-w-3xl text-base leading-7 text-muted-foreground">
              Monitor queued, sent, failed, skipped, and duplicate-prevented notification attempts across
              transactional and reminder flows.
            </p>
          </section>

          <AdminNotificationsClient initialData={data} />
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
              <CardTitle>Notification operations are temporarily unavailable</CardTitle>
              <CardDescription>
                We hit an issue loading notification delivery visibility. Please retry in a moment.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Delivery pipelines continue to run. This page failure is limited to the admin snapshot.
              </p>
              <p className="text-sm">
                <a className="font-medium text-foreground underline underline-offset-4" href="/admin/notifications">
                  Retry notifications view
                </a>
              </p>
            </CardContent>
          </Card>
        </main>
        <SiteFooter />
      </div>
    );
  }
}
