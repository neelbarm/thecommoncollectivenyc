/**
 * Updates the iOS app icon badge from server unread counts. No-op on web.
 */
export async function syncInboxBadgeFromServer(): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const { Capacitor } = await import("@capacitor/core");
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const { Badge } = await import("@capawesome/capacitor-badge");

    const response = await fetch("/api/inbox/unread", { cache: "no-store" });
    if (!response.ok) {
      return;
    }
    const payload = (await response.json()) as { ok?: boolean; total?: number };
    if (!payload.ok || typeof payload.total !== "number") {
      return;
    }
    const supported = await Badge.isSupported();
    if (!supported.isSupported) {
      return;
    }
    await Badge.set({ count: Math.max(0, Math.min(payload.total, 99)) });
  } catch {
    // Ignore: simulator, permissions, or plugin unavailable.
  }
}
