"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BookOpen,
  CalendarDays,
  ChevronRight,
  House,
  MessageCircleMore,
  Settings2,
  Sparkles,
  UserRound,
} from "lucide-react";

import { cn } from "@/lib/utils";

const primaryNav = [
  { href: "/dashboard", label: "Home", icon: House },
  { href: "/events", label: "Calendar", icon: CalendarDays },
  { href: "/announcements", label: "Updates", icon: Bell },
  { href: "/cohort/chat", label: "Chat", icon: MessageCircleMore },
  { href: "/profile", label: "Profile", icon: UserRound },
];

type ActionLink = {
  href: string;
  label: string;
};

export function MemberAppShell({
  eyebrow = "Common Collective",
  title,
  subtitle,
  children,
  actions,
  utilityHref = "/settings",
  utilityLabel = "Open app settings",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: ActionLink[];
  utilityHref?: string;
  utilityLabel?: string;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl items-start justify-center px-3 py-3 sm:px-5 sm:py-5">
        <div className="app-device-frame app-page-fade relative flex min-h-[calc(100vh-1.5rem)] w-full max-w-[30rem] flex-col overflow-hidden sm:min-h-[calc(100vh-2.5rem)] lg:max-w-[31rem]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top,_oklch(0.72_0.06_78_/0.28),_transparent_58%)]" />

          <header className="app-topbar relative z-10 px-5 pb-4 pt-5 sm:px-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="app-eyebrow">{eyebrow}</p>
                <div className="space-y-2">
                  <h1 className="font-heading text-[2.3rem] leading-[0.96] text-foreground sm:text-[2.6rem]">
                    {title}
                  </h1>
                  {subtitle ? (
                    <p className="max-w-[24rem] text-[0.98rem] leading-7 text-muted-foreground">{subtitle}</p>
                  ) : null}
                </div>
              </div>

              <Link href={utilityHref} aria-label={utilityLabel} className="app-icon-button mt-0.5">
                {utilityHref === "/settings" ? <Settings2 className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
              </Link>
            </div>

            {actions?.length ? (
              <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                {actions.map((action) => (
                  <Link key={action.href} href={action.href} className="app-chip">
                    <span>{action.label}</span>
                    <ChevronRight className="h-3.5 w-3.5 opacity-70" />
                  </Link>
                ))}
              </div>
            ) : null}
          </header>

          <main className="relative z-10 flex-1 overflow-y-auto px-5 pb-28 sm:px-6">
            <div className="space-y-4">{children}</div>
          </main>

          <nav className="app-bottom-nav absolute inset-x-0 bottom-0 z-20 px-3 pb-3 pt-2" aria-label="Member app">
            <div className="grid grid-cols-5 gap-1 rounded-[1.65rem] border border-border/60 bg-background/92 p-2 shadow-[0_-1px_0_oklch(1_0_0_/0.04),0_-18px_46px_-28px_oklch(0.03_0.02_45_/0.88)] backdrop-blur-xl">
              {primaryNav.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group flex flex-col items-center gap-1 rounded-[1.15rem] px-2 py-2.5 text-[0.64rem] font-medium uppercase tracking-[0.24em] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
                      isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
                        isActive
                          ? "border-primary/35 bg-primary text-primary-foreground shadow-[0_10px_30px_-16px_oklch(0.72_0.06_78_/0.95)]"
                          : "border-border/65 bg-card/55 text-muted-foreground group-hover:border-border group-hover:bg-card/80 group-hover:text-foreground",
                      )}
                    >
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <span className={cn("truncate", isActive ? "text-foreground" : "")}>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(180deg,_transparent,_oklch(0.11_0.01_45_/0.95)_60%)]" />
        </div>
      </div>
    </div>
  );
}

export function AppSection({
  title,
  description,
  action,
  children,
  tone = "default",
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  tone?: "default" | "accent";
}) {
  return (
    <section className={cn("app-panel", tone === "accent" ? "app-panel-accent" : "")}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-[1.08rem] font-semibold tracking-[-0.02em] text-foreground">{title}</h2>
          {description ? <p className="text-sm leading-6 text-muted-foreground">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

export function AppStat({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="app-stat-card">
      <p className="app-eyebrow text-[0.6rem]">{label}</p>
      <p className="mt-2 text-[1.45rem] font-semibold tracking-[-0.03em] text-foreground">{value}</p>
      {detail ? <p className="mt-2 text-xs leading-5 text-muted-foreground">{detail}</p> : null}
    </div>
  );
}

export function AppQuickLink({
  href,
  label,
  detail,
  icon,
}: {
  href: string;
  label: string;
  detail: string;
  icon?: "book" | "calendar" | "spark";
}) {
  const Icon = icon === "book" ? BookOpen : icon === "calendar" ? CalendarDays : Sparkles;

  return (
    <Link href={href} className="app-list-row">
      <div className="flex items-center gap-3">
        <span className="app-list-icon">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs leading-5 text-muted-foreground">{detail}</p>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground/75" />
    </Link>
  );
}
