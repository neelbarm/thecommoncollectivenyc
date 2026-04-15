import Link from "next/link";
import { ArrowRight, CalendarDays, Newspaper, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const pillars = [
  {
    title: "Apply with intention",
    description:
      "Members apply directly. No gamified waitlist, no scarcity theater, no referral gatekeeping.",
    icon: Newspaper,
  },
  {
    title: "Join a small recurring cohort",
    description:
      "Once onboarded, members are matched into thoughtful groups designed for real continuity.",
    icon: Users,
  },
  {
    title: "Attend recurring experiences",
    description:
      "Gatherings are social, human, and editorially curated to deepen relationships over time.",
    icon: CalendarDays,
  },
];

export default function HomePage() {
  return (
    <main>
      <section className="mx-auto w-full max-w-6xl px-4 pb-16 pt-14 sm:px-6 sm:pt-20 lg:px-8 lg:pb-24">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div className="space-y-8">
            <Badge
              variant="outline"
              className="border-muted-gold/35 bg-transparent px-3 py-1 text-[0.65rem] font-medium uppercase tracking-[0.28em] text-muted-foreground"
            >
              New York City Membership
            </Badge>
            <h1 className="max-w-[18ch] font-heading text-[2.5rem] leading-[1.06] text-foreground sm:text-5xl lg:text-[3.35rem]">
              A live members club for people who want real social rhythm.
            </h1>
            <p className="prose-calm max-w-2xl">
              The Common Collective is a non-exclusive NYC membership designed around recurring gatherings, small cohorts,
              and meaningful city connection.
            </p>
            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
              <Button asChild size="lg" className="h-12 rounded-full px-8 text-[0.8125rem] tracking-[0.12em] uppercase">
                <Link href="/apply">
                  Start your application
                  <ArrowRight className="ml-2 h-4 w-4 opacity-80" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 rounded-full px-8 text-[0.8125rem] tracking-wide"
              >
                <Link href="/login">Member login</Link>
              </Button>
            </div>
          </div>

          <Card className="surface-panel overflow-hidden border-border/65 bg-card/85">
            <CardContent className="relative p-0">
              <div className="relative h-[280px] w-full bg-[radial-gradient(circle_at_70%_22%,oklch(0.95_0.03_75_/0.7),transparent_56%),linear-gradient(to_bottom,oklch(0.97_0.02_80),oklch(0.9_0.02_85))]">
                <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(to_top,oklch(0.24_0.02_65_/0.9),transparent)]" />
                <svg
                  viewBox="0 0 820 280"
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-[58%] w-full text-[oklch(0.24_0.02_65_/_0.9)]"
                >
                  <path
                    d="M0 280V206h30v-52h28v34h24v-64h26v40h22v-84h34v66h20v-46h24v34h18v-56h30v76h26v-30h22v42h28v-72h24v54h18v-32h34v50h22v-86h30v60h24v-44h20v28h30v-62h34v52h18v-30h26v46h28v-24h24v38h26v-60h30v44h24v-34h20v50h26v-38h24v56h34v-66h26v86h26v-34h28v44h34v-60h26v74h28v-30h30v46h42V280Z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <div className="surface-subtle grid gap-2 border-t border-border/40 p-5 text-xs text-muted-foreground sm:grid-cols-3">
                <p className="uppercase tracking-[0.18em]">Downtown dinners</p>
                <p className="uppercase tracking-[0.18em]">Neighborhood salons</p>
                <p className="uppercase tracking-[0.18em]">Recurring cohorts</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="border-y border-border/40 bg-card/40">
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-14 sm:px-6 md:grid-cols-3 lg:px-8">
          {pillars.map((pillar) => (
            <Card key={pillar.title} className="h-full border-border/60 bg-card/90">
              <CardContent className="flex h-full flex-col space-y-4 p-7">
                <pillar.icon className="h-4 w-4 text-muted-gold/90" strokeWidth={1.25} />
                <h2 className="font-heading text-xl tracking-tight text-foreground">{pillar.title}</h2>
                <p className="text-[0.9375rem] leading-relaxed text-muted-foreground">{pillar.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <Card className="overflow-hidden border-border/60 bg-card/95">
          <CardContent className="grid gap-10 p-7 sm:p-10 md:grid-cols-[1.15fr_1fr]">
            <div className="space-y-5">
              <p className="eyebrow">How it works</p>
              <h3 className="font-heading text-[1.85rem] leading-tight tracking-tight text-foreground sm:text-3xl">
                Designed for consistency, not noise.
              </h3>
              <p className="prose-calm">
                We curate a social ecosystem where members can move from introductions to trust. You apply, complete
                onboarding, and then gather through recurring cohorts and experiences that feel warm, interesting, and
                grounded in the city.
              </p>
            </div>
            <div className="flex flex-col justify-center rounded-xl border border-border/50 bg-oat/80 p-7 shadow-[inset_0_1px_0_oklch(1_0_0_/0.45)]">
              <p className="font-heading text-lg leading-relaxed text-foreground/95">
                &ldquo;This is where you meet people you actually see again. It feels cultured, personal, and alive.&rdquo;
              </p>
              <p className="eyebrow mt-6 text-muted-foreground/90">Early member feedback</p>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
