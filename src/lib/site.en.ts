/** English overlay for homepage content.
 *
 *  The English pages iterate the SAME Bengali data arrays (so icons,
 *  accents, images, order and structure stay identical) and overlay the
 *  English TEXT from these lookups when the locale is "en". This keeps
 *  the change low-risk and avoids duplicating the full data shapes.
 *
 *  Keyed by slug (divisions/projects) or by index/label (stats, etc.). */

export const DIVISION_EN: Record<
  string,
  {
    name: string;
    tagline: string;
    heroTitle: string;
    description: string;
    highlights: string[];
  }
> = {
  "promise-city": {
    name: "Promise City",
    tagline: "Your own address in the heart of Dhaka",
    heroTitle: "No more dreaming from a rented home — own your address.",
    description:
      "Land plots, Fuzala Tower & Fuzala Complex in Promise City township, plus Ahbab Palace at Bashundhara River View — your future address with verified deeds, flexible instalments and full legal security.",
    highlights: [
      "5+ ongoing & completed projects",
      "Flats, land & commercial space",
      "Premium locations",
      "3,000+ happy families",
    ],
  },
  "ahbab-real-estate": {
    name: "Ahbab Real Estate",
    tagline: "Design to keys — a complete construction solution",
    heroTitle: "Every brick is laid on your trust.",
    description:
      "Flats, homes and commercial buildings — built by experienced architects with strict quality control and on-time handover, to stand strong even 50 years on.",
    highlights: [
      "Complete construction solution",
      "Experienced architect & engineer team",
      "On-time handover",
      "Lasting quality",
    ],
  },
  "promise-international": {
    name: "Promise International",
    tagline: "Start from 10,000 · withdraw anytime",
    heroTitle: "Banks just hold your money — we put it to work.",
    description:
      "A savings system better than a bank — freedom to withdraw anytime, transaction-based annual profit and fully transparent management. Real profit, not interest.",
    highlights: [
      "Better than a bank",
      "Flexible, easy savings",
      "Transaction-based profit",
      "Transparent & trusted",
    ],
  },
  "ahbab-travels-tours": {
    name: "Ahbab Travels & Tours",
    tagline: "The country's finest Hajj & Umrah service",
    heroTitle: "A journey to the House of Allah — we walk beside you every step.",
    description:
      "One of Bangladesh's most trusted Hajj & Umrah services. From visa processing to your return home — experienced muallims, premium accommodation and 24/7 support.",
    highlights: [
      "Nation's finest service",
      "100% transparent pricing",
      "Experienced muallim team",
      "Premium stay & transport",
    ],
  },
  "interior-3d-design": {
    name: "Ahbab Interior and Architects",
    tagline: "Engineering Plans & Interior Design",
    heroTitle: "Your story on four walls — we turn it into art.",
    description:
      "Interior design, engineering plans and photorealistic 3D rendering for homes, offices and shops — custom solutions to match your taste, needs and budget.",
    highlights: [
      "Engineering plans & drawings",
      "Photorealistic 3D rendering",
      "Residential & commercial interior",
      "Space optimisation",
    ],
  },
};

export const PROJECT_EN: Record<
  string,
  {
    name: string;
    status: string;
    location: string;
    price: string;
    size?: string;
    description: string;
    highlights: string[];
  }
