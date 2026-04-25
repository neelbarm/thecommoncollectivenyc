"use client";

import { useEffect } from "react";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { Keyboard, KeyboardResize, KeyboardStyle } from "@capacitor/keyboard";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style as StatusBarStyle } from "@capacitor/status-bar";

const RESUME_EVENT = "cc-capacitor-resume";

/**
 * Runs only inside the Capacitor native shell. Configures status bar, keyboard,
 * splash handoff, and exposes a document event when the app returns from background.
 */
export function CapacitorNativeBridge() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    document.documentElement.classList.add("cc-native");

    let cancelled = false;

    const run = async () => {
      try {
        await StatusBar.setOverlaysWebView({ overlay: true });
        await StatusBar.setStyle({ style: StatusBarStyle.Dark });
      } catch {
        // Status bar APIs can fail on simulators or restricted WebViews; ignore.
      }

      try {
        await Keyboard.setResizeMode({ mode: KeyboardResize.Native });
        await Keyboard.setStyle({ style: KeyboardStyle.Dark });
      } catch {
        // Keyboard plugin optional on some builds
      }

      try {
        await SplashScreen.hide({ fadeOutDuration: 220 });
      } catch {
        // Splash may already be hidden
      }

      if (cancelled) {
        return;
      }

      let resumeHandle: { remove: () => Promise<void> } | undefined;

      try {
        resumeHandle = await App.addListener("resume", () => {
          window.dispatchEvent(new CustomEvent(RESUME_EVENT));
        });
      } catch {
        // App lifecycle listener optional
      }

      return () => {
        void resumeHandle?.remove();
      };
    };

    let cleanupFromRun: (() => void) | undefined;

    void run().then((fn) => {
      cleanupFromRun = fn;
    });

    return () => {
      cancelled = true;
      cleanupFromRun?.();
    };
  }, []);

  return null;
}

export function isCapacitorNative(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export async function nativeNavHaptic(): Promise<void> {
  if (!isCapacitorNative()) {
    return;
  }
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    // Haptics unavailable (e.g. simulator without haptics)
  }
}

export { RESUME_EVENT };
