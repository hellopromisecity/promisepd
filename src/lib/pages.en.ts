/** English overlays for the Push-6 content pages (Story, Team, Partner,
 *  Gallery, Leaderboard, Marketing-policy, Contact).
 *
 *  Mirrors the site.en.ts / blog.en.ts pattern: the Bengali data in
 *  src/lib/* and the inline Bengali JSX stay the source of truth; these
 *  consts overlay the English TEXT (keyed by slug / id / src / index)
 *  when the active locale is "en". Components iterate the Bengali data,
 *  preserve every icon / accent / order / number-position, and swap in
 *  the strings from here.
 *
 *  Western digits throughout (no Bengali numerals) — English pages must
 *  show zero Bengali, including numbers. */

/* ── STORY ──────────────────────────────────────────────────────────── */

export type StoryMilestoneEn = { year: string; title: string; desc: string };
export type StoryIdentityEn = { label: string; value: string };

export const STORY_EN = {
  metaTitle: "The Story Behind — PromisePD",
  metaDesc:
    "In whose dream thousands of families now find a home — the life journey of Hafez Maulana Mufti Kamrul Hasan. From an ordinary village boy to the helm of Promise Group, a dream woven together milestone by milestone.",
  heroEyebrow: "The Story Behind",
  heroTitlePlain: "Whose dream is now home to",
  heroTitleAccent: "thousands of families",
  heroLead:
    "The hard-earned savings of thousands who once dreamed within rented walls now rest as a trust in his hands — our beloved",
  ceoFullName: "Hafez Maulana Mufti Kamrul Hasan",
  ceoName: "Kamrul Hasan",
  ceoRole: "Founder & Managing Director · Promise Group",
  leadPara1:
    "Who is this man — for whose success thousands of people, at home and abroad, pray from the heart, that he may see his dream fulfilled? For when his dream comes true, so too come true the dreams of thousands of families.",
  leadPara2A:
    "Some entrusted the hard-won earnings of life overseas, some the savings of a lifetime, and some the money from selling cherished jewellery — all in the hope of a place to call their own, placed as a trust in his hands. To these people from every walk of life and every corner of society, his name is the very meaning of trust — our beloved",
  identityHeadPlain: "A profile",
  identityHeadAccent: "at a glance",
  journeyEyebrow: "Two Decades of the Journey",
  journeyHeadPlain: "A dream journey woven",
  journeyHeadAccent: "milestone by milestone",
  journeySub:
    "From an ordinary village boy to a name thousands of families trust — every step shaped by hard work, honesty, and the mercy of Allah.",
  quotePlain:
    "Should he fall, the dreams of millions fall with him — and should he prevail, so too prevails the",
  quoteAccent: "small savings",
  quoteSub:
    "So let us all — you, I, all of us together — carry Promise forward. For then, we all win.",
  duaHeadPlain: "Our",
  duaHeadAccent: "du'a",
  duaBody:
    "May our Merciful Lord keep him free from all envy and malice, from every hardship and peril, and forever wrapped in the shelter of His mercy. May Allah the Almighty grant us all the strength to move forward with Promise and to see our dreams fulfilled — Ameen.",
  duaTagline: "Because Promise means — where dreams become real.",
  ctaEyebrow: "Let your journey begin today",
  ctaBody:
    "Whether it is the address of your dreams or a partnership in the Promise family — we are right beside you.",
  ctaContact: "Contact us",
  journeyReadBtn: "Read the life story",
  joinBtn: "Join the Promise family",
  milestones: [
    { year: "1986", title: "Born — Faridpur", desc: "On Thursday, 17 July 1986, he was born in the village of Uttar Chandibardi, Saltha police station, Faridpur. From earliest childhood, his path was shaped by Islamic education, moral character, and perseverance." },
    { year: "Childhood", title: "Primary Education", desc: "He completed his primary education at Ballavdi Primary School, then enrolled at Muksudpur S. J. High School." },
    { year: "Class 7", title: "A Path Toward the Deen", desc: "While studying in the seventh grade, a deep love for Islamic education took root in him — and he enrolled at Kaichail Hafezia Madrasa." },
    { year: "2005", title: "Hifz of the Holy Qur'an Completed", desc: "He successfully completed his Hifz at Khoria Nuraniya Hafezia Madrasa. That same year, he advanced toward higher Islamic education by enrolling in the Taisir department of Jamia Rahmania Arabia." },
    { year: "2010", title: "Beginning with Just ৳8,000", desc: "Alongside his studies, he began his business journey on a small scale with a capital of just ৳8,000 — the first step of honesty, hard work, and foresight." },
    { year: "2013", title: "Passed Dakhil", desc: "He passed the Dakhil examination from Dhaka Mohammadia Dakhil Madrasa, then enrolled at Dhaka College for higher studies." },
    { year: "2015", title: "Takmil — Master's-equivalent", desc: "He completed his Takmil (Master's-equivalent) at Jamia Rahmania Arabia under Befaqul Madarisil Arabia." },
    { year: "2016", title: "HSC and University", desc: "After passing the HSC from Dhaka College, he enrolled at Jagannath University." },
    { year: "2021", title: "Honours and Master's — Sociology", desc: "He completed his Honours and Master's degrees from the Department of Sociology at Jagannath University." },
    { year: "2026", title: "An Empire of Dreams", desc: "Today he stands at the helm of several thriving enterprises — including Promise City, Ahbab Real Estate, and Ahbab Travels and Tours — the architect of the dreams of thousands of families." },
  ] as StoryMilestoneEn[],
  identity: [
    { label: "Father", value: "Late Hares Sheikh" },
    { label: "Mother", value: "Foyjora Khatun" },
    { label: "Village", value: "Uttar Chandibardi" },
    { label: "Upazila", value: "Saltha" },
    { label: "District", value: "Faridpur" },
    { label: "Born", value: "17 July 1986 · Thursday" },
  ] as StoryIdentityEn[],
};