> = {
  "promise-city": {
    name: "Promise City",
    status: "Ongoing",
    location: "Dhaka",
    price: "Tk 6 Lakh / decimal",
    description:
      "A planned residential township in Dhaka — investable land plots (4/6/10 katha) alongside Fuzala Tower and Fuzala Complex.",
    highlights: [
      "4 / 6 / 10 katha plots",
      "Tk 9 Lakh per katha",
      "Verified deed & mutation",
      "Premium location",
    ],
  },
  "fuzala-tower": {
    name: "Fuzala Tower",
    status: "Ongoing",
    location: "Promise City, Dhaka",
    price: "Tk 5 Lakh",
    description:
      "A modern residential tower at the heart of Promise City — Tk 5 Lakh land share, then construction cost in 8 easy instalments. Each building on 9 decimals (6 katha) of land.",
    highlights: [
      "Land share from Tk 5 Lakh",
      "Construction in 8 instalments · 10% service charge",
      "Fully transparent construction account",
      "Premium location · skyline view",
    ],
  },
  "fuzala-complex": {
    name: "Fuzala Complex",
    status: "Ongoing",
    location: "Promise City, Dhaka",
    price: "Tk 5,20,000",
    size: "1200 sqft / unit",
    description:
      "A 30-building family residence — G+9, two 1200 sqft units per floor. 11 buildings sold out; booking now open for building 12.",
    highlights: [
      "30 buildings · G+9",
      "2 units per floor · 1200 sqft",
      "9 decimals (6 katha) of land",
      "Basement parking (1 per 2 units)",
    ],
  },
  "ahbab-palace-01": {
    name: "Ahbab Palace · 01",
    status: "Ongoing",
    location: "Bashundhara River View, Dhaka",
    price: "Tk 40.00 Lakh",
    description:
      "Flagship palace-class residence — G+6, 12 flats. Nearly all occupied; only 2 flats left on the 5th floor.",
    highlights: [
      "G+6 · 12 flats",
      "2 units per floor",
      "Only 2 left on 5th floor",
      "Premium finishing",
    ],
  },
  "ahbab-palace-02": {
    name: "Ahbab Palace · 02",
    status: "Ongoing",
    location: "Bashundhara River View, C Block, Dhaka",
    price: "Tk 4,000 / sqft",
    size: "1200 / 1800 sqft",
    description:
      "A south-facing G+8 residential building at Bashundhara River View C Block — 1200 & 1800 sqft flats at just Tk 4,000 per sqft. 5th-floor roof cast; ~50% complete.",
    highlights: [
      "South-facing · Bashundhara River View C Block",
      "1200 / 1800 sqft flats",
      "Land share from Tk 14.50 Lakh",
      "~50% complete incl. 5th-floor roof",
    ],
  },
};

/** Project DETAIL page content in English, keyed by slug. Mirrors the
 *  Bengali Project fields used on /projects/[slug]. */
export const PROJECT_DETAIL_EN: Record<
  string,
  {
    longDescription: string;
    details?: string[];
    payment?: { rows: { label: string; value: string }[]; note: string };
    plots?: {
      pricePerShotangsho: string;
      pricePerKatha: string;
      conversion: string;
      note?: string;
      categories: { katha: string; shotangsho: string; price: string }[];
    };
    shareMap?: { note?: string };
  }
