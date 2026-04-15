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
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        <div className="mb-10 space-y-4">
          <Badge
            variant="outline"
            className="border-muted-gold/30 bg-transparent px-3 py-1 text-[0.65rem] font-medium uppercase tracking-[0.28em] text-muted-foreground shadow-none"
          >
            Member area
          </Badge>
          <h1 className="font-heading text-[2.15rem] leading-[1.08] text-foreground sm:text-4xl lg:text-[2.65rem]">
            {title}
          </h1>
          <p className="prose-calm max-w-3xl">{description}</p>
        </div>

        <nav className="mb-10 flex flex-wrap gap-2">
          {appNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full border border-border/65 bg-card/70 px-4 py-2 text-[0.8125rem] font-medium tracking-wide text-muted-foreground shadow-soft transition-[color,box-shadow,border-color,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-stone/55 hover:text-foreground hover:shadow-lift active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <section className="surface-panel p-6 sm:p-8">
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
