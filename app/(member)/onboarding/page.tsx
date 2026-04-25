import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { MemberAppShell } from "@/components/layout/member-app-shell";

export default function OnboardingPage() {
  return (
    <MemberAppShell
      eyebrow="Member setup"
      title="Let’s shape your social rhythm."
      subtitle="This questionnaire tunes your cohort chemistry, neighborhood fit, and weekly cadence so the experience feels intentionally matched."
      actions={[
        { href: "/dashboard", label: "Back to Home" },
        { href: "/events", label: "See calendar" },
      ]}
    >
      <OnboardingForm />
    </MemberAppShell>
  );
}
