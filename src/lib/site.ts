import { FORMS } from "./forms";

export const SITE = {
  name: "Promise Proper Development Ltd.",
  nameBn: "প্রমিস প্রপার ডেভেলপমেন্ট লিমিটেড",
  shortName: "PromisePD",
  tagline: "স্বপ্ন যেখানে বাস্তব",
  description:
    "ঢাকায় আবাসিক, বাণিজ্যিক ও বিনিয়োগযোগ্য সম্পত্তির জন্য আপনার বিশ্বস্ত অংশীদার।",
  phone: "+8801910065136",
  phoneDisplay: "+৮৮০ ১৯১০-০৬৫১৩৬",
  phoneDisplayEn: "+880 1910-065136",
  whatsapp: "8801910065136",
  // Visit booking: the nav button links to our OWN /booking page (branded),
  // which embeds the TidyCal widget — so visitors only ever see promisepd.com.
  // `tidycalUrl` is the embed source; rename the TidyCal username to
  // `promisecity` so that URL carries no "growthency" either.
  bookingUrl: "/booking",
  tidycalUrl: "https://tidycal.com/promisecity",
  email: "promisegroup2023@gmail.com",
  address:
    "১২৩/১/২ কাজী টাওয়ার, দক্ষিণ যাত্রাবাড়ী, ঢাকা-১২০৪, বাংলাদেশ",
  addressEn:
    "123/1/2 Kazi Tower, South Jatrabari, Dhaka-1204, Bangladesh",
  hours: "মঙ্গল – রবি · সকাল ৯টা – সন্ধ্যা ৬টা",
  hoursEn: "Tue – Sun · 9:00 AM – 6:00 PM",
  weeklyOff: "সাপ্তাহিক ছুটি: সোমবার",
  weeklyOffEn: "Weekly off: Monday",
  facebook: "https://www.facebook.com/profile.php?id=100083894211030",
  founded: 2010,
  socials: {
    facebook: "https://www.facebook.com/profile.php?id=100083894211030",
    youtube: "https://www.youtube.com/@PromiseCity",
    // Footer WhatsApp icon → the public broadcast channel.  (The
    // floating chat button uses SITE.whatsapp / wa.me for 1:1 chat.)
    whatsapp: "https://whatsapp.com/channel/0029VbCq2Gv47Xe5fUugZi1D",
    telegram: "https://t.me/promisegroup2026",
  },
  credit: {
    label: "Made by Mustaqeem Billah",
    url: "https://growthency.com/",
  },
};

export type Division = {
  slug: string;
  nameEn: string;
  nameBn: string;
  shortBn: string;
  tagline: string;
  heroTitle: string;
  description: string;
  longDescription: string;
  icon: string;
  accent: "red" | "blue" | "ash" | "rb" | "ab" | "ar";
  features: {
    title: string;
    description: string;
    icon: string;
    /** 2 concrete sub-points shown as a mini bullet list on the card. */
    points: string[];
  }[];
  highlights: string[];
};

