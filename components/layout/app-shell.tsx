import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";

const appNav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/onboarding", label: "Onboarding" },
  { href: "/cohort", label: "Cohort" },
  { href: "/events", label: "Events" },
  { href: "/drop", label: "The Drop" },
  { href: "/admin", label: "Admin" },
];

export async function AppShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 space-y-3">
          <Badge variant="outline" className="border-border/70 px-3 py-1 text-xs uppercase tracking-[0.2em]">
            Member area
          </Badge>
          <h1 className="font-heading text-3xl text-foreground sm:text-4xl">{title}</h1>
          <p className="max-w-3xl text-muted-foreground">{description}</p>
        </div>

        <nav className="mb-8 flex flex-wrap gap-2">
          {appNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full border border-border/70 bg-card px-4 py-2 text-sm text-muted-foreground transition hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <section className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
          {children ?? (
            <p className="text-sm leading-7 text-muted-foreground">
              This route is intentionally lightweight while product workflows continue to mature. You can return to
              dashboard, events, or The Drop from the navigation above.
            </p>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
