/** Country dial-code list for the signup phone selector.
 *
 *  Bangladesh sits FIRST and is the default — ~90 % of members are local.
 *  The rest are ordered by relevance to this audience: the Gulf states
 *  (huge Bangladeshi workforce), then the neighbours, then the common
 *  Western / expat destinations, then the long tail.
 *
 *  `code` is the ISO-3166-1 alpha-2 (lowercase) used for the flag image;
 *  `dial` is the country calling code WITHOUT the leading "+".
 *
 *  Note: a dial code is NOT unique (USA + Canada both "1"), so the UI
 *  tracks the selected country by `code`, never by `dial`. */

export type Country = { code: string; name: string; dial: string };

export const COUNTRIES: Country[] = [
  { code: "bd", name: "Bangladesh", dial: "880" },
  // Gulf / Middle East — large Bangladeshi workforce
  { code: "sa", name: "Saudi Arabia", dial: "966" },
  { code: "ae", name: "United Arab Emirates", dial: "971" },
  { code: "qa", name: "Qatar", dial: "974" },
  { code: "kw", name: "Kuwait", dial: "965" },
  { code: "om", name: "Oman", dial: "968" },
  { code: "bh", name: "Bahrain", dial: "973" },
  { code: "jo", name: "Jordan", dial: "962" },
  { code: "lb", name: "Lebanon", dial: "961" },
  { code: "iq", name: "Iraq", dial: "964" },
  // South Asia / neighbours
  { code: "in", name: "India", dial: "91" },
  { code: "pk", name: "Pakistan", dial: "92" },
  { code: "np", name: "Nepal", dial: "977" },
  { code: "lk", name: "Sri Lanka", dial: "94" },
  { code: "mv", name: "Maldives", dial: "960" },
  { code: "bt", name: "Bhutan", dial: "975" },
  { code: "mm", name: "Myanmar", dial: "95" },
  { code: "af", name: "Afghanistan", dial: "93" },
  // South-East / East Asia
  { code: "my", name: "Malaysia", dial: "60" },
  { code: "sg", name: "Singapore", dial: "65" },
  { code: "bn", name: "Brunei", dial: "673" },
  { code: "id", name: "Indonesia", dial: "62" },
  { code: "th", name: "Thailand", dial: "66" },
  { code: "ph", name: "Philippines", dial: "63" },
  { code: "vn", name: "Vietnam", dial: "84" },
  { code: "cn", name: "China", dial: "86" },
  { code: "hk", name: "Hong Kong", dial: "852" },
  { code: "jp", name: "Japan", dial: "81" },
  { code: "kr", name: "South Korea", dial: "82" },
  // Western / expat hubs
  { code: "us", name: "United States", dial: "1" },
  { code: "gb", name: "United Kingdom", dial: "44" },
  { code: "ca", name: "Canada", dial: "1" },
  { code: "au", name: "Australia", dial: "61" },
  { code: "nz", name: "New Zealand", dial: "64" },
  { code: "ie", name: "Ireland", dial: "353" },
  { code: "it", name: "Italy", dial: "39" },
  { code: "fr", name: "France", dial: "33" },
  { code: "de", name: "Germany", dial: "49" },
  { code: "es", name: "Spain", dial: "34" },
  { code: "pt", name: "Portugal", dial: "351" },
  { code: "gr", name: "Greece", dial: "30" },
  { code: "nl", name: "Netherlands", dial: "31" },
  { code: "be", name: "Belgium", dial: "32" },
  { code: "ch", name: "Switzerland", dial: "41" },
  { code: "se", name: "Sweden", dial: "46" },
  { code: "no", name: "Norway", dial: "47" },
  { code: "dk", name: "Denmark", dial: "45" },
  { code: "tr", name: "Turkey", dial: "90" },
  { code: "ru", name: "Russia", dial: "7" },
  // Africa / others
  { code: "eg", name: "Egypt", dial: "20" },
  { code: "ly", name: "Libya", dial: "218" },
  { code: "sd", name: "Sudan", dial: "249" },
  { code: "za", name: "South Africa", dial: "27" },
  { code: "ng", name: "Nigeria", dial: "234" },
  { code: "ke", name: "Kenya", dial: "254" },
  { code: "ma", name: "Morocco", dial: "212" },
  { code: "ir", name: "Iran", dial: "98" },
  { code: "br", name: "Brazil", dial: "55" },
  { code: "mx", name: "Mexico", dial: "52" },
];

/** ISO code of the default country (Bangladesh). */
export const DEFAULT_COUNTRY = "bd";

/** Flag image URL (SVG → crisp at any size, renders on every OS incl. Windows
 *  where emoji flags don't). flagcdn.com is a free, CDN-cached flag host. */
export const flagUrl = (code: string) => `https://flagcdn.com/${code}.svg`;

/** Look up a country by ISO code, falling back to Bangladesh. */
export const countryByCode = (code: string): Country =>
  COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[0];