export const DIVISIONS: Division[] = [
  {
    slug: "promise-city",
    nameEn: "Promise City",
    nameBn: "প্রমিস সিটি",
    shortBn: "প্রমিস সিটি",
    tagline: "ঢাকার বুকে নিজের একটা ঠিকানা",
    heroTitle: "ভাড়ার ঘরে স্বপ্ন দেখা শেষ — এবার নিজের ঠিকানা।",
    description:
      "প্রমিস সিটি টাউনশিপে জমির প্লট, ফুজালা টাওয়ার ও ফুজালা কমপ্লেক্স এবং বসুন্ধরা রিভার ভিউতে আহবাব প্যালেস — যাচাইকৃত দলিল, নমনীয় কিস্তি ও সম্পূর্ণ আইনি নিরাপত্তার সাথে আপনার ভবিষ্যতের ঠিকানা।",
    longDescription:
      "আমাদের রিয়েল এস্টেট বিভাগের অধীনে দুটি টাউনশিপ — প্রমিস সিটিতে জমির প্লট, ফুজালা টাওয়ার ও ফুজালা কমপ্লেক্স; আর বসুন্ধরা রিভার ভিউতে আহবাব প্যালেস ০১ ও ০২। ফ্ল্যাট, জমি ও ল্যান্ডিং প্রপার্টি — সবই যাচাইকৃত দলিল ও সম্পূর্ণ আইনি নিরাপত্তার সাথে।",
    icon: "Building2",
    accent: "red",
    features: [
      {
        title: "প্রিমিয়াম লোকেশনে ফ্ল্যাট",
        description:
          "ঢাকার বিকাশমান এলাকায় বাছাইকৃত প্রকল্পে আধুনিক অ্যাপার্টমেন্ট।",
        icon: "Building2",
        points: ["মূল সড়ক, স্কুল ও বাজারের কাছে", "১, ২ ও ৩ বেডরুমের ইউনিট"],
      },
      {
        title: "যাচাইকৃত জমি ও প্লট",
        description:
          "সম্পূর্ণ আইনি যাচাইসহ প্রিমিয়াম প্লট এবং ল্যান্ডিং প্রপার্টি।",
        icon: "MapPin",
        points: ["RS/BS খতিয়ান যাচাই করা", "নামজারিসহ হস্তান্তর"],
      },
      {
        title: "নমনীয় কিস্তি",
        description:
          "আপনার ক্যাশফ্লো অনুযায়ী মাসিক পরিকল্পনা — বাজেট না ভেঙে।",
        icon: "CreditCard",
        points: ["মাসিক / ত্রৈমাসিক প্ল্যান", "ব্যাংক লোন ছাড়াই ইন-হাউস কিস্তি"],
      },
      {
        title: "সম্পূর্ণ আইনি নিরাপত্তা",
        description:
          "যাচাইকৃত দলিল, নিবন্ধিত স্বাক্ষর, কোনো অস্পষ্টতা নেই।",
        icon: "ShieldCheck",
        points: ["রেজিস্ট্রি-প্রস্তুত দলিল", "অভিজ্ঞ আইনি দল"],
      },
      {
        title: "বিনিয়োগে নিশ্চিত প্রবৃদ্ধি",
        description:
          "বিকাশমান এলাকায় জমি ও ফ্ল্যাটের মূল্য সময়ের সাথে বাড়ে — নিরাপদ বিনিয়োগ।",
        icon: "TrendingUp",
        points: ["বিকাশমান এলাকায় মূল্যবৃদ্ধি", "ভাড়া বা পুনর্বিক্রয়ে আয়"],
      },
      {
        title: "প্রমাণিত ট্র্যাক রেকর্ড",
        description:
          "১০+ বছরের অভিজ্ঞতা ও ৩০০০+ সন্তুষ্ট পরিবার — আস্থার নাম প্রমিস সিটি।",
        icon: "Award",
        points: ["৩০০০+ সন্তুষ্ট পরিবার", "১০+ বছরের অভিজ্ঞতা"],
      },
    ],
    highlights: [
      "৫+ চলমান ও সম্পন্ন প্রকল্প",
      "ফ্ল্যাট, জমি ও বাণিজ্যিক স্পেস",
      "প্রিমিয়াম লোকেশন",
      "৩০০০+ সুখী পরিবার",
    ],
  },
  {
    slug: "ahbab-real-estate",
    nameEn: "Ahbab Real Estate",
    nameBn: "আহবাব রিয়েল এস্টেট",
    shortBn: "আহবাব রিয়েল এস্টেট",
    tagline: "নকশা থেকে চাবি — সম্পূর্ণ নির্মাণ সমাধান",
    heroTitle: "প্রতিটি ইট গাঁথা হয় আপনার বিশ্বাসের উপর।",
    description:
      "ফ্ল্যাট, বাড়ি ও বাণিজ্যিক ভবন — অভিজ্ঞ স্থপতি, কঠোর মান নিয়ন্ত্রণ এবং সময়মতো হস্তান্তরের নিশ্চয়তায় ৫০ বছর পরেও যে নির্মাণ দাঁড়িয়ে থাকবে।",
    longDescription:
      "আহবাব রিয়েল এস্টেটের মাধ্যমে আমরা ফ্ল্যাট, বাড়ি এবং সব ধরনের নির্মাণকাজ সম্পন্ন করি। নকশা থেকে চাবি হস্তান্তর পর্যন্ত — সম্পূর্ণ নির্মাণ সমাধান এক ছাদের নিচে।",
    icon: "Hammer",
    accent: "blue",
    features: [
      {
        title: "আবাসিক ভবন নির্মাণ",
        description:
          "আধুনিক বাড়ি, অ্যাপার্টমেন্ট ও পারিবারিক কমপ্লেক্স নির্মাণ।",
        icon: "Home",
        points: ["নকশা থেকে ফিনিশিং", "মান নিয়ন্ত্রিত নির্মাণসামগ্রী"],
      },
      {
        title: "বাণিজ্যিক নির্মাণ",
        description:
          "অফিস, দোকান এবং মিশ্র-ব্যবহারের ভবন নির্মাণ।",
        icon: "Store",
        points: ["অফিস, শো-রুম ও দোকান", "মিশ্র-ব্যবহার ভবন"],
      },
      {
        title: "রিনোভেশন ও সম্প্রসারণ",
        description:
          "পুরানো ভবন আধুনিকায়ন এবং সম্প্রসারণের কাজ।",
        icon: "Wrench",
        points: ["পুরোনো ভবন আধুনিকায়ন", "অতিরিক্ত ফ্লোর সংযোজন"],
      },
      {
        title: "নকশা থেকে নির্মাণ",
        description:
          "আর্কিটেকচার, স্ট্রাকচারাল ডিজাইন থেকে নির্মাণ — সবকিছু।",
        icon: "Ruler",
        points: ["আর্কিটেকচারাল ও স্ট্রাকচারাল ডিজাইন", "3D ভিজ্যুয়ালাইজেশন"],
      },
      {
        title: "মান নিয়ন্ত্রণ",
        description:
          "প্রতিটি ধাপে কঠোর গুণগত তদারকি ও অভিজ্ঞ ইঞ্জিনিয়ার।",
        icon: "Award",
        points: ["প্রতিটি ধাপে তদারকি", "অভিজ্ঞ ইঞ্জিনিয়ার দল"],
      },
    ],
    highlights: [
      "সম্পূর্ণ নির্মাণ সমাধান",
      "অভিজ্ঞ স্থপতি ও ইঞ্জিনিয়ার দল",
      "সময়মতো হস্তান্তর",
      "দীর্ঘস্থায়ী মান",
    ],
  },
  {
    slug: "promise-international",
    nameEn: "Promise International",
    nameBn: "প্রমিস ইন্টারন্যাশনাল",
    shortBn: "প্রমিস ইন্টারন্যাশনাল",
    tagline: "১০,০০০ থেকে শুরু · যেকোনো সময় উত্তোলন",
    heroTitle: "ব্যাংক টাকা রাখে — আমরা টাকাকে কাজে লাগাই।",
    description:
      "ব্যাংকের চেয়ে উন্নত সঞ্চয় ব্যবস্থা — যেকোনো সময় উত্তোলনের স্বাধীনতা, লেনদেন-ভিত্তিক বার্ষিক লভ্যাংশ এবং সম্পূর্ণ স্বচ্ছ পরিচালনা। সুদ নয়, প্রকৃত লাভ।",
    longDescription:
      "প্রমিস ইন্টারন্যাশনালের মাধ্যমে আমরা ব্যাংকের চেয়েও উন্নত সঞ্চয় সেবা দিই। ১০,০০০ টাকা থেকে যেকোনো অঙ্ক জমা রাখুন, ব্যাংকের মতো যেকোনো সময় তুলুন, এবং বছর শেষে লেনদেনের ভিত্তিতে লভ্যাংশ পান। ব্যাংক তো সুদ দেয়, আর সময়মতো নিজের টাকা চাইলেও আজকাল পাওয়া যায় না — আমরা সেই সমস্যার সমাধান।",
    icon: "Landmark",
    accent: "ab",
    features: [
      {
        title: "১০,০০০ টাকা থেকে শুরু",
        description:
          "কম পরিমাণ থেকেই সঞ্চয় শুরু করতে পারবেন — যেকোনো অঙ্ক।",
        icon: "PiggyBank",
        points: ["যেকোনো অঙ্ক জমা", "সহজে অ্যাকাউন্ট খোলা"],
      },
      {
        title: "যেকোনো সময় উত্তোলন",
        description:
          "ব্যাংকের মতো যখন প্রয়োজন তখনই টাকা তুলতে পারবেন।",
        icon: "Wallet",
        points: ["ব্যাংকিং আওয়ারে তাৎক্ষণিক", "কোনো লক-ইন পিরিয়ড নেই"],
      },
      {
        title: "বার্ষিক লভ্যাংশ",
        description:
          "সারা বছরের লেনদেনের ভিত্তিতে বছর শেষে লভ্যাংশ — সুদ নয়।",
        icon: "TrendingUp",
        points: ["লেনদেন-ভিত্তিক মুনাফা", "সুদ নয়, প্রকৃত লাভ"],
      },
      {
        title: "স্বচ্ছ পরিচালনা",
        description:
          "প্রতিটি লেনদেন স্পষ্ট ও যাচাইযোগ্য, কোনো লুকানো শর্ত নেই।",
        icon: "Eye",
        points: ["প্রতিটি লেনদেন যাচাইযোগ্য", "কোনো লুকানো শর্ত নেই"],
      },
      {
        title: "দ্রুত জরুরি সেবা",
        description:
          "জরুরি প্রয়োজনে দ্রুত সাড়া — দীর্ঘ প্রক্রিয়ার ঝামেলা নেই।",
        icon: "Zap",
        points: ["জরুরি প্রয়োজনে দ্রুত সাড়া", "ন্যূনতম প্রক্রিয়া"],
      },
    ],
    highlights: [
      "ব্যাংকের চেয়ে উচ্চতর সুবিধা",
      "নমনীয় ও সহজ সঞ্চয়",
      "লেনদেন-ভিত্তিক লভ্যাংশ",
      "স্বচ্ছ ও বিশ্বস্ত",
    ],
  },
  {
    slug: "ahbab-travels-tours",
    nameEn: "Ahbab Travels & Tours",
    nameBn: "আহবাব ট্রাভেলস অ্যান্ড ট্যুরস",
    shortBn: "আহবাব ট্রাভেলস",
    tagline: "দেশসেরা হজ্জ ও উমরাহ পরিষেবা",
    heroTitle: "আল্লাহর ঘরে যাত্রা — আমরা পাশে হাঁটি প্রতিটি কদমে।",
    description:
      "বাংলাদেশের অন্যতম নির্ভরযোগ্য হজ্জ ও উমরাহ পরিষেবা। ভিসা প্রক্রিয়া থেকে দেশে ফেরা পর্যন্ত — অভিজ্ঞ মুয়াল্লিম, প্রিমিয়াম থাকা ও ২৪/৭ সহায়তা।",
    longDescription:
      "আহবাব ট্রাভেলস অ্যান্ড ট্যুরস বাংলাদেশের অন্যতম নির্ভরযোগ্য হজ্জ ও উমরাহ পরিষেবা প্রদানকারী। প্রতিটি ধাপে আপনার পাশে থাকি — ভিসা প্রক্রিয়া থেকে যাত্রা, এবং সফলভাবে দেশে ফেরা পর্যন্ত। অভিজ্ঞ গাইড, প্রিমিয়াম থাকার ব্যবস্থা এবং সম্পূর্ণ সহায়তা।",
    icon: "Plane",
    accent: "rb",
    features: [
      {
        title: "হজ্জ প্যাকেজ",
        description:
          "সম্পূর্ণ হজ্জ প্যাকেজ — ভিসা, ফ্লাইট, হোটেল ও মুয়াল্লিম সেবা।",
        icon: "Moon",
        points: ["ভিসা, ফ্লাইট ও হোটেল একসাথে", "অভিজ্ঞ মুয়াল্লিম"],
      },
      {
        title: "উমরাহ প্যাকেজ",
        description:
          "বছরজুড়ে উমরাহ যাত্রা — বিভিন্ন বাজেট ও মেয়াদের অপশন।",
        icon: "Star",
        points: ["বছরজুড়ে যাত্রার সুযোগ", "বিভিন্ন বাজেটের অপশন"],
      },
      {
        title: "ভিসা প্রক্রিয়া",
        description:
          "দ্রুত ও সঠিক ভিসা প্রক্রিয়াকরণ — সব কাগজপত্র আমরা সামলাই।",
        icon: "FileCheck",
        points: ["সম্পূর্ণ কাগজপত্র আমরা সামলাই", "দ্রুত ও সঠিক প্রসেসিং"],
      },
      {
        title: "হোটেল ও পরিবহন",
        description:
          "মক্কা ও মদিনায় প্রিমিয়াম থাকা এবং নির্ভরযোগ্য পরিবহন।",
        icon: "BedDouble",
        points: ["হারামের কাছে থাকা", "শীতাতপ নিয়ন্ত্রিত পরিবহন"],
      },
      {
        title: "অভিজ্ঞ গাইড",
        description:
          "জ্ঞানী ও অভিজ্ঞ মুয়াল্লিম এবং বাংলা ভাষায় গাইড।",
        icon: "Users",
        points: ["বাংলা ভাষায় গাইড", "প্রতি কদমে সঙ্গী"],
      },
      {
        title: "সম্পূর্ণ সহায়তা",
        description:
          "যাত্রার আগে, চলাকালীন ও পরে — ২৪/৭ সহায়তা।",
        icon: "Headphones",
        points: ["যাত্রার আগে-পরে সহায়তা", "২৪/৭ জরুরি হটলাইন"],
      },
    ],
    highlights: [
      "দেশসেরা সেবা",
      "শতভাগ স্বচ্ছ মূল্য",
      "অভিজ্ঞ মুয়াল্লিম দল",
      "প্রিমিয়াম থাকা ও পরিবহন",
    ],
  },
  {
    // Interior & 3D uses ASH for an elegant, neutral design-canvas feel
    // — balances the palette (2 red + 2 blue + 1 ash across the 5 divisions).
    slug: "interior-3d-design",
    nameEn: "Ahbab Interior and Architects",
    nameBn: "আহবাব ইন্টেরিয়র অ্যান্ড আর্কিটেক্টস",
    shortBn: "আহবাব ইন্টেরিয়র",
    tagline: "ইঞ্জিনিয়ারিং প্ল্যান ও ইন্টেরিয়র ডিজাইন",
    heroTitle: "চার দেয়ালে আপনার গল্প — আমরা শিল্প করে তুলি।",
    description:
      "বাড়ি, অফিস ও দোকানের ইন্টেরিয়র ডিজাইন, ইঞ্জিনিয়ারিং প্ল্যান ও ফটোরিয়ালিস্টিক 3D রেন্ডারিং — আপনার রুচি, প্রয়োজন ও বাজেট অনুযায়ী কাস্টম সমাধান।",
    longDescription:
      "প্রমিস গ্রুপের এই বিভাগে আমরা ইঞ্জিনিয়ারিং প্ল্যান, ইন্টেরিয়র ডিজাইন এবং ফটোরিয়ালিস্টিক 3D ভিজ্যুয়ালাইজেশন তৈরি করি — বাড়ি, অফিস, দোকান যেকোনো স্থাপনার জন্য। নির্মাণের আগেই দেখুন আপনার স্বপ্ন কেমন দেখাবে।",
    icon: "Palette",
    accent: "ash",
    features: [
      {
        title: "আবাসিক ইন্টেরিয়র",
        description:
          "বসার ঘর, শোবার ঘর, রান্নাঘর — প্রতিটি কোণে নিখুঁত নকশা।",
        icon: "Sofa",
        points: ["লিভিং, বেডরুম ও কিচেন", "প্রতিটি কোণে কাস্টম নকশা"],
      },
      {
        title: "অফিস ও কমার্শিয়াল",
        description:
          "অফিস, শো-রুম ও দোকানের জন্য আধুনিক ও কার্যকর নকশা।",
        icon: "Briefcase",
        points: ["অফিস, শো-রুম ও রিটেইল", "ব্র্যান্ড-সংগতিপূর্ণ ডিজাইন"],
      },
      {
        title: "3D রেন্ডারিং",
        description:
          "ফটোরিয়ালিস্টিক 3D ভিজ্যুয়ালাইজেশন — নির্মাণের আগেই দেখুন।",
        icon: "Box",
        points: ["ফটোরিয়ালিস্টিক ভিজ্যুয়াল", "নির্মাণের আগেই প্রিভিউ"],
      },
      {
        title: "স্পেস প্ল্যানিং",
        description:
          "প্রতিটি বর্গফুটের সর্বোচ্চ ব্যবহার — স্মার্ট লেআউট।",
        icon: "LayoutGrid",
        points: ["প্রতিটি বর্গফুটের সদ্ব্যবহার", "স্মার্ট, কার্যকর লেআউট"],
      },
      {
        title: "ফার্নিচার সিলেকশন",
        description:
          "নকশার সাথে মিলিয়ে সঠিক ফার্নিচার ও উপাদান নির্বাচন।",
        icon: "Armchair",
        points: ["নকশা-সংগতিপূর্ণ ফার্নিচার", "মানসম্পন্ন উপাদান"],
      },
      {
        title: "ইঞ্জিনিয়ারিং প্ল্যান ও নকশা",
        description:
          "ভবনের স্ট্রাকচারাল, সিভিল ও ইউটিলিটি প্ল্যানসহ বিস্তারিত আর্কিটেকচারাল নকশা।",
        icon: "Ruler",
        points: ["স্ট্রাকচারাল ও সিভিল প্ল্যান", "সম্পূর্ণ আর্কিটেকচারাল ড্রইং"],
      },
      {
        title: "কাস্টম সমাধান",
        description:
          "আপনার রুচি ও বাজেট অনুযায়ী সম্পূর্ণ ব্যক্তিগত ডিজাইন।",
        icon: "Palette",
        points: ["রুচি ও বাজেট অনুযায়ী", "সম্পূর্ণ ব্যক্তিগত ডিজাইন"],
      },
    ],
    highlights: [
      "ইঞ্জিনিয়ারিং প্ল্যান ও নকশা",
      "ফটোরিয়ালিস্টিক 3D রেন্ডারিং",
      "আবাসিক ও কমার্শিয়াল ইন্টেরিয়র",
      "স্পেস অপ্টিমাইজেশন",
    ],
  },
];

