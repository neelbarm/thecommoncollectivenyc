import Image from "next/image";
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
        "sticky top-0 z-50 w-full border-b border-border/45 bg-background/75 shadow-[0_1px_0_oklch(0.72_0.055_78_/0.12)] backdrop-blur-md",
        className,
      )}
    >
      <div className="mx-auto flex h-[4.25rem] w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label="The Common Collective home"
          className="inline-flex items-center transition-opacity duration-300 hover:opacity-80 motion-reduce:transition-none"
        >
          <Image
            src="/brand/common-collective-wordmark.svg"
            alt="The Common Collective"
            width={300}
            height={56}
            priority
            className="h-8 w-auto sm:h-9"
          />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="relative px-3 py-2 text-[0.8125rem] font-medium tracking-wide text-muted-foreground transition-colors duration-300 after:absolute after:inset-x-3 after:-bottom-px after:h-px after:origin-left after:scale-x-0 after:bg-muted-gold/50 after:transition-transform after:duration-500 after:ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-foreground hover:after:scale-x-100 motion-reduce:after:transition-none"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <UserMenu session={session} />
        </div>
      </div>

      <nav className="border-t border-border/35 md:hidden" aria-label="Mobile navigation">
        <div className="mx-auto flex w-full max-w-6xl gap-2 overflow-x-auto px-4 py-2.5 sm:px-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-full border border-border/60 bg-card/90 px-3.5 py-1.5 text-[0.7rem] font-medium tracking-wide text-muted-foreground shadow-soft transition-[color,box-shadow,border-color,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-stone/50 hover:text-foreground active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
