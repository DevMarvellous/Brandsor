"use client";

import { useEffect, useState } from "react";
import { Download, X, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "installPromptDismissedAt";
const SUPPRESS_DAYS = 7;
const SHOW_DELAY_MS = 4000; // let people see the app first; don't pounce on load

function recentlyDismissed(): boolean {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY) || 0);
    return Date.now() - at < SUPPRESS_DAYS * 86_400_000;
  } catch {
    return false;
  }
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [mode, setMode] = useState<"android" | "ios" | null>(null);

  useEffect(() => {
    // Don't urge installation on the public profile (it's a clean showcase for
    // visitors who aren't users yet), or if already installed / recently dismissed.
    if (window.location.pathname.startsWith("/b/")) return;
    if (isStandalone() || recentlyDismissed()) return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setTimeout(() => setMode("android"), SHOW_DELAY_MS);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    // iOS has no beforeinstallprompt — show an instructional hint instead.
    let iosTimer: ReturnType<typeof setTimeout> | undefined;
    if (isIos()) {
      iosTimer = setTimeout(() => setMode("ios"), SHOW_DELAY_MS);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      if (iosTimer) clearTimeout(iosTimer);
    };
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    setMode(null);
    setDeferred(null);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice.catch(() => undefined);
    dismiss();
  };

  if (!mode) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] p-3 sm:p-4 pointer-events-none">
      <div className="pointer-events-auto max-w-md mx-auto flex items-center gap-3 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a1a] shadow-lg p-3 sm:p-4 animate-fade-in-up">
        <div className="w-10 h-10 shrink-0 rounded-xl bg-primary flex items-center justify-center font-bold text-black">
          B
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Install Brandsor</p>
          {mode === "android" ? (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              Add it to your home screen for quick access.
            </p>
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Tap <Share className="inline w-3.5 h-3.5 -mt-0.5" /> then{" "}
              <span className="font-medium">Add to Home Screen</span>.
            </p>
          )}
        </div>

        {mode === "android" && (
          <button
            onClick={install}
            className="shrink-0 flex items-center gap-1.5 bg-primary text-black text-sm font-semibold px-3 py-2 rounded-xl hover:bg-amber-400 transition-colors"
          >
            <Download className="w-4 h-4" /> Install
          </button>
        )}

        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
