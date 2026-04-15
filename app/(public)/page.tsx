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
            <Button asChild size="lg" variant="outline" className="h-12 rounded-full px-8 text-[0.8125rem] tracking-wide">
              <Link href="/login">Member login</Link>
            </Button>
          </div>
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
