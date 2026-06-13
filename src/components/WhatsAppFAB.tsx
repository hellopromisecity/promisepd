"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { SITE } from "@/lib/site";
import { stripLocale } from "@/lib/i18n";

const FAB_T = {
  bn: {
    tipBold: "হ্যালো!",
    tip: "হোয়াটসঅ্যাপে দ্রুত উত্তর পান।",
    replyTime: "সাধারণত কয়েক মিনিটে উত্তর",
    greeting: "আসসালামু আলাইকুম! কীভাবে সাহায্য করতে পারি?",
    startChat: "চ্যাট শুরু করুন",
    aria: "WhatsApp চ্যাট",
    waText: "আসসালামু আলাইকুম। আমি প্রমিস PPD-এর প্রকল্প সম্পর্কে জানতে চাই।",
  },
  en: {
    tipBold: "Hello!",
    tip: "Get a quick reply on WhatsApp.",
    replyTime: "Usually replies in minutes",
    greeting: "Assalamu Alaikum! How can we help you?",
    startChat: "Start chat",
    aria: "WhatsApp chat",
    waText: "Assalamu Alaikum. I'd like to know about PromisePD's projects.",
  },
} as const;

function WhatsAppIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden {...props}>
      <path d="M16 .5C7.45.5.55 7.4.55 15.95c0 2.82.74 5.56 2.14 7.97L.5 31.5l7.78-2.04a15.4 15.4 0 0 0 7.72 1.97h.01c8.55 0 15.45-6.9 15.45-15.45 0-4.12-1.6-8-4.52-10.92A15.36 15.36 0 0 0 16 .5Zm0 28.34c-2.36 0-4.67-.63-6.7-1.83l-.48-.28-4.62 1.21 1.23-4.5-.31-.5a12.84 12.84 0 1 1 10.88 5.9Zm7.05-9.61c-.39-.2-2.28-1.12-2.63-1.25-.35-.13-.6-.2-.86.2-.26.39-1 1.25-1.22 1.51-.22.26-.45.29-.84.1-.39-.2-1.63-.6-3.1-1.92a11.69 11.69 0 0 1-2.16-2.69c-.22-.39-.02-.6.17-.79.17-.17.39-.45.58-.68.2-.23.26-.39.39-.65.13-.26.07-.49-.03-.68-.1-.2-.86-2.07-1.18-2.83-.31-.74-.62-.64-.86-.65l-.74-.01c-.26 0-.68.1-1.03.49s-1.35 1.32-1.35 3.2 1.38 3.71 1.57 3.97c.2.26 2.7 4.13 6.55 5.79.92.4 1.63.63 2.19.81.92.29 1.75.25 2.42.15.74-.11 2.28-.93 2.6-1.83.32-.9.32-1.67.22-1.83-.1-.16-.36-.26-.74-.45Z" />
    </svg>
  );
}

export default function WhatsAppFAB() {
  const [open, setOpen] = useState(false);
  const [tipDismissed, setTipDismissed] = useState(false);
  const pathname = usePathname() || "/";
  const { locale } = stripLocale(pathname);
  const t = FAB_T[locale];

  useEffect(() => {
    const timer = setTimeout(() => setTipDismissed(true), 6000);
    return () => clearTimeout(timer);
  }, []);

  const href = `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(t.waText)}`;

  return (
    <div className="fixed bottom-6 left-6 z-40 flex items-end gap-3 sm:left-6">
      <AnimatePresence>
        {!tipDismissed && !open && (
          <motion.div
            initial={{ opacity: 0, x: -20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.9 }}
            transition={{ delay: 1.5, duration: 0.4 }}
            className="hidden sm:block mb-2 max-w-[220px] rounded-2xl rounded-bl-sm bg-white border border-border px-4 py-3 shadow-lg"
          >
            <p className="text-xs text-fg-muted">
              <span className="font-semibold text-fg">{t.tipBold}</span> {t.tip}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col items-start gap-2">
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="mb-2 w-72 rounded-2xl bg-white border border-border shadow-2xl overflow-hidden"
            >
              <div className="bg-[#25d366] px-4 py-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center">
                  <WhatsAppIcon className="h-6 w-6 text-[#25d366]" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">
                    PromisePD
                  </div>
                  <div className="text-[11px] text-white/90">
                    {t.replyTime}
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="rounded-2xl rounded-bl-sm bg-bg-soft p-3">
                  <p className="text-xs text-fg-muted mb-1">PromisePD</p>
                  <p className="text-sm">{t.greeting}</p>
                </div>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="mt-3 flex items-center justify-center gap-2 w-full rounded-xl bg-[#25d366] hover:bg-[#1ebd58] px-4 py-2.5 text-sm font-semibold text-white transition-colors"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  {t.startChat}
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 1, type: "spring", damping: 12 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setOpen((o) => !o)}
          aria-label={t.aria}
          className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[#25d366] hover:bg-[#1ebd58] text-white shadow-2xl shadow-[#25d366]/40 transition-colors wa-pulse"
        >
          <WhatsAppIcon className="h-8 w-8" />
        </motion.button>
      </div>
    </div>
  );
}
