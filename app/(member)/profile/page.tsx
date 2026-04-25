import { MapPin, Settings2, Sparkles, Zap } from "lucide-react";

import { auth } from "@/auth";
import { AppQuickLink, AppSection, AppStat, MemberAppShell } from "@/components/layout/member-app-shell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getMemberDashboardData } from "@/lib/dashboard/get-member-dashboard-data";

function initials(firstName: string, memberName: string) {
  const pieces = memberName.split(" ").filter(Boolean);
  const lastInitial = pieces[1]?.[0] ?? "";
  return `${firstName[0] ?? ""}${lastInitial}`.toUpperCase();
}

function formatList(values: string[]) {
  return values.length ? values : ["Curated connections"];
}

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  const data = await getMemberDashboardData(session.user.id);
  if (!data) {
    return null;
  }

  const interestList = data.profile?.interests?.slice(0, 5) ?? [];
  const vibeList = data.profile?.preferredVibe?.slice(0, 4) ?? [];

  return (
    <MemberAppShell
      eyebrow="Member profile"
      title={`Profile, ${data.firstName}.`}
      subtitle="Your club identity, membership tone, and the signals we use to shape your cohort experience."
      actions={[{ href: "/onboarding", label: "Edit preferences" }]}
    >
      <AppSection title="Membership card" description="A premium snapshot of how your social profile reads across the club." tone="accent">
        <div className="app-profile-card">
          <div className="flex items-start justify-between gap-4">
            <Avatar size="lg" className="h-18 w-18 ring-primary/15">
              <AvatarFallback className="bg-primary/18 text-2xl text-primary">
                {initials(data.firstName, data.memberName)}
              </AvatarFallback>
            </Avatar>
            <Badge className="border border-primary/30 bg-primary/12 px-3 py-1 text-[0.68rem] uppercase tracking-[0.24em] text-primary shadow-none">
              {data.onboardingCompleted ? "Founding member" : "Onboarding active"}
            </Badge>
          </div>

          <div className="mt-6 space-y-2">
            <h2 className="text-[2rem] font-semibold tracking-[-0.035em] text-foreground">{data.firstName}</h2>
            <p className="text-sm text-muted-foreground">{session.user.email}</p>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {data.profile?.neighborhood ? (
              <Badge variant="outline" className="app-tag">
                <MapPin className="mr-1.5 h-3.5 w-3.5" />
                {data.profile.neighborhood}
              </Badge>
            ) : null}
            {data.profile?.idealGroupEnergy ? (
              <Badge variant="outline" className="app-tag">
                <Zap className="mr-1.5 h-3.5 w-3.5" />
                {data.profile.idealGroupEnergy}
              </Badge>
            ) : null}
            {data.profile?.budgetComfort ? (
              <Badge variant="outline" className="app-tag">
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                {data.profile.budgetComfort}
              </Badge>
            ) : null}
          </div>
        </div>
      </AppSection>

      <div className="grid grid-cols-2 gap-3">
        <AppStat
          label="Cohort status"
          value={data.cohort ? "Assigned" : "Pending"}
          detail={data.cohort ? data.cohort.name : "Matching in progress"}
        />
        <AppStat
          label="Onboarding"
          value={data.onboardingCompleted ? "Ready" : "Open"}
          detail={data.onboardingCompleted ? "Profile complete" : "Needs a final pass"}
        />
      </div>

      <AppSection title="Preferences" description="These cues shape placements, event recommendations, and concierge rhythm.">
        <div className="overflow-hidden rounded-[1.4rem] border border-border/60 bg-background/32">
          {[
            ["Age range", data.profile?.ageRange ?? "To be added"],
            ["Budget", data.profile?.budgetComfort ?? "Flexible"],
            ["Social energy", data.profile?.idealGroupEnergy ?? "Curated"],
            ["Nights free", data.profile?.preferredNights ?? "Varies"],
          ].map(([label, value], index) => (
            <div
              key={label}
              className={`flex items-center justify-between gap-4 px-4 py-4 ${index < 3 ? "border-b border-border/45" : ""}`}
            >
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="text-sm font-medium text-foreground">{value}</p>
            </div>
          ))}
        </div>
      </AppSection>

      <AppSection title="Neighbourhood" description="The area we should prioritize when shaping your weekly social rhythm.">
        <div className="flex flex-wrap gap-2">
          {data.profile?.neighborhood ? (
            <Badge variant="outline" className="app-tag">
              {data.profile.neighborhood}
            </Badge>
          ) : (
            <Badge variant="outline" className="app-tag">
              To be added
            </Badge>
          )}
        </div>
      </AppSection>

      <AppSection title="Interests" description="A quick read on what your best nights in the city feel like.">
        <div className="flex flex-wrap gap-2">
          {formatList(interestList).map((interest) => (
            <Badge key={interest} className="app-tag app-tag-highlight">
              {interest}
            </Badge>
          ))}
        </div>
      </AppSection>

      <AppSection title="Preferred vibe" description="The kind of room, chemistry, and energy that usually clicks for you.">
        <div className="flex flex-wrap gap-2">
          {formatList(vibeList).map((item) => (
            <Badge key={item} variant="outline" className="app-tag">
              {item}
            </Badge>
          ))}
        </div>
      </AppSection>

      <AppSection title="Account" description="A lightweight app layer today; richer account controls can land next.">
        <div className="space-y-3">
          <AppQuickLink
            href="/onboarding"
            label="Refine questionnaire"
            detail="Update your availability, energy, and matching preferences."
            icon="spark"
          />
          <AppQuickLink
            href="/dashboard"
            label="Return home"
            detail="Back to your cohort, calendar, and club rhythm."
            icon="calendar"
          />
          <div className="app-list-row opacity-85">
            <div className="flex items-center gap-3">
              <span className="app-list-icon">
                <Settings2 className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">App settings</p>
                <p className="text-xs leading-5 text-muted-foreground">Notification and chat controls can slot in here next.</p>
              </div>
            </div>
          </div>
        </div>
      </AppSection>
    </MemberAppShell>
  );
}
