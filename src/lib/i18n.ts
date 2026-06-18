/** Bilingual foundation.
 *
 *  The site ships in TWO fully-separate versions:
 *    • Bengali  — the DEFAULT, at the root domain (`/`, `/blog`, …)
 *    • English  — under the `/en` prefix (`/en`, `/en/blog`, …)
 *
 *  Rule (per the owner): an English page shows NO Bengali and a Bengali
 *  page shows NO English — EXCEPT the official application forms, whose
 *  content stays Bengali in both versions (they mirror real paper forms).
 *
 *  This module is the single source of truth for:
 *    • the Locale type + helpers to add/strip the `/en` prefix
 *    • the UI-string dictionary (navbar, footer, buttons, common chrome)
 *
 *  Page CONTENT (divisions, projects, blog, story) carries its English
 *  text alongside the Bengali in src/lib/site.ts etc.; this file holds
 *  the reusable interface strings. */

export type Locale = "bn" | "en";

export const LOCALES: Locale[] = ["bn", "en"];
export const DEFAULT_LOCALE: Locale = "bn";

/** Strip a leading `/en` (or `/en/...`) → the locale-neutral path. */
export function stripLocale(pathname: string): { locale: Locale; rest: string } {
  if (pathname === "/en" || pathname.startsWith("/en/")) {
    const rest = pathname.slice(3) || "/";
    return { locale: "en", rest };
  }
  return { locale: "bn", rest: pathname || "/" };
}

/** Build the href for `path` in `locale` (bn = root, en = /en prefix). */
export function localizedPath(path: string, locale: Locale): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (locale === "en") return clean === "/" ? "/en" : `/en${clean}`;
  return clean;
}

/** Swap the current path to the other locale (used by the switcher). */
export function swapLocale(pathname: string, to: Locale): string {
  const { rest } = stripLocale(pathname);
  return localizedPath(rest, to);
}

