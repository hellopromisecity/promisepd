/** Product changelog — shown in the dashboard (Settings → Changelog) so
 *  the team can see, at a glance, what shipped in every release.
 *
 *  Versioning: 1.0.1 → 1.0.10, then the next bump rolls the minor —
 *  1.0.10 → 1.1.0 → 1.1.1 … (patch runs 1–10, then minor +1).  Newest
 *  release goes at the TOP of the list; CURRENT_VERSION reads from it. */

export type ChangeKind = "new" | "improved" | "fixed" | "changed";

export type ChangelogEntry = {
  version: string;
  date: string; // YYYY-MM-DD
  title: string;
  changes: { kind: ChangeKind; text: string }[];
};

export const CHANGELOG_FOOTER = {
  company: "Promise Proper Development",
  // Credit link — text reads "Mustaqeem", links to the studio site.
  poweredByLabel: "Mustaqeem",
  poweredByUrl: "https://growthency.com/",
};

/** Newest first. */
export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "1.3.7",
    date: "2026-06-15",
    title: "Dashboard — live, real-data redesign",
    changes: [
      { kind: "improved", text: "The main Dashboard is rebuilt entirely on real investment data: animated KPIs (total balance, total invested, investors + how many are paying, projects + amount raised) and a clean secondary strip (profit, withdrawn, transactions, members, leads, blog)." },
      { kind: "new", text: "An interactive “Capital flow” chart — real money in vs out across the last 12 months, with a hover tooltip showing each month’s figures — replaces the old sample chart." },
      { kind: "new", text: "Live Project-funding bars (raised vs goal), a Top-investors chart, and a Recent-transactions feed, all from real data, alongside recent enquiries." },
    ],
  },
  {
    version: "1.3.6",
    date: "2026-06-15",
    title: "Paying / non-paying filter · attendance is staff-only",
    changes: [
      { kind: "new", text: "App Users: filter by Paying vs Non-paying — paying = anyone who has put in (or moved) any money; non-paying = zero-activity signups. A live count chip shows how many users match the current filter, and every filter option shows its own count." },
      { kind: "fixed", text: "Attendance now lists only staff / employees — investor app users (role “member”) are no longer pulled into the daily roster, so the totals reflect real staff." },
    ],
  },
  {
    version: "1.3.5",
    date: "2026-06-15",
    title: "Projects — full redesign with investor management",
    changes: [
      { kind: "improved", text: "The Projects page is rebuilt: summary cards (projects, total goal, total raised, memberships), search, a status filter and sorting, and a grid of project cards each showing live progress, goal, money raised and investor count." },
      { kind: "new", text: "Open any project to its own page — edit or delete it, and fully manage investors: add an investor (with share price / discount / dates), edit a membership, or remove one (their transactions stay intact). Each member’s real paid-in amount for the project is shown." },
      { kind: "new", text: "The Add/Edit Project form now includes Details and the “hide total / hide share price from app” toggles." },
      { kind: "changed", text: "The App Users “Assets under management” card is now labelled “Total balance”." },
    ],
  },
  {
    version: "1.3.4",
    date: "2026-06-15",
    title: "App Users — a complete, powerful redesign",
    changes: [
      { kind: "improved", text: "The App Users admin page is rebuilt end to end: animated summary cards (total users, verified vs unverified, total invested, assets under management), verified/active percentage rings, and a “top investors by balance” chart." },
      { kind: "improved", text: "Full-text search (name, UID, phone, FID, email), a status filter (all / verified / unverified / active / inactive), sortable columns, page sizes of 10/25/50/100, and a scrollable in-card table with sticky header." },
      { kind: "new", text: "Export the current view to CSV (full Unicode) or a clean branded PDF report." },
      { kind: "new", text: "Per-user actions in one place: view a full profile + financial summary, manage transactions (add / edit / delete with the balance recomputed live), edit details, one-click activate/deactivate, and add a brand-new app user — which also creates their login." },
    ],
  },
  {
    version: "1.3.3",
    date: "2026-06-15",
    title: "Accurate per-project investment totals",
    changes: [
      { kind: "fixed", text: "On the investor portal, each project’s “Invested” figure is now summed directly from that member’s own transactions for the project, so every payment type (land share, installment, booking money, etc.) is counted. Previously it read a stale cached total that could leave some payments out — e.g. a member’s land-share payments were missing from one project’s total." },
    ],
  },
  {
    version: "1.3.2",
    date: "2026-06-15",
    title: "Flow chart follows your filter · clearer cursors",
    changes: [
      { kind: "improved", text: "The All Transactions flow chart now matches the selected date range — daily bars for short ranges, weekly for medium, monthly for long — instead of always monthly, with bars evenly spaced across the whole range." },
      { kind: "fixed", text: "Buttons, toggles and other clickable controls now show the hand cursor on hover (with smooth transitions), not the plain arrow." },
    ],
  },
  {
    version: "1.3.1",
    date: "2026-06-15",
    title: "A sidebar you arrange · Investments up top",
    changes: [
      { kind: "new", text: "Drag any sidebar item up or down (grab the handle that appears on hover) to arrange the menu your way — the order is remembered on your device." },
      { kind: "changed", text: "Investments now sits right under Dashboard for quick access." },
    ],
  },
  {
    version: "1.3.0",
    date: "2026-06-15",
    title: "The investor platform — fully ported in",
    changes: [
      { kind: "new", text: "The entire investor platform from the old app now lives inside Promise City, under a new “Investments” menu — App Users, Projects, All Transactions, Transaction Types and Unsubscribe Requests." },
      { kind: "new", text: "Every investor, balance, investment and transaction was imported exactly — and investors sign in with their ORIGINAL password (no reset needed)." },
      { kind: "new", text: "Investor portal on the account page: each investor sees their balance, projects (with progress) and full transaction history, opens any transaction for details, and downloads a PDF receipt or a full statement." },
      { kind: "new", text: "Admins can add / edit / delete transactions (balances recalculate automatically), edit investors, manage projects & types, and approve / reject unsubscribe requests." },
    ],
  },
  {
    version: "1.2.10",
    date: "2026-06-15",
    title: "Attendance shows the real day",
    changes: [
      { kind: "fixed", text: "A day with no attendance now clearly says “No attendance taken” — instead of wrongly showing everyone present. Each date shows its own real data." },
      { kind: "new", text: "A “Take today’s attendance” button to start the day; once saved it reads “Today’s attendance taken”, with an Edit option." },
    ],
  },
  {
    version: "1.2.9",
    date: "2026-06-15",
    title: "Bullet-fast dashboard, tuned for Bangladesh",
    changes: [
      { kind: "improved", text: "Every dashboard section loads markedly faster — data queries run in parallel and the session is verified locally (one less round-trip per click)." },
      { kind: "improved", text: "Servers moved to the Singapore region — pages now load 2–3× faster for visitors in Bangladesh." },
      { kind: "fixed", text: "The dashboard “Blog posts” count is now live (it counts published posts too)." },
    ],
  },
  {
    version: "1.2.8",
    date: "2026-06-14",
    title: "Attendance, beautified · edit your own profile",
    changes: [
      { kind: "improved", text: "Attendance gets an animated “% present” gauge and Present/Late/Absent/Leave count cards." },
      { kind: "improved", text: "The chosen status is now a clear, filled button — and a Reset button undoes a day’s marks." },
      { kind: "new", text: "Admins can edit their own profile (name, salary…) right from the Staff list." },
    ],
  },
  {
    version: "1.2.7",
    date: "2026-06-14",
    title: "One-tap attendance + date ranges",
    changes: [
      { kind: "new", text: "Mark the whole team Present / Absent / Late / Leave in ONE tap, tweak anyone individually, then Save the day in one go — no more per-row dropdowns." },
      { kind: "new", text: "Date control with Today / Yesterday / pick-a-day, plus Last 7 days, Last 30 days, This / Last month, This / Last year and a custom range." },
      { kind: "new", text: "Range view shows a per-employee summary (present / late / absent / leave / days marked)." },
    ],
  },
  {
    version: "1.2.6",
    date: "2026-06-14",
    title: "Every employee on attendance + fingerprint import",
    changes: [
      { kind: "new", text: "The attendance roster now lists EVERY employee — with or without a login — so anyone’s hajira can be marked." },
      { kind: "new", text: "ZKTeco fingerprint import (K40 / K50 / K60 / K90): upload the device’s CSV/TXT export and attendance is added by employee code." },
    ],
  },
  {
    version: "1.2.5",
    date: "2026-06-14",
    title: "Company roster",
    changes: [
      { kind: "new", text: "The whole office team (name, designation, district, ID, mobile) now appears in Staff — give anyone a login in one click." },
    ],
  },
  {
    version: "1.2.4",
    date: "2026-06-14",
    title: "Staff management & pay",
    changes: [
      { kind: "new", text: "Add, edit and remove staff from the dashboard — set role, employee code, status and salary (basic + allowance − deduction)." },
      { kind: "new", text: "Attendance: pick any past date to review or mark, not just today." },
    ],
  },
  {
    version: "1.2.3",
    date: "2026-06-14",
    title: "Multi-tagging, full-height sidebar & Secure Vault",
    changes: [
      { kind: "new", text: "Secure Vault — keep every company login (site, URL, email, password) in one private place, with one-tap copy and show/hide." },
      { kind: "new", text: "A post can now be filed under multiple categories AND multiple projects at once (tap the chips to toggle)." },
      { kind: "improved", text: "The dashboard sidebar now runs the full height of every page — no more empty cut-off below the menu." },
    ],
  },
  {
    version: "1.2.2",
    date: "2026-06-14",
    title: "Sign in your way, richer articles",
    changes: [
      { kind: "new", text: "Sign in with your mobile (any format), username, OR email — plus your password. Whichever you use, it just works." },
      { kind: "fixed", text: "Facebook video & Reel links now embed and play inline (Reels keep their vertical shape)." },
      { kind: "new", text: "In the article editor, drag an image’s corner to resize it and add a caption beneath it." },
      { kind: "fixed", text: "The owner can no longer be locked out of the dashboard, whichever of their accounts they sign in with." },
    ],
  },
  {
    version: "1.2.1",
    date: "2026-06-14",
    title: "Dashboard footer & finishing touches",
    changes: [
      { kind: "fixed", text: "Blog author photo now sits ON TOP of the card banner (was clipped behind it) and is larger." },
      { kind: "new", text: "A universal footer on every dashboard section — “Design & Developed by Mustaqeem”." },
      { kind: "improved", text: "Sidebar no longer ends with empty space — it carries a “What’s new · version” link at the bottom." },
      { kind: "improved", text: "The changelog box is taller, so more releases show without scrolling." },
    ],
  },
  {
    version: "1.2.0",
    date: "2026-06-14",
    title: "Land plots, in-app changelog & polish",
    changes: [
      { kind: "new", text: "This changelog — every release and what it shipped, in one place." },
      { kind: "changed", text: "Promise City land plot: third category is now 10 katha = 15 decimals (৳90 Lakh)." },
      { kind: "improved", text: "Profile photo now appears in the dashboard topbar and the public Dashboard nav pill." },
      { kind: "improved", text: "Dashboard blog list shows real total views (base + tracked), not 0." },
      { kind: "improved", text: "Blog sidebar: bigger, cleaner author card; Popular & Recent now show 10 posts each." },
    ],
  },
  {
    version: "1.1.10",
    date: "2026-06-14",
    title: "One-click dashboard, no redirect bounce",
    changes: [
      { kind: "improved", text: "The “Dashboard” button now opens the dashboard directly — no more /account → /dashboard hop." },
      { kind: "new", text: "Header shows your avatar + “Dashboard” once signed in (guests still see “Login”)." },
    ],
  },
  {
    version: "1.1.9",
    date: "2026-06-14",
    title: "Dashboard moved to /dashboard",
    changes: [
      { kind: "changed", text: "The admin panel now lives at /dashboard (was /admin); old links 301-redirect automatically." },
      { kind: "changed", text: "Every “MD & CEO” label now reads “Founder & CEO”." },
      { kind: "improved", text: "Story page: the founder is named once, with a more evocative closing line." },
    ],
  },
  {
    version: "1.1.8",
    date: "2026-06-14",
    title: "Marketing roster & leaderboard",
    changes: [
      { kind: "new", text: "Imported the full marketing-officer + director roster (name, mobile, ID, district)." },
      { kind: "new", text: "Award-points officer picker is now searchable by name, mobile or ID number." },
      { kind: "improved", text: "Leaderboard scrolls inside its own box with a pinned header." },
    ],
  },
  {
    version: "1.1.7",
    date: "2026-06-14",
    title: "Blog reading experience",
    changes: [
      { kind: "new", text: "Article sidebar: a premium author card, Popular posts and Recent posts." },
      { kind: "new", text: "Per-post view counting (counts real visits, once per session)." },
      { kind: "improved", text: "Sharp, high-res founder photo across the blog." },
    ],
  },
  {
    version: "1.1.6",
    date: "2026-06-14",
    title: "Rich media in articles",
    changes: [
      { kind: "new", text: "Pasted YouTube / Facebook video links render as inline players (Facebook keeps its true aspect)." },
      { kind: "improved", text: "Sharing a post on WhatsApp / Facebook now shows the post’s own cover image." },
    ],
  },
  {
    version: "1.1.5",
    date: "2026-06-14",
    title: "Admin posts go public",
    changes: [
      { kind: "new", text: "Posts published from the dashboard now appear on the public blog (Bangla + English)." },
      { kind: "fixed", text: "Bangla post URLs no longer 500 in production (slugs are romanised to ASCII)." },
      { kind: "fixed", text: "Removed a hydration warning from the footer’s “report an issue” link." },
    ],
  },
  {
    version: "1.1.4",
    date: "2026-06-14",
    title: "Blog publishing fixes",
    changes: [
      { kind: "fixed", text: "Publishing a post with a Bangla title no longer fails with “Something went wrong”." },
      { kind: "new", text: "Project + category taxonomy for posts (admin can add / delete both)." },
      { kind: "improved", text: "The article editor’s toolbar stays pinned while you write long posts." },
    ],
  },
  {
    version: "1.1.3",
    date: "2026-06-13",
    title: "No more browser pop-ups",
    changes: [
      { kind: "improved", text: "Every confirm / alert / prompt is replaced with on-brand dialogs and toasts." },
    ],
  },
  {
    version: "1.1.2",
    date: "2026-06-13",
    title: "Analytics & follow-ups",
    changes: [
      { kind: "new", text: "Google Analytics tracking + a dashboard Analytics section." },
      { kind: "new", text: "Client follow-up data grid: search, status, custom date range, unique-lead counts." },
      { kind: "new", text: "Award points now capture the sale date and client name / ID." },
    ],
  },
  {
    version: "1.1.1",
    date: "2026-06-13",
    title: "Income & leaderboard depth",
    changes: [
      { kind: "new", text: "Income tracking that feeds the public leaderboard." },
      { kind: "improved", text: "Leaderboard: decimal points, AFR, filters, sort, CSV/PDF export, officer editing." },
      { kind: "fixed", text: "De-duplicated the point-item catalogue (idempotent migration)." },
    ],
  },
  {
    version: "1.1.0",
    date: "2026-06-13",
    title: "Marketing officers & live leaderboard",
    changes: [
      { kind: "new", text: "Marketing officers + points feed a live public leaderboard." },
      { kind: "changed", text: "Marketing split into Overview (leaderboard) and Client follow-up (leads)." },
    ],
  },
  {
    version: "1.0.10",
    date: "2026-06-13",
    title: "Faster, snappier dashboard",
    changes: [
      { kind: "improved", text: "Top progress bar + skeletons give instant navigation feedback." },
      { kind: "improved", text: "Auth-gated pages cache the session lookup and scope the middleware tightly." },
    ],
  },
  {
    version: "1.0.9",
    date: "2026-06-13",
    title: "Blog CMS",
    changes: [
      { kind: "new", text: "Full article editor with SEO, scheduling, cover upload and manageable categories." },
    ],
  },
  {
    version: "1.0.8",
    date: "2026-06-13",
    title: "Admin dashboard — all sections",
    changes: [
      { kind: "new", text: "Projects, Blog, Staff, Attendance, Finance, Marketing, Insights and Settings." },
      { kind: "new", text: "Role system (member / staff / manager / admin) with a super-admin override." },
    ],
  },
  {
    version: "1.0.7",
    date: "2026-06-13",
    title: "Member accounts",
    changes: [
      { kind: "new", text: "Real sign-up / sign-in with mobile or username + password (no OTP / SMS cost)." },
    ],
  },
  {
    version: "1.0.6",
    date: "2026-06-13",
    title: "Fifth division refresh",
    changes: [
      { kind: "changed", text: "Renamed the fifth division to “Ahbab Interior and Architects” + added its logo." },
    ],
  },
  {
    version: "1.0.5",
    date: "2026-06-12",
    title: "Installable app (PWA)",
    changes: [
      { kind: "new", text: "Install Promise City as an app; it opens to the login page." },
      { kind: "improved", text: "Centred the install-prompt screenshot for a cleaner look." },
    ],
  },
  {
    version: "1.0.4",
    date: "2026-06-03",
    title: "Official forms",
    changes: [
      { kind: "new", text: "Six fillable forms (Promise City, Fuzala Tower / Complex, investment, marketing director) — fill in, generate a PDF, email it." },
    ],
  },
  {
    version: "1.0.3",
    date: "2026-05-28",
    title: "Bilingual website",
    changes: [
      { kind: "new", text: "Full English mirror at /en with a language switcher and SEO hreflang tags." },
    ],
  },
  {
    version: "1.0.2",
    date: "2026-05-24",
    title: "Engagement & outreach",
    changes: [
      { kind: "new", text: "Newsletter sign-up with a branded welcome email." },
      { kind: "new", text: "Branded email notification on every contact-form submission." },
    ],
  },
  {
    version: "1.0.1",
    date: "2026-05-21",
    title: "Premium polish",
    changes: [
      { kind: "improved", text: "Subtle architectural hero backdrops across the homepage and division pages." },
      { kind: "improved", text: "Refined Partner rewards and Team cards with richer hover motion." },
    ],
  },
  {
    version: "1.0.0",
    date: "2026-05-20",
    title: "Launch 🎉",
    changes: [
      { kind: "new", text: "Promise City goes live — homepage, five divisions, projects, gallery, team, the story, partner programme, leaderboard and contact." },
    ],
  },
];

export const CURRENT_VERSION = CHANGELOG[0]?.version ?? "1.0.0";
