import Image from "next/image";
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

          <Card className="surface-panel overflow-hidden border-border/60 bg-card/90 shadow-[0_1px_0_oklch(1_0_0_/0.55)_inset,0_24px_48px_-28px_oklch(0.2_0.02_55_/_0.18)] ring-1 ring-black/[0.04]">
            <CardContent className="relative p-0">
              <div className="relative aspect-[16/10] w-full min-h-[220px] max-h-[400px] overflow-hidden sm:min-h-[260px]">
                <Image
                  src="/brand/home-hero-nyc.jpg"
                  alt="Manhattan skyline across the river at golden hour"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  className="object-cover object-[center_32%] motion-safe:scale-[1.03] motion-reduce:scale-100"
                />
                {/* Depth: cool shadows + warm lift (editorial print feel) */}
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-[oklch(0.14_0.02_55_/_0.92)] via-[oklch(0.2_0.025_60_/_0.45)] via-45% to-[oklch(0.42_0.04_75_/_0.2)]"
                />
                <div
                  aria-hidden
                  className="absolute inset-0 bg-[radial-gradient(ellipse_95%_70%_at_50%_0%,oklch(0.98_0.02_85_/_0.14),transparent_52%)]"
                />
                <div
                  aria-hidden
                  className="absolute inset-0 bg-[radial-gradient(ellipse_130%_90%_at_50%_100%,oklch(0.08_0.02_55_/_0.65),transparent_50%)]"
                />
                {/* Subtle film grain */}
                <div aria-hidden className="hero-editorial-grain" />
                <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 px-6 pb-6 pt-16 sm:px-7 sm:pb-7">
                  <p className="text-[0.62rem] font-medium uppercase tracking-[0.32em] text-[oklch(0.96_0.02_90_/_0.72)]">
                    The city, on your calendar
                  </p>
                  <p className="font-heading text-[1.35rem] leading-[1.15] tracking-tight text-[oklch(0.99_0.01_95_/_0.96)] sm:text-2xl">
                    Manhattan after hours
                  </p>
                </div>
              </div>
              <div className="relative border-t border-border/45 bg-gradient-to-b from-[oklch(0.97_0.015_85_/_0.97)] to-card/98">
                <div
                  aria-hidden
                  className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-muted-gold/35 to-transparent sm:inset-x-8"
                />
                <div className="grid gap-8 px-6 py-7 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-border/35 sm:px-0">
                  <div className="sm:px-7">
                    <p className="text-[0.6rem] font-medium uppercase tracking-[0.26em] text-muted-foreground/90">Gather</p>
                    <p className="mt-2 font-heading text-[0.8125rem] uppercase tracking-[0.14em] text-foreground">
                      Downtown dinners
                    </p>
                  </div>
                  <div className="sm:px-7">
                    <p className="text-[0.6rem] font-medium uppercase tracking-[0.26em] text-muted-foreground/90">Discuss</p>
                    <p className="mt-2 font-heading text-[0.8125rem] uppercase tracking-[0.14em] text-foreground">
                      Neighborhood salons
                    </p>
                  </div>
                  <div className="sm:px-7">
                    <p className="text-[0.6rem] font-medium uppercase tracking-[0.26em] text-muted-foreground/90">Belong</p>
                    <p className="mt-2 font-heading text-[0.8125rem] uppercase tracking-[0.14em] text-foreground">
                      Recurring cohorts
                    </p>
                  </div>
                </div>
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