/* ── PARTNER ────────────────────────────────────────────────────────── */

export const PARTNER_EN = {
  metaTitle: "Become a Partner — Set Your Own Income Goals",
  metaDesc:
    "The Promise Group Partner Program. Refer just 25 people for a chance to earn a free Umrah plus ৳5,25,000 in rewards. Set your income goal in the calculator and build your plan.",
  ctaEyebrow: "Start Today",
  ctaHeadPlain: "Your partnership journey is just",
  ctaHeadAccent: "one phone call away.",
  ctaBody:
    "Take the plan you have mapped out in the calculator and talk to our marketing team directly — understand onboarding, training, and the commission structure in detail.",
  sendMsg: "Send Message",
  /** keyed by commission id */
  commissions: {
    "fuzala-tower": { unit: "per share", description: "A limited number of shares remain with the company — the highest commission on every sale." },
    "fuzala-complex": { unit: "per share", description: "An attractive commission on every Fuzala Complex share you sell." },
    "land": { unit: "per decimal", description: "A guaranteed commission on every decimal of land sold." },
    "ahbab-flat": { unit: "per flat", description: "One flat sold equals a remarkable month's income." },
    "officer-recruit": { unit: "per officer", description: "Earned by Marketing Directors for every active officer they recruit." },
    "umrah": { unit: "per passenger", description: "Extra income on every Umrah passenger booking." },
    "hajj": { unit: "per passenger", description: "Income on every Hajj passenger booking." },
  } as Record<string, { unit: string; description: string }>,
  /** index-aligned with PARTNER_RULES */
  rules: [
    { tag: "Office Attendance", title: "One office day a week for Directors", body: "Only Marketing Directors are required to be in the office at least one day a week (10:00 AM – 5:00 PM). Office travel costs, mobile recharge, and lunch are all covered by Promise — Alhamdulillah." },
    { tag: "Promotion", title: "5 officers = ৳1,00,000 + Director post", body: "When a Marketing Officer recruits 5 active Marketing Officers, they earn a ৳1,00,000 commission and are promoted directly to the post of Marketing Director." },
    { tag: "Active Status", title: "Active Officer status at a minimum of 5 points", body: "Earn a minimum of 5 points in sales to be recognized as an Active Marketing Officer." },
    { tag: "Deposit Condition", title: "Client deposit = at least 10x the commission", body: "Please note carefully — to qualify for a commission, that commission must be equal to or less than 10% of the amount the client has deposited into the relevant project." },
  ],
  /** index-aligned with POINT_RULES */
  points: [
    { item: "Fuzala Tower (per share)", points: "1 point" },
    { item: "Fuzala Complex (per share)", points: "1 point" },
    { item: "Per decimal of land", points: "1 point" },
    { item: "Active Marketing Officer recruitment", points: "2 points" },
    { item: "Ahbab Real Estate Flat", points: "5 points" },
    { item: "Like / comment / share on a Promise City page post (within 72 hours)", points: ".20 point/post" },
    { item: "On-time attendance at meetings (announced from time to time)", points: "As announced" },
  ],
  /** keyed by threshold */
  awards: {
    20: { title: "Free Foreign Tour", description: "Earn 20 points for an international tour at the company's expense." },
    25: { title: "Free Umrah", description: "Earn 25 points for a free journey to the House of Allah." },
  } as Record<number, { title: string; description: string }>,
  periodStart: "1 January 2026",
  periodEnd: "31 December 2026",
  /** Partner-page UI chrome (hero / calculator / rules / points). */
  ui: {
    // hero
    heroEyebrow: "Partner Program",
    heroH1A: "Set your own",
    heroH1Grad: "income goal",
    heroH1B: "— yourself.",
    heroLeadA: "Bring",
    heroLeadBrand: "Promise City",
    heroLeadMid: "to people — because Promise City means",
    heroLeadBlue: "your dream, made real.",
    heroSub:
      "Set your income goal in the calculator and build a plan — see live exactly how many sales from each project it takes to get there.",
    openCalc: "Open the calculator",
    contactBtn: "Contact us to partner",
    chip1: "Real-estate commission",
    chip2: "Team-building bonus",
    chip3: "Hajj · Umrah commission",
    offerPill: "Signature offer",
    hookH2A: "Refer just",
    hookH2People: "people",
    hookH2B: "for a",
    hookSubPlain: "guaranteed",
    hookSubAccent: "Free Umrah",
    minCash: "Minimum cash",
    umrahValue: "Umrah value",
    totalReward: "Total reward",
    // footnote uses {start}/{end}
    heroFootnote:
      "* Up to a free Umrah at 25 points for the year, and a free foreign tour at 20 points. Valid {start} – {end}.",
    // calculator
    calcEyebrow: "Income calculator",
    calcH1A: "Set your own",
    calcH1Grad: "goal",
    calcH1B: "yourself",
    calcSub:
      "Drag the slider to set your income goal, then see how many sales from each project it takes to reach it.",
    goalLabel: "Your income goal",
    goalAria: "Income goal",
    goalSliderAria: "Income-goal slider",
    goalPeriod: " · monthly / within a set period",
    planLabel: "Your sales plan",
    reset: "Reset",
    pointWord: "point",
    pointsWord: "points",
    decrease: "Decrease",
    increase: "Increase",
    count: "count",
    fillSolo: "Fill with this →",
    fillSoloTitle: "Reach the goal with this product alone",
    achievement: "Your results",
    totalIncome: "Total income",
    goalHit: "Goal reached — Mashallah!",
    goalGapPrefix: "Still to goal",
    totalPoints: "Total points",
    totalSales: "Total sales",
    achievedNote: "✓ Achieved — Alhamdulillah",
    calcFootnote:
      "* To qualify, the commission must be within 10% of the client's deposit. This calculation is indicative — the marketing office finalises the figures.",
    target: "Target",
    // rules
    rulesEyebrow: "Marketing rules",
    rulesH1A: "The 2026",
    rulesH1Grad: "commission structure",
    rulesSub:
      "Effective from {start} — all previous policies cancelled. Transparent, direct, with no hidden conditions.",
    additionalRules: "Additional rules",
    // points
    pointsEyebrow: "Points system",
    pointsH1A: "Earn points —",
    pointsH1Grad: "claim rewards.",
    pointsSub:
      "Earn points from {start} – {end}. Reach a set threshold and the company covers a free reward.",
    howToEarn: "How to earn points",
  },
  /** keyed by role key */
  roles: {
    head: { label: "Head of Marketing", sub: "Lifetime top seller · one person" },
    director: { label: "Marketing Director", sub: "Recruited 5+ active officers" },
    active: { label: "Active Marketing Officer", sub: "Minimum 5 points" },
    officer: { label: "Marketing Officer", sub: "1–4 points" },
  } as Record<string, { label: string; sub: string }>,
  headline: { cashMin: "3,75,000", umrahValue: "1,50,000", totalValue: "5,25,000" },
};

