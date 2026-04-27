import { MessageCircleMore } from "lucide-react";

import { AppQuickLink, AppSection, MemberAppShell } from "@/components/layout/member-app-shell";
import { MemberChatClient } from "@/components/member/member-chat-client";
import { requireMemberSession } from "@/lib/auth/require-member-session";
import { getMemberChatData } from "@/lib/chat/get-member-chat-data";

export default async function CohortChatPage() {
  const session = await requireMemberSession();

  const data = await getMemberChatData(session.user.id);

  if (!data || !data.cohort) {
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
      <MemberChatClient initialData={data} />

      <AppSection
        title="Useful shortcuts"
        description="Keep the app navigable and functional while messaging grows into a full realtime feature."
      >
        <div className="space-y-3">
          <AppQuickLink
            href="/announcements"
            label="Open announcements"
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