/** Brand logo (WebP, transparent) per division — used for the Hero
 *  showcase card icon and the "আমাদের বিভাগ" nav dropdown.  Keyed by
 *  slug; a division without an entry falls back to its lucide `icon`.
 *  Sources converted via scripts/convert-division-logos.mjs.
 *  All five divisions now have a brand logo. */
export const DIVISION_LOGO: Record<string, string> = {
  "promise-city": "/div-promise-city.webp",
  "ahbab-real-estate": "/div-ahbab-real-estate.webp",
  "promise-international": "/div-promise-international.webp",
  "ahbab-travels-tours": "/div-ahbab-travels-tours.webp",
  "interior-3d-design": "/div-ahbab-interior.webp",
};

/** Real photo per division for the homepage division-card headers.
 *  Keyed by slug; a division without an entry keeps its solid accent
 *  header.  (Savings + interior have no real project photo yet.) */
export const DIVISION_IMAGE: Record<string, string> = {
  "promise-city": "/promisecityreal.webp",
  "ahbab-real-estate": "/ahbab.webp",
  "promise-international": "/savings.webp",
  "ahbab-travels-tours": "/kaaba.webp",
  "interior-3d-design": "/interior3d.webp",
};

// "about" + "why" left in NAV_IDS so the navbar's title/tagline still
// flips correctly when the visitor scrolls *through* those homepage
// sections — even though they're no longer clickable in the menu.
export const NAV_IDS = ["home", "about", "divisions", "projects", "why", "contact"];

