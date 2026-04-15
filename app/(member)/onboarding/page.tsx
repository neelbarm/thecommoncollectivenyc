import Link from "next/link";

import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { Button } from "@/components/ui/button";

export default function OnboardingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        <div className="mb-10 space-y-5">
          <p className="eyebrow inline-flex items-center rounded-full border border-muted-gold/30 bg-transparent px-3 py-1.5 text-foreground/80">
            Onboarding
          </p>
          <h1 className="font-heading text-[2.35rem] leading-[1.08] text-foreground sm:text-5xl">
            Let&apos;s shape your NYC social rhythm.
          </h1>
          <p className="prose-calm max-w-3xl">
            This questionnaire helps us tune your cohort chemistry and recurring experiences. Share what feels true to
            your week, your energy, and your social intentions.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/events">Events</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/drop">The Drop</Link>
            </Button>
          </div>
        </div>

        <OnboardingForm />
      </main>
      <SiteFooter />
    </div>
  );
}
