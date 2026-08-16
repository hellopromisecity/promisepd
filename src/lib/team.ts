/** Team / leadership data — drives /team and any "meet the people"
 *  card surface elsewhere on the site (CEO callout on /contact, etc.).
 *
 *  Photos live in /public — all WebP per the MUST RULE in AGENTS.md.
 *  When adding a new headshot, run it through the image pipeline
 *  (`scripts/convert-headshots-to-webp.mjs` or `src/lib/image.ts`)
 *  first, then append a TEAM_MEMBERS entry.
 */

export type TeamMember = {
  slug: string;
  name: string;
  nameEn: string;
  role: string;
  bio?: string;
  phone?: string;
  email?: string;
  /** Path under /public — always .webp per the MUST RULE. */
  photo: string;
  /** Brand-coloured accent strip behind the photo card. */
  accent: "red" | "blue" | "ash";
  /** Optional social handles — rendered as small links under the card. */
  socials?: {
    facebook?: string;
    linkedin?: string;
    whatsapp?: string;
  };
};

export const TEAM_MEMBERS: TeamMember[] = [
  {
    slug: "kamrul-hasan",
    name: "কামরুল হাসান",
    nameEn: "Kamrul Hasan",
    role: "Founder & CEO",
    bio: "প্রমিস গ্রুপের প্রতিষ্ঠাতা ও প্রধান পরিচালক — একজন স্বপ্নদ্রষ্টা উদ্যোক্তা, যাঁর দূরদর্শী নেতৃত্বে প্রতিষ্ঠানটি আজ হাজারো পরিবারের আস্থার ঠিকানা। ১৫+ বছরের অভিজ্ঞতায় তিনি ঢাকার রিয়েল এস্টেট ইন্ডাস্ট্রিতে স্বচ্ছতা, গুণগত মান ও বিশ্বাসের এক নতুন মান গড়ে তুলেছেন। সততা, প্রতিশ্রুতি ও গ্রাহক-সন্তুষ্টিকে সর্বোচ্চ গুরুত্ব দিয়ে তিনি প্রতিটি স্বপ্নকে বাস্তবে রূপ দিতে নিরলসভাবে কাজ করে যাচ্ছেন।",
    phone: "+8801910065136",
    email: "kamrulhasanfaridi95@gmail.com",
    // Versioned filename to bust the immutable /public cache (see the
    // manager note below).  Bump the suffix whenever the headshot
    // changes so visitors don't stay stuck on the old render.
    photo: "/ceo-v2.webp",
    accent: "blue",
    socials: { facebook: "https://www.facebook.com/kamrulhasan.kamrulhasan.77770194" },
  },
  {
    slug: "md-rashedul-islam",
    name: "মো. রাশেদুল ইসলাম",
    nameEn: "Md. Rashedul Islam",
    role: "Manager cum Accountant",
    bio: "প্রতিষ্ঠানের হিসাব-নিকাশ, রশিদ ব্যবস্থাপনা ও অ্যাপে নির্ভুল ডাটা এন্ট্রির দায়িত্বে — প্রতিটি লেনদেন যেন স্বচ্ছ ও নির্ভুল থাকে, সেটাই তাঁর প্রধান কাজ। ক্লায়েন্ট সম্পর্ক রক্ষায় নিষ্ঠাবান এই মানুষটি গ্রাহকদের সাথে আস্থার যোগাযোগের বিশ্বস্ত মুখ।",
    phone: "+8801910065137",
    email: "hmrashed29@gmail.com",
    // Versioned filename — next.config.ts sets `Cache-Control:
    // immutable` on all /public images, so updating in-place leaves
    // every visitor stuck with the previous render forever.  Bump
    // the suffix (-v2, -v3, …) whenever the headshot changes.
    photo: "/manager-v2.webp",
    accent: "red",
    socials: { facebook: "https://www.facebook.com/md.affan.501/" },
  },
  {
    slug: "mustaqeem-billah",
    name: "মুস্তাকীম বিল্লাহ",
    nameEn: "Mustaqeem Billah",
    role: "Engineer Support",
    bio: "এই ওয়েবসাইট ও ডিজিটাল ইকোসিস্টেমের পেছনের ইঞ্জিনিয়ার। সাইটের যেকোনো জায়গায় বাগ বা সমস্যা দেখলে সরাসরি তাঁকে রিপোর্ট করুন — দ্রুত সমাধান নিন। যেকোনো কাস্টম ওয়েবসাইট, সফটওয়্যার বা ডিজিটাল সেবা পেতে যোগাযোগ করুন।",
    phone: "+8801767682381",
    email: "itsinjamul@gmail.com",
    // Versioned filename — /public images are served immutable, so bump the
    // suffix whenever the headshot changes (developer.png → developer-v2.webp).
    photo: "/developer-v2.webp",
    accent: "ash",
    socials: { facebook: "https://www.facebook.com/learnwithinjamul" },
  },
  {
    slug: "md-helal-uddin",
    name: "হাফেজ মাওলানা হেলাল উদ্দিন",
    nameEn: "Hafej Maulana Helal Uddin",
    role: "Senior Officer",
    bio: "কোম্পানির সার্বিক কার্যক্রম দেখাশোনার দায়িত্বে — প্রতিটি বিভাগের কাজ ঠিকঠাকভাবে চলছে কি না, তা নিয়মিত তদারকি করেন। অভিজ্ঞ এই কর্মকর্তার নজরদারিতে অফিসের দৈনন্দিন কার্যক্রম থাকে সুশৃঙ্খল ও গতিশীল।",
    phone: "+8801602720690",
    email: "helaiuddinkh8026@gmail.com",
    photo: "/helaluddin.webp",
    accent: "blue",
  },
  {
    slug: "md-rafi-sarkar",
    name: "মো. রাফি সরকার",
    nameEn: "Md Rafi Sarkar",
    role: "Executive Engineer",
    bio: "প্রমিসের প্রতিটি ভবনের আর্কিটেক্ট ডিজাইন ও নির্মাণকাজের সার্বিক তত্ত্বাবধান তাঁর অধীনে — নকশা থেকে নির্মাণ, প্রতিটি ধাপ এগোয় তাঁর নজরদারিতে। গুণগত মান ও নিরাপত্তায় কোনো আপস না করে প্রতিটি প্রকল্প নকশা অনুযায়ী নিখুঁতভাবে বাস্তবায়ন করাই তাঁর কাজ।",
    phone: "+8801676737322",
    email: "m.rafisarker@gmail.com",
    photo: "/rafi.webp",
    accent: "red",
  },
  {
    slug: "tarek-ahmed",
    name: "তারেক আহমেদ",
    nameEn: "Tarek Ahmed",
    role: "Asst. Manager",
    bio: "অনলাইন মার্কেটিং ম্যানেজমেন্টের পাশাপাশি ম্যানেজারের দৈনন্দিন কার্যক্রমে সার্বিক সহযোগিতা, ক্লায়েন্ট যোগাযোগ ও কাজের সমন্বয়ের দায়িত্ব পালন। ম্যানেজারের প্রয়োজনীয় দায়িত্বগুলোতে সরাসরি সহায়তা ও কার্যক্রম পরিচালনা, অফিসের নিয়মিত কাজ তদারকি এবং গুরুত্বপূর্ণ বিষয়গুলো দক্ষতার সঙ্গে হ্যান্ডেল করা—প্রতিষ্ঠানের দৈনন্দিন কার্যক্রমের একজন নির্ভরযোগ্য সহযোগী।",
    phone: "+8801908324298",
    email: "tarekahmed723540@gmail.com",
    // Fresh filename (was tarek.webp) — /public is served immutable, so a
    // replaced headshot must change name or visitors keep the old render.
    photo: "/tarekahmed.webp",
    accent: "ash",
    socials: { facebook: "https://www.facebook.com/tarek.ahmed.57499" },
  },
  {
    slug: "abu-bakar",
    name: "আবু বকর",
    nameEn: "Abu Bakar",
    role: "Office Assistant",
    bio: "অফিসের পরিচ্ছন্নতা ও আতিথেয়তার প্রাণ — প্রতিটি রুম, রিসিপশন থেকে সেমিনার রুম পর্যন্ত সবকিছু পরিপাটি রাখা তাঁর দায়িত্ব। ক্লায়েন্ট ও অতিথিদের আপ্যায়নে তিনি সবসময় আন্তরিক ও তৎপর।",
    photo: "/abubakar.webp",
    accent: "blue",
  },
  {
    slug: "md-hanif-howlader",
    name: "মো. হানিফ হাওলাদার",
    nameEn: "Md Hanif Howlader",
    role: "Driver",
    bio: "গাড়ি চালনার পাশাপাশি অফিসে আগত ক্লায়েন্টদের তাৎক্ষণিক অভ্যর্থনা ও দৈনন্দিন কাজে সহযোগিতার দায়িত্বে। সময়নিষ্ঠ ও আন্তরিক — প্রমিস পরিবারের এক বিশ্বস্ত সদস্য।",
    photo: "/hanif.webp",
    accent: "red",
  },
];

/** Quick lookup for individual member pages or callouts. */
export function getTeamMember(slug: string): TeamMember | undefined {
  return TEAM_MEMBERS.find((m) => m.slug === slug);
}

/** Shortcut used by error pages, "report a bug" buttons, and
 *  anywhere else that needs to surface the developer's contact
 *  details.  Pulled from TEAM_MEMBERS so there's one source of
 *  truth for Mustaqeem's phone / email / WhatsApp.
 *
 *  WhatsApp link uses wa.me with the country-code'd phone (no
 *  spaces, no '+') so it works from both web and mobile. */
const _dev = TEAM_MEMBERS.find((m) => m.slug === "mustaqeem-billah")!;

export const DEVELOPER = {
  ..._dev,
  whatsappUrl: `https://wa.me/${(_dev.phone ?? "").replace(/[^\d]/g, "")}`,
  /** Pre-filled mail link that captures the error context. */
  reportMailUrl: (subject = "PromisePD — Site Issue Report", body = "") =>
    `mailto:${_dev.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
};