/** Curated short list for the footer "দ্রুত লিঙ্ক" column.
 *  Only the 5 highest-conversion pages — full NAV would make the
 *  footer column much taller than the others and break the
 *  symmetric 4-column layout. */
export const FOOTER_QUICK_LINKS: {
  label: string;
  labelEn: string;
  href: string;
}[] = [
  { label: "হোম", labelEn: "Home", href: "/#home" },
  { label: "আমাদের বিভাগ", labelEn: "Divisions", href: "/#divisions" },
  { label: "প্রকল্প", labelEn: "Projects", href: "/#projects" },
  { label: "পার্টনার হোন", labelEn: "Become a Partner", href: "/partner" },
  { label: "মার্কেটিং পলিসি", labelEn: "Marketing Policy", href: "/marketing-policy" },
  { label: "যোগাযোগ", labelEn: "Contact", href: "/contact" },
  { label: "পেমেন্ট মেথড", labelEn: "Payment Method", href: "/payment" },
];

/** When on the home section, navbar cycles through these brand identities */
export const HOME_BRAND_CYCLES = [
  { title: "PromisePD", tagline: SITE.tagline },
  { title: "প্রমিস সিটি", tagline: "স্বপ্ন যেখানে বাস্তব" },
];

/** Dynamic navbar title + tagline per section */
export const SECTION_META: Record<
  string,
  { title: string; tagline: string }
> = {
  home: { title: "PromisePD", tagline: SITE.tagline },
  about: { title: "আমাদের সম্পর্কে", tagline: "১৫+ বছরের আস্থা ও অঙ্গীকার" },
  stats: { title: "আমাদের যাত্রা", tagline: "সংখ্যায় প্রমিস গ্রুপ" },
  divisions: { title: "আমাদের বিভাগ", tagline: "৫টি বিভাগ — এক ছাদের নিচে" },
  projects: { title: "চলমান প্রকল্প", tagline: "ঢাকার বুকে নতুন ঠিকানা" },
  why: { title: "কেন প্রমিস গ্রুপ", tagline: "পরিবার যে কারণে বেছে নেয়" },
  testimonials: { title: "গ্রাহকদের কণ্ঠ", tagline: "তাঁদের কথায় আমাদের গল্প" },
  contact: { title: "যোগাযোগ করুন", tagline: "খুব শীঘ্রই উত্তর পাবেন" },
};

export const STATS = [
  { value: 15, suffix: "+", label: "বছরের অভিজ্ঞতা" },
  { value: 5, suffix: "", label: "ব্যবসায়িক বিভাগ" },
  { value: 5, suffix: "+", label: "প্রকল্প" },
  { value: 3000, suffix: "+", label: "সুখী পরিবার" },
];

export type Project = {
  /** URL slug — drives /projects/<slug> detail page + nav dropdown. */
  slug: string;
  name: string;
  status: "চলমান" | "সম্পন্ন" | "আসন্ন";
  location: string;
  price: string;
  size?: string;
  description: string;
  /** Longer copy shown on the detail page hero. */
  longDescription: string;
  /** Rich "about" paragraphs for the detail page.  If present, the
   *  detail page renders them with the first video embedded in the
   *  middle for a magazine-style layout. */
  details?: string[];
  highlights: string[];
  /** Brand accent for the card header band — keeps the projects grid varied. */
  accent: "red" | "blue" | "ash";
  /** Real cover image (WebP) — card header + detail hero. */
  cover: string;
  /** Gallery images for the detail page (first one usually = cover). */
  gallery: string[];
  /** Optional YouTube video ids shown on the detail page. */
  videoIds?: string[];
  /** Floor-plan link (PDF / image, e.g. Google Drive). */
  floorPlanUrl?: string;
  /** Full rules / spec marketing graphic — shown as an image section. */
  rulesImage?: string;
  /** Payment & deed terms — rendered as a dedicated detail section.
   *  `rows` are the headline figures (booking, instalment, total …);
   *  `note` carries the deed / construction-cost / transparency terms. */
  payment?: {
    rows: { label: string; value: string }[];
    note: string;
  };
  /** Building availability for multi-building projects (status grid). */
  buildings?: { total: number; soldOut: number; nowBooking: number };
  /** Floor-by-floor unit availability — rendered as a seat-map style
   *  diagram so visitors see which units are sold / open. */
  unitMap?: {
    floors: {
      label: string;
      units: {
        id: string;
        status: "sold" | "available" | "rented";
        size?: string;
      }[];
    }[];
    /** Optional parking summary (ground-floor / podium parking) shown as
     *  a separate box beside the unit grid. */
    parking?: { total: number; sold: number; available: number };
  };
  /** Land-plot categories & pricing (e.g. Promise City township). */
  plots?: {
    pricePerShotangsho: string;
    pricePerKatha: string;
    conversion: string;
    layoutPlanUrl?: string;
    note?: string;
    categories: { katha: string; shotangsho: string; price: string }[];
  };
  /** Limited-share projects (e.g. Fuzala Tower): `total` numbered
   *  shares, the first `sold` are gone, the rest are open & tappable
   *  (tap → dial to book). */
  shareMap?: {
    total: number;
    sold: number;
    note?: string;
  };
};