> = {
  "promise-city": {
    longDescription:
      "Promise City is our flagship residential township — Fuzala Tower and Fuzala Complex alongside investable land plots. Your future address in the heart of Dhaka, with verified deeds, handover with mutation and full legal security.",
    details: [
      "Promise City — a planned residential township in Dhaka, with investable land plots alongside Fuzala Tower and Fuzala Complex.",
      "Land price: 6 Lakh taka per decimal, 9 Lakh taka per katha (= 1.5 decimals). Three plot categories — 4 katha, 6 katha and 10 katha.",
      "Verified deed, handover with mutation — full legal security. Pick your plot from the layout plan.",
    ],
    plots: {
      pricePerShotangsho: "6 Lakh taka",
      pricePerKatha: "9 Lakh taka",
      conversion: "1 katha = 1.5 decimals",
      note: "Coming soon: live plot availability from the dashboard — filter by 4 / 6 / 10 katha and everyone can see which plots are open and which are sold — in shaa Allah.",
      categories: [
        { katha: "4 katha", shotangsho: "6 decimals", price: "Tk 36 Lakh" },
        { katha: "6 katha", shotangsho: "9 decimals", price: "Tk 54 Lakh" },
        { katha: "10 katha", shotangsho: "15 decimals", price: "Tk 90 Lakh" },
      ],
    },
  },
  "fuzala-tower": {
    longDescription:
      "Fuzala Tower is the crown of Promise City — a modern, complete residential tower in the heart of Dhaka, where every family finds security, comfort and an address to be proud of.",
    details: [
      "Fuzala Tower is not just a building — it is the crown of Promise City. A modern, complete residential tower in the heart of Dhaka, where every family finds security, comfort and an address worth taking pride in.",
      "Every unit is thoughtfully designed — ample light and air, open balconies, spacious living rooms and modern finishing. Lift, generator backup, 24-hour security, dedicated parking and community space — every daily need under one roof.",
      "Located at the heart of Promise City, with easy connection to schools, markets, mosques, hospitals and main roads — saving you both time and peace of mind in a congested city.",
      "Verified deed, registered signatures and full legal transparency — investing in Fuzala Tower means a secure future. Land share is 5 Lakh taka, then construction cost of 4 Lakh taka — in 8 easy instalments (50,000 taka each) + just a 10% service charge. You can verify the A-Z of every cost yourself via the app, website or office.",
      "No more dreaming from a rented home — build your family's lasting security and pride at Fuzala Tower. Book a site visit today.",
    ],
    payment: {
      rows: [
        { label: "Land share", value: "5,00,000 taka" },
        { label: "Construction cost", value: "4,00,000 taka" },
        { label: "Instalments", value: "8 × 50,000" },
      ],
      note: "After paying the 5,00,000 taka land share, construction cost is 4,00,000 taka — in 8 instalments (50,000 taka each) + just a 10% service charge. Pay 50,000 when work starts → the company advances construction → check the A-Z account on the app, website or at the office → then the next instalment. Fully transparent construction account.",
    },
    shareMap: {
      note: "Of 350 total shares, 300 are already sold — only 50 left. Tap any open share to call us directly. Don't wait — your preferred share may slip away.",
    },
  },
  "fuzala-complex": {
    longDescription:
      "Fuzala Complex is Promise City's affordable family-housing project — 30 buildings in total, each built G+9 on 9 decimals (about 6 katha) of land.",
    details: [
      "Fuzala Complex is Promise City's affordable family-housing project — 30 buildings in total, each on 9 decimals (about 6 katha) of land, built G+9.",
      "Two units per floor, each 1200 sqft. Basement parking — one parking space allotted per 2 units.",
      "11 buildings are already completely sold. Booking is now open for building 12 — contact us now to secure your preferred unit.",
      "Thoughtful layout, a safe community and easy transport links — Fuzala Complex is an ideal address for families building their first home.",
    ],
    payment: {
      rows: [
        { label: "Booking money", value: "40,000 taka" },
        { label: "Monthly instalment", value: "4,000 taka" },
        { label: "Land share", value: "5,20,000 taka" },
      ],
      note: "Once the 5,20,000 taka land share is fully paid, Promise City registers the land deed. After that, building construction costs only the actual construction cost + just a 10% service charge — and you can see the A-Z of your construction cost directly on the app, website or at the office. Pay the full land share by December 2027 and get the deed then, with flat handover in 2029 — in shaa Allah.",
    },
  },
  "ahbab-palace-01": {
    longDescription:
      "Ahbab Palace 01 is our flagship palace-class residence — a G+6 building with 12 flats, two units per floor. Spacious living, premium finishing and uninterrupted privacy.",
    details: [
      "Ahbab Palace 01 — a flagship G+6 building, 12 flats in total, two units per floor.",
      "Almost all residents have already moved in — currently only 2 flats remain on the 5th floor. See which units are open and which are sold in the unit diagram.",
      "Palace-class means more than size — it means quality. Premium finishing, imported fittings, and the uninterrupted privacy of limited units per floor.",
    ],
  },
  "ahbab-palace-02": {
    longDescription:
      "Ahbab Palace 02 — a south-facing modern G+8 building at Bashundhara River View C Block (near the old Ad-Din Medical, plots 922 & 923). Work is moving fast on a modern, elegant design — the 5th-floor roof is cast and roughly 50% complete. Flat handover by July 2027, in shaa Allah.",
    details: [
      "Project: Ahbab Palace 02 · Location: Bashundhara River View, C Block (near the old Ad-Din Medical) · Plots 922 & 923 · Facing: south.",
      "Advantages: near Bashundhara Lake; close to parks, college, madrasa, mosque and market — an eco-friendly, modern residential area.",
      "G+8 building — three 1200 sqft units per regular floor, and two larger 1800 sqft units on the 4th and 5th floors.",
      "Why Ahbab Real Estate: (a) own your dream flat for 35–40% less; (b) guaranteed on-time handover; (c) a transparent, trustworthy land-share model; (d) full support including registration; (e) superior, quality construction materials.",
      "Timeline — work started: June 2025; completion: July 2027 in shaa Allah. Booking is on — several shares already sold, only a few left. With ~50% complete including the 5th-floor roof, some profit now applies to the land share — contact us now to secure your preferred flat.",
    ],
    payment: {
      rows: [
        { label: "Per square foot", value: "4,000 taka" },
        { label: "1200 sqft flat", value: "~48 Lakh" },
        { label: "1800 sqft flat", value: "~72 Lakh" },
      ],
      note: "Flat price is set at 4,000 taka per square foot — 1200 sqft ~48 Lakh, 1800 sqft ~72 Lakh. Start by paying the land share (1200 sqft 14.50 Lakh, 1800 sqft 21.75 Lakh) and the rest in instalments tied to construction progress. ~35–40% cheaper than the market. With ~50% complete including the 5th-floor roof, some profit now applies to the land share.",
    },
  },
};