/* ── GALLERY ────────────────────────────────────────────────────────── */

export const GALLERY_EN = {
  metaTitle: "Gallery — PromisePD",
  metaDesc:
    "The latest photos and videos of our projects — Fuzala Tower, Fuzala Complex, Ahbab Palace, and much more.",
  eyebrow: "Gallery",
  h1Plain: "A glimpse of",
  h1Accent: "our work.",
  sub: "Fuzala Tower, Fuzala Complex, Ahbab Palace — the latest photos of our ongoing and completed projects plus new videos from our YouTube channel, all in one place.",
  tabPhotos: "Photos",
  tabVideos: "Videos",
  prev: "Previous",
  next: "Next",
  loadingVideos: "Loading videos…",
  videoErr: "Videos could not be loaded right now. Please try again in a little while.",
  videoEmpty: "New videos are coming soon — take a look at our YouTube channel.",
  viewChannel: "View channel",
  close: "Close",
  /** keyed by image src */
  titles: {
    "/ahbab1pics/ahbab1pics.webp": "Ahbab Palace 01 — Flagship Project",
    "/ahbab2pics/ahbab2pics.webp": "Ahbab Palace 02 — Residential Building",
    "/ftpics/ftt1.webp": "Fuzala Tower — Front View",
    "/ftpics/ft.webp": "Fuzala Tower — Construction Progress",
    "/ftpics/fuzala-2-0.webp": "Fuzala Tower — Architectural Design",
    "/fcpics/fc1.webp": "Fuzala Complex — Project View",
    "/fcpics/fc2.webp": "Fuzala Complex — Building Structure",
    "/fcpics/fc3.webp": "Fuzala Complex — Residential Block",
    "/fcpics/f4.webp": "Fuzala Complex — Surrounding Environment",
    "/promisecity.webp": "Promise City — The Address of Your Dreams",
    "/ahbab.webp": "Ahbab Real Estate — Construction Solutions",
    "/kaaba.webp": "Ahbab Travels — The Sacred Umrah Journey",
    "/madina.webp": "Ahbab Travels — Madina Munawwarah",
    "/tour.webp": "Ahbab Travels — International Tours",
  } as Record<string, string>,
};

