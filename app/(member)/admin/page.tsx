import { AdminOpsDashboardClient } from "@/components/admin/admin-ops-dashboard-client";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getAdminOpsData } from "@/lib/admin/get-admin-ops-data";

export default async function AdminPage() {
  const session = await requireAdmin();

  if (!session?.user?.id) {
    return null;
  }

  try {
    const data = await getAdminOpsData();

    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <section className="mb-6 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-muted-gold/40 bg-muted-gold/10">
                Admin ops
              </Badge>
              <Badge variant="outline">Secure view</Badge>
            </div>
            <h1 className="font-heading text-4xl leading-tight text-foreground sm:text-5xl">
              Operational dashboard
            </h1>
            <p className="max-w-3xl text-base leading-7 text-muted-foreground">
              Track members, applications, cohorts, seasons, event logistics, RSVP movement, and concierge activity
              from a single calm control surface.
            </p>
            <div className="surface-subtle flex flex-wrap gap-2 p-3">
              <a className="text-sm font-medium text-foreground underline underline-offset-4" href="/admin/applications">
                Open application review
              </a>
              <a className="text-sm font-medium text-foreground underline underline-offset-4" href="/admin/notifications">
                Open notification operations
              </a>
            </div>
          </section>

          <AdminOpsDashboardClient initialData={data} />
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
              <CardTitle>Admin operations are temporarily unavailable</CardTitle>
              <CardDescription>
                We hit an issue loading your operational snapshot. Please refresh in a moment.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Existing member and event data remain safe. This is likely a temporary fetch problem.
              </p>
              <p className="text-sm">
                <a className="font-medium text-foreground underline underline-offset-4" href="/admin">
                  Retry admin dashboard
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
