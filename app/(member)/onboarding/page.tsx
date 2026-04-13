import { Sparkles } from "lucide-react";

import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 space-y-4">
          <p className="inline-flex items-center gap-2 rounded-full border border-muted-gold/40 bg-muted-gold/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            Onboarding
          </p>
          <h1 className="font-heading text-4xl leading-tight text-foreground sm:text-5xl">
            Let&apos;s shape your NYC social rhythm.
          </h1>
          <p className="max-w-3xl text-base leading-7 text-muted-foreground">
            This questionnaire helps us tune your cohort chemistry and recurring experiences. Share what feels true to
            your week, your energy, and your social intentions.
          </p>
        </div>

        <OnboardingForm />
      </main>
      <SiteFooter />
    </div>
  );
}
