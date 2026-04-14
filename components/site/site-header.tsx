import Link from "next/link";

import { auth } from "@/auth";
import { UserMenu } from "@/components/site/user-menu";
import { cn } from "@/lib/utils";

const guestNavItems = [
  { href: "/", label: "Home" },
  { href: "/apply", label: "Apply" },
  { href: "/login", label: "Log in" },
];

const memberNavItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/onboarding", label: "Onboarding" },
  { href: "/cohort", label: "Cohort" },
  { href: "/events", label: "Events" },
  { href: "/drop", label: "The Drop" },
];

export async function SiteHeader({
  className,
}: {
  className?: string;
}) {
  const session = await auth();
  const navItems = session?.user
    ? session.user.role === "ADMIN"
      ? [...memberNavItems, { href: "/admin", label: "Admin" }]
      : memberNavItems
    : guestNavItems;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 backdrop-blur",
        className,
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="font-heading text-lg font-semibold tracking-wide text-foreground">
          The Common Collective
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Primary navigation">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <UserMenu session={session} />
        </div>
      </div>

      <nav className="border-t border-border/50 md:hidden" aria-label="Mobile navigation">
        <div className="mx-auto flex w-full max-w-6xl gap-2 overflow-x-auto px-4 py-2.5 sm:px-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-full border border-border/70 bg-card px-3 py-1.5 text-xs text-muted-foreground transition hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
