"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * "Install to home screen" button — shown only when the admin panel is NOT
 * already installed. Uses the native beforeinstallprompt where available
 * (Chrome/Edge/Android), and falls back to iOS Safari instructions.
 */
export function PwaInstallButton() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const nav = navigator as Navigator & { standalone?: boolean };
    const standalone = window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
    // One-time detection from browser APIs only available after mount.
    if (standalone) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInstalled(true);
      return;
    }
    setIsIOS(/iphone|ipad|ipod/i.test(nav.userAgent));

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  // Already installed, or no way to install here → render nothing.
  if (installed || (!deferred && !isIOS)) return null;

  async function onClick() {
    if (deferred) {
      await deferred.prompt();
      await deferred.userChoice;
      setDeferred(null);
    } else {
      setShowHelp((value) => !value);
    }
  }

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={onClick}
        aria-label="ホーム画面に追加"
        className="flex items-center gap-1.5 rounded-full border border-[var(--color-accent)] px-3 py-1.5 text-xs font-medium text-[var(--color-accent)] transition hover:bg-[var(--color-accent)]/10"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
        </svg>
        <span className="hidden sm:inline">インストール</span>
      </button>

      {showHelp ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-neutral-200 bg-white p-3 text-xs leading-relaxed text-neutral-600 shadow-lg">
          Safari下部の共有ボタンから「ホーム画面に追加」を選択すると、アプリとしてインストールできます。
          <button type="button" onClick={() => setShowHelp(false)} className="mt-2 block font-medium text-[var(--color-accent)]">
            閉じる
          </button>
        </div>
      ) : null}
    </div>
  );
}
