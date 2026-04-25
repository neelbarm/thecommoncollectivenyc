import { MessageCircleMore, Pin } from "lucide-react";

import { auth } from "@/auth";
import { AppQuickLink, AppSection, MemberAppShell } from "@/components/layout/member-app-shell";
import { Badge } from "@/components/ui/badge";
import { getMemberCohortData } from "@/lib/member/get-member-cohort-data";

function initials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

export default async function CohortChatPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const data = await getMemberCohortData(session.user.id);

  if (!data || !data.cohort.id) {
    return (
      <MemberAppShell
        eyebrow="COHORT CHAT"
        title="Your chat opens once your cohort is live."
        subtitle="We’ll unlock a private room for your cohort as soon as your placement is active."
        actions={[{ href: "/cohort", label: "Back to cohort" }]}
      >
        <AppSection
          title="Private by design"
          description="Cohort chat is meant to feel intimate and useful, not noisy. Once your cohort is assigned, this tab becomes your shared planning room."
        >
          <div className="space-y-3">
            <div className="app-list-row">
              <div className="flex items-center gap-3">
                <span className="app-list-icon">
                  <MessageCircleMore className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">Cohort-only messages</p>
                  <p className="text-xs leading-5 text-muted-foreground">
                    Private, lightweight coordination for your season.
                  </p>
                </div>
              </div>
            </div>
            <AppQuickLink
              href="/onboarding"
              label="Complete your member setup"
              detail="Your profile and onboarding completion drive cohort placement."
              icon="spark"
            />
          </div>
        </AppSection>
      </MemberAppShell>
    );
  }

  const pinnedMessages = [
    {
      id: "pin-1",
      author: "Common Concierge",
      body: `Welcome to ${data.cohort.name}. Use this space to coordinate quickly, confirm plans, and keep the energy warm.`,
      time: "Pinned update",
    },
    {
      id: "pin-2",
      author: "Host note",
      body: "Drop a short intro, your best neighborhood for weeknight plans, and one thing you always say yes to.",
      time: "Pinned prompt",
    },
  ];

  const sampleThread = data.members.slice(0, 5).map((member, index) => ({
    id: member.id,
    name: `${member.firstName} ${member.lastName}`,
    initials: initials(member.firstName, member.lastName),
    body:
      index === 0
        ? "Anyone free for a low-key dinner next Thursday in the west side?"
        : index === 1
          ? "I’m in if it stays below 9:30 and near a train."
          : index === 2
            ? "Would love that. Also down for wine bar + walk."
            : index === 3
              ? "Thursday works for me. I can suggest a couple places."
              : "Happy to join if we lock a time tonight.",
    time: `${index + 1}m ago`,
    highlight: index === 0,
  }));

  return (
    <MemberAppShell
      eyebrow="COHORT CHAT"
      title={`Keep ${data.cohort.name} in motion.`}
      subtitle="A private room for quick planning, warm check-ins, and the little messages that make the cohort feel alive."
      actions={[
        { href: "/cohort", label: "View roster" },
        { href: "/events", label: "Open calendar" },
      ]}
    >
      <AppSection
        title="Pinned"
        description="The notes your cohort should always see first."
        action={<Badge className="rounded-full border-0 bg-primary/90 px-3 py-1 text-[0.62rem] uppercase tracking-[0.24em] text-primary-foreground">Preview</Badge>}
      >
        <div className="space-y-3">
          {pinnedMessages.map((message) => (
            <article key={message.id} className="app-list-row items-start">
              <div className="flex items-start gap-3">
                <span className="app-list-icon mt-0.5">
                  <Pin className="h-4 w-4" />
                </span>
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{message.author}</p>
                    <span className="text-[0.65rem] uppercase tracking-[0.22em] text-muted-foreground">
                      {message.time}
                    </span>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">{message.body}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </AppSection>

      <AppSection
        title="Conversation"
        description="A premium placeholder for the cohort room we can back with realtime messaging next."
      >
        <div className="space-y-3">
          {sampleThread.map((message) => (
            <article
              key={message.id}
              className={`rounded-[1.35rem] border px-4 py-3 ${
                message.highlight
                  ? "border-primary/25 bg-primary/10 shadow-[0_18px_40px_-26px_oklch(0.72_0.06_78_/0.75)]"
                  : "border-border/60 bg-background/35"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/20 bg-card/70 text-sm font-semibold text-primary">
                  {message.initials}
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{message.name}</p>
                    <span className="text-[0.65rem] uppercase tracking-[0.22em] text-muted-foreground">
                      {message.time}
                    </span>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">{message.body}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </AppSection>

      <AppSection
        title="What comes next"
        description="This screen is intentionally designed as the first-class chat destination for the app."
        tone="accent"
      >
        <div className="space-y-3">
          <AppQuickLink
            href="/announcements"
            label="Add live announcements"
            detail="Pinned admin updates, unread state, and cohort-specific delivery."
            icon="book"
          />
          <AppQuickLink
            href="/dashboard"
            label="Back to home"
            detail="Use the home feed as the inbox for everything important."
            icon="spark"
          />
        </div>
      </AppSection>
    </MemberAppShell>
  );
}
