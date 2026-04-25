import { auth } from "@/auth";
import { MemberDashboard } from "@/components/dashboard/member-dashboard";
import { AppSection, MemberAppShell } from "@/components/layout/member-app-shell";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
        <MemberAppShell
          eyebrow="Member home"
          title="We couldn’t load your membership."
          subtitle="Something interrupted the connection to your member profile. Try again or continue onboarding to refresh your record."
          actions={[{ href: "/onboarding", label: "Continue onboarding" }]}
        >
          <AppSection title="Temporarily unavailable">
            <CardHeader className="px-0">
              <CardTitle>Member record unavailable</CardTitle>
              <CardDescription>
                If this keeps happening, sign out and back in, or continue onboarding to refresh your profile.
              </CardDescription>
            </CardHeader>
          </AppSection>
        </MemberAppShell>
      );
    }

    return (
      <MemberAppShell
        eyebrow="Common Collective"
        title={`Welcome back, ${data.firstName}.`}
        subtitle="Your cohort pulse, upcoming plans, and private-club rhythm in one premium member app."
        actions={[
          { href: "/cohort/chat", label: "Open cohort chat" },
          { href: "/announcements", label: "View announcements" },
        ]}
      >
        <MemberDashboard data={data} />
      </MemberAppShell>
    );
  } catch {
    return (
      <MemberAppShell
        eyebrow="Member home"
        title="Dashboard unavailable."
        subtitle="Please try again in a moment. Your sign-in and saved answers are still there."
        actions={[{ href: "/dashboard", label: "Try again" }]}
      >
        <AppSection title="Temporary issue">
          <CardHeader className="px-0">
            <CardTitle>Having trouble loading the dashboard</CardTitle>
            <CardDescription>
              If the problem continues, refresh the page or open onboarding to confirm your profile is complete.
            </CardDescription>
          </CardHeader>
        </AppSection>
      </MemberAppShell>
    );
  }
}
