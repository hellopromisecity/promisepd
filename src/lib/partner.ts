/** Partner program data — commission rules, point system, awards.
 *  All numbers reflect the 2026 marketing-rules update issued by the
 *  Promise board, effective 1 January 2026 – 31 December 2026.
 *
 *  Pure data, no runtime imports, so the same module is consumable from
 *  Server Components and the interactive calculator (client). */

export type PartnerCommission = {
  id: string;
  nameBn: string;
  nameEn: string;
  /** Bangla unit phrase shown next to the commission — e.g. "প্রতি শেয়ার". */
  unit: string;
  /** Commission in BDT per single unit. */
  commission: number;
  /** Points awarded per single unit (0 for Hajj/Umrah passengers). */
  points: number;
  description: string;
  accent: "red" | "blue" | "ash";
};

/** Every commission line item — drives the rules grid + calculator counters. */
export const PARTNER_COMMISSIONS: PartnerCommission[] = [
  {
    id: "fuzala-tower",
    nameBn: "ফুজালা টাওয়ার শেয়ার",
    nameEn: "Fuzala Tower Share",
    unit: "প্রতি শেয়ার",
    commission: 20000,
    points: 1,
    description:
      "কোম্পানির হাতে সীমিত কিছু শেয়ার — প্রতিটি সেলস-এ সর্বোচ্চ কমিশন।",
    accent: "red",
  },
  {
    id: "fuzala-complex",
    nameBn: "ফুজালা কমপ্লেক্স শেয়ার",
    nameEn: "Fuzala Complex Share",
    unit: "প্রতি শেয়ার",
    commission: 15000,
    points: 1,
    description: "ফুজালা কমপ্লেক্সের শেয়ার সেলস-এ আকর্ষণীয় কমিশন।",
    accent: "blue",
  },
  {
    id: "land",
    nameBn: "জমি",
    nameEn: "Land",
    unit: "প্রতি শতাংশ",
    commission: 10000,
    points: 1,
    description: "প্রতি শতাংশ জমি সেলস-এ নিশ্চিত কমিশন।",
    accent: "ash",
  },
  {
    id: "ahbab-flat",
    nameBn: "আহবাব রিয়েল এস্টেট ফ্ল্যাট",
    nameEn: "Ahbab Real Estate Flat",
    unit: "প্রতি ফ্ল্যাট",
    commission: 50000,
    points: 5,
    description: "একটি ফ্ল্যাট সেলস = এক মাসের চমৎকার আয়।",
    accent: "red",
  },
  {
    id: "officer-recruit",
    nameBn: "অ্যাক্টিভ মার্কেটিং অফিসার নিয়োগ",
    nameEn: "Active Marketing Officer Recruitment",
    unit: "প্রতি অফিসার",
    commission: 20000,
    points: 2,
    description:
      "মার্কেটিং ডিরেক্টর হিসেবে প্রতিটি অ্যাক্টিভ অফিসার নিয়োগে।",
    accent: "blue",
  },
  {
    id: "umrah",
    nameBn: "উমরাহ যাত্রী",
    nameEn: "Umrah Passenger",
    unit: "প্রতি যাত্রী",
    commission: 5000,
    points: 0,
    description: "প্রতিটি উমরাহ যাত্রী বুকিং-এ অতিরিক্ত আয়।",
    accent: "ash",
  },
  {
    id: "hajj",
    nameBn: "হজ্জ যাত্রী",
    nameEn: "Hajj Passenger",
    unit: "প্রতি যাত্রী",
    commission: 10000,
    points: 0,
    description: "প্রতিটি হজ্জ যাত্রী বুকিং-এ আয়।",
    accent: "red",
  },
];

/** Standalone marketing rules — promotion thresholds, attendance perks, etc.
 *  These don't fit into the per-sale commission table above. */
