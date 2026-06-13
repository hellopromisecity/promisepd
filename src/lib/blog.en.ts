/** English overlay for the blog — keyed by slug. Components iterate the
 *  Bengali BLOG_POSTS (preserving order, dates, icons, category, cover)
 *  and overlay the English text from here when locale is "en". */

export type BlogEn = {
  title: string;
  excerpt: string;
  intro: string;
  sections: { heading: string; body: string[] }[];
  closing: string;
};

const MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Format an ISO date (YYYY-MM-DD) as "15 May 2026" for English pages. */
export function formatDateEn(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${MONTHS_EN[m - 1]} ${y}`;
}

export const CATEGORY_EN: Record<string, string> = {
  projects: "Projects",
  notice: "Notice",
  rules: "Rules",
  resources: "Resources",
};

/** English labels for the blog project filter — keyed by BlogProjectKey. */
export const BLOG_PROJECT_EN: Record<string, string> = {
  "fuzala-tower": "Fuzala Tower",
  "fuzala-complex": "Fuzala Complex",
  "ahbab-palace-01": "Ahbab Palace 01",
  "ahbab-palace-02-1200": "Ahbab Palace 02 · 1200 sft",
  "ahbab-palace-02-1800": "Ahbab Palace 02 · 1800 sft",
};

export const BLOG_EN: Record<string, BlogEn> = {
  "2026-marketing-rules-update": {
    title: "2026 Marketing Rules Update — New Opportunities for Partners",
    excerpt:
      "Effective from 1 January 2026 — a new commission structure, points system, and the chance to earn a free Umrah and overseas tour. A complete guide to what you need to do as a partner.",
    intro:
      "An important announcement for the partners and marketing team of Promise Group — as of 1 January 2026, our entire marketing policy has been redesigned. All previous rules have been replaced with a more transparent and more rewarding framework, one in which every partner can set their own income goals.",
    sections: [
      { heading: "Why This Change", body: ["Promise Group's 15+ years of experience have taught us one thing: our marketing team is our greatest strength. That is why, in this new framework, we have made the path to career growth just as clear as the path to higher earnings for our partners.", "The old rules carried a great deal of complexity — commissions varied from project to project, and the points system was unclear. In the new framework, every line item is transparent, so any member can know at the very start of the month exactly what they will achieve by the end of the year."] },
      { heading: "The New Commission Structure", body: ["Commissions have been set as follows: 20,000 Taka on a Fuzala Tower share, 15,000 Taka on a Fuzala Complex share, 10,000 Taka per decimal of land, and 50,000 Taka on an Ahbab Real Estate flat.", "Beyond this, there is 20,000 Taka for recruiting an active marketing officer, and recruiting 5 officers at once earns a 1 Lakh Taka bonus along with direct appointment to the position of Marketing Director. There are also separate commissions for booking Hajj and Umrah pilgrims."] },
      { heading: "Points System and Rewards", body: ["Points will accumulate with every sale and recruitment — 1 point per Fuzala share, 5 points per Ahbab flat, and 2 points per officer recruited. At the end of the year, 20 points earn a free overseas tour at the company's expense, and 25 points earn a free Umrah.", "Even liking, commenting on, or sharing a Promise City page post within 72 hours will add 0.20 points each. Separate points will also be announced for arriving at meetings on time."] },
      { heading: "What You Need to Do as a Partner", body: ["First, go to the Partner page, set your monthly or annual income goal in the calculator, and see how many sales from which project will get you to that goal. Then come to the marketing office to complete your training and onboarding.", "Marketing Directors are required to be present in the office at least one day a week (10:00 AM to 5:00 PM). Travel costs, mobile recharge, and lunch are all covered by the company — Alhamdulillah."] },
    ],
    closing:
      "This new framework is not merely a path to income — it is an opportunity to build a professional career. Join the Promise family: deliver the address of people's dreams to them, and earn the chance to see the House of Allah in your own lifetime.",
  },
  "fuzala-tower-flagship": {
    title: "Fuzala Tower — Why It Is Promise City's Flagship",
    excerpt:
      "A modern residential tower at the heart of Promise City — skyline views, premium amenities, and long-term investment potential.",
    intro:
      "Fuzala Tower is more than a building — it is the identity of Promise City. Rising in one of Dhaka's fastest-growing areas, this modern tower features apartments designed around the highest standards of quality, premium amenities, and lasting investment value.",
    sections: [
      { heading: "Location and Surroundings", body: ["The tower is located at the centre of Promise City — just minutes from the main road. Schools, hospitals, shopping centres, and the office district are all within easy reach.", "Far from the noise of the city, yet close to everything that matters — it is this balance that makes Fuzala Tower truly unique."] },
      { heading: "Apartment Configurations", body: ["The tower offers a range of 1, 2, and 3 bedroom configurations — from 800 to 1,600 square feet. Every apartment features an open kitchen, a spacious balcony, and a flawless arrangement for natural light and ventilation.", "Prices start at 8.50 Lakh Taka — an unmatched value in today's market."] },
      { heading: "Premium Amenities", body: ["A gym, community hall, prayer space, rooftop garden, 24/7 security, and CCTV — everything a modern residence should have is right here.", "Parking, lifts, generator backup, and a water reserve — not a single inconvenience in daily life."] },
      { heading: "Investment Potential", body: ["With the ongoing expansion of the Promise City area and steadily rising demand, Fuzala Tower presents an exceptional investment opportunity. For those who buy today, the likelihood of the value multiplying several times over within 5 years is very high."] },
    ],
    closing:
      "Stop dreaming from a rented home — now claim an address of your own at Fuzala Tower. Before booking, visit the site, review the floor plans, and speak with us directly.",
  },
  "fuzala-complex-family-home": {
    title: "Fuzala Complex — An Affordable Family Home",
    excerpt:
      "Thoughtful layouts, a secure community, easy connectivity — the ideal housing solution for middle-class families.",
    intro:
      "Every family deserves an address of its own — it is from this conviction that Fuzala Complex is taking shape. Starting from just 4.45 Lakh Taka, it is a project that stays well within the means of a middle-class family, yet makes no compromise when it comes to comfort and convenience.",
    sections: [
      { heading: "Design Philosophy", body: ["The complex has been designed with every need of family life in mind — safe play areas for children, easy movement for the elderly, and personal privacy for every member.", "Every flat makes the most of its space — not a single square foot has been wasted."] },
      { heading: "A Secure Community", body: ["24/7 security, CCTV coverage, gate registry, and a close-knit community of neighbours — so that even when your child steps outside alone, you can rest assured."] },
      { heading: "Easy Connectivity", body: ["The main road, public transport, and the market — everything is within easy reach. You'll save time on the daily commute to the office or to school and college, and gain more time to give to your family."] },
      { heading: "Flexible Instalment Plans", body: ["Instalment plans tailored to your monthly salary — so that your dream address becomes yours without breaking your budget. We arrange in-house instalments without the complications of a bank loan."] },
    ],
    closing:
      "Fuzala Complex — where affordable does not mean lower quality. Pay a visit to the site once and see the difference for yourself.",
  },
  "ahbab-palace-01-flagship": {
    title: "Ahbab Palace 01 — The Flagship Palace-Class Residence",
    excerpt:
      "Spacious living, premium finishes, and uninterrupted privacy — a home that tells the story of your success.",
    intro:
      "Ahbab Palace 01 — the gravitas in the name is reflected in reality. This is Promise Group's flagship residential project, where every square foot showcases flawless finishing, every corner reflects thoughtful design, and every resident is a client of distinguished standing.",
    sections: [
      { heading: "What Palace-Class Means", body: ["Palace-class is not about size alone — it is about quality. Italian marble, premium woodwork, imported fittings, a custom-designed kitchen, and spa-grade bathrooms — that extra measure of care is visible in every detail."] },
      { heading: "Spacious Living", body: ["The flat layouts are arranged so that the whole family can live together while everyone still enjoys their own space. The master bedroom, guest room, study corner, and large drawing room are all proportioned with care."] },
      { heading: "Uninterrupted Privacy", body: ["Limited flats per floor, a private lift lobby, and separate entrances — a design that gives you a resort-like feeling within your own home."] },
      { heading: "Who This Home Is For", body: ["For those who have achieved success and wish to give that success its due distinction — Ahbab Palace 01 is for them. Prices start from 40 Lakh Taka — exceptional value when measured against this calibre of quality."] },
    ],
    closing: "",
  },
  "ahbab-palace-02-1200sft": {
    title: "Ahbab Palace 02 (1200 sft) — Compact Luxury",
    excerpt:
      "An open kitchen, spacious balcony, and modern fittings within 1200 square feet — the perfect address for a small family.",
    intro:
      "A large footprint is not always the mark of luxury — with the right design and premium finishing, even a 1200-square-foot flat can offer a palatial feeling. The 1200 sft edition of Ahbab Palace 02 proves exactly that.",
    sections: [
      { heading: "Space Optimisation", body: ["Every square foot has been used thoughtfully — no unnecessary corridors, no dead space. As a result, the genuinely usable area feels far more generous."] },
      { heading: "The Advantages of an Open Kitchen", body: ["A kitchen is not merely a place to cook; it is the heart where the family comes together. With an open layout, you can chat with guests and keep an eye on the children even while you cook."] },
      { heading: "Ideal for Small Families", body: ["Ideal for newlyweds, small families, or anyone who prefers simple living. Prices start from 14.50 Lakh Taka, with the option to buy in instalments."] },
      { heading: "Ready for the Future", body: ["Fibre-internet ready, smart-home compatible fittings, and ample power capacity — adding any new technology will require no renovation whatsoever."] },
    ],
    closing: "",
  },
  "ahbab-palace-02-1800sft": {
    title: "Ahbab Palace 02 (1800 sft) — Spacious Living for the Larger Family",
    excerpt:
      "A master suite, generous balconies, and an open layout — the address that grows with your family as it grows.",
    intro:
      "When a household has 4–6 members — from grandparents to younger siblings, all living together — space becomes a fundamental need. The 1800 sft edition of Ahbab Palace 02 is designed specifically for families like these.",
    sections: [
      { heading: "The Beauty of the Master Suite", body: ["An attached bathroom, a walk-in closet, and a private balcony with the master bedroom — a slice of peace at the end of the day."] },
      { heading: "Large Balconies and Open Views", body: ["Two spacious balconies — one off the drawing room, the other off the bedroom. From morning tea-time chats to quiet moments at night, enjoy both beneath the open sky."] },
      { heading: "Multi-Generation Living", body: ["A separate room for elderly members, a study corner for the children, and private space for the adults — a layout where three generations can live together in comfort."] },
      { heading: "Investment + Lifestyle", body: ["1800 sft for 21.75 Lakh Taka — an offer that is rare in today's market. A home for the family and a long-term investment, both at once."] },
    ],
    closing: "",
  },
  "office-hours-weekly-holiday": {
    title: "Office Hours and Weekly Holiday — Know Before You Get in Touch",
    excerpt:
      "We are open Tuesday to Sunday, 9:00 AM to 6:00 PM. Monday is our weekly holiday — please keep this in mind when planning to reach us.",
    intro:
      "Many of our clients prefer to meet us in person — for their convenience, here is clear information about our office hours and weekly holiday.",
    sections: [
      { heading: "Regular Office Hours", body: ["Our office is open from Tuesday to Sunday, every day from 9:00 AM to 6:00 PM. The lunch break is from 1:00 PM to 2:00 PM.", "You are welcome to visit during these hours without an appointment, but calling ahead will help you receive faster service."] },
      { heading: "Weekly Holiday", body: ["Monday is our weekly holiday. The office remains closed on this day — however, for urgent matters you may call our hotline."] },
      { heading: "Emergency Contact", body: ["For urgent matters outside office hours or on holidays, please use our hotline at +880 1910-065136. You will also receive a quick response if you send a message on WhatsApp."] },
    ],
    closing: "",
  },
  "upcoming-projects-2026": {
    title: "Upcoming Project Announcements — What's Coming in 2026",
    excerpt:
      "A new edition of Ahbab Palace, the Promise City expansion, and dedicated commercial space — here's what's arriving this year.",
    intro:
      "2026 is a special year for us — marking 15 years of Promise Group and the launch of several new projects. We want to give our clients and partners an early look at what's on the way.",
    sections: [
      { heading: "Promise City Expansion", body: ["An additional 20 acres of land is being added to the western side of Promise City, with finalized plans for new residential buildings, a park, a mosque, and a community center."] },
      { heading: "A New Edition of Ahbab Palace", body: ["The pre-launch of Ahbab Palace 03 is scheduled for later this year — set to be our most ambitious residential project yet. Those interested in our early-booking packages are welcome to get in touch."] },
      { heading: "Commercial Space", body: ["For the first time, Promise Group is introducing a dedicated commercial tower — featuring office, showroom, and retail spaces, with special offers for small and medium business owners."] },
      { heading: "Contact and Pre-Booking", body: ["If you are interested in any of these projects, contact us today. Pre-booking comes with special discounts and the opportunity to choose your preferred unit."] },
    ],
    closing: "",
  },
  "flat-booking-rules-guide": {
    title: "Flat Booking Rules — From Start to Key Handover",
    excerpt:
      "Booking payment, instalment planning, the registration process, and final handover — a step-by-step guide to it all.",
    intro:
      "Buying a flat means far more than simply paying money — it involves a legal process, documentation, instalment planning, and finally registration. Today we will clearly explain exactly how this entire process works for Promise Group's clients.",
    sections: [
      { heading: "Step 1: Site Visit and Unit Selection", body: ["First, visit our office or come to the site to view the project and unit of your choice. We discuss the floor plan, location, and price list with you in detail."] },
      { heading: "Step 2: Booking Payment", body: ["Once your preferred unit is finalised, a booking amount equal to 10% of the total price must be deposited. A provisional booking receipt is issued at the moment of booking.", "This amount is fully refundable — should the client wish to cancel the agreement within 7 working days for any reason."] },
      { heading: "Step 3: Agreement and Instalment Plan", body: ["After booking, we prepare a detailed agreement that sets out the instalment amounts, the schedule, and the payment milestones tied to construction progress.", "Monthly, quarterly, or half-yearly instalment plans are available to suit the client's convenience."] },
      { heading: "Step 4: Construction Monitoring", body: ["Clients may visit the site at any time and will receive reports on construction progress. Every month we send a site update, complete with photographs and a brief summary."] },
      { heading: "Step 5: Registration", body: ["Once 80% of the total price has been paid, the registration process begins. Execution of the deed at the sub-registry office, the registration fee, and the stamp duty — our legal team handles all of it."] },
      { heading: "Step 6: Final Handover", body: ["Once the remaining balance is paid and all documents are ready, the keys are handed over. Before handover, a joint inspection checks all the finishing — and any issue found is resolved on the spot."] },
    ],
    closing:
      "Transparency at every step — this is Promise Group's promise. No hidden costs, no misleading conditions.",
  },
  "commission-payment-rules-partners": {
    title: "Commission and Payment Rules — A Complete Guide for Partners",
    excerpt:
      "When you earn your commission, how payments are made, and the client's 10% deposit rule — every question answered in one place.",
    intro:
      "Before joining as a partner, it is essential to have a clear understanding of the commission structure and the payment process. In this guide, we explain the new 2026 commission rules with complete clarity.",
    sections: [
      { heading: "The 10% Deposit Rule", body: ["There is one key point to keep in mind in order to earn a commission: your commission must be equal to or less than 10% of the amount the client has deposited into the relevant project. In other words, to earn a commission of 1 Lakh Taka, the client must have deposited at least 10 Lakh Taka.", "This rule ensures the client's genuine commitment and keeps the company's cash flow secure."] },
      { heading: "When Commissions Are Paid", body: ["Once the client's payment has been officially received, the commission is paid within a maximum of 15 working days — by bank transfer, mobile banking, or cheque, according to the partner's preference."] },
      { heading: "Payment Documentation", body: ["Every commission payment comes with a detailed payment slip that clearly states the client's name, the project, the unit, the amount the client has deposited, and the amount of the commission."] },
      { heading: "Tax and Other Deductions", body: ["Applicable government tax/AIT (Advance Income Tax) will be deducted in accordance with the law. Our Accounts department provides the documentation required for your annual tax return."] },
      { heading: "Dispute Resolution", body: ["If you have any dispute or question regarding your commission, please first discuss it with the Marketing Director. If it remains unresolved, you may appeal to the CEO, where the final decision will be made."] },
    ],
    closing:
      "Transparent rules, timely payments, and a professional environment — these are the foundations of the Promise Partner Programme.",
  },
  "land-buying-bangladesh-guide": {
    title: "What You Must Know Before Buying Land in Bangladesh",
    excerpt:
      "Verifying the title deed, checking the khatian, the mutation process, and how to avoid common scams — a complete guide for first-time buyers.",
    intro:
      "Buying land in Bangladesh is, on one hand, a major investment, and on the other, a process bound up with complex legal procedures. This guide is for those buying land for the first time — what to check, which scams to avoid, and what the correct process looks like.",
    sections: [
      { heading: "Verifying the Title Deed — The First Step", body: ["Before buying any land, the single most important thing is verifying the original title deed. Examine everything — how the seller came to hold the deed (through inheritance, purchase, or gift), the date of the deed, and the seal of the registry office.", "Have the deed checked by an experienced lawyer — this is an indispensable expense."] },
      { heading: "Checking the Khatian and Porcha", body: ["Obtain the updated khatian (CS, SA, RS, and BS) from the AC Land office. Check that the current owner's name, the area of the land, and the plot (daag) number all match.", "If there is any discrepancy between the khatian and the deed, stop and ask questions. Many problems later on stem from incorrect records."] },
      { heading: "Mutation (Namjari)", body: ["After buying the land, the most important task is mutation. Without it, you are not the full legal owner of the land. Complete this process by applying at the Tehsil office."] },
      { heading: "Common Scams and How to Avoid Them", body: ["The same land sold to multiple buyers, forged deeds, unclear boundaries, land mortgaged against a loan — these are the most common scams. In every case, the only solution is to seek legal advice in advance and verify the records at government offices.", "Be cautious whenever you hear of an 'extraordinary offer' — land sold far below market value is often a sign of some underlying problem."] },
      { heading: "The Advantages of Buying Land with Promise Group", body: ["Every piece of land we offer comes with complete legal verification, a registry-ready deed, and handover including mutation. We keep our clients free from legal complications by managing the entire process ourselves."] },
    ],
    closing:
      "Buying land is one of the biggest investments of a lifetime — so caution and accurate information are essential at every step. Get in touch with us; our experienced team of advisors is ready to answer all your questions.",
  },
  "flat-buying-complete-guide-2026": {
    title: "The Complete Guide to Buying a Flat — 2026 Edition",
    excerpt:
      "From location analysis to verifying building quality, from the loan process to registration — everything you need to know before buying a flat.",
    intro:
      "A flat is more than four walls — it is a family's future. Making the right decision requires weighing many factors. Here is a complete guide to buying a flat in the market realities of 2026 — one that will keep you on the right track.",
    sections: [
      { heading: "Setting Your Budget", body: ["Total budget = the price of the flat + registration fees (roughly 7-8%) + interior work (10-15%) + an emergency fund. If you decide to buy based on the flat's price alone, you may run into trouble later.", "Make sure your monthly installments do not exceed 30-40% of your monthly income — following this rule of thumb will help you avoid financial strain."] },
      { heading: "Location Analysis", body: ["The potential of a location 10 years from now matters more than what it is today. How far away are the schools, hospitals, markets, and transport links? Is the area growing, or is it stagnant?", "Look into upcoming infrastructure projects (new roads, the metro rail, bridges) — these can double the value of a flat within 5 years."] },
      { heading: "Vetting the Developer", body: ["Review the developer's previous projects — were they handed over on time? What was the quality like? Speak with their past clients. Check whether they are a REHAB member.", "Smaller developers may offer cheaper deals, but the risk is also higher. A trusted brand may charge a little more, but it gives you peace of mind."] },
      { heading: "Verifying Building Quality", body: ["Check everything — the quality of the construction materials (rebar, cement, bricks), earthquake resistance, the brand of the lift, and the plumbing system. If possible, have an engineer carry out a site visit."] },
      { heading: "The Loan Process and Installments", body: ["Before taking out a bank home loan, compare the interest rates and terms of at least 3 banks. Factor in processing fees and pre-payment charges.", "A developer's in-house installment plan is often more convenient than a bank loan — because it involves less complexity and less paperwork."] },
      { heading: "The Agreement and Registration", body: ["Everything must be put in writing in the agreement — the handover date, penalties for delays, quality standards, and the right to use common areas. Have a lawyer review the agreement."] },
      { heading: "Final Checklist", body: ["✓ Deed and land records are correct ✓ Developer is trustworthy ✓ Location is suitable ✓ Staying within budget ✓ Loan/installment plan is clear ✓ Agreement reviewed ✓ Joint inspection before handover"] },
    ],
    closing:
      "Buying a flat is a major decision — don't rush it; examine every aspect carefully. Promise Group will stand by your side throughout the entire process — from consultation to the handover of the keys.",
  },
};
