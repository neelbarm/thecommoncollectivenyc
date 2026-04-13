import Link from "next/link";
import { ArrowRight, CalendarDays, Users, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const pillars = [
  {
    title: "Apply with intention",
    description:
      "Members apply directly. No gamified waitlist, no scarcity theater, no referral gatekeeping.",
    icon: Sparkles,
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
      <section className="mx-auto w-full max-w-6xl px-4 pb-14 pt-12 sm:px-6 sm:pt-16 lg:px-8 lg:pb-20">
        <div className="space-y-6">
          <Badge
            variant="outline"
            className="border-muted-gold/50 bg-muted-gold/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-foreground"
          >
            New York City Membership
          </Badge>
          <h1 className="max-w-4xl font-heading text-4xl leading-tight text-foreground sm:text-5xl lg:text-6xl">
            A live members club for people who want real social rhythm.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            The Common Collective is a non-exclusive NYC membership designed around recurring gatherings, small cohorts,
            and meaningful city connection.
          </p>
          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Button asChild size="lg" className="h-11 rounded-full px-6">
              <Link href="/apply">
                Start your application
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-11 rounded-full border-border/80 px-6">
              <Link href="/login">Member login</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-y border-border/60 bg-card/60">
        <div className="mx-auto grid w-full max-w-6xl gap-5 px-4 py-10 sm:px-6 md:grid-cols-3 lg:px-8">
          {pillars.map((pillar) => (
            <Card key={pillar.title} className="border-border/70 bg-card shadow-soft">
              <CardContent className="space-y-3 p-6">
                <pillar.icon className="h-5 w-5 text-muted-gold" />
                <h2 className="font-heading text-xl text-foreground">{pillar.title}</h2>
                <p className="text-sm leading-6 text-muted-foreground">{pillar.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <Card className="overflow-hidden border-border/70 bg-card shadow-soft">
          <CardContent className="grid gap-8 p-6 sm:p-8 md:grid-cols-[1.2fr_1fr]">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">How it works</p>
              <h3 className="font-heading text-3xl text-foreground">Designed for consistency, not noise.</h3>
              <p className="text-sm leading-7 text-muted-foreground sm:text-base">
                We curate a social ecosystem where members can move from introductions to trust. You apply, complete
                onboarding, and then gather through recurring cohorts and experiences that feel warm, interesting, and
                grounded in the city.
              </p>
            </div>
            <div className="rounded-xl border border-border/70 bg-oat p-5">
              <p className="text-sm leading-7 text-foreground">
                &ldquo;This is where you meet people you actually see again. It feels cultured, personal, and alive.&rdquo;
              </p>
              <p className="mt-4 text-xs uppercase tracking-[0.2em] text-muted-foreground">Early member feedback</p>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