/* ── LEADERBOARD ────────────────────────────────────────────────────── */

export const LEADERBOARD_EN = {
  metaTitle: "Leaderboard — Promise Partner Rankings",
  metaDesc:
    "The Promise Group Partner Program rankings of our top sales performers — points, earnings and rewards. Free Umrah and foreign tours for the highest point-earners.",
  eyebrowPrefix: "Partner Leaderboard",
  h1Plain: "The ones at the top —",
  h1Accent: "their rewards.",
  /** sub uses {start} / {end} placeholders */
  sub: "A live ranking of the partners who earn the most points from {start} to {end}. Free Umrah and international tours for the top performers.",
  pointsWord: "points",
  thRank: "Rank",
  thPartner: "Partner",
  thPoints: "Points",
  thEarnings: "Earnings",
  ctaHeadPlain: "Want to see your name",
  ctaHeadAccent: "on this list?",
  ctaBody:
    "Join the Partner Program, set your income goal in the calculator, and rise to the list of top performers at year's end.",
  ctaPartnerBtn: "Go to the Partner page",
  ctaContactBtn: "Contact us directly",
  note: "* Live ranking data will be connected soon — once the Partner Program is active.",
  // controls
  searchPh: "Find your position by username, email, mobile or ID…",
  searchAria: "Search the leaderboard",
  clear: "Clear",
  allRoles: "All roles",
  allRolesSub: "All partners",
  periods: ["Last 30 days", "This year", "Last year", "All-time"],
};

/* ── MARKETING POLICY ───────────────────────────────────────────────── */

