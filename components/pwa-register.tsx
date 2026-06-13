"use client";

import { useEffect, useState } from "react";
import { Download, WifiOff, X } from "lucide-react";
import { processQueue } from "@/lib/client/offline-queue";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PwaRegister() {
  const [isOnline, setIsOnline] = useState(true);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [showOffline, setShowOffline] = useState(false);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      setShowOffline(false);
      window.dispatchEvent(new CustomEvent("app:online"));
      try {
        const result = await processQueue();
        if (result.processed > 0) {
          window.location.reload();
        }
      } catch {
        // Queue processing will be retried on next online event.
      }
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowOffline(true);
      window.dispatchEvent(new CustomEvent("app:offline"));
    };

    setIsOnline(navigator.onLine);
    setShowOffline(!navigator.onLine);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setShowInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("SW registered:", registration.scope);
        })
        .catch((error) => {
          console.error("SW registration failed:", error);
        });
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  async function handleInstall() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setShowInstall(false);
      setInstallPrompt(null);
    }
  }

  return (
    <>
      {showOffline && (
        <div className="fixed left-4 right-4 top-4 z-50 flex items-center gap-3 rounded-[18px] bg-orange p-4 text-forest shadow-lg">
          <WifiOff className="h-5 w-5 shrink-0" strokeWidth={2.25} />
          <p className="flex-1 text-sm font-semibold">
            Anda offline. Data akan disimpan dan dikirim ulang saat koneksi tersedia.
          </p>
          <button
            aria-label="Tutup"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-forest/10"
            onClick={() => setShowOffline(false)}
            type="button"
          >
            <X className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>
      )}

      {showInstall && isOnline && (
        <div className="fixed bottom-24 left-4 right-4 z-50 flex items-center gap-3 rounded-[18px] bg-forest p-4 text-white shadow-lg">
          <Download className="h-5 w-5 shrink-0" strokeWidth={2.25} />
          <p className="flex-1 text-sm font-semibold">
            Install Scresh di perangkat untuk akses lebih cepat dan offline.
          </p>
          <button
            className="rounded-[10px] bg-lime px-3 py-2 text-sm font-bold text-forest"
            onClick={handleInstall}
            type="button"
          >
            Install
          </button>
          <button
            aria-label="Tutup"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10"
            onClick={() => setShowInstall(false)}
            type="button"
          >
            <X className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>
      )}
    </>
  );
}