export const PROJECTS: Project[] = [
  {
    slug: "promise-city",
    name: "প্রমিস সিটি",
    status: "চলমান",
    location: "ঢাকা",
    price: "৳ ৬ লাখ / শতাংশ",
    description:
      "ঢাকার বুকে পরিকল্পিত আবাসিক টাউনশিপ — ফুজালা টাওয়ার ও ফুজালা কমপ্লেক্সের পাশাপাশি বিনিয়োগযোগ্য জমির প্লট (৪/৬/১০ কাঠা)।",
    longDescription:
      "প্রমিস সিটি আমাদের ফ্ল্যাগশিপ আবাসিক টাউনশিপ — ফুজালা টাওয়ার ও ফুজালা কমপ্লেক্সের পাশাপাশি বিনিয়োগযোগ্য জমির প্লট। যাচাইকৃত দলিল, নামজারিসহ হস্তান্তর এবং সম্পূর্ণ আইনি নিরাপত্তার সাথে ঢাকার বুকে আপনার ভবিষ্যতের ঠিকানা।",
    details: [
      "প্রমিস সিটি — ঢাকার বুকে একটি পরিকল্পিত আবাসিক টাউনশিপ, যেখানে ফুজালা টাওয়ার ও ফুজালা কমপ্লেক্সের পাশাপাশি রয়েছে বিনিয়োগযোগ্য জমির প্লট।",
      "জমির মূল্য: প্রতি শতাংশ ৬ লাখ টাকা, প্রতি কাঠা (= ১.৫ শতাংশ) ৯ লাখ টাকা। ৪ কাঠা, ৬ কাঠা ও ১০ কাঠা — তিন ক্যাটাগরির প্লট পাওয়া যাচ্ছে।",
      "যাচাইকৃত দলিল, নামজারিসহ হস্তান্তর — সম্পূর্ণ আইনি নিরাপত্তা। প্লটের লেআউট প্ল্যান দেখে আপনার পছন্দের প্লট বেছে নিন।",
    ],
    highlights: ["৪ / ৬ / ১০ কাঠা প্লট", "প্রতি কাঠা ৯ লাখ টাকা", "যাচাইকৃত দলিল ও নামজারি", "প্রিমিয়াম লোকেশন"],
    accent: "red",
    cover: "/promisecityreal.webp",
    gallery: [
      "/promisecityreal.webp",
      "/ftpics/ftt1.webp",
      "/fcpics/fc1.webp",
      "/ftpics/fuzala-2-0.webp",
    ],
    videoIds: ["u55eC0IjfUQ"],
    plots: {
      pricePerShotangsho: "৬ লাখ টাকা",
      pricePerKatha: "৯ লাখ টাকা",
      conversion: "১ কাঠা = ১.৫ শতাংশ",
      layoutPlanUrl:
        "https://drive.google.com/file/d/1Rh-zAWKCpS1MFt6BpMpzePSZs-Rvsir5/view?usp=sharing",
      note: "শীঘ্রই: ড্যাশবোর্ড থেকে লাইভ প্লট availability — ৪ / ৬ / ১০ কাঠা ফিল্টার করে কোন প্লট খালি আর কোনটি বিক্রি, তা সবাই দেখতে পারবেন — ইন শা আল্লাহ।",
      categories: [
        { katha: "৪ কাঠা", shotangsho: "৬ শতাংশ", price: "৳ ৩৬ লাখ" },
        { katha: "৬ কাঠা", shotangsho: "৯ শতাংশ", price: "৳ ৫৪ লাখ" },
        { katha: "১০ কাঠা", shotangsho: "১৫ শতাংশ", price: "৳ ৯০ লাখ" },
      ],
    },
  },
  {
    slug: "fuzala-tower",
    name: "ফুজালা টাওয়ার",
    status: "চলমান",
    location: "প্রমিস সিটি, ঢাকা",
    price: "৳ ৫ লাখ",
    description:
      "প্রমিস সিটির প্রাণকেন্দ্রে আধুনিক আবাসিক টাওয়ার — ৫ লাখ টাকা ল্যান্ড শেয়ার, এরপর নির্মাণ খরচ ৮টি সহজ কিস্তিতে। প্রতিটি ভবন ৯ শতাংশ (৬ কাঠা) জমির উপর।",
    longDescription:
      "ফুজালা টাওয়ার প্রমিস সিটির মুকুট — ঢাকার বুকে একটি আধুনিক, পূর্ণাঙ্গ আবাসিক টাওয়ার, যেখানে প্রতিটি পরিবার খুঁজে পায় নিরাপত্তা, স্বাচ্ছন্দ্য আর গর্ব করার মতো একটি ঠিকানা।",
    details: [
      "ফুজালা টাওয়ার শুধু একটি ভবন নয় — এটি প্রমিস সিটির মুকুট। ঢাকার বুকে একটি আধুনিক, পূর্ণাঙ্গ আবাসিক টাওয়ার, যেখানে প্রতিটি পরিবার খুঁজে পায় নিরাপত্তা, স্বাচ্ছন্দ্য এবং নিজের একটি গর্ব করার মতো ঠিকানা।",
      "চিন্তাশীল স্থাপত্য নকশায় গড়া প্রতিটি ইউনিট — পর্যাপ্ত আলো-বাতাস, খোলা ব্যালকনি, প্রশস্ত বসার ঘর ও আধুনিক ফিনিশিং। লিফট, জেনারেটর ব্যাকআপ, ২৪ ঘণ্টা নিরাপত্তা, নিজস্ব পার্কিং এবং কমিউনিটি স্পেস — দৈনন্দিন জীবনের প্রতিটি প্রয়োজন এক ছাদের নিচে।",
      "প্রমিস সিটির প্রাণকেন্দ্রে অবস্থিত হওয়ায় স্কুল, বাজার, মসজিদ, হাসপাতাল ও প্রধান সড়কের সাথে সহজ সংযোগ — যানজটের শহরে আপনার সময় আর স্বস্তি, দুটোই বাঁচে।",
      "যাচাইকৃত দলিল, নিবন্ধিত স্বাক্ষর ও সম্পূর্ণ আইনি স্বচ্ছতা — ফুজালা টাওয়ারে বিনিয়োগ মানে নিশ্চিন্ত ভবিষ্যৎ। ল্যান্ড শেয়ার ৫ লাখ টাকা, এরপর নির্মাণ খরচ ৪ লাখ টাকা — ৮টি সহজ কিস্তিতে (প্রতিবার ৫০,০০০ টাকা) + মাত্র ১০% সার্ভিস চার্জ। প্রতিটি কাজের A-Z হিসাব আপনি অ্যাপ, ওয়েবসাইট বা অফিসে নিজেই যাচাই করতে পারবেন।",
      "ভাড়ার ঘরে স্বপ্ন দেখা শেষ — ফুজালা টাওয়ারে গড়ে তুলুন আপনার পরিবারের স্থায়ী নিরাপত্তা ও অহংকার। আজই একটি সাইট ভিজিট বুক করুন এবং নিজ চোখে দেখে নিন কেন প্রমিস সিটি ঢাকার বিশ্বস্ত নাম।",
    ],
    highlights: [
      "ল্যান্ড শেয়ার ৫ লাখ থেকে",
      "নির্মাণ ৮ কিস্তিতে · ১০% সার্ভিস চার্জ",
      "সম্পূর্ণ স্বচ্ছ নির্মাণ হিসাব",
      "প্রিমিয়াম লোকেশন · স্কাইলাইন ভিউ",
    ],
    accent: "red",
    cover: "/ftpics/ftt1.webp",
    gallery: ["/ftpics/ftt1.webp", "/ftpics/ft.webp", "/ftpics/fuzala-2-0.webp"],
    videoIds: ["appf8v2ATLo"],
    rulesImage: "/ft-rules.webp",
    payment: {
      rows: [
        { label: "ল্যান্ড শেয়ার", value: "৫,০০,০০০ টাকা" },
        { label: "নির্মাণ খরচ", value: "৪,০০,০০০ টাকা" },
        { label: "কিস্তি", value: "৮ × ৫০,০০০" },
      ],
      note: "ল্যান্ড শেয়ার ৫,০০,০০০ টাকা পরিশোধের পর নির্মাণ খরচ ৪,০০,০০০ টাকা — ৮টি কিস্তিতে (প্রতিবার ৫০,০০০ টাকা) + মাত্র ১০% সার্ভিস চার্জ। কাজ শুরু হলে ৫০,০০০ টাকা দিন → কোম্পানি নির্মাণকাজ এগিয়ে নেবে → প্রতিটি কাজের A-Z হিসাব অ্যাপ, ওয়েবসাইট বা অফিসে দেখে নিন → এরপর পরের কিস্তি। সম্পূর্ণ স্বচ্ছ নির্মাণ হিসাব।",
    },
    shareMap: {
      total: 350,
      sold: 300,
      note: "মোট ৩৫০টি শেয়ারের মধ্যে ৩০০টি ইতিমধ্যে বিক্রি শেষ — মাত্র ৫০টি বাকি। যেকোনো খালি শেয়ারে ক্লিক করলেই সরাসরি কল চলে যাবে। দেরি করলে পছন্দের শেয়ার হাতছাড়া হতে পারে।",
    },
  },
  {
    slug: "fuzala-complex",
    name: "ফুজালা কমপ্লেক্স",
    status: "চলমান",
    location: "প্রমিস সিটি, ঢাকা",
    price: "৳ ৫,২০,০০০",
    size: "১২০০ বর্গফুট / ইউনিট",
    description:
      "৩০টি ভবনের পারিবারিক আবাসন — G+9, প্রতি ফ্লোরে ২টি ১২০০ বর্গফুট ইউনিট। ১১টি ভবন বিক্রি শেষ, ১২ নম্বর ভবনে বুকিং চলছে।",
    longDescription:
      "ফুজালা কমপ্লেক্স প্রমিস সিটির সাশ্রয়ী পারিবারিক আবাসন প্রকল্প — মোট ৩০টি ভবন, প্রতিটি ৯ শতাংশ (প্রায় ৬ কাঠা) জমির উপর G+9 কাঠামোয় নির্মিত।",
    details: [
      "ফুজালা কমপ্লেক্স প্রমিস সিটির একটি সাশ্রয়ী পারিবারিক আবাসন প্রকল্প — মোট ৩০টি ভবন, প্রতিটি ভবন ৯ শতাংশ (প্রায় ৬ কাঠা) জমির উপর G+9 কাঠামোয় নির্মিত।",
      "প্রতিটি ফ্লোরে ২টি করে ইউনিট, প্রতিটি ১২০০ বর্গফুট। বেসমেন্টে পার্কিং — প্রতি ২ ইউনিটের জন্য ১টি পার্কিং স্পেস বরাদ্দ।",
      "ইতিমধ্যে ১১টি ভবন সম্পূর্ণ বিক্রি হয়ে গেছে। বর্তমানে ১২ নম্বর ভবনে বুকিং চলছে — পছন্দের ইউনিট নিশ্চিত করতে এখনই যোগাযোগ করুন।",
      "চিন্তাশীল লেআউট, নিরাপদ কমিউনিটি ও সহজ যাতায়াতের সংযোগ — প্রথমবার নিজের ঠিকানা গড়তে চাওয়া পরিবারের জন্য ফুজালা কমপ্লেক্স একটি আদর্শ ঠিকানা।",
    ],
    highlights: [
      "৩০টি ভবন · G+9",
      "প্রতি ফ্লোরে ২ ইউনিট · ১২০০ sqft",
      "৯ শতাংশ (৬ কাঠা) জমি",
      "বেসমেন্ট পার্কিং (২ ইউনিটে ১টি)",
    ],
    accent: "blue",
    cover: "/fcpics/fc1.webp",
    gallery: ["/fcpics/fc1.webp", "/fcpics/fc2.webp", "/fcpics/fc3.webp", "/fcpics/f4.webp"],
    floorPlanUrl:
      "https://drive.google.com/file/d/1LNYsoSRrMGJFrGXG4MQkAj7s71-JkK4L/view?usp=sharing",
    rulesImage: "/fc-rules.webp",
    payment: {
      rows: [
        { label: "বুকিং মানি", value: "৪০,০০০ টাকা" },
        { label: "মাসিক কিস্তি", value: "৪,০০০ টাকা" },
        { label: "ল্যান্ড শেয়ার", value: "৫,২০,০০০ টাকা" },
      ],
      note: "ল্যান্ড শেয়ার ৫,২০,০০০ টাকা সম্পূর্ণ পরিশোধ হলে প্রমিস সিটি জমির দলিল করে দেবে। এরপর ভবন নির্মাণে শুধু প্রকৃত নির্মাণ খরচ + মাত্র ১০% সার্ভিস চার্জ — আপনার নির্মাণের A-Z খরচ অ্যাপ, ওয়েবসাইট বা অফিসে এসে সরাসরি দেখতে পারবেন। কেউ ২০২৭ সালের ডিসেম্বরের মধ্যে সম্পূর্ণ ল্যান্ড শেয়ার দিলে তখনই জমির দলিল ও ২০২৯ সালে ফ্ল্যাট হস্তান্তর — ইন শা আল্লাহ।",
    },
    buildings: { total: 30, soldOut: 11, nowBooking: 12 },
    // Project documentary — rendered as the polished figure in the middle of
    // the "About" section (midVideo = videoIds[0]) in ProjectDetail.
    videoIds: ["C4CmXFQYv9Y"],
  },
  {
    slug: "ahbab-palace-01",
    name: "আহবাব প্যালেস · ০১",
    status: "চলমান",
    location: "বসুন্ধরা রিভার ভিউ, ঢাকা",
    price: "৳ ৪০.০০ লাখ",
    description:
      "ফ্ল্যাগশিপ প্যালেস-ক্লাস বাসস্থান — G+6, ১২টি ফ্ল্যাট। প্রায় সবাই উঠে গেছেন; ৫ম তলায় মাত্র ২টি ফ্ল্যাট খালি।",
    longDescription:
      "আহবাব প্যালেস ০১ আমাদের ফ্ল্যাগশিপ প্যালেস-ক্লাস বাসস্থান — G+6 ভবন, মোট ১২টি ফ্ল্যাট, প্রতি ফ্লোরে ২টি ইউনিট। প্রশস্ত যাপন, প্রিমিয়াম ফিনিশিং এবং নিরবচ্ছিন্ন গোপনীয়তা।",
    details: [
      "আহবাব প্যালেস ০১ — G+6 কাঠামোর ফ্ল্যাগশিপ ভবন, মোট ১২টি ফ্ল্যাট, প্রতি ফ্লোরে ২টি করে ইউনিট।",
      "প্রায় সব বাসিন্দা ইতিমধ্যে উঠে গেছেন — বর্তমানে শুধু ৫ম তলায় ২টি ফ্ল্যাট খালি আছে। ইউনিট ডায়াগ্রামে কোন ইউনিট খালি আর কোনটি বিক্রি, তা দেখে নিন।",
      "প্যালেস-ক্লাস মানে শুধু আকার নয় — মানে। প্রিমিয়াম ফিনিশিং, আমদানিকৃত ফিটিংস এবং প্রতিটি ফ্লোরে সীমিত ইউনিটের নিরবচ্ছিন্ন গোপনীয়তা।",
    ],
    highlights: [
      "G+6 · ১২টি ফ্ল্যাট",
      "প্রতি ফ্লোরে ২টি ইউনিট",
      "৫ম তলায় মাত্র ২টি খালি",
      "প্রিমিয়াম ফিনিশিং",
    ],
    accent: "red",
    cover: "/ahbab1pics/ahbab1pics.webp",
    gallery: ["/ahbab1pics/ahbab1pics.webp"],
    videoIds: ["9P1GRaFG-1I"],
    unitMap: {
      floors: [
        { label: "৬ষ্ঠ তলা", units: [{ id: "6A", status: "sold" }, { id: "6B", status: "sold" }] },
        { label: "৫ম তলা", units: [{ id: "5A", status: "available" }, { id: "5B", status: "available" }] },
        { label: "৪র্থ তলা", units: [{ id: "4A", status: "sold" }, { id: "4B", status: "sold" }] },
        { label: "৩য় তলা", units: [{ id: "3A", status: "sold" }, { id: "3B", status: "sold" }] },
        { label: "২য় তলা", units: [{ id: "2A", status: "sold" }, { id: "2B", status: "sold" }] },
        { label: "১ম তলা", units: [{ id: "1A", status: "sold" }, { id: "1B", status: "sold" }] },
      ],
    },
  },
  {
    slug: "ahbab-palace-02",
    name: "আহবাব প্যালেস · ০২",
    status: "চলমান",
    location: "বসুন্ধরা রিভার ভিউ, সি ব্লক, ঢাকা",
    price: "৳ ৪,০০০ / বর্গফুট",
    size: "১২০০ / ১৮০০ বর্গফুট",
    description:
      "বসুন্ধরা রিভার ভিউ সি ব্লকে দক্ষিণমুখী G+8 আবাসিক ভবন — ১২০০ ও ১৮০০ বর্গফুটের ফ্ল্যাট, প্রতি বর্গফুট মাত্র ৪,০০০ টাকা। ৫ম তলার ছাদ ঢালাইসহ প্রায় ৫০% কাজ সম্পন্ন।",
    longDescription:
      "আহবাব প্যালেস ০২ — বসুন্ধরা রিভার ভিউ সি ব্লকে (পুরাতন আদ-দীন মেডিকেলের সন্নিকটে, প্লট ৯২২ ও ৯২৩) দক্ষিণমুখী একটি আধুনিক G+8 আবাসিক ভবন। আধুনিক ও চমৎকার নকশায় কাজ দ্রুত এগিয়ে চলছে — ইতোমধ্যে ৫ম তলার ছাদ ঢালাইসহ প্রায় ৫০% কাজ সম্পন্ন। ইনশাআল্লাহ জুলাই ২০২৭-এর মধ্যে ফ্ল্যাট হস্তান্তর।",
    details: [
      "প্রকল্প: আহবাব প্যালেস ০২ · লোকেশন: বসুন্ধরা রিভার ভিউ, সি ব্লক (পুরাতন আদ-দীন মেডিকেলের সন্নিকটে) · প্লট নম্বর ৯২২ ও ৯২৩ · দিক: দক্ষিণমুখী।",
      "সুবিধা: বসুন্ধরা লেকের নিকটবর্তী; পার্ক, কলেজ, মাদরাসা, মসজিদ ও মার্কেট সংলগ্ন — একটি পরিবেশবান্ধব আধুনিক আবাসন এলাকা।",
      "G+8 ভবন — সাধারণ ফ্লোরে ৩টি করে ১২০০ বর্গফুট ইউনিট, ৪র্থ ও ৫ম তলায় ২টি করে ১৮০০ বর্গফুট বড় ইউনিট।",
      "কেন আহবাব রিয়েল এস্টেট: (ক) ৩৫–৪০% কম খরচে স্বপ্নের ফ্ল্যাটের মালিকানা; (খ) নির্ধারিত সময়ে হস্তান্তরের নিশ্চয়তা; (গ) স্বচ্ছ ও বিশ্বাসযোগ্য ল্যান্ড শেয়ার মডেল; (ঘ) রেজিস্ট্রেশনসহ যাবতীয় সহযোগিতা; (ঙ) উন্নত ও মানসম্মত নির্মাণ সামগ্রী।",
      "প্রগতি সময়সূচী — কাজ শুরু: জুন ২০২৫; কাজ শেষ: জুলাই ২০২৭ ইনশাআল্লাহ। বুকিং চলছে — ইতোমধ্যে বেশ কিছু শেয়ার বিক্রি হয়েছে, আর অল্প কিছু বাকি। ৫ম তলার ছাদসহ প্রায় ৫০% কাজ সম্পন্ন হওয়ায় এখন ল্যান্ড শেয়ারে কিছু প্রফিট যুক্ত হবে — পছন্দের ফ্ল্যাট নিশ্চিত করতে এখনই যোগাযোগ করুন।",
    ],
    highlights: [
      "দক্ষিণমুখী · বসুন্ধরা রিভার ভিউ সি ব্লক",
      "১২০০ / ১৮০০ বর্গফুট ফ্ল্যাট",
      "প্রতি বর্গফুট মাত্র ৪,০০০ টাকা",
      "৫ম তলার ছাদসহ প্রায় ৫০% কাজ সম্পন্ন",
    ],
    accent: "blue",
    cover: "/ahbab2pics/ahbab2pics.webp",
    gallery: ["/ahbab2pics/ahbab2pics.webp"],
    floorPlanUrl:
      "https://drive.google.com/file/d/1xcFgJ27f3X0AcxwK28yTf5DgSsKip2XY/view?usp=sharing",
    payment: {
      rows: [
        { label: "প্রতি বর্গফুট", value: "৪,০০০ টাকা" },
        { label: "১২০০ বর্গফুট ফ্ল্যাট", value: "প্রায় ৪৮ লাখ" },
        { label: "১৮০০ বর্গফুট ফ্ল্যাট", value: "প্রায় ৭২ লাখ" },
      ],
      note: "ফ্ল্যাটের মূল্য প্রতি বর্গফুট ৪,০০০ টাকা হিসেবে নির্ধারিত — ১২০০ বর্গফুট প্রায় ৪৮ লক্ষ, ১৮০০ বর্গফুট প্রায় ৭২ লক্ষ টাকা। শুরুতে ল্যান্ড শেয়ার (১২০০ বর্গফুট ১৪.৫০ লক্ষ, ১৮০০ বর্গফুট ২১.৭৫ লক্ষ টাকা) পরিশোধ করে বাকি অর্থ নির্মাণের অগ্রগতি অনুযায়ী কিস্তিতে। বাজারের তুলনায় ৩৫–৪০% সাশ্রয়। ৫ম তলার ছাদসহ প্রায় ৫০% কাজ সম্পন্ন হওয়ায় এখন ল্যান্ড শেয়ারে কিছু প্রফিট যুক্ত হবে।",
    },
    unitMap: {
      floors: [
        { label: "ছাদ", units: [{ id: "R1", status: "available" }, { id: "R2", status: "available" }] },
        { label: "৯ম তলা", units: [{ id: "9A", status: "available", size: "১২০০" }, { id: "9B", status: "available", size: "১২০০" }, { id: "9C", status: "available", size: "১২০০" }] },
        { label: "৮ম তলা", units: [{ id: "8A", status: "available", size: "১২০০" }, { id: "8B", status: "sold", size: "১২০০" }, { id: "8C", status: "sold", size: "১২০০" }] },
        { label: "৭ম তলা", units: [{ id: "7A", status: "sold", size: "১২০০" }, { id: "7B", status: "sold", size: "১২০০" }, { id: "7C", status: "sold", size: "১২০০" }] },
        { label: "৬ষ্ঠ তলা", units: [{ id: "6A", status: "sold", size: "১২০০" }, { id: "6B", status: "sold", size: "১২০০" }, { id: "6C", status: "sold", size: "১২০০" }] },
        { label: "৫ম তলা", units: [{ id: "5A", status: "available", size: "১৮০০" }, { id: "5B", status: "sold", size: "১৮০০" }] },
        { label: "৪র্থ তলা", units: [{ id: "4A", status: "sold", size: "১৮০০" }, { id: "4B", status: "available", size: "১৮০০" }] },
        { label: "৩য় তলা", units: [{ id: "3A", status: "available", size: "১২০০" }, { id: "3B", status: "available", size: "১২০০" }, { id: "3C", status: "available", size: "১২০০" }] },
        { label: "২য় তলা", units: [{ id: "2A", status: "available", size: "১২০০" }, { id: "2B", status: "sold", size: "১২০০" }, { id: "2C", status: "sold", size: "১২০০" }] },
      ],
      // Ground floor is parking. Owner's latest: 12 total, 9 sold, 3 open.
      parking: { total: 12, sold: 9, available: 3 },
    },
  },
];

