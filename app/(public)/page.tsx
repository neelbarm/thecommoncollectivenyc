import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Check,
  MapPin,
  Newspaper,
  Sparkles,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { pageEnterClasses } from "@/lib/motion";

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

const membershipNotes = [
  "Thoughtful member application with human review.",
  "Small recurring cohorts designed for continuity, not chaos.",
  "Editorially curated gatherings across dinners, salons, and city rituals.",
] as const;

const experienceMoments = [
  {
    label: "Gatherings",
    title: "Downtown dinners with actual continuity",
    description:
      "Not one-off social noise — recurring tables where names become familiar and trust has room to build.",
  },
  {
    label: "Cohorts",
    title: "A social home base inside the city",
    description:
      "Members are placed into intimate groups that make New York feel warmer, smaller, and easier to belong inside.",
  },
  {
    label: "Concierge rhythm",
    title: "A calendar that feels curated, not crowded",
    description:
      "Events, announcements, and cohort coordination are designed to support a recurring social rhythm you can actually keep.",
  },
] as const;

export default function HomePage() {
  return (
    <main>
      <section className="mx-auto w-full max-w-6xl px-4 pb-16 pt-14 sm:px-6 sm:pt-20 lg:px-8 lg:pb-24">
        <div className={`grid gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-end ${pageEnterClasses}`}>
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
            <div className="grid gap-3 sm:grid-cols-3">
              {membershipNotes.map((note) => (
                <div
                  key={note}
                  className="rounded-[1.15rem] border border-border/55 bg-card/65 px-4 py-3 shadow-[inset_0_1px_0_oklch(1_0_0_/0.04)]"
                >
                  <div className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 text-muted-gold" />
                    <p className="text-sm leading-6 text-muted-foreground">{note}</p>
                  </div>
                </div>
              ))}
            </div>
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

          <Card className="surface-panel overflow-hidden border-border/60 bg-[linear-gradient(180deg,oklch(0.2_0.014_42)_0%,oklch(0.155_0.012_42)_100%)] text-[oklch(0.95_0.012_86)] shadow-[0_1px_0_oklch(1_0_0_/0.1)_inset,0_32px_70px_-40px_oklch(0.02_0.02_50_/1)] ring-1 ring-[oklch(0.52_0.03_78_/0.14)]">
            <CardContent className="relative overflow-hidden p-0">
              <div
                aria-hidden
                className="absolute inset-0 bg-[radial-gradient(circle_at_top,_oklch(0.72_0.05_76_/0.18),_transparent_42%),radial-gradient(circle_at_80%_65%,_oklch(0.38_0.026_70_/0.16),_transparent_36%)]"
              />
              <div aria-hidden className="hero-editorial-grain absolute inset-0 opacity-[0.085]" />
              <div className="relative space-y-8 p-7 sm:p-8">
                <div className="flex items-center justify-between gap-4">
                  <Image
                    src="/brand/common-collective-wordmark.svg"
                    alt="The Common Collective"
                    width={220}
                    height={56}
                    className="h-8 w-auto opacity-95 invert"
                  />
                  <span className="rounded-full border border-[oklch(0.72_0.05_76_/0.28)] bg-[oklch(0.72_0.05_76_/0.08)] px-3 py-1 text-[0.62rem] font-medium uppercase tracking-[0.24em] text-[oklch(0.86_0.03_82)]">
                    NYC membership
                  </span>
                </div>

                <div className="space-y-4">
                  <p className="text-[0.62rem] font-medium uppercase tracking-[0.32em] text-[oklch(0.84_0.02_84_/0.68)]">
                    The city, on your calendar
                  </p>
                  <h2 className="font-heading text-[2rem] leading-[1.02] tracking-tight text-[oklch(0.98_0.01_95_/_0.96)] sm:text-[2.35rem]">
                    A private-feeling social rhythm without the exclusivity theatre.
                  </h2>
                  <p className="max-w-[28rem] text-sm leading-7 text-[oklch(0.88_0.01_88_/0.78)]">
                    The Common Collective is for people who want real continuity in New York: recurring dinners,
                    thoughtful salons, and a cohort they actually see again.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[1.15rem] border border-white/8 bg-white/[0.04] p-4">
                    <p className="text-[0.62rem] uppercase tracking-[0.24em] text-[oklch(0.84_0.02_84_/0.65)]">
                      Gather
                    </p>
                    <p className="mt-2 font-heading text-lg text-[oklch(0.98_0.01_95_/_0.96)]">
                      Downtown dinners
                    </p>
                  </div>
                  <div className="rounded-[1.15rem] border border-white/8 bg-white/[0.04] p-4">
                    <p className="text-[0.62rem] uppercase tracking-[0.24em] text-[oklch(0.84_0.02_84_/0.65)]">
                      Discuss
                    </p>
                    <p className="mt-2 font-heading text-lg text-[oklch(0.98_0.01_95_/_0.96)]">
                      Neighborhood salons
                    </p>
                  </div>
                  <div className="rounded-[1.15rem] border border-white/8 bg-white/[0.04] p-4">
                    <p className="text-[0.62rem] uppercase tracking-[0.24em] text-[oklch(0.84_0.02_84_/0.65)]">
                      Belong
                    </p>
                    <p className="mt-2 font-heading text-lg text-[oklch(0.98_0.01_95_/_0.96)]">
                      Recurring cohorts
                    </p>
                  </div>
                </div>

                <div className="rounded-[1.35rem] border border-[oklch(0.72_0.05_76_/0.2)] bg-[linear-gradient(180deg,oklch(0.17_0.012_42)_0%,oklch(0.14_0.012_42)_100%)] p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[oklch(0.72_0.05_76_/0.25)] bg-[oklch(0.72_0.05_76_/0.08)]">
                      <Sparkles className="h-5 w-5 text-[oklch(0.8_0.04_82)]" />
                    </div>
                    <div>
                      <p className="text-[0.62rem] uppercase tracking-[0.24em] text-[oklch(0.84_0.02_84_/0.65)]">
                        What membership feels like
                      </p>
                      <p className="mt-1 text-sm leading-6 text-[oklch(0.92_0.01_88_/0.84)]">
                        Cultured, warm, recurring, and easy to keep showing up for.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="border-y border-border/40 bg-card/40">
        <div className={`mx-auto grid w-full max-w-6xl gap-6 px-4 py-14 sm:px-6 md:grid-cols-3 lg:px-8 ${pageEnterClasses}`}>
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
        <Card className={`overflow-hidden border-border/60 bg-card/95 ${pageEnterClasses}`}>
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

      <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 lg:px-8 lg:pb-24">
        <div className={`grid gap-6 md:grid-cols-3 ${pageEnterClasses}`}>
          {experienceMoments.map((moment) => (
            <Card key={moment.title} className="border-border/60 bg-card/88">
              <CardContent className="space-y-4 p-7">
                <p className="eyebrow">{moment.label}</p>
                <h3 className="font-heading text-[1.55rem] leading-tight text-foreground">{moment.title}</h3>
                <p className="text-sm leading-7 text-muted-foreground">{moment.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-t border-border/40 bg-card/35">
        <div className={`mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-16 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8 ${pageEnterClasses}`}>
          <div className="max-w-2xl space-y-4">
            <p className="eyebrow inline-flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5" />
              New York City
            </p>
            <h3 className="font-heading text-[2rem] leading-tight text-foreground sm:text-[2.5rem]">
              A members club built around recurring city connection.
            </h3>
            <p className="prose-calm">
              The Common Collective is for thoughtful people who want introductions that turn into continuity: small
              cohorts, editorial social experiences, and a calendar that helps real connection happen again.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 rounded-full px-8 text-[0.8125rem] tracking-[0.12em] uppercase">
              <Link href="/apply">
                Apply now
                <ArrowRight className="ml-2 h-4 w-4 opacity-80" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-full px-8 text-[0.8125rem] tracking-wide">
              <Link href="/signup">Create account</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
