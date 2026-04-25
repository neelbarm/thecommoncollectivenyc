"use client";

import { LogOut, MoonStar, ShieldCheck } from "lucide-react";
import { signOut } from "next-auth/react";

import { AppQuickLink, AppSection, MemberAppShell } from "@/components/layout/member-app-shell";
import { MemberAppPreferences } from "@/components/member/member-app-preferences";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <MemberAppShell
      eyebrow="App settings"
      title="Controls, privacy, and notifications."
      subtitle="Everything visible here is functional today so the premium shell behaves like a real app, not a static mock."
      actions={[
        { href: "/profile", label: "Back to profile" },
        { href: "/announcements", label: "Open updates" },
      ]}
      utilityHref="/profile"
      utilityLabel="Back to profile"
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="app-stat-card">
          <p className="app-eyebrow text-[0.6rem]">Notifications</p>
          <p className="mt-2 text-[1.45rem] font-semibold tracking-[-0.03em] text-foreground">Device</p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">Saved locally on this device for now.</p>
        </div>
        <div className="app-stat-card">
          <p className="app-eyebrow text-[0.6rem]">Theme</p>
          <p className="mt-2 text-[1.45rem] font-semibold tracking-[-0.03em] text-foreground">Dark</p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">Optimized for the premium club look.</p>
        </div>
      </div>

      <AppSection
        title="Notification preferences"
        description="Control the app surfaces that should feel immediate versus ambient."
      >
        <MemberAppPreferences />
      </AppSection>

      <AppSection
        title="Account protection"
        description="Lightweight controls for trust and private-club boundaries."
        tone="accent"
      >
        <div className="space-y-3">
          <div className="rounded-[1.2rem] border border-border/60 bg-background/35 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="app-list-icon">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">Private member environment</p>
                <p className="text-xs leading-5 text-muted-foreground">
                  Cohort spaces remain authenticated and tied to your account session.
                </p>
              </div>
            </div>
            <Badge variant="outline">Active</Badge>
          </div>
          <div className="rounded-[1.2rem] border border-border/60 bg-background/35 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="app-list-icon">
                <MoonStar className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">Dark member theme</p>
                <p className="text-xs leading-5 text-muted-foreground">
                  Tuned for the premium editorial aesthetic across mobile screens.
                </p>
              </div>
            </div>
            <Badge variant="outline">Default</Badge>
          </div>
        </div>
      </AppSection>

      <AppSection title="Quick management" description="One-tap routes to the app surfaces members use most.">
        <div className="space-y-3">
          <AppQuickLink
            href="/announcements"
            label="Announcements feed"
            detail="Open member updates, mark announcements read, and pin your attention."
            icon="spark"
          />
          <AppQuickLink
            href="/cohort/chat"
            label="Cohort chat"
            detail="Compose messages and keep your small group in motion."
            icon="calendar"
          />
        </div>
      </AppSection>

      <AppSection title="Session" description="Fully functional account action." >
        <Button
          type="button"
          variant="outline"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full justify-between rounded-[1.2rem] border-destructive/25 bg-destructive/5 text-destructive hover:bg-destructive/10"
        >
          <span>Log out</span>
          <LogOut className="h-4 w-4" />
        </Button>
      </AppSection>
    </MemberAppShell>
  );
}