export const POLICY_EN = {
  metaTitle: "Marketing Policy — PromisePD",
  metaDesc:
    "The official marketing policy for Promise City's marketers and resellers — content usage, pricing, references, commissions and client-visit rules.",
  eyebrow: "Marketing Policy",
  h1Plain: "The Guidelines",
  h1Accent: "for Our Marketers.",
  sub: "Every Promise City marketer and reseller works within this policy — content usage, pricing, references, commissions and client visits. Transparency and mutual trust are our foundation.",
  clauseWord: "Clause",
  trustNote:
    "This policy was created to ensure a transparent and fair relationship between Promise City and its marketers. For any question or clarification, contact the marketing office directly.",
  ctaHeadPlain: "Begin Your Journey",
  ctaHeadAccent: "as a Partner",
  ctaBody:
    "Understood the guidelines? Now join the Partner Program and set your own income goals.",
  ctaBtn: "Go to the Partner Page",
  /** index-aligned with MARKETING_POLICY */
  rules: [
    { title: "All Content Is Open to Marketers", body: "Every image, PDF, floor plan, and video across our website, app, Facebook page, and YouTube channel — all of it is freely available to all marketers. They are welcome to reuse, edit, cut, or remove this content as they see fit for their own promotions." },
    { title: "The Price on the Day of the Visit Is Final", body: "Whenever a customer arrives at the office or a project site after seeing a marketer's video or image promotion, the price is set according to the current rate on that day. A customer who turns up expecting an old price after watching a video, image, or other content from, say, a year ago cannot purchase a flat or plot at that outdated rate." },
    { title: "Promise City May Not Be Presented as Your Own Company", body: "When selling a flat, plot, or any other product, you may not promote Promise City as your own company. Promise is a sole proprietorship, and its one and only owner is the Founder & CEO — Md. Kamrul Hasan." },
    { title: "Promotion as a Reseller / Associate Is Permitted", body: "However, anyone who wishes may promote under their own company name and tell customers: “We are marketers or resellers of Promise City, and we work as associates of Promise to help carry it forward.”" },
    { title: "No Reselling at a Higher Price Before the Deed", body: "A marketer who acquires a plot or flat from us may not resell it at a higher price until the deed is fully executed. If customers later discover that different buyers paid different prices, it damages Promise City's reputation and breeds ill feeling." },
    { title: "After the Deed — Freedom to Sell at Your Own Price", body: "Once a flat or plot is registered by deed in the buyer's own name, it is regarded as that owner's property — at which point the owner is free to sell it on to others at any price, higher or lower." },
    { title: "A Reference Is Required on the First Sale", body: "Every Promise customer's first sale must be made through someone's reference. If there is no referrer on the first sale, it is counted under Promise City. From the second sale onward, however, marketers may use their own name as the reference on the relevant sale." },
    { title: "How to Keep Your Own Reference on a Large Sale", body: "If someone's first sale is a large transaction and they would rather not assign the reference to another person, they may purchase any small Promise product, show that as the other party's reference, and thereby use their own name as the reference on the large sale (such as a flat or a sizeable plot)." },
    { title: "First Visit = That Officer's Client", body: "If a marketer brings a customer in for their first visit, no other marketer may later bring that same customer in and earn a referral commission — the customer is regarded as the client of the first officer who arranged the visit. So before taking anyone on a visit, ask and confirm whether that customer has already visited Promise City under someone else." },
    { title: "The Condition for Becoming an Officer — Be a Promise Customer Yourself", body: "To become a marketing officer, you must first purchase one of Promise's products yourself. Unlike other companies, Promise's aim is not merely to generate large sales — our goal is to earn the customer's trust and confidence. So before selling to others, buy a Promise product yourself and earn that trust. Only then will the customers you refer believe in it too — because since you are connected to Promise and are a customer yourself, it means the product is genuinely good; if it were not, you surely would not advise others to buy it." },
    { title: "The Right to Change the Rules Rests with the Owner", body: "The owner — that is, Md. Kamrul Hasan — may at any time add to, amend, or introduce new rules to the policy above." },
  ],
};

/* ── TEAM ───────────────────────────────────────────────────────────── */