/** Bengali floor label → English, for the unit-map diagram. */
export const FLOOR_EN: Record<string, string> = {
  "ছাদ": "Roof",
  "৯ম তলা": "9th floor",
  "৮ম তলা": "8th floor",
  "৭ম তলা": "7th floor",
  "৬ষ্ঠ তলা": "6th floor",
  "৫ম তলা": "5th floor",
  "৪র্থ তলা": "4th floor",
  "৩য় তলা": "3rd floor",
  "২য় তলা": "2nd floor",
  "১ম তলা": "1st floor",
};

/** Stats — same order as STATS; only labels translate. */
export const STATS_EN_LABELS = [
  "Years of experience",
  "Business divisions",
  "Projects",
  "Happy families",
];

/** Why-us — same order as WHY_US. */
export const WHY_US_EN = [
  { title: "Premium location", description: "Every project hand-picked from Dhaka's fastest-growing areas." },
  { title: "Quality assurance", description: "Every wall, every fitting — built to last decade after decade." },
  { title: "15+ years of experience", description: "Guiding families the right way since 2010." },
  { title: "Flexible instalments", description: "Plans that move with your salary — never against it." },
  { title: "Legal security", description: "Verified deeds, registered signatures, zero ambiguity." },
  { title: "5 divisions under one roof", description: "Real estate, construction, savings, Hajj and design — all together." },
];

/** Testimonials — same order as TESTIMONIALS. */
export const TESTIMONIALS_EN = [
  {
    name: "Rashed Ahmed",
    role: "Homeowner · Fuzala Tower",
    quote:
      "From the first site visit to the day I got the keys, every step felt easy. Honest people, honest work.",
  },
  {
    name: "Nusrat Jahan",
    role: "Family · Ahbab Palace",
    quote:
      "I compared six developers in Dhaka. Promise Group won on transparency — and the build quality was even better than promised.",
  },
  {
    name: "Abdul Halim",
    role: "Hajji · Ahbab Travels",
    quote:
      "Ahbab Travels was beside me at every step of the journey to the House of Allah. Reliability, care and Islamic adab — I found it all.",
  },
  {
    name: "Imran Hossain",
    role: "Saver · Promise International",
    quote:
      "I save every month without the hassle of a bank, and withdraw whenever I need to. Transparency and convenience — both.",
  },
  {
    name: "Sabina Yasmin",
    role: "Homeowner · Interior Design",
    quote:
      "Seeing the 3D design, I knew the home before it was even built. The finishing turned out exactly the same.",
  },
];

/** Division DETAIL page content (longDescription + features) in English,
 *  keyed by slug. Same feature order/icons as the Bengali DIVISIONS. */
export const DIVISION_DETAIL_EN: Record<
  string,
  {
    long: string;
    features: { title: string; description: string; points: string[] }[];
  }