export const NAV = [
  // Home points at root `/` (not `/#home`) so the URL bar stays
  // clean — Navbar intercepts the click and scrolls to top when
  // the user is already on the homepage.
  { label: "হোম", href: "/", id: "home" },
  {
    label: "বিভাগ",
    href: "/#divisions",
    id: "divisions",
    dropdown: DIVISIONS.map((d) => ({
      label: d.nameBn,
      tagline: d.tagline,
      href: `/${d.slug}`,
      slug: d.slug,
      icon: d.icon as string | undefined,
      image: undefined as string | undefined,
      accent: d.accent as string,
    })),
  },
  {
    label: "প্রকল্প",
    href: "/#projects",
    id: "projects",
    dropdown: PROJECTS.map((p) => ({
      label: p.name,
      tagline: p.location,
      href: `/projects/${p.slug}`,
      slug: p.slug,
      icon: undefined as string | undefined,
      image: p.cover as string | undefined,
      accent: p.accent as string,
    })),
  },
  {
    label: "ফর্ম",
    href: "/forms",
    id: "forms",
    dropdown: FORMS.map((f) => ({
      label: f.nameBn,
      tagline: f.shortBn,
      href: `/forms/${f.slug}`,
      slug: f.slug,
      icon: undefined as string | undefined,
      image: f.pages[0] as string | undefined,
      accent: f.accent as string,
    })),
  },
  { label: "গ্যালারি", href: "/gallery", id: "gallery", standalone: true },
  { label: "পার্টনার হোন", href: "/partner", id: "partner", standalone: true },
  { label: "লিডারবোর্ড", href: "/leaderboard", id: "leaderboard", standalone: true },
  { label: "টিম", href: "/team", id: "team", standalone: true },
  { label: "পেছনের গল্প", href: "/story", id: "story", standalone: true },
  { label: "ব্লগ", href: "/blog", id: "blog", standalone: true },
];

