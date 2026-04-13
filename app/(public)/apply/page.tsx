import Link from "next/link";

import { ApplyForm } from "@/components/site/apply-form";
import { Button } from "@/components/ui/button";

export default function ApplyPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="mb-10 grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:items-end">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Member Application</p>
          <h1 className="font-heading text-4xl leading-tight text-foreground sm:text-5xl">
            Apply directly. No waitlist theatre.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground">
            Share how you show up in social spaces, what you&apos;re looking for, and why recurring community matters to
            you. This foundation helps us design thoughtful cohorts and experiences.
          </p>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
          <h2 className="font-heading text-2xl text-foreground">Before you submit</h2>
          <ul className="mt-4 space-y-2 text-sm leading-6 text-muted-foreground">
            <li>- Applications are reviewed on a rolling basis.</li>
            <li>- If accepted, onboarding opens immediately.</li>
            <li>- Membership is non-exclusive and cohort-based.</li>
          </ul>
          <Button asChild variant="outline" className="mt-5 w-full">
            <Link href="/signup">Need an account first?</Link>
          </Button>
        </div>
      </section>

      <ApplyForm />
    </main>
  );
}