/** Reusable UI / chrome strings. Page content lives with the data. */
type Dict = {
  // nav labels (keyed by NAV item id)
  nav: Record<string, string>;
  // common buttons + chrome
  login: string;
  signup: string;
  accountNav: string;
  dashboardNav: string;
  call: string;
  menu: string;
  openMenu: string;
  closeMenu: string;
  langName: string; // this locale's own name, for the switcher
  footer: {
    brand: string;
    tagline: string;
    about: string;
    follow: string;
    quickLinks: string;
    contact: string;
    rights: string;
  };
  home: {
    detailsBtn: string;
    aboutBtn: string;
    autoRotate: string;
    divisionWord: string;
    viewDivision: string;
    trustChips: string[];
    fromPrice: string;
    about: { eyebrow: string; headA: string; headB: string; body1: string; body2: string };
    divisions: { eyebrow: string; headA: string; headB: string; sub: string };
    projects: { eyebrow: string; headA: string; headB: string; sub: string };
    why: { eyebrow: string; headA: string; headB: string };
    testimonials: { eyebrow: string; headA: string; headB: string };
  };
  contact: {
    eyebrow: string;
    headA: string;
    headB: string;
    sub: string;
    labelPhone: string;
    labelEmail: string;
    labelOffice: string;
    labelHours: string;
    fName: string;
    phName: string;
    fEmail: string;
    fPhone: string;
    phPhone: string;
    fInterest: string;
    fMessage: string;
    phMessage: string;
    send: string;
    sending: string;
    consent: string;
    ok: string;
    err: string;
  };
  newsletter: {
    headA: string;
    headB: string;
    sub: string;
    placeholder: string;
    subscribe: string;
    subscribing: string;
    subscribed: string;
    perks: string[];
  };
  blog: {
    journal: string;
    headA: string;
    headB: string;
    sub: string;
    searchPh: string;
    searchAria: string;
    clear: string;
    allProjects: string;
    allCategories: string;
    posts: string;
    projectLabel: string;
    categoryLabel: string;
    forQuery: string;
    reset: string;
    prev: string;
    next: string;
    readMins: string;
    readMinsLong: string;
    views: string;
    emptyTitle: string;
    emptySub: string;
    emptyReset: string;
    minRead: string;
    relatedTitle: string;
    backToBlog: string;
    by: string;
    backToList: string;
    authorLabel: string;
    authorBio: string;
    ctaHead: string;
    ctaSub: string;
    sendMsg: string;
    prevPost: string;
    nextPost: string;
  };
  projDetail: {
    allProjects: string;
    fromPrice: string;
    bookVisit: string;
    floorPlan: string;
    bldgStatusA: string;
    bldgStatusB: string;
    bldgSummary: (total: string, sold: string, booking: string) => string;
    booking: string;
    soldOut: string;
    coming: string;
    bldgNowBooking: (n: string) => string;
    bldgCta: string;
    urgentContact: string;
    paymentA: string;
    paymentB: string;
    rulesA: string;
    rulesB: string;
    zoom: string;
    unitA: string;
    unitB: string;
    unitSub: string;
    legendOpen: string;
    legendSold: string;
    legendRented: string;
    open: string;
    rented: string;
    unitCta: string;
    bookingContact: string;
    parkingTitle: string;
    parkingTotal: string;
    parkingSold: string;
    parkingFree: string;
    plotsA: string;
    plotsB: string;
    plotsSub: string;
    perDecimal: string;
    perKatha: string;
    conversion: string;
    layoutPlan: string;
    aboutA: string;
    aboutB: string;
    docCaption: string;
    galleryA: string;
    galleryB: string;
    videos: string;
    ctaSuffix: string;
    contactBtn: string;
    share: { headA: string; headB: string; total: (t: string) => string; soldCount: (s: string) => string; remaining: (r: string) => string; filterOpen: (r: string) => string; filterSold: (s: string) => string; filterAll: (t: string) => string; legendOpen: string; legendSold: string; soldLabel: string; openLabel: string; bookBtn: string; empty: string };
  };
  divDetail: {
    backToDivisions: string;
    consult: string;
    otherDivisions: string;
    aboutEyebrow: string;
    aboutSuffix: string;
    featEyebrow: string;
    featHeadA: string;
    featHeadB: string;
    projEyebrow: string;
    projHeadA: string;
    projHeadB: string;
    ctaSuffix: string;
    ctaMore: string;
    ctaSub: string;
    sendMsg: string;
    prevDiv: string;
    nextDiv: string;
  };
  auth: {
    loginH: string;
    loginHb: string;
    loginSub: string;
    signupH: string;
    signupHb: string;
    signupSub: string;
    fullName: string;
    phName: string;
    loginId: string;
    mobile: string;
    mobileHint: string;
    countrySearch: string;
    countrySelect: string;
    emailOrUser: string;
    phEmailOrUser: string;
    password: string;
    remember: string;
    forgot: string;
    processing: string;
    loginBtn: string;
    signupBtn: string;
    noAccount: string;
    signupLink: string;
    haveAccount: string;
    loginLink: string;
    pwHide: string;
    pwShow: string;
  };
  account: {
    title: string;
    greeting: string;
    subtitle: string;
    profileHead: string;
    nameLabel: string;
    mobileLabel: string;
    usernameLabel: string;
    emailLabel: string;
    notSet: string;
    memberSince: string;
    quickHead: string;
    forms: string;
    formsSub: string;
    contact: string;
    contactSub: string;
    projects: string;
    projectsSub: string;
    logout: string;
    loggingOut: string;
  };
};

