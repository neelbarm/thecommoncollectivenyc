"use client";

import { useEffect } from "react";

import { isCapacitorNative, RESUME_EVENT } from "@/components/native/capacitor-native-bridge";
import { syncInboxBadgeFromServer } from "@/lib/native/sync-inbox-badge";

export function NativeBadgeSync() {
  useEffect(() => {
    if (!isCapacitorNative()) {
      return;
    }

    void syncInboxBadgeFromServer();

    const onResume = () => {
      void syncInboxBadgeFromServer();
    };

    window.addEventListener(RESUME_EVENT, onResume);
    return () => {
      window.removeEventListener(RESUME_EVENT, onResume);
    };
  }, []);

  return null;
}