export const TEAM_EN = {
  metaTitle: "Our Team — PromisePD",
  metaDesc:
    "The people behind Promise Group — working every day to build the address of your dreams. Meet the leadership, management and operations team.",
  eyebrow: "Our Team",
  h1Plain: "The people whose work",
  h1Accent: "builds your dream.",
  sub: "The leadership and operations team of Promise Group — built on experience, dedication, and genuine care.",
  comingHeadPlain: "More members —",
  comingHeadAccent: "coming very soon",
  comingBody:
    "Introductions to our marketing, project management, engineering, and customer care team members will be added here soon.",
  /** keyed by member slug */
  bios: {
    "kamrul-hasan": "Founder and Managing Director of Promise Group. With over 15 years of experience, he has set a new standard of transparency and trust in Dhaka's real-estate industry.",
    "md-rashedul-islam": "Responsible for day-to-day operations, client service, and office coordination. His foremost task is making sure every booking, site visit, and follow-up runs flawlessly. He is the trusted first point of contact for our clients.",
    "mustaqeem-billah": "The engineer behind this website and our wider digital ecosystem. If you spot a bug or any issue anywhere on the site, report it to him directly for a swift resolution.",
  } as Record<string, string>,
};

/* ── FORMS ──────────────────────────────────────────────────────────── */
/* Chrome + navigation labels are English on /en; the official form itself
 * (the FormFiller document) stays Bengali in BOTH versions per the project
 * rule — only the forms remain Bengali. */

export const FORMS_EN = {
  metaTitle: "Forms — PromisePD",
  metaDesc:
    "Fill out all of Promise Group's official forms online — flat allocation, investment, Promise City, Fuzala Tower & Complex, Marketing Director. Once filled, it reaches the office directly.",
  eyebrow: "Online forms",
  h1Plain: "Official forms,",
  h1Accent: "filled online",
  sub: "Pick the form you need and enter your details — the completed form is generated in the exact official design and sent straight to our office.",
  fillBtn: "Fill the form",
  comingBtn: "In preparation",
  soonBadge: "Soon",
  backToForms: "All forms",
  notReadyBody:
    "Online filling for this form is being added very soon — in shaa Allah. To apply right now, please contact our office.",
  /** English names/short labels/descriptions for navigation, keyed by slug.
   *  `short` drives the compact dropdown subtitle (one line); `description`
   *  is the longer card text on the forms listing. */
  names: {
    "flat-allocation": {
      name: "Flat Allocation Application",
      short: "Flat allocation",
      description:
        "Application form for booking and allotment of an Ahbab Real Estate flat — with applicant, nominee and official details.",
    },
    investment: {
      name: "Investment Form",
      short: "Investment",
      description: "Application form for savings and investment with Promise International.",
    },
    "promise-city": {
      name: "Promise City Form",
      short: "Promise City",
      description: "Application form for land/plot booking in the Promise City project.",
    },
    "fuzala-tower": {
      name: "Fuzala Tower Form",
      short: "Fuzala Tower",
      description: "Application form for flat/share booking in Fuzala Tower.",
    },
    "fuzala-complex": {
      name: "Fuzala Complex Form",
      short: "Fuzala Complex",
      description: "Application form for flat booking in Fuzala Complex.",
    },
    "marketing-director": {
      name: "Marketing Director Form",
      short: "Marketing Director",
      description: "Application to join Promise Group as a Marketing Director.",
    },
  } as Record<string, { name: string; short: string; description: string }>,
};

/* ── CONTACT (page chrome; the form itself is localized via DICT) ──────── */

export const CONTACT_EN = {
  metaTitle: "Contact — PromisePD",
  metaDesc:
    "Get in touch with Promise Group directly — phone, email, office address and map.",
  eyebrow: "Contact",
  h1Plain: "Whatever your question,",
  h1Accent: "we're here for you.",
  sub: "Phone, email, an office visit or a message — reach out however suits you best.",
  ceoCardLabel: "Talk to us directly",
  emailBtn: "Email",
  tilePhone: "Phone",
  tileEmail: "Email",
  tileOffice: "Office",
  tileHours: "Hours",
  mapEyebrow: "Our office",
  mapHeadPlain: "Find us in",
  mapHeadAccent: "South Jatrabari, Dhaka.",
  directionsBtn: "Get directions",
  openInMapsBtn: "Open in Google Maps",
};