> = {
  "promise-city": {
    long: "Under our real-estate division we run two townships — land plots, Fuzala Tower and Fuzala Complex at Promise City, and Ahbab Palace 01 & 02 at Bashundhara River View. Flats, land and landing property — all with verified deeds and full legal security.",
    features: [
      { title: "Flats in premium locations", description: "Modern apartments in hand-picked projects across Dhaka's growing areas.", points: ["Near main roads, schools & markets", "1, 2 & 3-bedroom units"] },
      { title: "Verified land & plots", description: "Premium plots and landing property with full legal verification.", points: ["RS/BS khatian verified", "Handover with mutation"] },
      { title: "Flexible instalments", description: "A monthly plan that fits your cashflow — without breaking your budget.", points: ["Monthly / quarterly plans", "In-house instalments, no bank loan"] },
      { title: "Full legal security", description: "Verified deeds, registered signatures, zero ambiguity.", points: ["Registry-ready deed", "Experienced legal team"] },
      { title: "Assured investment growth", description: "Land and flat values rise over time in growing areas — a safe investment.", points: ["Appreciation in growing areas", "Income from rent or resale"] },
      { title: "Proven track record", description: "10+ years of experience and 3,000+ satisfied families — Promise City, a name you trust.", points: ["3,000+ satisfied families", "10+ years of experience"] },
    ],
  },
  "ahbab-real-estate": {
    long: "Through Ahbab Real Estate we deliver flats, homes and every kind of construction work. From design to key handover — a complete construction solution under one roof.",
    features: [
      { title: "Residential construction", description: "Modern homes, apartments and family complexes.", points: ["Design to finishing", "Quality-controlled materials"] },
      { title: "Commercial construction", description: "Offices, shops and mixed-use buildings.", points: ["Office, showroom & shop", "Mixed-use buildings"] },
      { title: "Renovation & extension", description: "Modernising old buildings and adding extensions.", points: ["Modernise old buildings", "Add extra floors"] },
      { title: "Design to construction", description: "Architecture and structural design through to construction — everything.", points: ["Architectural & structural design", "3D visualisation"] },
      { title: "Quality control", description: "Strict quality supervision at every stage with experienced engineers.", points: ["Supervision at every stage", "Experienced engineer team"] },
    ],
  },
  "promise-international": {
    long: "Through Promise International we offer savings services even better than a bank. Deposit any amount from 10,000 taka, withdraw anytime like a bank, and earn a transaction-based profit at year-end. Banks pay interest — and these days you can't even get your own money on time. We solve exactly that.",
    features: [
      { title: "Start from 10,000 taka", description: "Begin saving from a small amount — any sum.", points: ["Deposit any amount", "Easy account opening"] },
      { title: "Withdraw anytime", description: "Withdraw your money whenever you need, just like a bank.", points: ["Instant during banking hours", "No lock-in period"] },
      { title: "Annual profit", description: "A year-end profit based on the year's transactions — not interest.", points: ["Transaction-based profit", "Real profit, not interest"] },
      { title: "Transparent management", description: "Every transaction is clear and verifiable, with no hidden terms.", points: ["Every transaction verifiable", "No hidden terms"] },
      { title: "Fast emergency service", description: "Quick response in emergencies — no long, tedious process.", points: ["Fast response in emergencies", "Minimal process"] },
    ],
  },
  "ahbab-travels-tours": {
    long: "Ahbab Travels & Tours is one of Bangladesh's most trusted Hajj & Umrah providers. We stand beside you at every step — from visa processing to your journey and safe return home. Experienced guides, premium accommodation and complete support.",
    features: [
      { title: "Hajj packages", description: "Complete Hajj packages — visa, flight, hotel and muallim service.", points: ["Visa, flight & hotel together", "Experienced muallim"] },
      { title: "Umrah packages", description: "Umrah journeys year-round — options for every budget and duration.", points: ["Travel opportunities all year", "Options for every budget"] },
      { title: "Visa processing", description: "Fast, accurate visa processing — we handle all the paperwork.", points: ["We handle all paperwork", "Fast, accurate processing"] },
      { title: "Hotel & transport", description: "Premium accommodation in Makkah & Madinah and reliable transport.", points: ["Stay near the Haram", "Air-conditioned transport"] },
      { title: "Experienced guides", description: "Knowledgeable, experienced muallims and guidance in Bangla.", points: ["Guidance in Bangla", "A companion at every step"] },
      { title: "Complete support", description: "Support before, during and after the journey — 24/7.", points: ["Support before & after travel", "24/7 emergency hotline"] },
    ],
  },
  "interior-3d-design": {
    long: "In this division we create engineering plans, interior design and photorealistic 3D visualisation — for homes, offices, shops, any space. See how your dream will look before it is even built.",
    features: [
      { title: "Residential interior", description: "Living room, bedroom, kitchen — flawless design in every corner.", points: ["Living, bedroom & kitchen", "Custom design in every corner"] },
      { title: "Office & commercial", description: "Modern, functional design for offices, showrooms and shops.", points: ["Office, showroom & retail", "Brand-consistent design"] },
      { title: "3D rendering", description: "Photorealistic 3D visualisation — see it before it's built.", points: ["Photorealistic visuals", "Preview before construction"] },
      { title: "Space planning", description: "Maximum use of every square foot — smart layouts.", points: ["Make the most of every sqft", "Smart, functional layouts"] },
      { title: "Furniture selection", description: "The right furniture and materials matched to your design.", points: ["Design-consistent furniture", "Quality materials"] },
      { title: "Engineering plan & drawings", description: "Detailed architectural drawings with structural, civil and utility plans.", points: ["Structural & civil plans", "Complete architectural drawings"] },
      { title: "Custom solutions", description: "Fully personalised design to match your taste and budget.", points: ["To match taste & budget", "Fully personalised design"] },
    ],
  },
};

