/** Official application forms — each is an exact replica of the
 *  company's real PDF form. The blank PDF pages are rasterised to
 *  WebP (scripts/rasterize-forms.mjs → /public/forms/<slug>-p<n>.webp)
 *  and used as the form background; the applicant's typed values are
 *  overlaid at the coordinates below, then the whole thing is captured
 *  to a faithful PDF (client-side, so Bengali shapes correctly) and
 *  emailed to the office.
 *
 *  Coordinates are PERCENTAGES of the page image (top/left of the
 *  baseline where the value should sit), so they scale at any preview
 *  size. `size` is the font size in % of the page WIDTH. */

export type FormFieldType = "text" | "tel" | "email" | "number" | "date";

export type FormField = {
  key: string;
  label: string;
  type: FormFieldType;
  /** Section grouping for the data-entry UI. */
  group: string;
  required?: boolean;
  placeholder?: string;
  /** Overlay placement on the form image. */
  pos: {
    page: number; // 1-based page index
    top: number; // % from top (text baseline sits just above this line)
    left: number; // % from left
    width: number; // % wide (text condenses within)
    size?: number; // font size as % of page width (default S)
    align?: "left" | "center";
    /** When present, the value renders into the printed grid boxes.
     *  - "digits" (default): one digit per box (NID / mobile).
     *  - "date": value is DDMMYYYY → day, month, year each centred in
     *    its own box (`cells` = the 3 box-centre x%). */
    boxes?: {
      cy: number;
      size?: number;
      mode?: "digits" | "date";
      firstX?: number;
      pitch?: number;
      count?: number;
      cells?: number[];
    };
  };
};

/** A photo the applicant uploads, painted into a ছবি box. */
export type PhotoBox = {
  key: string; // "applicant" | "nominee"
  label: string;
  note: string;
  page: number;
  left: number;
  top: number;
  width: number;
  height: number;
};

/** An auto-filled signature/date drawn in a stylish (cursive) font. */
export type SignaturePlace = {
  id: string;
  source: "applicantName" | "fixed" | "today";
  value?: string; // for source==="fixed"
  page: number;
  left: number;
  top: number;
  width: number;
  size: number;
  align?: "left" | "center";
  cursive?: boolean;
};

export type FormDef = {
  slug: string;
  nameBn: string;
  shortBn: string;
  description: string;
  accent: "red" | "blue" | "ash";
  /** Ordered page background images (WebP). */
  pages: string[];
  /** True once fields are mapped + calibrated. */
  ready: boolean;
  fields: FormField[];
  photos?: PhotoBox[];
  signatures?: SignaturePlace[];
  /** Uploaded ID docs appended as extra PDF pages (full-page image). */
  documents?: { key: string; label: string }[];
};

/** Shared default font size (% of page width). Bumped for legibility. */
const S = 1.9;

