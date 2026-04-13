import Link from "next/link";

import { auth } from "@/auth";
import { UserMenu } from "@/components/site/user-menu";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/apply", label: "Apply" },
  { href: "/events", label: "Events" },
  { href: "/drop", label: "The Drop" },
];

export async function SiteHeader({
  className,
}: {
  className?: string;
}) {
  const session = await auth();

  return (
    <header className={cn("sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 backdrop-blur", className)}>
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="font-heading text-lg font-semibold tracking-wide text-foreground">
          The Common Collective
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
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
    </header>
  );
}
