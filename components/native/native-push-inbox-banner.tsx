"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BellRing, MessageCircleMore, X } from "lucide-react";

import {
  PUSH_ACTION_EVENT,
  PUSH_RECEIVED_EVENT,
} from "@/components/native/capacitor-native-bridge";

type PushBannerPayload = {
  title: string;
  body: string;
  route: string;
  type: "announcement" | "chat" | "generic";
};

function normalizePushDetail(detail: unknown): PushBannerPayload | null {
  if (!detail || typeof detail !== "object") {
    return null;
  }
  const data = detail as {
    title?: unknown;
    body?: unknown;
    route?: unknown;
    type?: unknown;
  };
  const route = typeof data.route === "string" && data.route.length > 0 ? data.route : "/dashboard";
  const title = typeof data.title === "string" && data.title.length > 0 ? data.title : "New update";
  const body = typeof data.body === "string" && data.body.length > 0 ? data.body : "Open the app to view details.";
  const type = data.type === "announcement" || data.type === "chat" ? data.type : "generic";

  return { title, body, route, type };
}

export function NativePushInboxBanner() {
  const [banner, setBanner] = useState<PushBannerPayload | null>(null);

  useEffect(() => {
    const onReceived = (event: Event) => {
      const custom = event as CustomEvent<unknown>;
      const payload = normalizePushDetail(custom.detail);
      if (payload) {
        setBanner(payload);
      }
    };

    const onAction = (event: Event) => {
      const custom = event as CustomEvent<unknown>;
      const payload = normalizePushDetail(custom.detail);
      if (payload) {
        setBanner(payload);
      }
    };

    window.addEventListener(PUSH_RECEIVED_EVENT, onReceived);
    window.addEventListener(PUSH_ACTION_EVENT, onAction);
    return () => {
      window.removeEventListener(PUSH_RECEIVED_EVENT, onReceived);
      window.removeEventListener(PUSH_ACTION_EVENT, onAction);
    };
  }, []);

  const icon = useMemo(() => {
    if (!banner) {
      return null;
    }
    if (banner.type === "chat") {
      return <MessageCircleMore className="h-4 w-4" />;
    }
    return <BellRing className="h-4 w-4" />;
  }, [banner]);

  if (!banner) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[90] mx-auto w-[min(94vw,32rem)]">
      <div className="pointer-events-auto rounded-[1.2rem] border border-primary/30 bg-[linear-gradient(180deg,_oklch(0.2_0.015_45),_oklch(0.165_0.014_42))] p-3 shadow-[0_20px_48px_-30px_oklch(0.03_0.02_45_/0.95)] backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border border-primary/30 bg-primary/12 text-primary">
            {icon}
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="truncate text-sm font-semibold text-foreground">{banner.title}</p>
            <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">{banner.body}</p>
            <div className="pt-1">
              <Link
                href={banner.route}
                onClick={() => setBanner(null)}
                className="inline-flex rounded-full border border-border/55 bg-background/35 px-3 py-1 text-[0.66rem] font-medium uppercase tracking-[0.18em] text-foreground"
              >
                Open
              </Link>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setBanner(null)}
            className="rounded-full border border-border/50 bg-background/35 p-1.5 text-muted-foreground"
            aria-label="Dismiss notification banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