/** English navbar meta (the scrolling logo title/tagline) — page +
 *  section keys mirror the Bengali SECTION_META / page checks. */
export const NAV_META_EN: Record<string, { title: string; tagline: string }> = {
  home: { title: "PromisePD", tagline: "Where dreams are real" },
  about: { title: "About us", tagline: "15+ years of trust & commitment" },
  stats: { title: "Our journey", tagline: "Promise Group in numbers" },
  divisions: { title: "Our Divisions", tagline: "5 divisions — under one roof" },
  projects: { title: "Ongoing Projects", tagline: "New addresses in Dhaka" },
  why: { title: "Why Promise Group", tagline: "Why families choose us" },
  testimonials: { title: "Client voices", tagline: "Our story in their words" },
  contact: { title: "Contact us", tagline: "We'll reply very soon" },
  partner: { title: "Become a Partner", tagline: "Set your own income target" },
  blog: { title: "Promise Journal", tagline: "Real-estate knowledge, your way" },
  team: { title: "Our Team", tagline: "The people who build your dream" },
  leaderboard: { title: "Leaderboard", tagline: "Those at the top — and their rewards" },
  gallery: { title: "Gallery", tagline: "Our work in photos & videos" },
  story: { title: "Our Story", tagline: "The journey behind PromisePD" },
};

export const HOME_BRAND_CYCLES_EN = [
  { title: "PromisePD", tagline: "Where dreams are real" },
  { title: "Promise City", tagline: "Where dreams are real" },
];

/** Contact "interest" options — same order as INTERESTS. */
export const INTERESTS_EN = [
  "Promise City — flat/land",
  "Ahbab Real Estate — construction",
  "Promise International — savings",
  "Ahbab Travels — Hajj/Umrah",
  "Engineering & Interior Design",
  "General enquiry",
];

/** About pillars — same order as the About component. */
export const ABOUT_PILLARS_EN = [
  {
    title: "Built right",
    copy: "The same materials we'd use in our own home — nothing less. We measure standards in decades, not days.",
  },
  {
    title: "People first",
    copy: "Family before fees. Every decision starts with the person who will live here.",
  },
  {
    title: "Promises kept",
    copy: "On-time milestones, no hidden costs, and no surprises even after the keys are handed over.",
  },
];
