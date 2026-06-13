import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/?source=pwa",
    name: "Promise Proper Development Ltd. — স্বপ্ন যেখানে বাস্তব",
    short_name: "PromisePD",
    description:
      "ঢাকার বিশ্বস্ত আবাসন অংশীদার। ৫টি বিভাগে এক ছাদের নিচে — রিয়েল এস্টেট, নির্মাণ, সঞ্চয়, হজ্জ ও ৩ডি ডিজাইন।",
    // Installed PWA opens straight to the login page (the app entry point
    // for members). `id` stays "/?source=pwa" so existing installs update
    // in place rather than registering as a new app.
    start_url: "/login?source=pwa",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "any",
    background_color: "#ffffff",
    // Brand blue — matches the logo's primary colour.  Drives the
    // PWA title-bar tint on Android, the iOS status-bar accent, and
    // the new-tab card background in Chrome's tab strip.
    theme_color: "#1847A1",
    categories: ["business", "real-estate", "lifestyle", "finance", "travel"],
    lang: "bn",
    dir: "ltr",
    scope: "/",
    icons: [
      { src: "/icon.png", sizes: "256x256", type: "image/png", purpose: "any" },
      { src: "/logo.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/logo.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png", purpose: "any" },
      { src: "/logo.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/logo.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    // Rich install previews — Chrome/Edge show these in the install dialog.
    screenshots: [
      {
        src: "/screenshot-wide-v2.png",
        sizes: "1280x720",
        type: "image/png",
        form_factor: "wide",
        label: "PromisePD — Dhaka's trusted real-estate partner",
      },
      {
        // Square so it fills Chrome's (roughly square) mobile install-dialog
        // cell — a tall portrait letterboxes left with a dead gap on the
        // right. Card art is centred on a branded panel inside the image.
        src: "/screenshot-mobile-v2.png",
        sizes: "1280x1280",
        type: "image/png",
        form_factor: "narrow",
        label: "PromisePD — five business divisions",
      },
    ],
    shortcuts: [
      {
        name: "প্রকল্প",
        short_name: "প্রকল্প",
        description: "চলমান প্রকল্প দেখুন",
        url: "/?source=pwa#projects",
        icons: [{ src: "/icon.png", sizes: "256x256" }],
      },
      {
        name: "আমাদের বিভাগ",
        short_name: "বিভাগ",
        description: "৫টি বিভাগ দেখুন",
        url: "/?source=pwa#divisions",
        icons: [{ src: "/icon.png", sizes: "256x256" }],
      },
      {
        name: "যোগাযোগ",
        short_name: "যোগাযোগ",
        description: "যোগাযোগ করুন",
        url: "/?source=pwa#contact",
        icons: [{ src: "/icon.png", sizes: "256x256" }],
      },
    ],
    prefer_related_applications: false,
  };
}
