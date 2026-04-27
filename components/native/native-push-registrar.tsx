"use client";

import { useEffect } from "react";

import {
  ensureNativePushRegistration,
  getNativeDeviceContext,
  isCapacitorNative,
  PUSH_REGISTERED_EVENT,
} from "@/components/native/capacitor-native-bridge";

type RegisterPayload = {
  token: string;
  platform: "ios";
  appBundle?: string | null;
  environment?: string | null;
  deviceModel?: string | null;
  osVersion?: string | null;
  locale?: string | null;
  deviceId?: string | null;
};

async function sendTokenToBackend(payload: RegisterPayload) {
  await fetch("/api/push/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export function NativePushRegistrar() {
  useEffect(() => {
    if (!isCapacitorNative()) {
      return;
    }

    const handlePushRegistered = async (event: Event) => {
      const custom = event as CustomEvent<{ token?: string }>;
      const token = custom.detail?.token;
      if (!token) {
        return;
      }

      const context = await getNativeDeviceContext();
      await sendTokenToBackend({
        token,
        platform: "ios",
        appBundle: context?.appBundle ?? null,
        environment: context?.environment ?? null,
        deviceModel: context?.deviceModel ?? null,
        osVersion: context?.osVersion ?? null,
        locale: context?.locale ?? null,
        deviceId: context?.deviceId ?? null,
      });
    };

    window.addEventListener(PUSH_REGISTERED_EVENT, handlePushRegistered);
    void ensureNativePushRegistration();

    return () => {
      window.removeEventListener(PUSH_REGISTERED_EVENT, handlePushRegistered);
    };
  }, []);

  return null;
}
