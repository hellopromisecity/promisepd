"use client";

/** Persistent "install app" FAB — a fallback for when the auto popup
 *  (PWAInstallPrompt) is missed or dismissed.  Sits between the WhatsApp
 *  (bottom-left) and scroll-to-top (bottom-right) FABs on mobile/tablet, and
 *  is hidden on lg+ (where the browser's own address-bar install affordance
 *  is obvious).  The installed PWA hides it via the parent `.pwa-hide`
 *  wrapper in layout.tsx.  Only renders when the app is actually
 *  installable (Android/desktop beforeinstallprompt, or iOS Safari). */

import { useEffect, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X } from "lucide-react";
import { stripLocale } from "@/lib/i18n";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const COPY = {
  bn: {
    label: "ইনস্টল",
    aria: "অ্যাপ ইনস্টল করুন",
    iosHint: "Safari-র শেয়ার বাটনে ট্যাপ করুন → “Add to Home Screen” সিলেক্ট করুন।",
    close: "বন্ধ করুন",
  },
  en: {
    label: "Install",
    aria: "Install the app",
    iosHint: "Tap Safari’s Share button → choose “Add to Home Screen”.",
    close: "Close",
  },
};

export default function PwaInstallButton() {
  const { locale } = stripLocale(usePathname() || "/");
  const T = COPY[locale];

  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [iosOpen, setIosOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone;
    if (standalone) {
      setInstalled(true);
      return;
    }

    const ua = window.navigator.userAgent;
    setIsIOS(
      /iPad|iPhone|iPod/.test(ua) &&
        !(window as Window & { MSStream?: unknown }).MSStream,
    );

    const handler = (ev: Event) => {
      ev.preventDefault();
      setDeferred(ev as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function handleClick() {
    if (deferred) {
      try {
        await deferred.prompt();
        await deferred.userChoice;
      } catch {
        /* the event can only be prompted once */
      } finally {
        setDeferred(null);
      }
    } else if (isIOS) {
      setIosOpen((o) => !o);
    }
  }

  // Only show when genuinely installable and not already installed.
  if (installed || (!deferred && !isIOS)) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 flex-col items-center gap-1.5 lg:hidden">
      <AnimatePresence>
        {iosOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="relative mb-1 max-w-[240px] rounded-2xl border border-border bg-white px-4 py-3 text-center shadow-xl"
          >
            <button
              onClick={() => setIosOpen(false)}
              aria-label={T.close}
              className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-white text-fg-muted shadow"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <p className="text-xs leading-snug text-fg-muted">{T.iosHint}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <span className="rounded-full border border-border bg-white px-2 py-0.5 text-[11px] font-bold leading-none text-fg shadow-sm">
        {T.label}
      </span>

      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3, type: "spring", damping: 13 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleClick}
        aria-label={T.aria}
        className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-2xl ring-1 ring-border"
      >
        <Image src="/icon.png" alt="" width={44} height={44} className="rounded-2xl" />
        <span className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-brand-blue text-white shadow-md ring-2 ring-white">
          <Download className="h-3.5 w-3.5" />
        </span>
      </motion.button>
    </div>
  );
}