export const FORMS: FormDef[] = [
  {
    slug: "flat-allocation",
    nameBn: "ফ্ল্যাট বরাদ্দের আবেদন ফরম",
    shortBn: "ফ্ল্যাট বরাদ্দ",
    description:
      "আহবাব রিয়েল এস্টেটের ফ্ল্যাট বুকিং ও বরাদ্দের জন্য আবেদন ফরম — আবেদনকারী, নমিনি ও অফিসিয়াল তথ্যসহ।",
    accent: "blue",
    pages: ["/forms/flat-allocation-p1.webp", "/forms/flat-allocation-p2.webp"],
    ready: true,
    fields: [
      // ── Applicant ───────────────────────────────────────────
      { key: "file_no", label: "ফাইল নং", type: "text", group: "আবেদনকারীর তথ্য", placeholder: "অফিস পূরণ করবে — খালি রাখুন", pos: { page: 1, top: 18.5, left: 16, width: 20, size: S } },
      { key: "name", label: "নাম", type: "text", group: "আবেদনকারীর তথ্য", required: true, pos: { page: 1, top: 21.0, left: 11.5, width: 40, size: S } },
      { key: "profession", label: "পেশা", type: "text", group: "আবেদনকারীর তথ্য", pos: { page: 1, top: 21.0, left: 61, width: 16, size: S } },
      { key: "blood", label: "রক্তের গ্রুপ", type: "text", group: "আবেদনকারীর তথ্য", pos: { page: 1, top: 21.0, left: 87, width: 11, size: S } },
      { key: "father", label: "পিতা/স্বামী", type: "text", group: "আবেদনকারীর তথ্য", pos: { page: 1, top: 24.0, left: 16.5, width: 35, size: S } },
      { key: "mother", label: "মাতা", type: "text", group: "আবেদনকারীর তথ্য", pos: { page: 1, top: 24.0, left: 59, width: 37, size: S } },
      { key: "present_addr", label: "বর্তমান ঠিকানা", type: "text", group: "আবেদনকারীর তথ্য", pos: { page: 1, top: 26.7, left: 18, width: 78, size: S } },
      { key: "permanent_addr", label: "স্থায়ী ঠিকানা", type: "text", group: "আবেদনকারীর তথ্য", pos: { page: 1, top: 29.7, left: 15, width: 81, size: S } },
      { key: "dob", label: "জন্ম তারিখ (DDMMYYYY)", type: "text", group: "আবেদনকারীর তথ্য", placeholder: "১৫০৩১৯৯০", pos: { page: 1, top: 33.0, left: 16, width: 14, size: S, boxes: { mode: "date", cells: [17, 21, 26], cy: 32.4, size: 1.7 } } },
      { key: "nid", label: "NID/পাসপোর্ট নং", type: "text", group: "আবেদনকারীর তথ্য", pos: { page: 1, top: 33.0, left: 47, width: 40, size: 1.5, boxes: { firstX: 48.3, pitch: 3.06, count: 17, cy: 32.4, size: 1.6 } } },
      { key: "mobile", label: "মোবাইল নং", type: "tel", group: "আবেদনকারীর তথ্য", required: true, pos: { page: 1, top: 36.0, left: 17, width: 28, size: 1.5, boxes: { firstX: 15.8, pitch: 2.3, count: 11, cy: 36.8, size: 1.7 } } },
      { key: "email", label: "ই-মেইল", type: "email", group: "আবেদনকারীর তথ্য", pos: { page: 1, top: 38.0, left: 60, width: 36, size: 2.0 } },

      // ── Nominee ─────────────────────────────────────────────
      { key: "n_name", label: "নমিনির নাম", type: "text", group: "নমিনির তথ্য", pos: { page: 1, top: 45.0, left: 11, width: 38, size: S } },
      { key: "n_profession", label: "নমিনির পেশা", type: "text", group: "নমিনির তথ্য", pos: { page: 1, top: 45.0, left: 61, width: 16, size: S } },
      { key: "n_blood", label: "নমিনির রক্তের গ্রুপ", type: "text", group: "নমিনির তথ্য", pos: { page: 1, top: 48.5, left: 14, width: 11, size: S } },
      { key: "n_relation", label: "সম্পর্ক", type: "text", group: "নমিনির তথ্য", pos: { page: 1, top: 48.5, left: 35, width: 16, size: S } },
      { key: "n_dob", label: "নমিনির জন্ম তারিখ (DDMMYYYY)", type: "text", group: "নমিনির তথ্য", placeholder: "১০০৫১৯৯২", pos: { page: 1, top: 48.5, left: 65, width: 12, size: S, boxes: { mode: "date", cells: [66.5, 69.5, 73], cy: 48.8, size: 1.4 } } },
      { key: "n_father", label: "নমিনির পিতা/স্বামী", type: "text", group: "নমিনির তথ্য", pos: { page: 1, top: 51.5, left: 13, width: 30, size: S } },
      { key: "n_mother", label: "নমিনির মাতা", type: "text", group: "নমিনির তথ্য", pos: { page: 1, top: 51.5, left: 53, width: 24, size: S } },
      { key: "n_present_addr", label: "নমিনির বর্তমান ঠিকানা", type: "text", group: "নমিনির তথ্য", pos: { page: 1, top: 54.2, left: 18, width: 58, size: S } },
      { key: "n_permanent_addr", label: "নমিনির স্থায়ী ঠিকানা", type: "text", group: "নমিনির তথ্য", pos: { page: 1, top: 57.2, left: 15, width: 61, size: S } },
      { key: "n_nid", label: "নমিনির NID/পাসপোর্ট নং", type: "text", group: "নমিনির তথ্য", pos: { page: 1, top: 61.5, left: 22, width: 50, size: 1.5, boxes: { firstX: 17.5, pitch: 3.0, count: 17, cy: 60.8, size: 1.6 } } },
      { key: "n_mobile", label: "নমিনির মোবাইল নং", type: "tel", group: "নমিনির তথ্য", pos: { page: 1, top: 65.2, left: 17, width: 50, size: 1.5, boxes: { firstX: 15.8, pitch: 2.3, count: 11, cy: 65.3, size: 1.7 } } },

      // ── Official ────────────────────────────────────────────
      { key: "ref", label: "রেফারেন্স", type: "text", group: "অফিসিয়াল তথ্য", pos: { page: 1, top: 73.7, left: 13, width: 30, size: S } },
      { key: "project", label: "প্রজেক্টের নাম", type: "text", group: "অফিসিয়াল তথ্য", pos: { page: 1, top: 73.7, left: 53, width: 43, size: S } },
      { key: "location", label: "অবস্থান", type: "text", group: "অফিসিয়াল তথ্য", pos: { page: 1, top: 77.4, left: 15, width: 23, size: S } },
      { key: "flat_size", label: "ফ্ল্যাট সাইজ", type: "text", group: "অফিসিয়াল তথ্য", pos: { page: 1, top: 77.4, left: 45, width: 14, size: S } },
      { key: "block", label: "ব্লক নং", type: "text", group: "অফিসিয়াল তথ্য", pos: { page: 1, top: 77.4, left: 67, width: 8, size: S } },
      { key: "road", label: "রোড নং", type: "text", group: "অফিসিয়াল তথ্য", pos: { page: 1, top: 77.4, left: 85, width: 11, size: S } },
      { key: "plot", label: "প্লট নং", type: "text", group: "অফিসিয়াল তথ্য", pos: { page: 1, top: 80.9, left: 13, width: 14, size: S } },
      { key: "flat_no", label: "ফ্ল্যাট নং", type: "text", group: "অফিসিয়াল তথ্য", pos: { page: 1, top: 80.9, left: 37, width: 10, size: S } },
      { key: "payment_type", label: "পেমেন্টের ধরণ", type: "text", group: "অফিসিয়াল তথ্য", pos: { page: 1, top: 80.9, left: 60, width: 12, size: S } },
      { key: "onetime", label: "এককালীন", type: "text", group: "অফিসিয়াল তথ্য", pos: { page: 1, top: 80.9, left: 83, width: 13, size: S } },
      { key: "installment", label: "কিস্তি", type: "text", group: "অফিসিয়াল তথ্য", pos: { page: 1, top: 84.4, left: 13, width: 14, size: S } },
      { key: "booking_money", label: "বুকিং মানি", type: "text", group: "অফিসিয়াল তথ্য", pos: { page: 1, top: 84.4, left: 41, width: 16, size: S } },
      { key: "monthly", label: "প্রতি মাসের কিস্তি", type: "text", group: "অফিসিয়াল তথ্য", pos: { page: 1, top: 84.4, left: 73, width: 23, size: S } },
      { key: "total", label: "মোট মূল্য", type: "text", group: "অফিসিয়াল তথ্য", pos: { page: 1, top: 87.9, left: 16, width: 26, size: S } },
      { key: "in_words", label: "কথায়", type: "text", group: "অফিসিয়াল তথ্য", pos: { page: 1, top: 87.9, left: 52, width: 44, size: S } },
    ],
    photos: [
      { key: "applicant", label: "আবেদনকারীর ছবি", note: "৪০০×৪০০ px · পাসপোর্ট সাইজ রঙিন · সর্বোচ্চ ৫ MB", page: 1, left: 81.3, top: 6.0, width: 17.3, height: 11.6 },
      { key: "nominee", label: "নমিনির ছবি", note: "৪০০×৪০০ px · পাসপোর্ট সাইজ রঙিন · সর্বোচ্চ ৫ MB", page: 1, left: 81.3, top: 42.5, width: 17.3, height: 12.6 },
    ],
    signatures: [
      // Applicant signature (their name, cursive) + date — sits ABOVE
      // the nominee block's printed "স্বাক্ষর ও তারিখ" caption.
      { id: "applicant_sig", source: "applicantName", page: 1, left: 73, top: 63.4, width: 24, size: 2.4, align: "center", cursive: true },
      { id: "applicant_date", source: "today", page: 1, left: 73, top: 65.4, width: 24, size: 1.3, align: "center" },
      // Only the final approval signature is needed (page 2) — no
      // chairman/MD sign on page 1.
      { id: "applicant_sig2", source: "applicantName", page: 2, left: 6, top: 87.5, width: 26, size: 2.4, align: "center", cursive: true },
      { id: "md_sig2", source: "fixed", value: "MD. Kamrul Hasan", page: 2, left: 60, top: 87.5, width: 30, size: 2.6, align: "center", cursive: true },
    ],
    documents: [
      { key: "applicant_nid", label: "আবেদনকারীর NID / পাসপোর্ট" },
      { key: "nominee_nid", label: "নমিনির NID / পাসপোর্ট" },
    ],
  },

  // The remaining five share the same pipeline; field maps are added
  // (and calibrated) one by one. Pages already rasterised + listed so
  // visitors can preview the official form immediately.
  {
    slug: "investment",
    nameBn: "বিনিয়োগ ফরম",
    shortBn: "বিনিয়োগ",
    description: "প্রমিস ইন্টারন্যাশনালে সঞ্চয় ও বিনিয়োগের আবেদন ফরম।",
    accent: "blue",
    pages: ["/forms/investment-p1.webp", "/forms/investment-p2.webp"],
    ready: true,
    fields: [
      // ── Applicant ──────────────────────────────────────────────
      { key: "file_no", label: "ফাইল নং", type: "text", group: "আবেদনকারীর তথ্য", placeholder: "অফিস পূরণ করবে — খালি রাখুন", pos: { page: 1, top: 17.6, left: 17, width: 18, size: S } },
      { key: "name", label: "নাম", type: "text", group: "আবেদনকারীর তথ্য", required: true, pos: { page: 1, top: 22.2, left: 11.5, width: 40, size: S } },
      { key: "profession", label: "পেশা", type: "text", group: "আবেদনকারীর তথ্য", pos: { page: 1, top: 22.2, left: 61, width: 16, size: S } },
      { key: "blood", label: "রক্তের গ্রুপ", type: "text", group: "আবেদনকারীর তথ্য", pos: { page: 1, top: 22.2, left: 87, width: 11, size: S } },
      { key: "father", label: "পিতা/স্বামী", type: "text", group: "আবেদনকারীর তথ্য", pos: { page: 1, top: 25.5, left: 16.5, width: 35, size: S } },
      { key: "mother", label: "মাতা", type: "text", group: "আবেদনকারীর তথ্য", pos: { page: 1, top: 25.5, left: 59, width: 37, size: S } },
      { key: "present_addr", label: "বর্তমান ঠিকানা", type: "text", group: "আবেদনকারীর তথ্য", pos: { page: 1, top: 28.8, left: 18, width: 78, size: S } },
      { key: "permanent_addr", label: "স্থায়ী ঠিকানা", type: "text", group: "আবেদনকারীর তথ্য", pos: { page: 1, top: 32.0, left: 15, width: 81, size: S } },
      { key: "dob", label: "জন্ম তারিখ (DDMMYYYY)", type: "text", group: "আবেদনকারীর তথ্য", placeholder: "১৫০৩১৯৯০", pos: { page: 1, top: 35.0, left: 16, width: 14, size: S, boxes: { mode: "date", cells: [20.14, 23.7, 28.77], cy: 35.0, size: 1.7 } } },
      { key: "nid", label: "NID/পাসপোর্ট নং", type: "text", group: "আবেদনকারীর তথ্য", pos: { page: 1, top: 35.0, left: 47, width: 45, size: 1.5, boxes: { firstX: 49.06, pitch: 3.43, count: 13, cy: 35.0, size: 1.5 } } },
      { key: "mobile", label: "মোবাইল নং", type: "tel", group: "আবেদনকারীর তথ্য", required: true, pos: { page: 1, top: 38.3, left: 17, width: 35, size: 1.5, boxes: { firstX: 19.1, pitch: 3.11, count: 11, cy: 38.3, size: 1.6 } } },
      { key: "email", label: "ই-মেইল", type: "email", group: "আবেদনকারীর তথ্য", pos: { page: 1, top: 38.3, left: 60, width: 36, size: 2.0 } },

      // ── Nominee (full) ─────────────────────────────────────────
      { key: "n_name", label: "নমিনির নাম", type: "text", group: "নমিনির তথ্য", pos: { page: 1, top: 48.3, left: 11, width: 40, size: S } },
      { key: "n_profession", label: "নমিনির পেশা", type: "text", group: "নমিনির তথ্য", pos: { page: 1, top: 48.3, left: 61, width: 16, size: S } },
      { key: "n_blood", label: "নমিনির রক্তের গ্রুপ", type: "text", group: "নমিনির তথ্য", pos: { page: 1, top: 51.7, left: 14, width: 12, size: S } },
      { key: "n_relation", label: "সম্পর্ক", type: "text", group: "নমিনির তথ্য", pos: { page: 1, top: 51.7, left: 35, width: 16, size: S } },
      { key: "n_dob", label: "নমিনির জন্ম তারিখ (DDMMYYYY)", type: "text", group: "নমিনির তথ্য", placeholder: "১০০৫২০০০", pos: { page: 1, top: 50.9, left: 62, width: 14, size: S, boxes: { mode: "date", cells: [63.8, 67.5, 72.7], cy: 50.9, size: 1.4 } } },
      { key: "n_father", label: "নমিনির পিতা/স্বামী", type: "text", group: "নমিনির তথ্য", pos: { page: 1, top: 55.2, left: 13, width: 32, size: S } },
      { key: "n_mother", label: "নমিনির মাতা", type: "text", group: "নমিনির তথ্য", pos: { page: 1, top: 55.2, left: 53, width: 24, size: S } },
      { key: "n_present_addr", label: "নমিনির বর্তমান ঠিকানা", type: "text", group: "নমিনির তথ্য", pos: { page: 1, top: 58.5, left: 18, width: 58, size: S } },
      { key: "n_permanent_addr", label: "নমিনির স্থায়ী ঠিকানা", type: "text", group: "নমিনির তথ্য", pos: { page: 1, top: 62.0, left: 15, width: 61, size: S } },
      { key: "n_nid", label: "নমিনির NID/পাসপোর্ট নং", type: "text", group: "নমিনির তথ্য", pos: { page: 1, top: 66.7, left: 24, width: 50, size: 1.5, boxes: { firstX: 24.86, pitch: 3.9, count: 13, cy: 66.7, size: 1.5 } } },
      { key: "n_mobile", label: "নমিনির মোবাইল নং", type: "tel", group: "নমিনির তথ্য", pos: { page: 1, top: 69.8, left: 24, width: 50, size: 1.5, boxes: { firstX: 24.86, pitch: 3.9, count: 11, cy: 69.8, size: 1.6 } } },

      // ── Official (investment terms) ────────────────────────────
      { key: "ref", label: "রেফারেন্স", type: "text", group: "অফিসিয়াল তথ্য", pos: { page: 1, top: 81.0, left: 13, width: 34, size: S } },
      { key: "invest_method", label: "বিনিয়োগ পদ্ধতি", type: "text", group: "অফিসিয়াল তথ্য", pos: { page: 1, top: 85.0, left: 20, width: 70, size: S } },
      { key: "invest_start", label: "বিনিয়োগ শুরুর তারিখ", type: "text", group: "অফিসিয়াল তথ্য", pos: { page: 1, top: 88.6, left: 20, width: 28, size: S } },
      { key: "invest_end", label: "মেয়াদ উত্তীর্ণের তারিখ", type: "text", group: "অফিসিয়াল তথ্য", pos: { page: 1, top: 88.6, left: 62, width: 30, size: S } },
    ],
    photos: [
      { key: "applicant", label: "আবেদনকারীর ছবি", note: "৪০০×৪০০ px · পাসপোর্ট সাইজ রঙিন · সর্বোচ্চ ৫ MB", page: 1, left: 84.5, top: 3.5, width: 13.5, height: 9.5 },
      { key: "nominee", label: "নমিনির ছবি", note: "৪০০×৪০০ px · পাসপোর্ট সাইজ রঙিন · সর্বোচ্চ ৫ MB", page: 1, left: 81.5, top: 45.5, width: 16.5, height: 12.5 },
    ],
    signatures: [
      { id: "applicant_sig", source: "applicantName", page: 1, left: 73, top: 69.5, width: 24, size: 2.4, align: "center", cursive: true },
      { id: "applicant_date", source: "today", page: 1, left: 73, top: 71.5, width: 24, size: 1.3, align: "center" },
    ],
    documents: [
      { key: "applicant_nid", label: "আবেদনকারীর NID / পাসপোর্ট" },
      { key: "nominee_nid", label: "নমিনির NID / পাসপোর্ট" },
    ],
  },
  {
    slug: "promise-city",
    nameBn: "প্রমিস সিটি ফরম",
    shortBn: "প্রমিস সিটি",
    description: "প্রমিস সিটি প্রকল্পে জমি/প্লট বুকিংয়ের আবেদন ফরম।",
    accent: "red",
    pages: ["/forms/promise-city-p1.webp", "/forms/promise-city-p2.webp"],
    ready: true,
    fields: [
      // ── Applicant ──────────────────────────────────────────────
      { key: "file_no", label: "ফাইল নং", type: "text", group: "আবেদনকারীর তথ্য", placeholder: "অফিস পূরণ করবে — খালি রাখুন", pos: { page: 1, top: 20.0, left: 17, width: 18, size: S } },
      { key: "name", label: "নাম", type: "text", group: "আবেদনকারীর তথ্য", required: true, pos: { page: 1, top: 22.2, left: 11.5, width: 40, size: S } },
      { key: "profession", label: "পেশা", type: "text", group: "আবেদনকারীর তথ্য", pos: { page: 1, top: 22.2, left: 61, width: 16, size: S } },
      { key: "blood", label: "রক্তের গ্রুপ", type: "text", group: "আবেদনকারীর তথ্য", pos: { page: 1, top: 22.2, left: 87, width: 11, size: S } },
      { key: "father", label: "পিতা/স্বামী", type: "text", group: "আবেদনকারীর তথ্য", pos: { page: 1, top: 25.5, left: 16.5, width: 35, size: S } },
      { key: "mother", label: "মাতা", type: "text", group: "আবেদনকারীর তথ্য", pos: { page: 1, top: 25.5, left: 59, width: 37, size: S } },
      { key: "present_addr", label: "বর্তমান ঠিকানা", type: "text", group: "আবেদনকারীর তথ্য", pos: { page: 1, top: 28.8, left: 18, width: 78, size: S } },
      { key: "permanent_addr", label: "স্থায়ী ঠিকানা", type: "text", group: "আবেদনকারীর তথ্য", pos: { page: 1, top: 32.0, left: 15, width: 81, size: S } },
      { key: "dob", label: "জন্ম তারিখ (DDMMYYYY)", type: "text", group: "আবেদনকারীর তথ্য", placeholder: "১৫০৩১৯৯০", pos: { page: 1, top: 35.3, left: 16, width: 14, size: S, boxes: { mode: "date", cells: [20.14, 23.7, 28.77], cy: 35.3, size: 1.7 } } },
      { key: "nid", label: "NID/পাসপোর্ট নং", type: "text", group: "আবেদনকারীর তথ্য", pos: { page: 1, top: 35.3, left: 47, width: 45, size: 1.5, boxes: { firstX: 49.06, pitch: 3.43, count: 13, cy: 35.3, size: 1.5 } } },
      { key: "mobile", label: "মোবাইল নং", type: "tel", group: "আবেদনকারীর তথ্য", required: true, pos: { page: 1, top: 39.3, left: 17, width: 35, size: 1.5, boxes: { firstX: 19.1, pitch: 3.11, count: 11, cy: 39.3, size: 1.6 } } },
      { key: "email", label: "ই-মেইল", type: "email", group: "আবেদনকারীর তথ্য", pos: { page: 1, top: 40.2, left: 60, width: 36, size: 2.0 } },

      // ── Nominee (promise-city has a shorter nominee block) ─────
      { key: "n_name", label: "নমিনির নাম", type: "text", group: "নমিনির তথ্য", pos: { page: 1, top: 47.25, left: 11, width: 40, size: S } },
      { key: "n_relation", label: "সম্পর্ক", type: "text", group: "নমিনির তথ্য", pos: { page: 1, top: 47.25, left: 62, width: 30, size: S } },
      { key: "n_father", label: "নমিনির পিতা/স্বামী", type: "text", group: "নমিনির তথ্য", pos: { page: 1, top: 50.8, left: 16, width: 32, size: S } },
      { key: "n_mother", label: "নমিনির মাতা", type: "text", group: "নমিনির তথ্য", pos: { page: 1, top: 50.8, left: 56, width: 22, size: S } },
      { key: "n_present_addr", label: "নমিনির বর্তমান ঠিকানা", type: "text", group: "নমিনির তথ্য", pos: { page: 1, top: 54.1, left: 20, width: 56, size: S } },
      { key: "n_permanent_addr", label: "নমিনির স্থায়ী ঠিকানা", type: "text", group: "নমিনির তথ্য", pos: { page: 1, top: 57.55, left: 16, width: 60, size: S } },
      { key: "n_nid", label: "নমিনির NID/পাসপোর্ট নং", type: "text", group: "নমিনির তথ্য", pos: { page: 1, top: 61.4, left: 24, width: 48, size: 1.5, boxes: { firstX: 26.05, pitch: 3.84, count: 13, cy: 61.4, size: 1.5 } } },
      { key: "n_mobile", label: "নমিনির মোবাইল নং", type: "tel", group: "নমিনির তথ্য", pos: { page: 1, top: 65.2, left: 24, width: 50, size: 1.5, boxes: { firstX: 26.95, pitch: 4.49, count: 11, cy: 65.2, size: 1.6 } } },

      // ── Official (plot purchase) ───────────────────────────────
      { key: "ref", label: "রেফারেন্স", type: "text", group: "অফিসিয়াল তথ্য", pos: { page: 1, top: 72.2, left: 14, width: 32, size: S } },
      { key: "off_file_no", label: "ফাইল নং", type: "text", group: "অফিসিয়াল তথ্য", placeholder: "অফিস পূরণ করবে", pos: { page: 1, top: 72.2, left: 62, width: 32, size: S } },
      { key: "project", label: "প্রজেক্টের নাম", type: "text", group: "অফিসিয়াল তথ্য", pos: { page: 1, top: 75.3, left: 17, width: 30, size: S } },
      { key: "location", label: "অবস্থান", type: "text", group: "অফিসিয়াল তথ্য", pos: { page: 1, top: 75.3, left: 60, width: 34, size: S } },
      { key: "block", label: "ব্লক নং", type: "text", group: "অফিসিয়াল তথ্য", pos: { page: 1, top: 78.5, left: 12, width: 12, size: S } },
      { key: "road", label: "রোড নং", type: "text", group: "অফিসিয়াল তথ্য", pos: { page: 1, top: 78.5, left: 35, width: 11, size: S } },
      { key: "plot", label: "প্লট নং", type: "text", group: "অফিসিয়াল তথ্য", pos: { page: 1, top: 78.5, left: 56, width: 11, size: S } },
      { key: "plot_size", label: "প্লট সাইজ", type: "text", group: "অফিসিয়াল তথ্য", pos: { page: 1, top: 78.5, left: 80, width: 16, size: S } },
      { key: "payment_type", label: "পেমেন্টের ধরণ", type: "text", group: "অফিসিয়াল তথ্য", pos: { page: 1, top: 81.8, left: 20, width: 24, size: S } },
      { key: "installment_amount", label: "কিস্তির পরিমাণ", type: "text", group: "অফিসিয়াল তথ্য", pos: { page: 1, top: 81.8, left: 64, width: 30, size: S } },
      { key: "monthly", label: "মাসিক কিস্তি", type: "text", group: "অফিসিয়াল তথ্য", pos: { page: 1, top: 85.5, left: 16, width: 16, size: S } },
      { key: "yearly", label: "বার্ষিক কিস্তি", type: "text", group: "অফিসিয়াল তথ্য", pos: { page: 1, top: 85.5, left: 45, width: 16, size: S } },
      { key: "booking_money", label: "বুকিং মানি", type: "text", group: "অফিসিয়াল তথ্য", pos: { page: 1, top: 85.5, left: 75, width: 20, size: S } },
      { key: "total", label: "মোট মূল্য", type: "text", group: "অফিসিয়াল তথ্য", pos: { page: 1, top: 89.1, left: 16, width: 26, size: S } },
      { key: "in_words", label: "কথায়", type: "text", group: "অফিসিয়াল তথ্য", pos: { page: 1, top: 89.1, left: 52, width: 44, size: S } },
    ],
    photos: [
      { key: "applicant", label: "আবেদনকারীর ছবি", note: "৪০০×৪০০ px · পাসপোর্ট সাইজ রঙিন · সর্বোচ্চ ৫ MB", page: 1, left: 81.3, top: 6.0, width: 17.3, height: 11.6 },
      { key: "nominee", label: "নমিনির ছবি", note: "৪০০×৪০০ px · পাসপোর্ট সাইজ রঙিন · সর্বোচ্চ ৫ MB", page: 1, left: 81.3, top: 44.0, width: 16.5, height: 12.0 },
    ],
    signatures: [
      { id: "applicant_sig", source: "applicantName", page: 1, left: 73, top: 65.5, width: 24, size: 2.4, align: "center", cursive: true },
      { id: "applicant_date", source: "today", page: 1, left: 73, top: 67.5, width: 24, size: 1.3, align: "center" },
    ],
    documents: [
      { key: "applicant_nid", label: "আবেদনকারীর NID / পাসপোর্ট" },
      { key: "nominee_nid", label: "নমিনির NID / পাসপোর্ট" },
    ],
  },
  {
    slug: "fuzala-tower",
    nameBn: "ফুজালা টাওয়ার ফরম",
    shortBn: "ফুজালা টাওয়ার",
    description: "ফুজালা টাওয়ারে ফ্ল্যাট/শেয়ার বুকিংয়ের আবেদন ফরম।",
    accent: "red",
    pages: ["/forms/fuzala-tower-p1.webp", "/forms/fuzala-tower-p2.webp"],
    ready: true,
    fields: [
      // ── Applicant ──────────────────────────────────────────────
      { key: "file_no", label: "ফাইল নং", type: "text", group: "আবেদনকারীর তথ্য", placeholder: "অফিস পূরণ করবে — খালি রাখুন", pos: { page: 1, top: 18.4, left: 17, width: 18, size: S } },
      { key: "name", label: "নাম", type: "text", group: "আবেদনকারীর তথ্য", required: true, pos: { page: 1, top: 24.2, left: 11.5, width: 40, size: S } },
      { key: "profession", label: "পেশা", type: "text", group: "আবেদনকারীর তথ্য", pos: { page: 1, top: 24.2, left: 61, width: 16, size: S } },
      { key: "blood", label: "রক্তের গ্রুপ", type: "text", group: "আবেদনকারীর তথ্য", pos: { page: 1, top: 24.2, left: 87, width: 11, size: S } },
      { key: "father", label: "পিতা/স্বামী", type: "text", group: "আবেদনকারীর তথ্য", pos: { page: 1, top: 27.3, left: 16.5, width: 35, size: S } },
      { key: "mother", label: "মাতা", type: "text", group: "আবেদনকারীর তথ্য", pos: { page: 1, top: 27.3, left: 59, width: 37, size: S } },
      { key: "present_addr", label: "বর্তমান ঠিকানা", type: "text", group: "আবেদনকারীর তথ্য", pos: { page: 1, top: 30.5, left: 18, width: 78, size: S } },
      { key: "permanent_addr", label: "স্থায়ী ঠিকানা", type: "text", group: "আবেদনকারীর তথ্য", pos: { page: 1, top: 33.5, left: 15, width: 81, size: S } },
      { key: "dob", label: "জন্ম তারিখ (DDMMYYYY)", type: "text", group: "আবেদনকারীর তথ্য", placeholder: "১৫০৩১৯৯০", pos: { page: 1, top: 36.9, left: 16, width: 14, size: S, boxes: { mode: "date", cells: [20.14, 23.7, 28.77], cy: 36.9, size: 1.7 } } },
      { key: "nid", label: "NID/পাসপোর্ট নং", type: "text", group: "আবেদনকারীর তথ্য", pos: { page: 1, top: 36.9, left: 47, width: 45, size: 1.5, boxes: { firstX: 49.06, pitch: 3.43, count: 13, cy: 36.9, size: 1.5 } } },
      { key: "mobile", label: "মোবাইল নং", type: "tel", group: "আবেদনকারীর তথ্য", required: true, pos: { page: 1, top: 40.7, left: 17, width: 35, size: 1.5, boxes: { firstX: 19.1, pitch: 3.11, count: 11, cy: 40.7, size: 1.6 } } },
      { key: "email", label: "ই-মেইল", type: "email", group: "আবেদনকারীর তথ্য", pos: { page: 1, top: 42.2, left: 60, width: 36, size: 2.0 } },

      // ── Nominee ────────────────────────────────────────────────
      { key: "n_name", label: "নমিনির নাম", type: "text", group: "নমিনির তথ্য", pos: { page: 1, top: 49.1, left: 11, width: 40, size: S } },
      { key: "n_profession", label: "নমিনির পেশা", type: "text", group: "নমিনির তথ্য", pos: { page: 1, top: 49.1, left: 61, width: 16, size: S } },
      { key: "n_blood", label: "নমিনির রক্তের গ্রুপ", type: "text", group: "নমিনির তথ্য", pos: { page: 1, top: 52.4, left: 14, width: 11, size: S } },
      { key: "n_relation", label: "সম্পর্ক", type: "text", group: "নমিনির তথ্য", pos: { page: 1, top: 52.4, left: 35, width: 16, size: S } },
      { key: "n_dob", label: "নমিনির জন্ম তারিখ (DDMMYYYY)", type: "text", group: "নমিনির তথ্য", placeholder: "১০০৫২০০০", pos: { page: 1, top: 51.6, left: 62, width: 14, size: S, boxes: { mode: "date", cells: [63.8, 67.5, 72.7], cy: 51.6, size: 1.4 } } },
      { key: "n_father", label: "নমিনির পিতা/স্বামী", type: "text", group: "নমিনির তথ্য", pos: { page: 1, top: 55.7, left: 13, width: 32, size: S } },
      { key: "n_mother", label: "নমিনির মাতা", type: "text", group: "নমিনির তথ্য", pos: { page: 1, top: 55.7, left: 53, width: 24, size: S } },
      { key: "n_present_addr", label: "নমিনির বর্তমান ঠিকানা", type: "text", group: "নমিনির তথ্য", pos: { page: 1, top: 59.0, left: 18, width: 58, size: S } },
      { key: "n_permanent_addr", label: "নমিনির স্থায়ী ঠিকানা", type: "text", group: "নমিনির তথ্য", pos: { page: 1, top: 62.2, left: 15, width: 61, size: S } },
      { key: "n_nid", label: "নমিনির NID/পাসপোর্ট নং", type: "text", group: "নমিনির তথ্য", pos: { page: 1, top: 63.6, left: 24, width: 50, size: 1.5, boxes: { firstX: 24.86, pitch: 3.9, count: 13, cy: 63.6, size: 1.5 } } },
      { key: "n_mobile", label: "নমিনির মোবাইল নং", type: "tel", group: "নমিনির তথ্য", pos: { page: 1, top: 67.0, left: 24, width: 50, size: 1.5, boxes: { firstX: 24.86, pitch: 3.9, count: 11, cy: 67.0, size: 1.6 } } },

      // ── Official (Fuzala Tower share booking) ──────────────────
      { key: "ref", label: "রেফারেন্স", type: "text", group: "অফিসিয়াল তথ্য", pos: { page: 1, top: 78.9, left: 13, width: 32, size: S } },
      { key: "off_file_no", label: "ফাইল নং", type: "text", group: "অফিসিয়াল তথ্য", placeholder: "অফিস পূরণ করবে", pos: { page: 1, top: 78.9, left: 60, width: 32, size: S } },
      { key: "location", label: "অবস্থান", type: "text", group: "অফিসিয়াল তথ্য", pos: { page: 1, top: 82.4, left: 15, width: 22, size: S } },
      { key: "share_count", label: "শেয়ার সংখ্যা", type: "text", group: "অফিসিয়াল তথ্য", pos: { page: 1, top: 82.4, left: 52, width: 14, size: S } },
      { key: "payment_type", label: "পেমেন্টের ধরণ", type: "text", group: "অফিসিয়াল তথ্য", pos: { page: 1, top: 82.4, left: 82, width: 14, size: S } },
      { key: "installment", label: "কিস্তি", type: "text", group: "অফিসিয়াল তথ্য", pos: { page: 1, top: 85.6, left: 13, width: 16, size: S } },
      { key: "booking_money", label: "বুকিং মানি", type: "text", group: "অফিসিয়াল তথ্য", pos: { page: 1, top: 85.6, left: 41, width: 16, size: S } },
      { key: "monthly", label: "প্রতি মাসের কিস্তি", type: "text", group: "অফিসিয়াল তথ্য", pos: { page: 1, top: 85.6, left: 73, width: 23, size: S } },
      { key: "total", label: "মোট মূল্য", type: "text", group: "অফিসিয়াল তথ্য", pos: { page: 1, top: 89.1, left: 16, width: 26, size: S } },
      { key: "in_words", label: "কথায়", type: "text", group: "অফিসিয়াল তথ্য", pos: { page: 1, top: 89.1, left: 52, width: 44, size: S } },
    ],
    photos: [
      { key: "applicant", label: "আবেদনকারীর ছবি", note: "৪০০×৪০০ px · পাসপোর্ট সাইজ রঙিন · সর্বোচ্চ ৫ MB", page: 1, left: 84.5, top: 4.5, width: 13.5, height: 9.5 },
      { key: "nominee", label: "নমিনির ছবি", note: "৪০০×৪০০ px · পাসপোর্ট সাইজ রঙিন · সর্বোচ্চ ৫ MB", page: 1, left: 81.5, top: 46.5, width: 16.5, height: 12.5 },
    ],
    signatures: [
      { id: "applicant_sig", source: "applicantName", page: 1, left: 73, top: 67.5, width: 24, size: 2.4, align: "center", cursive: true },
      { id: "applicant_date", source: "today", page: 1, left: 73, top: 69.5, width: 24, size: 1.3, align: "center" },
    ],
    documents: [
      { key: "applicant_nid", label: "আবেদনকারীর NID / পাসপোর্ট" },
      { key: "nominee_nid", label: "নমিনির NID / পাসপোর্ট" },
    ],
  },
  {
    slug: "fuzala-complex",
    nameBn: "ফুজালা কমপ্লেক্স ফরম",
    shortBn: "ফুজালা কমপ্লেক্স",
    description: "ফুজালা কমপ্লেক্সে ফ্ল্যাট বুকিংয়ের আবেদন ফরম।",
    accent: "blue",
    pages: ["/forms/fuzala-complex-p1.webp", "/forms/fuzala-complex-p2.webp"],
    ready: true,
    fields: [
      // ── Applicant ──────────────────────────────────────────────
      { key: "file_no", label: "ফাইল নং", type: "text", group: "আবেদনকারীর তথ্য", placeholder: "অফিস পূরণ করবে — খালি রাখুন", pos: { page: 1, top: 17.8, left: 17, width: 18, size: S } },
      { key: "name", label: "নাম", type: "text", group: "আবেদনকারীর তথ্য", required: true, pos: { page: 1, top: 23.3, left: 11.5, width: 40, size: S } },
      { key: "profession", label: "পেশা", type: "text", group: "আবেদনকারীর তথ্য", pos: { page: 1, top: 23.3, left: 61, width: 16, size: S } },
      { key: "blood", label: "রক্তের গ্রুপ", type: "text", group: "আবেদনকারীর তথ্য", pos: { page: 1, top: 23.3, left: 87, width: 11, size: S } },
      { key: "father", label: "পিতা/স্বামী", type: "text", group: "আবেদনকারীর তথ্য", pos: { page: 1, top: 26.4, left: 16.5, width: 35, size: S } },
      { key: "mother", label: "মাতা", type: "text", group: "আবেদনকারীর তথ্য", pos: { page: 1, top: 26.4, left: 59, width: 37, size: S } },
      { key: "present_addr", label: "বর্তমান ঠিকানা", type: "text", group: "আবেদনকারীর তথ্য", pos: { page: 1, top: 29.6, left: 18, width: 78, size: S } },
      { key: "permanent_addr", label: "স্থায়ী ঠিকানা", type: "text", group: "আবেদনকারীর তথ্য", pos: { page: 1, top: 32.6, left: 15, width: 81, size: S } },
      { key: "dob", label: "জন্ম তারিখ (DDMMYYYY)", type: "text", group: "আবেদনকারীর তথ্য", placeholder: "১৫০৩১৯৯০", pos: { page: 1, top: 34.0, left: 16, width: 14, size: S, boxes: { mode: "date", cells: [20.14, 23.7, 28.77], cy: 34.0, size: 1.7 } } },
      { key: "nid", label: "NID/পাসপোর্ট নং", type: "text", group: "আবেদনকারীর তথ্য", pos: { page: 1, top: 34.0, left: 47, width: 45, size: 1.5, boxes: { firstX: 49.06, pitch: 3.43, count: 13, cy: 34.0, size: 1.5 } } },
      { key: "mobile", label: "মোবাইল নং", type: "tel", group: "আবেদনকারীর তথ্য", required: true, pos: { page: 1, top: 37.8, left: 17, width: 35, size: 1.5, boxes: { firstX: 19.1, pitch: 3.11, count: 11, cy: 37.8, size: 1.6 } } },
      { key: "email", label: "ই-মেইল", type: "email", group: "আবেদনকারীর তথ্য", pos: { page: 1, top: 39.3, left: 60, width: 36, size: 2.0 } },

      // ── Nominee (name+relation, then blood+profession+dob) ─────
      { key: "n_name", label: "নমিনির নাম", type: "text", group: "নমিনির তথ্য", pos: { page: 1, top: 48.4, left: 11, width: 42, size: S } },
      { key: "n_relation", label: "সম্পর্ক", type: "text", group: "নমিনির তথ্য", pos: { page: 1, top: 48.4, left: 60, width: 30, size: S } },
      { key: "n_blood", label: "নমিনির রক্তের গ্রুপ", type: "text", group: "নমিনির তথ্য", pos: { page: 1, top: 51.7, left: 14, width: 12, size: S } },
      { key: "n_profession", label: "নমিনির পেশা", type: "text", group: "নমিনির তথ্য", pos: { page: 1, top: 51.7, left: 40, width: 16, size: S } },
      { key: "n_dob", label: "নমিনির জন্ম তারিখ (DDMMYYYY)", type: "text", group: "নমিনির তথ্য", placeholder: "১০০৫২০০০", pos: { page: 1, top: 50.7, left: 62, width: 14, size: S, boxes: { mode: "date", cells: [63.8, 67.5, 72.7], cy: 50.7, size: 1.4 } } },
      { key: "n_father", label: "নমিনির পিতা/স্বামী", type: "text", group: "নমিনির তথ্য", pos: { page: 1, top: 55.0, left: 13, width: 32, size: S } },
      { key: "n_mother", label: "নমিনির মাতা", type: "text", group: "নমিনির তথ্য", pos: { page: 1, top: 55.0, left: 53, width: 24, size: S } },
      { key: "n_present_addr", label: "নমিনির বর্তমান ঠিকানা", type: "text", group: "নমিনির তথ্য", pos: { page: 1, top: 58.3, left: 18, width: 58, size: S } },
      { key: "n_permanent_addr", label: "নমিনির স্থায়ী ঠিকানা", type: "text", group: "নমিনির তথ্য", pos: { page: 1, top: 61.5, left: 15, width: 61, size: S } },
      { key: "n_nid", label: "নমিনির NID/পাসপোর্ট নং", type: "text", group: "নমিনির তথ্য", pos: { page: 1, top: 63.4, left: 24, width: 50, size: 1.5, boxes: { firstX: 24.86, pitch: 3.9, count: 13, cy: 63.4, size: 1.5 } } },
      { key: "n_mobile", label: "নমিনির মোবাইল নং", type: "tel", group: "নমিনির তথ্য", pos: { page: 1, top: 66.8, left: 24, width: 50, size: 1.5, boxes: { firstX: 24.86, pitch: 3.9, count: 11, cy: 66.8, size: 1.6 } } },

      // ── Official (Fuzala Complex flat booking) ─────────────────
      { key: "ref", label: "রেফারেন্স", type: "text", group: "অফিসিয়াল তথ্য", pos: { page: 1, top: 78.7, left: 13, width: 32, size: S } },
      { key: "off_file_no", label: "ফাইল নং", type: "text", group: "অফিসিয়াল তথ্য", placeholder: "অফিস পূরণ করবে", pos: { page: 1, top: 78.7, left: 60, width: 32, size: S } },
      { key: "location", label: "অবস্থান", type: "text", group: "অফিসিয়াল তথ্য", pos: { page: 1, top: 82.2, left: 15, width: 22, size: S } },
      { key: "share_count", label: "শেয়ার সংখ্যা", type: "text", group: "অফিসিয়াল তথ্য", pos: { page: 1, top: 82.2, left: 52, width: 14, size: S } },
      { key: "payment_type", label: "পেমেন্টের ধরণ", type: "text", group: "অফিসিয়াল তথ্য", pos: { page: 1, top: 82.2, left: 82, width: 14, size: S } },
      { key: "installment", label: "কিস্তির পরিমাণ", type: "text", group: "অফিসিয়াল তথ্য", pos: { page: 1, top: 85.4, left: 13, width: 16, size: S } },
      { key: "booking_money", label: "বুকিং মানি", type: "text", group: "অফিসিয়াল তথ্য", pos: { page: 1, top: 85.4, left: 41, width: 16, size: S } },
      { key: "monthly", label: "মাসিক কিস্তি", type: "text", group: "অফিসিয়াল তথ্য", pos: { page: 1, top: 85.4, left: 73, width: 23, size: S } },
      { key: "total", label: "মোট মূল্য", type: "text", group: "অফিসিয়াল তথ্য", pos: { page: 1, top: 88.9, left: 16, width: 26, size: S } },
      { key: "in_words", label: "কথায়", type: "text", group: "অফিসিয়াল তথ্য", pos: { page: 1, top: 88.9, left: 52, width: 44, size: S } },
    ],
    photos: [
      { key: "applicant", label: "আবেদনকারীর ছবি", note: "৪০০×৪০০ px · পাসপোর্ট সাইজ রঙিন · সর্বোচ্চ ৫ MB", page: 1, left: 84.5, top: 4.5, width: 13.5, height: 9.5 },
      { key: "nominee", label: "নমিনির ছবি", note: "৪০০×৪০০ px · পাসপোর্ট সাইজ রঙিন · সর্বোচ্চ ৫ MB", page: 1, left: 81.5, top: 46.0, width: 16.5, height: 12.5 },
    ],
    signatures: [
      { id: "applicant_sig", source: "applicantName", page: 1, left: 73, top: 67.0, width: 24, size: 2.4, align: "center", cursive: true },
      { id: "applicant_date", source: "today", page: 1, left: 73, top: 69.0, width: 24, size: 1.3, align: "center" },
    ],
    documents: [
      { key: "applicant_nid", label: "আবেদনকারীর NID / পাসপোর্ট" },
      { key: "nominee_nid", label: "নমিনির NID / পাসপোর্ট" },
    ],
  },
  {
    slug: "marketing-director",
    nameBn: "মার্কেটিং ডিরেক্টর ফরম",
    shortBn: "মার্কেটিং ডিরেক্টর",
    description: "প্রমিস গ্রুপের মার্কেটিং ডিরেক্টর হিসেবে যোগদানের আবেদন ফরম।",
    accent: "ash",
    pages: ["/forms/marketing-director-p1.webp", "/forms/marketing-director-p2.webp"],
    ready: true,
    fields: [
      // ── Applicant (job application) ────────────────────────────
      { key: "name", label: "নাম", type: "text", group: "আবেদনকারীর তথ্য", required: true, pos: { page: 1, top: 22.6, left: 11.5, width: 40, size: S } },
      { key: "profession", label: "পেশা", type: "text", group: "আবেদনকারীর তথ্য", pos: { page: 1, top: 22.6, left: 61, width: 16, size: S } },
      { key: "blood", label: "রক্তের গ্রুপ", type: "text", group: "আবেদনকারীর তথ্য", pos: { page: 1, top: 22.6, left: 87, width: 11, size: S } },
      { key: "father", label: "পিতা/স্বামী", type: "text", group: "আবেদনকারীর তথ্য", pos: { page: 1, top: 25.9, left: 16.5, width: 35, size: S } },
      { key: "mother", label: "মাতা", type: "text", group: "আবেদনকারীর তথ্য", pos: { page: 1, top: 25.9, left: 59, width: 37, size: S } },
      { key: "present_addr", label: "বর্তমান ঠিকানা", type: "text", group: "আবেদনকারীর তথ্য", pos: { page: 1, top: 29.2, left: 18, width: 78, size: S } },
      { key: "permanent_addr", label: "স্থায়ী ঠিকানা", type: "text", group: "আবেদনকারীর তথ্য", pos: { page: 1, top: 32.4, left: 15, width: 81, size: S } },
      { key: "dob", label: "জন্ম তারিখ (DDMMYYYY)", type: "text", group: "আবেদনকারীর তথ্য", placeholder: "১৫০৩১৯৯০", pos: { page: 1, top: 38.0, left: 16, width: 14, size: S, boxes: { mode: "date", cells: [20.14, 23.7, 28.77], cy: 38.0, size: 1.7 } } },
      { key: "nid", label: "NID/পাসপোর্ট নং", type: "text", group: "আবেদনকারীর তথ্য", pos: { page: 1, top: 38.0, left: 47, width: 45, size: 1.5, boxes: { firstX: 49.06, pitch: 3.43, count: 13, cy: 38.0, size: 1.5 } } },
      { key: "mobile", label: "মোবাইল নং", type: "tel", group: "আবেদনকারীর তথ্য", required: true, pos: { page: 1, top: 41.0, left: 17, width: 35, size: 1.5, boxes: { firstX: 19.1, pitch: 3.11, count: 11, cy: 41.0, size: 1.6 } } },
      { key: "email", label: "ই-মেইল", type: "email", group: "আবেদনকারীর তথ্য", pos: { page: 1, top: 41.4, left: 60, width: 36, size: 2.0 } },

      // ── Attestor (সত্যায়নকারী) ─────────────────────────────────
      { key: "v_name", label: "সত্যায়নকারীর নাম", type: "text", group: "সত্যায়নকারীর তথ্য", pos: { page: 1, top: 49.8, left: 11, width: 42, size: S } },
      { key: "v_profession", label: "সত্যায়নকারীর পেশা", type: "text", group: "সত্যায়নকারীর তথ্য", pos: { page: 1, top: 53.2, left: 13, width: 18, size: S } },
      { key: "v_blood", label: "সত্যায়নকারীর রক্তের গ্রুপ", type: "text", group: "সত্যায়নকারীর তথ্য", pos: { page: 1, top: 53.2, left: 40, width: 12, size: S } },
      { key: "v_dob", label: "সত্যায়নকারীর জন্ম তারিখ (DDMMYYYY)", type: "text", group: "সত্যায়নকারীর তথ্য", placeholder: "১০০৫২০০০", pos: { page: 1, top: 52.0, left: 61, width: 14, size: S, boxes: { mode: "date", cells: [62, 66, 71], cy: 52.0, size: 1.4 } } },
      { key: "v_father", label: "সত্যায়নকারীর পিতা/স্বামী", type: "text", group: "সত্যায়নকারীর তথ্য", pos: { page: 1, top: 56.6, left: 13, width: 32, size: S } },
      { key: "v_mother", label: "সত্যায়নকারীর মাতা", type: "text", group: "সত্যায়নকারীর তথ্য", pos: { page: 1, top: 56.6, left: 53, width: 24, size: S } },
      { key: "v_present_addr", label: "সত্যায়নকারীর বর্তমান ঠিকানা", type: "text", group: "সত্যায়নকারীর তথ্য", pos: { page: 1, top: 60.1, left: 18, width: 58, size: S } },
      { key: "v_permanent_addr", label: "সত্যায়নকারীর স্থায়ী ঠিকানা", type: "text", group: "সত্যায়নকারীর তথ্য", pos: { page: 1, top: 63.5, left: 15, width: 61, size: S } },
      { key: "v_mobile", label: "সত্যায়নকারীর মোবাইল নং", type: "tel", group: "সত্যায়নকারীর তথ্য", pos: { page: 1, top: 65.0, left: 22, width: 50, size: 1.5, boxes: { firstX: 22, pitch: 3.5, count: 11, cy: 65.0, size: 1.6 } } },
      { key: "v_nid", label: "সত্যায়নকারীর NID/পাসপোর্ট নং", type: "text", group: "সত্যায়নকারীর তথ্য", pos: { page: 1, top: 68.0, left: 22, width: 50, size: 1.5, boxes: { firstX: 22, pitch: 3.5, count: 13, cy: 68.0, size: 1.5 } } },

      // ── Official (appointment) ─────────────────────────────────
      { key: "ref", label: "রেফারেন্স", type: "text", group: "অফিসিয়াল তথ্য", pos: { page: 1, top: 80.5, left: 13, width: 34, size: S } },
      { key: "appoint_method", label: "নিয়োগ পদ্ধতি", type: "text", group: "অফিসিয়াল তথ্য", pos: { page: 1, top: 84.3, left: 22, width: 30, size: S } },
      { key: "department", label: "ডিপার্টমেন্ট", type: "text", group: "অফিসিয়াল তথ্য", pos: { page: 1, top: 84.3, left: 62, width: 30, size: S } },
      { key: "designation", label: "পদবী", type: "text", group: "অফিসিয়াল তথ্য", pos: { page: 1, top: 88.1, left: 13, width: 30, size: S } },
      { key: "appoint_date", label: "নিয়োগের তারিখ", type: "text", group: "অফিসিয়াল তথ্য", pos: { page: 1, top: 88.1, left: 60, width: 30, size: S } },
    ],
    photos: [
      { key: "applicant", label: "আবেদনকারীর ছবি", note: "৪০০×৪০০ px · পাসপোর্ট সাইজ রঙিন · সর্বোচ্চ ৫ MB", page: 1, left: 84.5, top: 4.0, width: 13.5, height: 9.5 },
      { key: "attestor", label: "সত্যায়নকারীর ছবি", note: "৪০০×৪০০ px · পাসপোর্ট সাইজ রঙিন · সর্বোচ্চ ৫ MB", page: 1, left: 81.5, top: 46.5, width: 16.5, height: 12.5 },
    ],
    signatures: [
      { id: "applicant_sig", source: "applicantName", page: 1, left: 73, top: 70.0, width: 24, size: 2.4, align: "center", cursive: true },
      { id: "applicant_date", source: "today", page: 1, left: 73, top: 72.0, width: 24, size: 1.3, align: "center" },
    ],
    documents: [
      { key: "applicant_nid", label: "আবেদনকারীর NID / পাসপোর্ট" },
      { key: "attestor_nid", label: "সত্যায়নকারীর NID / পাসপোর্ট" },
    ],
  },
];

export function getForm(slug: string): FormDef | undefined {
  return FORMS.find((f) => f.slug === slug);
}