export const WHY_US = [
  {
    title: "প্রিমিয়াম লোকেশন",
    description: "ঢাকার বিকাশমান এলাকা থেকে হাতে বাছাই করা প্রতিটি প্রকল্প।",
    icon: "MapPin",
  },
  {
    title: "গুণগত নিশ্চয়তা",
    description: "প্রতিটি দেয়াল, প্রতিটি ফিটিং — দশকের পর দশক টিকে থাকার মতো।",
    icon: "Award",
  },
  {
    title: "১৫+ বছরের অভিজ্ঞতা",
    description: "২০১০ সাল থেকে পরিবারগুলোকে সঠিক পথ দেখাচ্ছি, সঠিকভাবে।",
    icon: "Users",
  },
  {
    title: "নমনীয় কিস্তি",
    description: "আপনার বেতনের সাথে চলে — বিরুদ্ধে নয়। এমন পরিকল্পনা।",
    icon: "CreditCard",
  },
  {
    title: "আইনি নিরাপত্তা",
    description: "যাচাইকৃত দলিল, নিবন্ধিত স্বাক্ষর, কোনো অস্পষ্টতা নেই।",
    icon: "ShieldCheck",
  },
  {
    title: "৫ বিভাগ এক ছাদের নিচে",
    description: "রিয়েল এস্টেট, নির্মাণ, সঞ্চয়, হজ্জ ও ডিজাইন — সব একসাথে।",
    icon: "Layers",
  },
];