export const PARTNER_RULES: {
  tag: string;
  title: string;
  body: string;
}[] = [
  {
    tag: "অফিস উপস্থিতি",
    title: "ডিরেক্টরদের জন্য সাপ্তাহিক ১ দিন অফিস",
    body: "শুধু মার্কেটিং ডিরেক্টরগণকে সপ্তাহে কমপক্ষে একদিন (সকাল ১০টা – বিকেল ৫টা) অফিস করতে হবে। অফিসের যাতায়াত খরচ, মোবাইল রিচার্জ ও লাঞ্চের ব্যবস্থা প্রমিসের পক্ষ থেকে — আলহামদুলিল্লাহ।",
  },
  {
    tag: "প্রমোশন",
    title: "৫ জন অফিসার = ১ লক্ষ + ডিরেক্টর পদ",
    body: "মার্কেটিং অফিসার কর্তৃক ৫ জন অ্যাকটিভ মার্কেটিং অফিসার নিয়োগে ১,০০,০০০ টাকা কমিশনসহ সরাসরি মার্কেটিং ডিরেক্টর পদে পদায়ন।",
  },
  {
    tag: "অ্যাক্টিভ যোগ্যতা",
    title: "নূন্যতম ৫ পয়েন্টে অ্যাক্টিভ অফিসার স্বীকৃতি",
    body: "সেলসে নূন্যতম ৫ পয়েন্ট অর্জন করলে অ্যাকটিভ মার্কেটিং অফিসার হিসেবে গন্য হবেন।",
  },
  {
    tag: "জমার শর্ত",
    title: "ক্লায়েন্টের জমা = কমিশনের কমপক্ষে ১০x",
    body: "কমিশন পেতে অবশ্যই লক্ষণীয় — ক্লায়েন্টের উক্ত প্রজেক্টে জমা টাকার ১০% পরিমাণ-এর সমান বা তার কম কমিশন হতে হবে।",
  },
];

/** Points table — both calculator-driving and informational rows. */
export const POINT_RULES: { item: string; points: string }[] = [
  { item: "ফুজালা টাওয়ার (প্রতি শেয়ার)", points: "১ পয়েন্ট" },
  { item: "ফুজালা কমপ্লেক্স (প্রতি শেয়ার)", points: "১ পয়েন্ট" },
  { item: "প্রতি শতাংশ জমি", points: "১ পয়েন্ট" },
  { item: "অ্যাক্টিভ মার্কেটিং অফিসার নিয়োগ", points: "২ পয়েন্ট" },
  { item: "আহবাব রিয়েল এস্টেট ফ্ল্যাট", points: "৫ পয়েন্ট" },
  {
    item: "প্রমিস সিটি পেইজ পোস্টে লাইক/কমেন্ট/শেয়ার (৭২ ঘণ্টার মধ্যে)",
    points: ".২০ পয়েন্ট/পোস্ট",
  },
  {
    item: "মিটিংয়ে সময়মতো উপস্থিতি (সময়ে-সময়ে ঘোষিত)",
    points: "ঘোষণা অনুযায়ী",
  },
];

/** Two annual rewards — used by hero hook + calculator progress bars. */
export const PARTNER_AWARDS = [
  {
    threshold: 20,
    titleBn: "ফ্রি বিদেশ ট্যুর",
    titleEn: "Free Foreign Tour",
    description: "২০ পয়েন্ট অর্জনে কোম্পানির খরচে আন্তর্জাতিক ট্যুর।",
    accent: "blue" as const,
  },
  {
    threshold: 25,
    titleBn: "ফ্রি উমরাহ",
    titleEn: "Free Umrah",
    description: "২৫ পয়েন্ট অর্জনে আল্লাহর ঘরে ফ্রি যাত্রা।",
    accent: "red" as const,
  },
];

/** The annual point-accumulation window. */
export const PARTNER_PERIOD = {
  startBn: "১ জানুয়ারি ২০২৬",
  endBn: "৩১ ডিসেম্বর ২০২৬",
};

/** Partner role hierarchy — single source of truth for the
 *  leaderboard's role-filter dropdown.
 *
 *  `count` is how many partners currently hold each role; the
 *  dropdown shows it as a badge and "সকল ভূমিকা" shows the sum.
 *  These are seed figures the marketing office maintains — when the
 *  partner table lands in Supabase, replace each `count` with a live
 *  `select count(*) … where role = …` so the badges stay accurate
 *  automatically.
 *
 *  Distribution mirrors the program rules: exactly one Head of
 *  Marketing (lifetime top seller), a handful of Directors (each
 *  recruited 5+ officers), more Active Officers (5+ points), and the
 *  widest tier of entry-level Officers (1–4 points). */
export type PartnerRoleKey = "head" | "director" | "active" | "officer";

