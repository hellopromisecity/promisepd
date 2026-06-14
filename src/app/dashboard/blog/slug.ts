/** Slug helper shared between the client form (live auto-suggest) and
 *  the server actions (final normalisation before the DB write).
 *
 *  Kept out of the "use server" actions file on purpose: every export
 *  of a "use server" module must be an async Server Function, and this
 *  is a plain synchronous utility used on both sides. */

// ── Bangla → Latin transliteration ────────────────────────────────
// Slugs MUST be ASCII: a non-ASCII URL path flows into Next.js's
// `x-next-cache-tags` response header on ISR pages, and Node rejects
// non-ASCII header values (ERR_INVALID_CHAR → 500 on Vercel).  So a
// Bangla title like "বার্ষিক ভ্রমণ গাইডলাইন ২০২৬" is romanised to
// "barshik-bhromon-gaidolain-2026" instead of kept as Bangla.

const BN_DIGITS: Record<string, string> = {
  "০": "0", "১": "1", "২": "2", "৩": "3", "৪": "4",
  "৫": "5", "৬": "6", "৭": "7", "৮": "8", "৯": "9",
};

const BN_VOWELS: Record<string, string> = {
  অ: "o", আ: "a", ই: "i", ঈ: "i", উ: "u", ঊ: "u", ঋ: "ri",
  এ: "e", ঐ: "oi", ও: "o", ঔ: "ou",
};

// Vowel signs (matra) that attach to a preceding consonant.
const BN_MATRA: Record<string, string> = {
  "া": "a", "ি": "i", "ী": "i", "ু": "u", "ূ": "u",
  "ৃ": "ri", "ে": "e", "ৈ": "oi", "ো": "o", "ৌ": "ou",
};

const BN_CONS: Record<string, string> = {
  ক: "k", খ: "kh", গ: "g", ঘ: "gh", ঙ: "ng",
  চ: "ch", ছ: "chh", জ: "j", ঝ: "jh", ঞ: "n",
  ট: "t", ঠ: "th", ড: "d", ঢ: "dh", ণ: "n",
  ত: "t", থ: "th", দ: "d", ধ: "dh", ন: "n",
  প: "p", ফ: "ph", ব: "b", ভ: "bh", ম: "m",
  য: "j", র: "r", ল: "l", শ: "sh", ষ: "sh", স: "s", হ: "h",
  "ড়": "r", "ঢ়": "rh", "য়": "y", "ৎ": "t",
};

const BN_OTHER: Record<string, string> = {
  "ং": "ng", // anusvara ং
  "ঃ": "h", //  visarga ঃ
  "ঁ": "", //   candrabindu ঁ
  "়": "", //   nukta ় (drop)
};

const HASANTA = "্"; // ্ — suppresses the inherent vowel

/** Romanise Bangla text to ASCII, adding the inherent "o" vowel after a
 *  consonant only when another syllable follows (so word-final consonants
 *  stay bare: বার্ষিক → "barshik", not "barshiko"). */
function transliterateBangla(input: string): string {
  const chars = [...input];
  let out = "";
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    if (BN_DIGITS[c]) { out += BN_DIGITS[c]; continue; }
    if (BN_VOWELS[c]) { out += BN_VOWELS[c]; continue; }
    if (BN_MATRA[c]) { out += BN_MATRA[c]; continue; }
    if (BN_OTHER[c] !== undefined) { out += BN_OTHER[c]; continue; }
    if (c === HASANTA) continue; // cluster join — no vowel
    if (BN_CONS[c]) {
      out += BN_CONS[c];
      const next = chars[i + 1];
      const moreSyllables = next != null && (BN_CONS[next] !== undefined || BN_VOWELS[next] !== undefined);
      if (moreSyllables) out += "o"; // inherent vowel, mid-word only
      continue;
    }
    out += c; // ASCII / anything else passes through to the strip step
  }
  return out;
}

/** Romanise Bangla, lowercase, spaces→-, strip non-url chars, collapse
 *  repeats.  Always returns an ASCII slug (or "" if nothing usable). */
export function slugify(raw: string): string {
  return transliterateBangla((raw ?? "").normalize("NFC"))
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