export const TESTIMONIALS = [
  {
    name: "রাশেদ আহমেদ",
    role: "গৃহকর্তা · ফুজালা টাওয়ার",
    quote:
      "প্রথম সাইট ভিজিট থেকে চাবি হাতে পাওয়ার দিন পর্যন্ত প্রতিটি ধাপ সহজ মনে হয়েছে। সৎ মানুষ, সৎ কাজ।",
  },
  {
    name: "নুসরাত জাহান",
    role: "পরিবার · আহবাব প্যালেস",
    quote:
      "ঢাকার ছয়জন ডেভেলপারের সাথে তুলনা করেছি। স্বচ্ছতাতেই প্রমিস গ্রুপ জিতেছে — আর নির্মাণের মানও প্রতিশ্রুতির চেয়েও ভালো।",
  },
  {
    name: "আবদুল হালিম",
    role: "হাজী · আহবাব ট্রাভেলস",
    quote:
      "আল্লাহর ঘরে যাত্রার প্রতিটি ধাপে আহবাব ট্রাভেলস পাশে ছিল। নির্ভরযোগ্যতা, যত্ন এবং ইসলামি আদব — সবকিছু পেয়েছি।",
  },
  {
    name: "ইমরান হোসেন",
    role: "সঞ্চয়ী · প্রমিস ইন্টারন্যাশনাল",
    quote:
      "ব্যাংকের ঝামেলা ছাড়াই প্রতিমাসে সঞ্চয় করছি, যখন প্রয়োজন তখনই তুলেছি। স্বচ্ছতা ও সুবিধা — দুটোই।",
  },
  {
    name: "সাবিনা ইয়াসমিন",
    role: "গৃহকর্তা · ইন্টেরিয়র ডিজাইন",
    quote:
      "3D ডিজাইন দেখে নির্মাণের আগেই বাড়িটা মনে হয়েছিল চিনি। ফিনিশিং-ও ঠিক তেমনই হয়েছে।",
  },
];

export const INTERESTS = [
  "প্রমিস সিটি — ফ্ল্যাট/জমি",
  "আহবাব রিয়েল এস্টেট — নির্মাণ",
  "প্রমিস ইন্টারন্যাশনাল — সঞ্চয়",
  "আহবাব ট্রাভেলস — হজ্জ/উমরাহ",
  "ইন্টেরিয়র ও 3D ডিজাইন",
  "সাধারণ পরামর্শ",
];