export const DICT: Record<Locale, Dict> = {
  bn: {
    nav: {
      home: "হোম",
      divisions: "বিভাগ",
      projects: "প্রকল্প",
      forms: "ফর্ম",
      gallery: "গ্যালারি",
      partner: "পার্টনার হোন",
      leaderboard: "লিডারবোর্ড",
      team: "টিম",
      story: "পেছনের গল্প",
      blog: "ব্লগ",
      contact: "যোগাযোগ",
    },
    login: "লগইন",
    dashboardNav: "ড্যাশবোর্ড",
    signup: "সাইন আপ",
    accountNav: "অ্যাকাউন্ট",
    call: "কল করুন",
    menu: "মেনু",
    openMenu: "মেনু খুলুন",
    closeMenu: "মেনু বন্ধ করুন",
    langName: "বাংলা",
    footer: {
      brand: "প্রমিস সিটি",
      tagline: "স্বপ্ন যেখানে বাস্তব",
      about:
        "১৫+ বছর ধরে ঢাকার মানুষকে সেবা দিয়ে আসছি — রিয়েল এস্টেট, নির্মাণ, সঞ্চয়, হজ্জ ও ডিজাইন।",
      follow: "অনুসরণ করুন",
      quickLinks: "দ্রুত লিঙ্ক",
      contact: "যোগাযোগ",
      rights: "সর্বস্বত্ব সংরক্ষিত।",
    },
    home: {
      detailsBtn: "বিস্তারিত দেখুন",
      aboutBtn: "আমাদের সম্পর্কে",
      autoRotate: "স্বয়ংক্রিয়ভাবে পরিবর্তিত হয়",
      divisionWord: "বিভাগ",
      viewDivision: "বিভাগটি দেখুন",
      trustChips: ["আইনি নিরাপত্তা", "গুণগত নির্মাণ", "প্রিমিয়াম এলাকা", "নমনীয় কিস্তি"],
      fromPrice: "শুরু",
      about: {
        eyebrow: "আমাদের গল্প",
        headA: "আমরা শুধু ভবন তৈরি করি না।",
        headB: "প্রতিশ্রুতি গড়ি।",
        body1:
          "২০১০ সাল থেকে প্রমিস গ্রুপ ঢাকার মাটিতে নিঃশব্দে এক অবিচল শক্তি — পরিবারগুলোকে এমন বাড়িতে পৌঁছে দিচ্ছি যা তাঁদের জীবন, বাজেট ও ভবিষ্যতের সাথে মেলে।",
        body2:
          "আজ আমরা ৫টি বিভাগে কাজ করি — প্রমিস সিটি (রিয়েল এস্টেট), আহবাব রিয়েল এস্টেট (নির্মাণ), প্রমিস ইন্টারন্যাশনাল (সঞ্চয়), আহবাব ট্রাভেলস (হজ্জ/উমরাহ), এবং ইঞ্জিনিয়ারিং ও ইন্টেরিয়র ডিজাইন।",
      },
      divisions: {
        eyebrow: "আমাদের বিভাগ",
        headA: "৫টি বিভাগ —",
        headB: "এক ছাদের নিচে।",
        sub: "প্রমিস গ্রুপের পাঁচটি মূল ব্যবসায়িক বিভাগ — রিয়েল এস্টেট, নির্মাণ, সঞ্চয়, হজ্জ এবং ডিজাইন। প্রতিটি বিভাগে আমরা সেরাটাই দিই।",
      },
      projects: {
        eyebrow: "চলমান প্রকল্প",
        headA: "যেখানে মানুষ",
        headB: "পরবর্তী ঠিকানা গড়ছে।",
        sub: "বাছাইকৃত সাইট, স্বচ্ছ মূল্য, নমনীয় পরিকল্পনা। নিচের প্রতিটি প্রকল্প বাস্তব, চলমান এবং আজই বুকিংযোগ্য।",
      },
      why: {
        eyebrow: "কেন প্রমিস PPD",
        headA: "যে কারণে মানুষ",
        headB: "আমাদের বেছে নেয়।",
      },
      testimonials: {
        eyebrow: "বাস্তব কণ্ঠ",
        headA: "আমাদের পরিবার",
        headB: "যা বলে।",
      },
    },
    contact: {
      eyebrow: "যোগাযোগ",
      headA: "চলুন খুঁজে নিই",
      headB: "আপনার পরবর্তী বাড়ি।",
      sub: "একটি বার্তা পাঠান — আমরা খুব শীঘ্রই আপনার সাথে যোগাযোগ করবো।",
      labelPhone: "ফোন",
      labelEmail: "ইমেইল",
      labelOffice: "অফিস",
      labelHours: "সময়",
      fName: "আপনার নাম",
      phName: "পূর্ণ নাম",
      fEmail: "ইমেইল",
      fPhone: "ফোন (ঐচ্ছিক)",
      phPhone: "+৮৮০ ১XXX-XXXXXX",
      fInterest: "আগ্রহের বিষয়",
      fMessage: "বার্তা",
      phMessage: "আপনি কী খুঁজছেন একটু লিখুন...",
      send: "বার্তা পাঠান",
      sending: "পাঠানো হচ্ছে...",
      consent: "ফর্ম জমা দিয়ে আপনি আমাদের যোগাযোগ করার অনুমতি দিচ্ছেন।",
      ok: "ধন্যবাদ — আমরা খুব শীঘ্রই আপনার সাথে যোগাযোগ করবো।",
      err: "কিছু একটা সমস্যা হয়েছে, আবার চেষ্টা করুন।",
    },
    newsletter: {
      headA: "আপডেট পেতে",
      headB: "যুক্ত থাকুন।",
      sub: "নতুন প্রকল্প, কিস্তি অফার ও প্রি-লঞ্চ সুবিধার খবর সবার আগে আপনার ইনবক্সে পৌঁছে দেবো — কোনো স্প্যাম নেই।",
      placeholder: "you@example.com",
      subscribe: "সাবস্ক্রাইব",
      subscribing: "পাঠানো হচ্ছে...",
      subscribed: "সাবস্ক্রাইব হয়েছে",
      perks: ["নতুন প্রকল্প", "কিস্তি অফার", "প্রি-লঞ্চ সুবিধা"],
    },
    blog: {
      journal: "প্রমিস জার্নাল",
      headA: "রিয়েল এস্টেট",
      headB: "জ্ঞান, আপনার ভাষায়।",
      sub: "প্রকল্প পরিচিতি, মার্কেটিং নোটিশ, বুকিং নিয়মাবলী এবং ফ্ল্যাট-জমি কেনার বিস্তারিত গাইড — সবকিছু এক জায়গায়।",
      searchPh: "শিরোনাম বা বিষয় দিয়ে খুঁজুন…",
      searchAria: "ব্লগ খুঁজুন",
      clear: "ক্লিয়ার",
      allProjects: "সকল প্রকল্প",
      allCategories: "সকল ক্যাটাগরি",
      posts: "টি পোস্ট",
      projectLabel: "প্রকল্প",
      categoryLabel: "ক্যাটাগরি",
      forQuery: "এর জন্য",
      reset: "ফিল্টার রিসেট",
      prev: "পূর্ববর্তী",
      next: "পরবর্তী",
      readMins: "মিনিট",
      readMinsLong: "মিনিট পড়া",
      views: "ভিউ",
      emptyTitle: "কোনো পোস্ট পাওয়া যায়নি",
      emptySub: "ভিন্ন ক্যাটাগরি বা অন্য কীওয়ার্ড দিয়ে আবার চেষ্টা করুন।",
      emptyReset: "ফিল্টার রিসেট করুন",
      minRead: "মিনিট পড়া",
      relatedTitle: "সম্পর্কিত পোস্ট",
      backToBlog: "সব পোস্ট",
      by: "লিখেছেন",
      backToList: "সব পোস্টে ফিরুন",
      authorLabel: "লেখক",
      authorBio:
        "প্রমিস গ্রুপের প্রতিষ্ঠাতা ও প্রধান পরিচালক — ১৫+ বছরের অভিজ্ঞতায় ঢাকার রিয়েল এস্টেট ইন্ডাস্ট্রিতে স্বচ্ছতা ও বিশ্বাসের নতুন মান গড়ে তুলেছেন।",
      ctaHead: "আরও জানতে চান?",
      ctaSub:
        "এই পোস্টের বিষয়ে প্রশ্ন থাকলে অথবা ব্যক্তিগত পরামর্শ চাইলে সরাসরি যোগাযোগ করুন।",
      sendMsg: "বার্তা পাঠান",
      prevPost: "পূর্ববর্তী পোস্ট",
      nextPost: "পরবর্তী পোস্ট",
    },
    projDetail: {
      allProjects: "সব প্রকল্প",
      fromPrice: "শুরু",
      bookVisit: "সাইট ভিজিট বুক করুন",
      floorPlan: "ফ্লোর প্ল্যান দেখুন",
      bldgStatusA: "ভবন",
      bldgStatusB: "স্ট্যাটাস",
      bldgSummary: (total, sold, booking) =>
        `মোট ${total}টি ভবন · ${sold}টি বিক্রি শেষ · ভবন ${booking}-এ বুকিং চলছে`,
      booking: "বুকিং",
      soldOut: "বিক্রি শেষ",
      coming: "আসছে",
      bldgNowBooking: (n) => `ভবন ${n}-এ এখন বুকিং চলছে`,
      bldgCta: "পছন্দের ইউনিট নিশ্চিত করতে এখনই যোগাযোগ করুন — সীমিত ইউনিট।",
      urgentContact: "জরুরি যোগাযোগ",
      paymentA: "পেমেন্ট ও",
      paymentB: "দলিল",
      rulesA: "বিস্তারিত",
      rulesB: "নিয়মাবলী",
      zoom: "বড় করে দেখুন",
      unitA: "ইউনিট",
      unitB: "অ্যাভেইলেবিলিটি",
      unitSub: "কোন ইউনিট খালি আর কোনটি বিক্রি হয়ে গেছে — নিচের ডায়াগ্রামে দেখে নিন।",
      legendOpen: "খালি",
      legendSold: "বিক্রি শেষ",
      legendRented: "ভাড়া",
      open: "খালি",
      rented: "ভাড়া",
      unitCta: "পছন্দের খালি ইউনিট নিশ্চিত করতে এখনই যোগাযোগ করুন — সীমিত ইউনিট।",
      bookingContact: "বুকিং যোগাযোগ",
      parkingTitle: "পার্কিং",
      parkingTotal: "মোট",
      parkingSold: "বিক্রি",
      parkingFree: "খালি",
      plotsA: "জমির",
      plotsB: "প্লট ও মূল্য",
      plotsSub: "বিনিয়োগযোগ্য আবাসিক প্লট — যাচাইকৃত দলিল ও নামজারিসহ হস্তান্তর।",
      perDecimal: "প্রতি শতাংশ",
      perKatha: "প্রতি কাঠা",
      conversion: "রূপান্তর",
      layoutPlan: "জমির লেআউট প্ল্যান দেখুন",
      aboutA: "প্রকল্প",
      aboutB: "সম্পর্কে",
      docCaption: "প্রজেক্ট ডকুমেন্টরি",
      galleryA: "ছবি",
      galleryB: "গ্যালারি",
      videos: "ভিডিও",
      ctaSuffix: "আপনার পছন্দ হয়েছে?",
      contactBtn: "যোগাযোগ করুন",
      share: {
        headA: "শেয়ার",
        headB: "অ্যাভেইলেবিলিটি",
        total: (t) => `মোট ${t}টি শেয়ার`,
        soldCount: (s) => `${s}টি বিক্রি শেষ`,
        remaining: (r) => `মাত্র ${r}টি বাকি`,
        filterOpen: (r) => `খালি — মাত্র ${r}টি`,
        filterSold: (s) => `বিক্রি শেষ — ${s}টি`,
        filterAll: (t) => `সব দেখুন — ${t}টি`,
        legendOpen: "খালি — ক্লিক করে বুক করুন",
        legendSold: "বিক্রি শেষ",
        soldLabel: "বিক্রি শেষ",
        openLabel: "খালি",
        bookBtn: "শেয়ার বুকিং",
        empty: "এই মুহূর্তে এই ক্যাটাগরিতে কোনো শেয়ার নেই।",
      },
    },
    divDetail: {
      backToDivisions: "আমাদের বিভাগ",
      consult: "পরামর্শ নিন",
      otherDivisions: "অন্যান্য বিভাগ",
      aboutEyebrow: "বিভাগ পরিচিতি",
      aboutSuffix: "সম্পর্কে",
      featEyebrow: "আমরা যা দিই",
      featHeadA: "এই বিভাগের",
      featHeadB: "সেবা ও সুবিধা",
      projEyebrow: "চলমান প্রকল্প",
      projHeadA: "প্রমিস সিটির",
      projHeadB: "প্রকল্পসমূহ",
      ctaSuffix: "সম্পর্কে",
      ctaMore: "আরও জানুন",
      ctaSub: "আমাদের সাথে সরাসরি কথা বলুন — আপনার প্রয়োজন বুঝে সঠিক সমাধান দেবো।",
      sendMsg: "বার্তা পাঠান",
      prevDiv: "পূর্ববর্তী বিভাগ",
      nextDiv: "পরবর্তী বিভাগ",
    },
    auth: {
      loginH: "স্বাগতম",
      loginHb: "ফিরে।",
      loginSub: "মোবাইল নম্বর ও পাসওয়ার্ড দিয়ে দ্রুত লগইন করুন।",
      signupH: "আপনার",
      signupHb: "যাত্রা শুরু",
      signupSub: "শুধু নাম + মোবাইল + পাসওয়ার্ড — এক মিনিটেই অ্যাকাউন্ট তৈরি।",
      fullName: "পূর্ণ নাম",
      phName: "যেমন: কামরুল হাসান",
      loginId: "মোবাইল / ইউজারনেম / ইমেইল",
      mobile: "মোবাইল নম্বর",
      mobileHint: "শুধু মোবাইল + পাসওয়ার্ড দিয়েই দ্রুত লগইন করতে পারবেন।",
      countrySearch: "দেশ খুঁজুন...",
      countrySelect: "দেশ নির্বাচন করুন",
      emailOrUser: "ইমেইল বা ইউজারনেম (ঐচ্ছিক)",
      phEmailOrUser: "you@example.com  অথবা  kamrul95",
      password: "পাসওয়ার্ড",
      remember: "আমাকে মনে রাখুন",
      forgot: "পাসওয়ার্ড ভুলে গেছেন?",
      processing: "প্রক্রিয়াধীন...",
      loginBtn: "লগইন করুন",
      signupBtn: "অ্যাকাউন্ট তৈরি করুন",
      noAccount: "অ্যাকাউন্ট নেই?",
      signupLink: "সাইন আপ করুন →",
      haveAccount: "আগে থেকেই অ্যাকাউন্ট আছে?",
      loginLink: "লগইন করুন →",
      pwHide: "পাসওয়ার্ড লুকান",
      pwShow: "পাসওয়ার্ড দেখান",
    },
    account: {
      title: "আমার অ্যাকাউন্ট",
      greeting: "স্বাগতম",
      subtitle: "আপনার প্রমিস সিটি অ্যাকাউন্ট ড্যাশবোর্ড।",
      profileHead: "আপনার তথ্য",
      nameLabel: "নাম",
      mobileLabel: "মোবাইল",
      usernameLabel: "ইউজারনেম",
      emailLabel: "ইমেইল",
      notSet: "দেওয়া হয়নি",
      memberSince: "সদস্য হয়েছেন",
      quickHead: "দ্রুত লিঙ্ক",
      forms: "অফিসিয়াল ফরম",
      formsSub: "আবেদন ফরম পূরণ ও জমা দিন",
      contact: "যোগাযোগ",
      contactSub: "আমাদের সাথে কথা বলুন",
      projects: "প্রকল্প",
      projectsSub: "চলমান প্রকল্প দেখুন",
      logout: "লগআউট",
      loggingOut: "লগআউট হচ্ছে...",
    },
  },
  en: {
    nav: {
      home: "Home",
      divisions: "Divisions",
      projects: "Projects",
      forms: "Forms",
      gallery: "Gallery",
      partner: "Partner",
      leaderboard: "Leaderboard",
      team: "Team",
      story: "Story",
      blog: "Blog",
      contact: "Contact",
    },
    login: "Login",
    dashboardNav: "Dashboard",
    signup: "Sign Up",
    accountNav: "Account",
    call: "Call Now",
    menu: "Menu",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    langName: "English",
    footer: {
      brand: "Promise City",
      tagline: "Where dreams are real",
      about:
        "Serving the people of Dhaka for 15+ years — real estate, construction, savings, Hajj and design.",
      follow: "Follow us",
      quickLinks: "Quick Links",
      contact: "Contact",
      rights: "All rights reserved.",
    },
    home: {
      detailsBtn: "View details",
      aboutBtn: "About us",
      autoRotate: "Auto-rotating",
      divisionWord: "Division",
      viewDivision: "View division",
      trustChips: ["Legal security", "Quality build", "Premium areas", "Flexible instalments"],
      fromPrice: "From",
      about: {
        eyebrow: "Our Story",
        headA: "We don't just build buildings.",
        headB: "We build promises.",
        body1:
          "Since 2010, Promise Group has been a quiet, steady force on Dhaka's soil — delivering families homes that fit their life, budget and future.",
        body2:
          "Today we work across 5 divisions — Promise City (real estate), Ahbab Real Estate (construction), Promise International (savings), Ahbab Travels (Hajj/Umrah), and Engineering & Interior Design.",
      },
      divisions: {
        eyebrow: "Our Divisions",
        headA: "5 divisions —",
        headB: "under one roof.",
        sub: "Promise Group's five core business divisions — real estate, construction, savings, Hajj and design. In each, we give our very best.",
      },
      projects: {
        eyebrow: "Ongoing Projects",
        headA: "Where people build",
        headB: "their next address.",
        sub: "Curated sites, transparent pricing, flexible plans. Every project below is real, ongoing and bookable today.",
      },
      why: {
        eyebrow: "Why PromisePD",
        headA: "The reasons people",
        headB: "choose us.",
      },
      testimonials: {
        eyebrow: "Real voices",
        headA: "What our family",
        headB: "says.",
      },
    },
    contact: {
      eyebrow: "Contact",
      headA: "Let's find",
      headB: "your next home.",
      sub: "Send us a message — we'll get back to you very soon.",
      labelPhone: "Phone",
      labelEmail: "Email",
      labelOffice: "Office",
      labelHours: "Hours",
      fName: "Your name",
      phName: "Full name",
      fEmail: "Email",
      fPhone: "Phone (optional)",
      phPhone: "+880 1XXX-XXXXXX",
      fInterest: "Interested in",
      fMessage: "Message",
      phMessage: "Tell us a little about what you're looking for...",
      send: "Send message",
      sending: "Sending...",
      consent: "By submitting this form you allow us to contact you.",
      ok: "Thank you — we'll get back to you very soon.",
      err: "Something went wrong, please try again.",
    },
    newsletter: {
      headA: "Stay in the loop",
      headB: "for updates.",
      sub: "New projects, instalment offers and pre-launch perks — delivered to your inbox first. No spam, ever.",
      placeholder: "you@example.com",
      subscribe: "Subscribe",
      subscribing: "Sending...",
      subscribed: "Subscribed",
      perks: ["New projects", "Instalment offers", "Pre-launch perks"],
    },
    blog: {
      journal: "Promise Journal",
      headA: "Real-estate",
      headB: "knowledge, your way.",
      sub: "Project guides, marketing notices, booking rules and complete flat & land buying resources — everything in one place.",
      searchPh: "Search by title or topic…",
      searchAria: "Search the blog",
      clear: "Clear",
      allProjects: "All projects",
      allCategories: "All categories",
      posts: "posts",
      projectLabel: "project",
      categoryLabel: "category",
      forQuery: "for",
      reset: "Reset filters",
      prev: "Previous",
      next: "Next",
      readMins: "min",
      readMinsLong: "min read",
      views: "views",
      emptyTitle: "No posts found",
      emptySub: "Try a different category or another keyword.",
      emptyReset: "Reset filters",
      minRead: "min read",
      relatedTitle: "Related posts",
      backToBlog: "All posts",
      by: "By",
      backToList: "Back to all posts",
      authorLabel: "Author",
      authorBio:
        "Founder & Managing Director of Promise Group — with 15+ years of experience, he has set a new standard of transparency and trust in Dhaka's real-estate industry.",
      ctaHead: "Want to know more?",
      ctaSub:
        "Have a question about this post, or want personal advice? Get in touch directly.",
      sendMsg: "Send a message",
      prevPost: "Previous post",
      nextPost: "Next post",
    },
    projDetail: {
      allProjects: "All projects",
      fromPrice: "From",
      bookVisit: "Book a site visit",
      floorPlan: "View floor plan",
      bldgStatusA: "Building",
      bldgStatusB: "status",
      bldgSummary: (total, sold, booking) =>
        `${total} buildings total · ${sold} sold out · booking open for building ${booking}`,
      booking: "Booking",
      soldOut: "Sold out",
      coming: "Coming",
      bldgNowBooking: (n) => `Booking now open for building ${n}`,
      bldgCta: "Contact us now to secure your preferred unit — limited units.",
      urgentContact: "Urgent contact",
      paymentA: "Payment &",
      paymentB: "deed",
      rulesA: "Detailed",
      rulesB: "rules",
      zoom: "View larger",
      unitA: "Unit",
      unitB: "availability",
      unitSub: "Which units are open and which are sold — see the diagram below.",
      legendOpen: "Open",
      legendSold: "Sold out",
      legendRented: "Rented",
      open: "Open",
      rented: "Rented",
      unitCta: "Contact us now to secure your preferred open unit — limited units.",
      bookingContact: "Booking contact",
      parkingTitle: "Parking",
      parkingTotal: "Total",
      parkingSold: "Sold",
      parkingFree: "Available",
      plotsA: "Land",
      plotsB: "plots & pricing",
      plotsSub: "Investable residential plots — verified deed, handover with mutation.",
      perDecimal: "Per decimal",
      perKatha: "Per katha",
      conversion: "Conversion",
      layoutPlan: "View land layout plan",
      aboutA: "About the",
      aboutB: "project",
      docCaption: "project documentary",
      galleryA: "Photo",
      galleryB: "gallery",
      videos: "Videos",
      ctaSuffix: "— like what you see?",
      contactBtn: "Contact us",
      share: {
        headA: "Share",
        headB: "availability",
        total: (t) => `${t} total shares`,
        soldCount: (s) => `${s} sold out`,
        remaining: (r) => `only ${r} left`,
        filterOpen: (r) => `Open — only ${r}`,
        filterSold: (s) => `Sold out — ${s}`,
        filterAll: (t) => `Show all — ${t}`,
        legendOpen: "Open — click to book",
        legendSold: "Sold out",
        soldLabel: "Sold out",
        openLabel: "Open",
        bookBtn: "Share booking",
        empty: "No shares in this category right now.",
      },
    },
    divDetail: {
      backToDivisions: "Our Divisions",
      consult: "Get a consultation",
      otherDivisions: "Other divisions",
      aboutEyebrow: "About this division",
      aboutSuffix: "",
      featEyebrow: "What we offer",
      featHeadA: "This division's",
      featHeadB: "services & benefits",
      projEyebrow: "Ongoing Projects",
      projHeadA: "Promise City",
      projHeadB: "projects",
      ctaSuffix: "",
      ctaMore: "Learn more",
      ctaSub: "Talk to us directly — we'll understand your needs and give you the right solution.",
      sendMsg: "Send message",
      prevDiv: "Previous division",
      nextDiv: "Next division",
    },
    auth: {
      loginH: "Welcome",
      loginHb: "back.",
      loginSub: "Log in quickly with your mobile number and password.",
      signupH: "Begin your",
      signupHb: "journey",
      signupSub: "Just name + mobile + password — create an account in a minute.",
      fullName: "Full name",
      phName: "e.g. Kamrul Hasan",
      loginId: "Mobile / username / email",
      mobile: "Mobile number",
      mobileHint: "Just mobile + password lets you log in fast.",
      countrySearch: "Search country...",
      countrySelect: "Select country",
      emailOrUser: "Email or username (optional)",
      phEmailOrUser: "you@example.com  or  kamrul95",
      password: "Password",
      remember: "Remember me",
      forgot: "Forgot password?",
      processing: "Processing...",
      loginBtn: "Log in",
      signupBtn: "Create account",
      noAccount: "No account?",
      signupLink: "Sign up →",
      haveAccount: "Already have an account?",
      loginLink: "Log in →",
      pwHide: "Hide password",
      pwShow: "Show password",
    },
    account: {
      title: "My account",
      greeting: "Welcome",
      subtitle: "Your Promise City account dashboard.",
      profileHead: "Your details",
      nameLabel: "Name",
      mobileLabel: "Mobile",
      usernameLabel: "Username",
      emailLabel: "Email",
      notSet: "Not set",
      memberSince: "Member since",
      quickHead: "Quick links",
      forms: "Official forms",
      formsSub: "Fill in and submit application forms",
      contact: "Contact",
      contactSub: "Talk to our team",
      projects: "Projects",
      projectsSub: "Browse ongoing projects",
      logout: "Log out",
      loggingOut: "Logging out...",
    },
  },
};