export const PARTNER_ROLES: {
  key: PartnerRoleKey;
  bn: string;
  sub: string;
  count: number;
}[] = [
  {
    key: "head",
    bn: "Head of Marketing",
    sub: "Lifetime top seller · একজন",
    count: 1,
  },
  {
    key: "director",
    bn: "Marketing Director",
    sub: "৫+ active officer রিক্রুট",
    count: 6,
  },
  {
    key: "active",
    bn: "Active Marketing Officer",
    sub: "নূন্যতম ৫ পয়েন্ট",
    count: 28,
  },
  {
    key: "officer",
    bn: "Marketing Officer",
    sub: "১–৪ পয়েন্ট",
    count: 64,
  },
];

/** Total active partners = sum of every role's count.  Computed so
 *  the "সকল ভূমিকা" badge always equals the parts — never drifts. */
export const PARTNER_TOTAL_COUNT = PARTNER_ROLES.reduce(
  (sum, r) => sum + r.count,
  0,
);

/** Marketing policy — the rulebook every Promise marketer / reseller
 *  agrees to.  Drives the /marketing-policy page.  Each item has a
 *  short scannable title + the full rule body, both in Bangla.
 *
 *  The final rule (owner may amend at any time) is intentionally last
 *  and also surfaced as a standalone callout on the page. */
