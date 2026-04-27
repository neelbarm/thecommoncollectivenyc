"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Send, WifiOff } from "lucide-react";

import { AppQuickLink, AppSection } from "@/components/layout/member-app-shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { APP_URL_OPEN_EVENT, RESUME_EVENT } from "@/components/native/capacitor-native-bridge";
import type { MemberChatData } from "@/lib/chat/get-member-chat-data";

export function MemberChatClient({
  initialData,
}: {
  initialData: MemberChatData;
}) {
  const [messages, setMessages] = useState(initialData.messages);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const messageCountLabel = useMemo(() => {
    if (messages.length === 1) {
      return "1 message in the room";
    }
    return `${messages.length} messages in the room`;
  }, [messages.length]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const updateOnlineState = () => setIsOffline(!navigator.onLine);
    updateOnlineState();
    window.addEventListener("online", updateOnlineState);
    window.addEventListener("offline", updateOnlineState);
    return () => {
      window.removeEventListener("online", updateOnlineState);
      window.removeEventListener("offline", updateOnlineState);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const refreshMessages = async () => {
      if (!navigator.onLine) {
        return;
      }
      setIsRefreshing(true);
      try {
        const response = await fetch("/api/chat/messages", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Unable to refresh chat.");
        }
        const payload = (await response.json()) as {
          ok?: boolean;
          data?: MemberChatData;
          error?: string;
        };
        if (payload.ok && payload.data?.messages) {
          setMessages(payload.data.messages);
          setError(null);
        } else if (payload.error) {
          setError(payload.error);
        }
      } catch (refreshError) {
        setError(refreshError instanceof Error ? refreshError.message : "Unable to refresh chat.");
      } finally {
        setIsRefreshing(false);
      }
    };

    const onNativeResume = () => {
      void refreshMessages();
    };
    const onAppUrlOpen = () => {
      void refreshMessages();
    };
    const onWindowOnline = () => {
      void refreshMessages();
    };

    window.addEventListener(RESUME_EVENT, onNativeResume);
    window.addEventListener(APP_URL_OPEN_EVENT, onAppUrlOpen);
    window.addEventListener("online", onWindowOnline);

    return () => {
      window.removeEventListener(RESUME_EVENT, onNativeResume);
      window.removeEventListener(APP_URL_OPEN_EVENT, onAppUrlOpen);
      window.removeEventListener("online", onWindowOnline);
    };
  }, []);

  function submitMessage() {
    const body = draft.trim();
    if (!body) {
      setError("Write a message before sending.");
      return;
    }

    if (body.length > 600) {
      setError("Please keep messages under 600 characters.");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/chat/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ roomId: initialData.cohort?.roomId, body }),
        });

        const payload = (await response.json()) as {
          error?: string;
          message?: MemberChatData["messages"][number];
        };

        if (!response.ok || !payload.message) {
          throw new Error(payload.error ?? "Unable to send your message.");
        }

        setMessages((current) => [...current, payload.message!]);
        setDraft("");
      } catch (postError) {
        setError(postError instanceof Error ? postError.message : "Unable to send your message.");
      }
    });
  }

  return (
    <>
      <AppSection
        title="Conversation"
        description={`${messageCountLabel}. Messages here are now stored in the database for your cohort room.`}
      >
        {isOffline ? (
          <p className="mb-3 status-banner border-amber-400/35 bg-amber-500/8 text-amber-100">
            <span className="inline-flex items-center gap-2">
              <WifiOff className="h-4 w-4" />
              Offline mode: messages will sync when connection returns.
            </span>
          </p>
        ) : null}
        {isRefreshing ? (
          <p className="mb-3 status-banner border-border/55 bg-card/55 text-xs text-muted-foreground">
            Refreshing chat…
          </p>
        ) : null}
        <div className="space-y-3">
          {messages.length === 0 ? (
            <div className="rounded-[1.35rem] border border-dashed border-border/55 bg-background/24 px-4 py-4">
              <p className="text-sm font-medium text-foreground">No messages yet</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Be the first to start the room with a plan, check-in, or intro.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <article
                key={message.id}
                className={`rounded-[1.35rem] border px-4 py-3 ${
                  message.isCurrentUser
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
                      <p className="text-sm font-medium text-foreground">
                        {message.isCurrentUser ? "You" : message.authorName}
                      </p>
                      <span className="text-[0.65rem] uppercase tracking-[0.22em] text-muted-foreground">
                        {message.timeLabel}
                      </span>
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">{message.body}</p>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </AppSection>

      <AppSection
        title="Send a note"
        description="This is now connected to a persistent cohort room. Post a message and it will appear for the group."
        tone="accent"
      >
        <div className="space-y-3 rounded-[1.35rem] border border-border/60 bg-background/30 p-4">
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Anyone free for dinner next Thursday near the west side?"
            className="min-h-28 rounded-[1.15rem]"
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button onClick={submitMessage} disabled={isPending} className="w-full justify-center">
            <Send className="h-4 w-4" />
            {isPending ? "Sending..." : "Send to cohort room"}
          </Button>
        </div>
      </AppSection>

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
    </>
  );
}
