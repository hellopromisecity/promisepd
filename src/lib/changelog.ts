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
    version: "1.5.4",
    date: "2026-06-25",
    title: "Marketing: rename point items from the Point values panel",
    changes: [
      { kind: "improved", text: "In “Point values per sale”, each item now has an ✏️ edit button next to delete — tap it to rename the item (e.g. fix a typo or reword it), then “Save all”. Renaming doesn't touch past history entries." },
    ],
  },
  {
    version: "1.5.3",
    date: "2026-06-25",
    title: "Marketing: editable history with reasons & client deposits · glowing podium",
    changes: [
      { kind: "new", text: "Each history entry now shows what the point was for (e.g. “FB activity ×5”), so it's always clear why points were awarded — no more guessing." },
      { kind: "new", text: "History entries can be edited or deleted individually; the officer's points, fund and income totals recalculate automatically afterwards." },
      { kind: "improved", text: "Instead of a raw client ID, each entry shows that client's total deposit in the company so far (resolved from their investor account when available)." },
      { kind: "improved", text: "The top-3 podium cards lift on hover like the dashboard cards, and the #1 champion card has a soft brand-blue light gently circling it." },
    ],
  },
  {
    version: "1.5.2",
    date: "2026-06-25",
    title: "Marketing leaderboard: top-3 podium · officer history · cleaner rows",
    changes: [
      { kind: "new", text: "A top-3 champions podium now sits above the marketing leaderboard — 1st in the centre, 2nd and 3rd flanking — each showing the officer's name, points and income. It follows the date filter, so the podium changes with the period." },
      { kind: "new", text: "Each officer row has a new 👁 view button: open it to see that officer's full referral history with dates — who they brought in, when, the fund raised (investment), income and points for each — plus lifetime totals." },
      { kind: "improved", text: "The Type column is cleaner — it now shows just the role and district (e.g. “Active Marketing Officer · Dhaka”), dropping the extra MD/AMO/MO code badge." },
    ],
  },
  {
    version: "1.5.1",
    date: "2026-06-25",
    title: "Password reset · all signups visible · PWA chrome · share buttons",
    changes: [
      { kind: "new", text: "Forgot your password? There's now a proper reset page — get a 6-digit code on your phone (SMS) and set a new password. (Email-based reset turns on automatically once a sending domain is verified.)" },
      { kind: "fixed", text: "Every new signup now appears in the dashboard App Users list automatically — a zero-balance app account is created at signup, so members can no longer go missing (and the earlier signups were backfilled)." },
      { kind: "improved", text: "The installed mobile app (PWA) now shows the site header and footer on every page — just like the website — except the clean login and signup screens." },
      { kind: "new", text: "A floating social-share bar (Facebook, WhatsApp, Telegram, X + copy-link) shares whatever page you're on, and a mobile “Install” button lets visitors add the app even if the auto-prompt doesn't appear." },
      { kind: "fixed", text: "Members without a real email no longer see an internal “…@users.promisepd.app” address on their account — it now correctly shows none." },
    ],
  },
  {
    version: "1.5.0",
    date: "2026-06-19",
    title: "Fuzala Complex — project documentary video",
    changes: [
      { kind: "new", text: "The Fuzala Complex project page now features its documentary video — embedded in a clean, framed player right in the middle of the project description, so visitors can watch the full story of the project as they read about it." },
    ],
  },
  {
    version: "1.4.10",
    date: "2026-06-18",
    title: "Unified app icon (final.webp) everywhere · lighter /public",
    changes: [
      { kind: "improved", text: "The new rounded-square Promise City mark (final.webp) is now the single brand icon used everywhere — the PWA install/home-screen icon, the Android & iOS splash screens, and the browser / Google favicon — all regenerated from one source for a consistent look." },
      { kind: "changed", text: "Converted the icon source to WebP and removed unused PNG/JPEG files from the site’s public assets (old logo sources, leftover brand images), keeping the project lean. Live, referenced images are untouched." },
    ],
  },
  {
    version: "1.4.9",
    date: "2026-06-18",
    title: "Brand tagline · Google logo · investor site chrome · clearer logout",
    changes: [
      { kind: "changed", text: "English tagline corrected everywhere from “Where dreams come true” to “Where dreams are real” (matches স্বপ্ন যেখানে বাস্তব)." },
      { kind: "fixed", text: "Search engines (Google) will now show the blue Promise City logo as the site favicon instead of a generic icon — added a proper multi-size favicon. (Google refreshes its cached icon over a few days/weeks.)" },
      { kind: "improved", text: "Investors visiting their account on the website now keep the site header (navigation) and footer, so they can move around the site. Inside the installed mobile app (PWA) the header/footer stay hidden for a clean, native app feel." },
      { kind: "improved", text: "The investor logout button is now red with a “Logout” label under it, so it’s obvious what it does. Settings got a matching label too." },
    ],
  },
  {
    version: "1.4.8",
    date: "2026-06-18",
    title: "Polished PWA splash + icon · sticky investor header · team update",
    changes: [
      { kind: "fixed", text: "The installed-app splash screen no longer shows the logo trapped inside a dark rounded box. The app icon was using a transparent logo where a full-bleed one is required, so the system filled the gaps with a dark frame. The whole icon set was regenerated from the brand logo (now also served as a lighter WebP), so the home-screen icon and splash look clean and crisp." },
      { kind: "new", text: "Added branded launch screens for iPhone — opening the installed app now shows the Promise City logo on a clean screen instead of a blank white flash, on every common iPhone size." },
      { kind: "improved", text: "In the investor app, the welcome line and your identity card (name · UID · FID, with settings & logout) now stay pinned to the top while balance, projects and transactions scroll underneath — so who you are and the key actions are always one tap away." },
      { kind: "changed", text: "Team page: Mustaqeem Billah's photo was updated and his title changed from “Development Support” to “Engineer Support”." },
    ],
  },
  {
    version: "1.4.7",
    date: "2026-06-17",
    title: "Staff: no duplicate rows · owner-only role changes · manager full view",
    changes: [
      { kind: "fixed", text: "A staff member who also has a login (e.g. an investor made admin) no longer shows up twice — the office-roster row and the account now merge into one row with their role and controls, matched by employee code even when the login has no mobile." },
      { kind: "improved", text: "Role upgrade / downgrade is now restricted to the owner (founder) only. Other admins can still manage staff records, but cannot change anyone's role — so the hierarchy can't be reshuffled by a second admin." },
      { kind: "improved", text: "Managers now see the full dashboard, just like admins (all sections visible). Role changes stay owner-only." },
    ],
  },
  {
    version: "1.4.6",
    date: "2026-06-16",
    title: "Staff can log in by email (handy when they're also an investor)",
    changes: [
      { kind: "new", text: "When adding a dashboard staff member you can now leave Mobile blank and use Email + password as their login. This fixes the “account with this mobile already exists” error for someone who is already an investor — they get a separate admin login by email, while their investor account (mobile + password) stays completely separate and untouched." },
    ],
  },
  {
    version: "1.4.5",
    date: "2026-06-16",
    title: "Faster page speed — lighter, calmer hero (esp. mobile)",
    changes: [
      { kind: "improved", text: "On phones, the hero's always-running decorative animations (blurred blobs, gradient shimmer, button shine) and the headline typewriter now hold still — freeing the mobile main thread for a noticeably snappier load. The desktop experience is unchanged." },
      { kind: "improved", text: "The big architectural backdrop (the largest, slowest image) now serves at a lighter quality that's invisible under its colour wash — roughly half the bytes, so the hero paints faster (better LCP)." },
      { kind: "improved", text: "Removed an unused network preconnect and an extra high-priority image preload, so the main image starts loading sooner." },
    ],
  },
  {
    version: "1.4.4",
    date: "2026-06-16",
    title: "Fix: can't add transactions · marketing TUPAC + TFRAF columns",
    changes: [
      { kind: "fixed", text: "Adding a transaction for any investor failed with “Something went wrong”. Once the transactions table passed 1,000 rows, the next-id generator (which only saw the first 1,000) kept reusing an existing id and the insert was rejected. It now scans every row and retries on a clash, so transactions save reliably again." },
      { kind: "improved", text: "Marketing leaderboard: the Type column now stacks the role badge, position and district together — freeing room for two new columns. TUPAC shows each officer’s distinct clients as a % of all paying customers (e.g. 4 / 309 = 1.3%); TFRAF shows their AFR as a % of the company’s total fund." },
    ],
  },
  {
    version: "1.4.3",
    date: "2026-06-16",
    title: "Signup phone hint — drop the leading 0, accept it either way",
    changes: [
      { kind: "improved", text: "Since the country code (+880) already sits in the selector, the number placeholder now shows “1XXXXXXXXX” instead of “01XXXXXXXXX”." },
      { kind: "fixed", text: "If someone types a leading 0 out of habit (e.g. 01712…), it’s still accepted — the system strips it automatically and never shows an error. Works for every country, not just Bangladesh." },
    ],
  },
  {
    version: "1.4.2",
    date: "2026-06-16",
    title: "Signup — international phone field with country selector",
    changes: [
      { kind: "new", text: "The signup mobile field now has a country-code selector. Bangladesh (+880) is the default since most members are local; tap the flag to pick any of 59 countries (Gulf states, neighbours, Western hubs) with a quick search box. The number is still required — there’s no OTP / verification step." },
      { kind: "improved", text: "Login now also accepts a full international number, so members who signed up with a non-Bangladeshi number (and no email/username) can still log in by typing their number." },
    ],
  },
  {
    version: "1.4.1",
    date: "2026-06-16",
    title: "Cleaner investor app — compact header, settings, preset filters",
    changes: [
      { kind: "improved", text: "The investor account header is now a single compact row — avatar, name, and UID/FID on their own lines, with the settings + logout icons tucked neatly beside the name. No more oversized box." },
      { kind: "changed", text: "The বাং/EN language switcher moved into the in-app Settings sheet (top row), keeping the header clean." },
      { kind: "improved", text: "Transactions filter: the From/To date pickers are replaced with a smart preset dropdown — All time / Last 7, 30, 90 days / This year / Last year." },
      { kind: "fixed", text: "The website footer now stays on the browser login page but disappears inside the installed PWA, so the app feels native (no marketing footer)." },
    ],
  },
  {
    version: "1.4.0",
    date: "2026-06-16",
    title: "Account header polish — language switcher + clearer IDs",
    changes: [
      { kind: "improved", text: "The investor account header now carries the বাং/EN language switcher alongside the settings + logout controls, neatly in the top-right. UID and FID each sit on their own line so the full IDs are always visible (no more truncation)." },
    ],
  },
  {
    version: "1.3.10",
    date: "2026-06-16",
    title: "Investor app: native PWA feel · project popups · in-app settings",
    changes: [
      { kind: "improved", text: "The member /account portal is now a clean standalone app — no public navbar, footer, WhatsApp button or scroll-to-top. The top shows the investor’s avatar + name instead of a “login” button, so it feels like a real installed app, not a marketing page." },
      { kind: "new", text: "Tap any project (My Projects or All Projects) to open a detail popup — full description, status, address, share price and period, plus your invested / profit / progress." },
      { kind: "new", text: "An in-app Settings sheet (the gear icon) lets the investor update their name, email and login number, and change their password — all self-service." },
    ],
  },
  {
    version: "1.3.9",
    date: "2026-06-15",
    title: "Last 7 days everywhere · dashboard date filter · tighter flow chart",
    changes: [
      { kind: "improved", text: "The All Transactions flow chart now has wider bars that fill the width (no big gaps) and is shorter — the table is reachable without long scrolling." },
      { kind: "new", text: "“Last 7 days” added to the All Transactions date filter (for the Tue–Sun weekly accounting), plus CSV + PDF export of the exact filtered view." },
      { kind: "new", text: "The Dashboard has a date-range filter next to “New project” (Last 7 days / 30 days / this year / last year / 12 months / custom): pick a range, Apply, and the Capital-flow card shows that period’s in / out / net / transaction count — with a one-click CSV export." },
    ],
  },
  {
    version: "1.3.8",
    date: "2026-06-15",
    title: "Colourful cards · richer flow chart · transaction SMS",
    changes: [
      { kind: "improved", text: "Stat cards across the whole admin are now soft colourful gradient cards that gently lift on hover (with the icon popping), and the All Transactions summary cards get the same treatment." },
      { kind: "improved", text: "The All Transactions flow chart is redesigned — taller gradient bars on a baseline, a grow-in animation, and a hover tooltip showing each period’s exact in/out." },
      { kind: "new", text: "Adding a transaction now texts the investor (Bangladeshi numbers) through the SMS gateway — e.g. “BDT 50,000.00 has been credited to your account. Ref: TX100951” for a credit, or “debited from your account” for a withdrawal." },
    ],
  },
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
