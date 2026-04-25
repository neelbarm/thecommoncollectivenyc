import { auth } from "@/auth";
import { MemberAppShell } from "@/components/layout/member-app-shell";
import { DropPageClient } from "@/components/drop/drop-page-client";
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
        <MemberAppShell
          eyebrow="Instant plans"
          title="The Drop is unavailable."
          subtitle="Your sign-in is intact, but we could not reach your spontaneous-plan activity right now."
        >
          <Card className="app-panel border-dashed border-primary/30 bg-primary/6">
            <CardHeader>
              <CardTitle>Try again in a moment</CardTitle>
              <CardDescription className="text-sm leading-7">
                This is usually temporary. Your previous requests are still saved.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Refresh the page or continue onboarding if you recently joined.</p>
            </CardContent>
          </Card>
        </MemberAppShell>
      );
    }

    return (
      <MemberAppShell
        eyebrow="Drop concierge"
        title="Spontaneous plans, member to member."
        subtitle="Signal a free window, see responses quickly, and turn availability into a social moment."
        actions={[
          { href: "/dashboard", label: "Back home" },
          { href: "/cohort/chat", label: "Open cohort chat" },
        ]}
      >
        <DropPageClient initialData={dropData} />
      </MemberAppShell>
    );
  } catch {
    return (
      <MemberAppShell
        eyebrow="Instant plans"
        title="Having trouble loading The Drop."
        subtitle="Any requests you already posted remain saved."
      >
        <Card className="app-panel">
          <CardHeader>
            <CardTitle>Please refresh shortly</CardTitle>
            <CardDescription>If the problem persists, return from the dashboard and try again.</CardDescription>
          </CardHeader>
        </Card>
      </MemberAppShell>
    );
  }
}