export const MARKETING_POLICY: { title: string; body: string }[] = [
  {
    title: "সমস্ত কনটেন্ট মার্কেটারদের জন্য উন্মুক্ত",
    body: "আমাদের ওয়েবসাইট, অ্যাপ, ফেসবুক পেজ ও ইউটিউব চ্যানেলের সব ছবি, পিডিএফ, ফ্লোর প্ল্যান এবং ভিডিও — সমস্ত কনটেন্ট সকল মার্কেটারের জন্য উন্মুক্ত। প্রমোশনের জন্য তাঁরা নিজেদের মতো করে এসব reuse, edit, cut বা remove করে ব্যবহার করতে পারবেন।",
  },
  {
    title: "ভিজিটের দিনের মূল্যই চূড়ান্ত",
    body: "মার্কেটারদের ভিডিও বা ছবির প্রমোশন দেখে যেকোনো কাস্টমার যেদিন অফিস বা প্রকল্প ভিজিটে আসবেন, সেদিনের নতুন মূল্য অনুযায়ী দাম নির্ধারিত হবে। কেউ বছর খানেক আগের পুরনো ভিডিও/ছবি বা অন্য কনটেন্ট দেখে এসে পুরনো মূল্যে ফ্ল্যাট বা জমি নিতে চাইলে তা গ্রহণযোগ্য নয়।",
  },
  {
    title: "প্রমিস সিটি নিজের কোম্পানি বলা যাবে না",
    body: "ফ্ল্যাট, জমি বা অন্য যেকোনো পণ্য বিক্রির সময় প্রমিস সিটিকে নিজের কোম্পানি বলে প্রচার করা যাবে না। কারণ প্রমিস একটি একক মালিকানাধীন প্রতিষ্ঠান, এবং এর একমাত্র মালিক Founder & CEO — মো. কামরুল হাসান।",
  },
  {
    title: "রিসেলার / সহযোগী হিসেবে প্রমোশন করা যাবে",
    body: "তবে কেউ চাইলে নিজের কোম্পানির নামে প্রমোট করে কাস্টমারদের বলতে পারেন — “আমরা প্রমিস সিটির মার্কেটার বা রিসেলার এবং প্রমিসের সহযোগী হিসেবে কাজ করি, প্রমিসকে এগিয়ে নিয়ে যাওয়ার জন্য।”",
  },
  {
    title: "দলিলের আগে বেশি দামে বিক্রি নয়",
    body: "কোনো মার্কেটার আমাদের কাছ থেকে জমি বা ফ্ল্যাট নিয়ে দলিল সম্পন্ন হওয়ার আগ পর্যন্ত তা বেশি দামে বিক্রি করতে পারবেন না। কারণ পরে যদি কাস্টমাররা জানতে পারেন একেকজন একেক দামে নিয়েছেন, তাতে প্রমিস সিটির সুনাম ক্ষুণ্ন হয় ও মনোমালিন্য সৃষ্টি হয়।",
  },
  {
    title: "দলিলের পর — নিজ মূল্যে বিক্রির স্বাধীনতা",
    body: "তবে ফ্ল্যাট বা জমি নিজের নামে দলিল হওয়ার পর সেটি সংশ্লিষ্ট মালিকের সম্পদ বলে গণ্য হবে — তখন কম-বেশি যেকোনো মূল্যে মালিক তাঁর সম্পদ অন্যের কাছে বিক্রি করতে পারবেন।",
  },
  {
    title: "প্রথম সেলসে রেফারেন্স আবশ্যক",
    body: "প্রত্যেক প্রমিস কাস্টমারের প্রথম সেলস অবশ্যই কারো রেফারেন্সে হতে হবে। প্রথম সেলসে কোনো রেফার না থাকলে সেটি প্রমিস সিটির আন্ডারে কাউন্ট হবে। তবে দ্বিতীয় সেলস থেকে মার্কেটাররা নির্ধারিত সেলে নিজের নাম রেফারেন্স হিসেবে ব্যবহার করতে পারবেন।",
  },
  {
    title: "বড় সেলে নিজের রেফার রাখার উপায়",
    body: "কারো প্রথম সেল যদি বড় অঙ্কের হয় এবং অন্য কাউকে রেফার দিতে আপত্তি থাকে, তবে তিনি প্রমিসের যেকোনো ছোট পণ্য কিনে সেটিকে অন্যের রেফার হিসেবে দেখিয়ে — বড় সেলে (যেমন ফ্ল্যাট বা বড় জমি) নিজের নাম রেফারেন্স হিসেবে ব্যবহার করতে পারবেন।",
  },
  {
    title: "First visit = সেই অফিসারের ক্লায়েন্ট",
    body: "কোনো মার্কেটার যদি কোনো কাস্টমারকে প্রথম ভিজিট করান, তবে সেই কাস্টমারকে অন্য কোনো মার্কেটার ভিজিট করিয়ে রেফার হিসেবে কমিশন আর্নের সুযোগ পাবেন না — প্রথম যে অফিসার ভিজিট করিয়েছেন, কাস্টমার তাঁরই ক্লায়েন্ট হিসেবে গণ্য হবেন। তাই ভিজিটে নেওয়ার আগে জিজ্ঞেস করে নিশ্চিত হয়ে নিন, ওই কাস্টমার আগে কারো আন্ডারে প্রমিস সিটি ভিজিট করেছেন কিনা।",
  },
  {
    title: "অফিসার হওয়ার শর্ত — নিজেই প্রমিসের গ্রাহক হোন",
    body: "মার্কেটিং অফিসার হতে হলে আপনাকে অবশ্যই প্রমিসের যেকোনো একটি পণ্য নিজে কিনতে হবে। কারণ অন্যান্য কোম্পানির মতো প্রমিসের উদ্দেশ্য শুধু বড় অঙ্কের সেলস তৈরি করা নয় — আমাদের লক্ষ্য গ্রাহকের আস্থা ও বিশ্বাস অর্জন। তাই অন্যকে বিক্রির আগে নিজেই প্রমিসের একটি পণ্য কিনে আস্থা অর্জন করুন। তখনই কেবল আপনার রেফার করা কাস্টমাররাও বিশ্বাস করবেন — কারণ আপনি নিজেই যেহেতু প্রমিসের সাথে যুক্ত ও এর একজন গ্রাহক, তার মানে পণ্যটি সত্যিই ভালো; ভালো না হলে আপনি নিশ্চয়ই অন্যকে তা কিনতে পরামর্শ দিতেন না।",
  },
  {
    title: "নিয়ম পরিবর্তনের অধিকার মালিকের",
    body: "মালিক অর্থাৎ মো. কামরুল হাসান যেকোনো সময় উপরোক্ত নিয়মে সংযোজন, বিয়োজন বা নতুন নিয়ম যুক্ত করতে পারেন।",
  },
];

/** Headline hook for the hero — the "matro 25 jonke refer" pitch.
 *  25 active officer recruits × 20,000 = 5,00,000 in cash + free Umrah
 *  (since 25 × 2 points = 50, well above the 25-point Umrah threshold).
 *  We frame the cash conservatively at 3,75,000 to be safe — the actual
 *  payout can be higher depending on Director-promotion timing. */
export const PARTNER_HEADLINE = {
  referralsTarget: 25,
  cashMinBn: "৩,৭৫,০০০",
  umrahValueBn: "১,৫০,০০০",
  totalValueBn: "৫,২৫,০০০",
};

/** Bengali (bn-BD) digit + lakh/crore grouping formatter — used everywhere
 *  numbers display in the partner UI. Created once, reused. */
export const bnNumber = (n: number) =>
  new Intl.NumberFormat("bn-BD", { maximumFractionDigits: 0 }).format(n);
