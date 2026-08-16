/** Product changelog — shown in the dashboard (Settings → Changelog) so
 *  the team can see, at a glance, what shipped in every release.
 *
 *  Versioning: 1.0.1 → 1.0.10, then the next bump rolls the minor —
 *  1.0.10 → 1.1.0 → 1.1.1 … (patch runs 1–10, then minor +1).  A big
 *  milestone rolls the whole number (1.7.x → 2.0.0).  Newest release goes
 *  at the TOP of the list; CURRENT_VERSION reads from it. */

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
    version: "2.4.1",
    date: "2026-08-16",
    title: "One archive, one place",
    changes: [
      { kind: "changed", text: "The Archive button inside All Customers is gone — the sidebar's Archive section is now the one home for everything deleted (users, holdings and transactions), so there's a single place to look." },
      { kind: "improved", text: "Md Helal Uddin's and Md Rafi Sarkar's team cards got their mobile numbers and email addresses." },
    ],
  },
  {
    version: "2.4.0",
    date: "2026-08-16",
    title: "The Archive — one recycle bin for everything",
    changes: [
      { kind: "new", text: "A new Archive section in the sidebar: every deleted thing on the platform now waits in one 30-day recycle bin with three tabs — Users (deleted customers), Projects (a single holding deleted from someone's file) and Transactions (deleted payments). Restore anything in one click; after 30 days it's gone for good, automatically." },
      { kind: "new", text: "The Archive opens with a live overview — stat cards for what's parked inside (and its money value), a donut of the mix, and a countdown chart showing how much of the bin empties in each coming window, red when something is about to expire." },
      { kind: "changed", text: "Deleting is now always reversible first: a project-holding delete (from the customer popup or a project page) and a transaction delete both go to the Archive instead of vanishing instantly — with a type-delete-to-confirm warning before anything moves. A holding's app-side money is parked with it, so All Customers, the project pages and the member's app stay exactly in sync through delete and restore." },
      { kind: "improved", text: "Search, sorting (newest deleted / expiring soonest / biggest amount) and pagination on every archive tab." },
    ],
  },
  {
    version: "2.3.10",
    date: "2026-08-16",
    title: "Delete a holding right from the customer popup",
    changes: [
      { kind: "new", text: "The All-Customers popup (view holdings) now has a delete button on every book holding — remove a duplicate or junk project row for one customer without leaving the page. Same behaviour as the project page's delete: the holding's payment ledger goes with it and any referral commission is reversed, after a clear confirmation. The customer's account and their other projects stay untouched." },
    ],
  },
  {
    version: "2.3.9",
    date: "2026-08-16",
    title: "Tarek Ahmed's card, refreshed",
    changes: [
      { kind: "changed", text: "Tarek Ahmed's team-page card got his real photo (WebP pipeline: 1.5MB JPEG → 130KB), the designation Asst. Manager, his contact details (mobile, email and Facebook profile) and an updated profile in Bengali and English — all-round support in the manager's daily operations, client communication and work coordination." },
    ],
  },
  {
    version: "2.3.8",
    date: "2026-08-14",
    title: "Every book payment reaches the app — and refunds count",
    changes: [
      { kind: "fixed", text: "A customer whose app account predated the big book-to-app migration kept their old app history only — the migration deliberately skipped mirroring into accounts that already had transactions, so 17 of one member's 18 book payments never reached her app (the app said ৳46,000 while the book said ৳1,55,000). Her full ledger is now mirrored — the Transactions popup and her app show every payment." },
      { kind: "new", text: "Refunds/withdrawals now work on real-estate files: a ledger-backed withdrawal reduces the member's balance and re-opens their dues (Remaining = price − net paid). Recorded her ৳5,000 deed-fee withdrawal — her balance reads ৳1,50,000 everywhere: project page, All Customers and the app." },
      { kind: "fixed", text: "A data sweep found 417 real-estate files carrying a phantom \"withdrawn = 90% of paid\" value from an old import, with no ledger backing — all zeroed to match their actual payment ledgers (displays never used them, but now that withdrawals count, they had to be clean). One genuinely refunded file's Remaining was corrected in the same pass." },
    ],
  },
  {
    version: "2.3.7",
    date: "2026-08-14",
    title: "The whole team, on the team page",
    changes: [
      { kind: "new", text: "The public Team page now introduces the full office family — Md Helal Uddin (Senior Officer, overall operations oversight), Md Rafi Sarkar (Executive Engineer — every building's architect design and construction supervision runs under him), Tarek Ahmed (Online Marketing cum Asst. Officer), Abu Bakar (Office Assistant) and Md Hanif Howlader (Driver) — each with their photo and a short profile in Bengali and English, in proper seniority order." },
      { kind: "changed", text: "Md. Rashedul Islam's title updated to Manager cum Accountant." },
      { kind: "improved", text: "All five new headshots went through the WebP pipeline (max 1920px, ~78 quality, metadata stripped) — ~245KB JPEGs became ~75KB WebPs, and the unoptimized originals were removed." },
    ],
  },
  {
    version: "2.3.6",
    date: "2026-08-11",
    title: "Final balance leads — the money that's actually in the company",
    changes: [
      { kind: "changed", text: "The headline card on All Customers, Projectify and every project page now shows the FINAL BALANCE — what the company actually holds right now (deposits net of withdrawals, dividends and accrued profit included) — instead of the lifetime Total collected, which still shows underneath. The dashboard's first card follows along, as always." },
      { kind: "changed", text: "In every customer table the Balance / Remain column moved to the FRONT — the first money you read on a row is what it's worth today, then Paid, then the rest. Project pages now open sorted by it too, and CSV/PDF exports follow the same order." },
    ],
  },
  {
    version: "2.3.5",
    date: "2026-08-11",
    title: "One profit figure everywhere — this cycle's dividend",
    changes: [
      { kind: "fixed", text: "The same member's profit read ৳3,31,067 on the deposit scheme page but ৳6,34,348 in All Customers (and the app), because two pages answered two different questions — the scheme page announced this cycle's dividend while All Customers stacked earlier credited dividends on top. Now every page — scheme page, All Customers and the member's app — shows one figure: THIS cycle's accrued dividend. Earlier credited dividends are already part of the member's money, so they stay inside the balance; no balance changed anywhere." },
    ],
  },
  {
    version: "2.3.4",
    date: "2026-08-11",
    title: "Profit alignment, take one",
    changes: [
      { kind: "changed", text: "First pass at unifying the profit figure aligned the deposit scheme page to the larger All-Customers total — superseded within the hour by 2.3.5, which aligns everything to the correct figure: the current cycle's dividend." },
    ],
  },
  {
    version: "2.3.3",
    date: "2026-08-11",
    title: "Transaction history you can sort",
    changes: [
      { kind: "new", text: "The Transaction history in a customer's transactions box now sorts with one click: a Date toggle (latest → oldest by default, click again for oldest first) and an Amount toggle (biggest → smallest first, click again to flip) — handy for spotting the largest payments or reading a ledger from the beginning." },
    ],
  },
  {
    version: "2.3.2",
    date: "2026-08-07",
    title: "The password you set is the password that works — always",
    changes: [
      { kind: "fixed", text: "Setting a password from Edit customer could fail with “No login yet” for members whose accounts came from the books without a number — even when their file HAD a mobile. Now the panel builds the login on the spot (their number + your password), overriding anything old — the customer signs in immediately and can change it later in settings." },
      { kind: "improved", text: "Every account that had a usable number but no login got one in a sweep (default password), so managers can reset passwords for anyone. Accounts with no number anywhere get their login the moment a number or password is set — no dead ends left." },
    ],
  },
  {
    version: "2.3.1",
    date: "2026-08-07",
    title: "Remaining that's actually right — for every price, every customer",
    changes: [
      { kind: "fixed", text: "The Remaining column was a frozen leftover from the old sheets — it never moved when a payment came in or a price was edited (a member sold 2 shares at ৳5,70,000 with ৳5,10,000 paid showed ৳-2,20,000 instead of ৳60,000). It is now computed live — contract price − paid — and recomputed on every payment, edit and price change. 684 customers' stale figures were corrected in one sweep." },
      { kind: "improved", text: "Because we sell at different prices to different customers, the whole chain now follows each person's OWN price: the project page Remaining, their app goal and % paid all track the Total price on their file — change it once, everything updates." },
    ],
  },
  {
    version: "2.3.0",
    date: "2026-08-06",
    title: "The book is complete — every customer on every project page",
    changes: [
      { kind: "fixed", text: "Some customers with crores in the platform were invisible on their project's page (e.g. a member with ৳38,00,000 in Ahbab Palace-02 who wasn't among its listed customers) — their money lived only on the app side. All 96 such holdings (৳3.5 Cr of deposits) now have proper book rows with their full payment history, receipts and mirror links — every project page lists every one of its customers, no exceptions." },
      { kind: "changed", text: "Transactionify's User column now leads with the FILE ID (what the office actually knows people by) with the mobile number underneath — UIDs only appear for accounts without a file. Search matches file numbers and mobiles too, and the CSV export carries File ID + Mobile columns." },
    ],
  },
  {
    version: "2.2.11",
    date: "2026-08-06",
    title: "Your price, your progress — and SMS only when you want it",
    changes: [
      { kind: "new", text: "Every member's app now measures progress against the price THEY bought at — the contract price from their file (e.g. a Fuzala Complex bought at ৳2,65,000 shows % paid of ৳2,65,000, not today's ৳5,00,000). 162 members' goals were set from their files, and editing a customer's Total price updates their app goal instantly." },
      { kind: "new", text: "Every Add-transaction form now has an SMS switch (on by default): flip it off and the customer isn't texted for that entry — perfect for re-entering a corrected amount without the customer getting two or three confusing messages." },
      { kind: "fixed", text: "One member's file had its three payments (৳77,000) missing from the import — restored from the office sheet with receipts, mirrored to her app, and her contract price (৳2,65,000) set as her goal." },
    ],
  },
  {
    version: "2.2.10",
    date: "2026-08-06",
    title: "The app shows every project — with the real final balance",
    changes: [
      { kind: "fixed", text: "One member's Ahbab Palace-02 money showed twice in the app: the book holds ONE Ahbab project but the app has two options (1800sft & 1200sft) with fold-identical names, and yesterday's ledger rebuild mirrored onto the wrong one. Repaired — and project matching is now member-aware, so a mirror always lands on the option that member actually belongs to." },
      { kind: "fixed", text: "46 project cards were invisible in members' apps (money present, membership row missing — e.g. a Fuzala Complex holding that never showed). Every project a member has money in now has its card." },
      { kind: "new", text: "Deposit cards in the app now show three figures: বিনিয়োগ · মুনাফা · ব্যালেন্স — the final balance is invested + profit − withdrawn, so a member who withdrew sees exactly what remains (e.g. ৳35,000 deposited, ৳650 profit, ৳5,650 withdrawn → balance ৳30,000)." },
    ],
  },
  {
    version: "2.2.9",
    date: "2026-08-05",
    title: "Marketing: the commission traffic light",
    changes: [
      { kind: "changed", text: "In an officer's history (👁), the “মোট জমা” percentage now measures what matters: progress toward the commission payout. A commission becomes withdrawable once the client has deposited 10× its amount (Fuzala Complex ৳15,000 commission → ৳1,50,000 deposited; Fuzala Tower ৳20,000 → ৳2,00,000) — the % climbs to 100 as the deposits come in." },
      { kind: "new", text: "The chip is a traffic light: RED while the commission is not yet withdrawable, and it turns GREEN automatically the moment the client's deposit crosses the line — one glance tells you which officers can be paid. A complete package for the marketing team." },
    ],
  },
  {
    version: "2.2.8",
    date: "2026-08-05",
    title: "Different number, different person — accounts split automatically",
    changes: [
      { kind: "fixed", text: "Customers who once shared one mobile number shared one app account from the migration — so adding or deleting one person's transaction echoed into the other's app. The affected customers now have their own separate accounts (own number + the default password), and each other's money can never touch again." },
      { kind: "new", text: "This can't happen again: the moment a manager gives a book customer their OWN number, the platform automatically sets up their own app account, moves their transactions across, and links their project card — no shared ledgers between different people." },
    ],
  },
  {
    version: "2.2.7",
    date: "2026-08-05",
    title: "Archive: delete forever, when you mean it",
    changes: [
      { kind: "new", text: "Each archived customer now has a red Delete button beside Restore — an INSTANT permanent delete for when you don't want to wait out the 30 days. It wipes the account, their book rows, every payment and transaction, and their app login." },
      { kind: "changed", text: "Because there is no coming back from it, the confirmation spells it out — no archive, no restore — and still makes you type “delete” before the button arms. Only already-archived customers can be deleted this way; the audit log records who did it." },
    ],
  },
  {
    version: "2.2.6",
    date: "2026-07-30",
    title: "Transactionify: savings and withdrawals, one dropdown apart",
    changes: [
      { kind: "new", text: "A money-flow filter next to Add transaction — All Transactions / All Savings / All Withdrawal. It drives the whole page: the cards, the graph, the table AND the CSV/PDF exports, so MD sir can pull exactly the report he needs (files are named savings-… / withdrawals-… accordingly)." },
      { kind: "fixed", text: "A future-dated scheduled entry (like a fixed-date maturity withdrawal) no longer pins itself to the top of the list — it stays hidden until its day comes, or until you filter a date range that reaches into the future." },
    ],
  },
  {
    version: "2.2.5",
    date: "2026-07-30",
    title: "Every customer is an app user now — and the piggy bank is gone",
    changes: [
      { kind: "changed", text: "The piggy-bank icon is retired everywhere — the app's profit line, the dashboard's Avg/payer cards and the savings page on the website now carry a coins icon instead." },
      { kind: "new", text: "The last 11 book customers without an app account got their own accounts (default password, book payments and project cards mirrored in) — every one of our customers is an app user now, whether they log in or not. The “No app account” filter left All Customers because the category no longer exists." },
    ],
  },
  {
    version: "2.2.4",
    date: "2026-07-30",
    title: "The investor app tells the truth about profit",
    changes: [
      { kind: "fixed", text: "Some accounts carried phantom “মুনাফা” from the old system — a stale imported balance could show lakhs of profit on real-estate shares that never earn any. The app's totals now sum live from the member's own ledger, so মোট ব্যালেন্স / বিনিয়োগ / মুনাফা are always the real figures." },
      { kind: "new", text: "Deposit-scheme members now see their project-wise profit exactly as Projectify calculates it — the recorded dividend plus the live accrued Mudaraba profit, the same taka the office dashboard shows." },
      { kind: "changed", text: "Profit is a deposit-scheme concept: real-estate project cards no longer show a profit line at all." },
    ],
  },
  {
    version: "2.2.3",
    date: "2026-07-29",
    title: "The bell rings — plus a sidebar and backdrop with brand feel",
    changes: [
      { kind: "new", text: "The 🔔 notification bell finally does something: click it for the latest five transactions — who, what type, how much, when — with a “See all transactions” link straight into Transactionify." },
      { kind: "improved", text: "Sidebar items now glide on hover — a smooth slide with a light blue highlight — and the whole dashboard sits on a subtle brand backdrop: a soft blue wash from one corner, a soft red from the other, mostly white in between." },
    ],
  },
  {
    version: "2.2.2",
    date: "2026-07-29",
    title: "Find anyone by any file number",
    changes: [
      { kind: "fixed", text: "All Customers search now matches EVERY file number a person has — the office file on each project book, not just the app account's own File ID. (A customer whose account was opened on a foreign number and whose deposit file carries a different number now comes up either way.)" },
      { kind: "improved", text: "When an app account has no File ID of its own, the row now shows the office file number from their book — so the File column is never blank for a book customer." },
      { kind: "changed", text: "The Dashboard's four headline cards are now the exact same four as Projectify's All Customers — collected, customers, unique people, projects — same values, same subtitles." },
    ],
  },
  {
    version: "2.2.1",
    date: "2026-07-29",
    title: "A cleaner dashboard — SMS at a glance, honest dates, a fuller graph",
    changes: [
      { kind: "new", text: "Four SMS cards on the Dashboard — balance (est.), remaining SMS, sent and cost over 30 days — the same numbers as the SMS page, one click away." },
      { kind: "fixed", text: "Two old transactions carried day/month-swapped dates from the previous system (01 Aug ↔ 08 Jan, 07 Oct ↔ 10 Jul) — repaired against the book, so nothing future-dated tops the lists anymore. Recent transactions also skips scheduled future entries (like a fixed-date maturity withdrawal), and every date now renders in Bangladesh time on first paint — the brief blank-then-flash on load is gone." },
      { kind: "improved", text: "Both flow graphs show the last 12 months ending today, start and end on real activity (no hollow months), and the Dashboard's capital flow now stretches edge-to-edge instead of floating in the middle." },
      { kind: "changed", text: "A leaner sidebar: Finance, Income and Expenses are out; Marketing is now two direct items — Marketing and Client follow-up — no more digging into submenus." },
    ],
  },
  {
    version: "2.2.0",
    date: "2026-07-29",
    title: "Transactionify — every transaction, one beautiful graph",
    changes: [
      { kind: "new", text: "A new “Transactionify” section in the sidebar: every deposit, profit and withdrawal on the platform in one explorer — search, date presets, sortable columns, CSV/PDF export and inline add/edit, exactly like before, but front and centre." },
      { kind: "new", text: "The flow chart grew up: the old bar towers are now a smooth area graph — green In and red Out curves with gradient fills, faint ৳ gridlines, and a crosshair that follows your mouse showing In / Out / Net for any day, week or month." },
      { kind: "changed", text: "The legacy Investments menu has left the sidebar (ahead of its 1 August retirement) — Projectify and Transactionify are the two homes now. Old record pages still open from project links when needed." },
      { kind: "improved", text: "The Dashboard's headline cards now read straight from Projectify's All Customers — total balance, total collected, customer and membership counts, and Top customers all match the Projectify page to the taka." },
    ],
  },
  {
    version: "2.1.2",
    date: "2026-07-26",
    title: "App entries land in the book too — and deposits show their true remaining",
    changes: [
      { kind: "new", text: "A transaction added from the app side now writes the book ledger as well — both worlds stay identical no matter where the entry starts." },
      { kind: "fixed", text: "Deposit balances now include the live accrued dividend, so a matured, fully-withdrawn deposit shows exactly ৳0 remaining — not a phantom minus figure." },
      { kind: "fixed", text: "The row action menu no longer gets clipped on the last rows of a long customer list." },
    ],
  },
  {
    version: "2.1.1",
    date: "2026-07-23",
    title: "A form fill can never be lost again",
    changes: [
      { kind: "fixed", text: "Every website form submission is saved to the database FIRST (visible in Messages), then emailed to all three office inboxes with the PDF attached — a mail hiccup can no longer swallow a lead." },
      { kind: "new", text: "Safer customer operations: deactivate/delete now asks you to type the word to confirm, deleted customers rest in a 30-day restorable Archive, and a customer's mobile number can be edited (their login moves with it)." },
    ],
  },
  {
    version: "2.1.0",
    date: "2026-07-21",
    title: "One customer world — everything runs from Projectify",
    changes: [
      { kind: "new", text: "Every customer is now an app user. All 573 book customers were migrated to app accounts in one pass — existing users untouched (their own passwords keep working), everyone else got a login (mobile + the default password) with their full payment history and project cards in their PWA. Self-signups appear in All Customers automatically." },
      { kind: "new", text: "One flow for everything: a single Add customer button also creates the app login (email + password fields built in); the Edit pencil is a full editor — profile & login (File ID, email, verified/active, set a new app password) plus “Add to project” to place anyone in any project with reference commission. Rows show File IDs, and search now puts direct name/number matches first." },
      { kind: "new", text: "Projectify project pages now carry the app project's full details (description, goal, per-user share, dates, status) with Edit / Add Project / guarded Delete — one edit updates the website, the admin and the investor PWA together. The Analytics daily chart shows each day's visitors on hover." },
      { kind: "improved", text: "Transactions from anywhere sync everywhere: the book entry, the customer's app transactions, their PWA balance AND project card, plus the SMS — and now edits and deletes update the mirrored app transaction too (each payment remembers its mirror; migration 0029)." },
      { kind: "fixed", text: "An edited payment could duplicate its app-side copy (a same-day timezone slip made the sync miss the original and add a new one). Matching is timezone-proof now, the hard link prevents any repeat, and the one affected account was repaired to the taka." },
      { kind: "changed", text: "Projectify is now the single home for customers, transactions, logins and projects. The old Investments menu stays only to look up old records during the transition and leaves the sidebar on 1 August. Staff/admin logins land straight on the dashboard, and the dividend engine's “365 days = 1 year” is locked in everywhere." },
    ],
  },
  {
    version: "2.0.1",
    date: "2026-07-18",
    title: "Deposit books reconciled — taka to taka",
    changes: [
      { kind: "improved", text: "The General Deposit A and Special Deposit dashboards were audited line-by-line against the office sheets — every date, dividend and withdrawal ties out to the taka, with the 365-day year locked in everywhere." },
    ],
  },
  {
    version: "2.0.0",
    date: "2026-07-15",
    title: "Promise City 2.0 — the whole company, in one place",
    changes: [
      { kind: "new", text: "A new “SMS” section: your KhudeBarta balance, how many SMS you can still send, and today / 7-day / 30-day usage + cost — as clean cards, a 14-day bar chart and a balance dial — so you never have to log in to KhudeBarta to check. Every message the app sends (transaction alerts, Profit Push, reset codes) is counted and subtracted automatically; after a top-up you just type the new balance." },
      { kind: "new", text: "🎉 A milestone. In under two months — 19 May → 15 July 2026 — Promise City grew from a launch website into a full operating platform: the public site + installable app, the investor portal, a 9-project customer hub (780 customers and over ৳20 crore of ledger), automatic Shariah Mudaraba dividend, a marketing leaderboard with 60 partners, staff · attendance · finance, and now bulk SMS — all connected, all live. Thank you for the trust. Here's to v2.0." },
    ],
  },
  {
    version: "1.7.10",
    date: "2026-07-15",
    title: "Profit Push — text every member their dividend, in one click",
    changes: [
      { kind: "new", text: "Each deposit scheme (Special · General A & B · Monthly) now has a “Profit Push” button. Write the message once with placeholders — {name}, {profit}, {paid}, {remain} — and it texts every member their OWN figures in one go (“Assalamu Alaikum {name}, this year's profit is {profit} taka”). A live preview, an SMS-length + total-cost estimate, and a confirm showing the recipient count keep you in control before anything sends — made for the yearly dividend announcement." },
    ],
  },
  {
    version: "1.7.9",
    date: "2026-07-15",
    title: "SMS now reaches every customer — not just app users",
    changes: [
      { kind: "fixed", text: "Transaction SMS to project-book customers were silently never sent. Their numbers are saved in local “01…” form, which the gateway quietly rejected — so credit/debit texts never went out (app users worked because theirs are stored as “+880…”). Now every format — 01…, +880…, even a field holding two numbers — is normalised, so book customers get their SMS too." },
    ],
  },
  {
    version: "1.7.8",
    date: "2026-07-15",
    title: "All Customers — the app and the books, unified",
    changes: [
      { kind: "new", text: "“All Customers” now brings your project-book customers AND your live app / investment accounts into one place — an app investor who isn't already in the books is added, matched by name so nobody is counted twice." },
      { kind: "changed", text: "It's now a unique-person directory, just like App Users: each person is ONE clean row, however many projects they're in — click to see their full per-project breakdown in a popup. New “Unique people” count and a “Top holders by current balance” chart (real-estate paid + deposit remaining, every project combined)." },
      { kind: "fixed", text: "The project filter now lists exactly your 9 projects — the app's variant names (e.g. “Investment (General Deposit) Group-A”, “Ahbab Palace-02 (1200sft)”) are mapped onto the real project, so no more duplicates in the dropdown." },
    ],
  },
  {
    version: "1.7.7",
    date: "2026-07-15",
    title: "Deposit schemes: a clear money-flow table",
    changes: [
      { kind: "improved", text: "Deposit customer lists now read left-to-right the way the money flows — Total Paid · Total Withdrawn · Profit · Remaining — instead of a bare “Joined” date, so a member's whole position is visible at a glance (all four columns sortable, and in the CSV)." },
      { kind: "improved", text: "“Remaining” is now the true final balance — deposits + dividend − withdrawals + this year's accrued profit — exactly what's theirs right now. No double-counting: the engine treats credited dividends as principal and adds the fresh earning on top (e.g. Md. Faiz Ullah: ৳24,00,000 paid, ৳12,19,000 withdrawn, ৳1,54,519 profit → ৳13,83,489 remaining)." },
    ],
  },
  {
    version: "1.7.6",
    date: "2026-07-15",
    title: "Investor totals always live from the ledger",
    changes: [
      { kind: "fixed", text: "The dashboard's investor “invested” and “balance” figures now sum straight from each member's transactions instead of a cached total that could fall behind — so the numbers always match the ledger." },
    ],
  },
  {
    version: "1.7.5",
    date: "2026-07-15",
    title: "Deposit history: clearer figures + editable transactions",
    changes: [
      { kind: "new", text: "A deposit member's detail popup (👁) now shows a “Remaining balance” tile — how much of their money is still in the company after every withdrawal." },
      { kind: "new", text: "Every recorded transaction can now be EDITED, not just deleted — fix a wrong amount, date, type or receipt in place, and the member's totals re-roll automatically." },
    ],
  },
  {
    version: "1.7.4",
    date: "2026-07-15",
    title: "Report inbox, staff roles & My Projects",
    changes: [
      { kind: "new", text: "“Insights” becomes “Report” — a Gmail-style inbox for the team's daily work updates. Managers and admins get one tab per staff member (Rashed · Tarek · Abu Bakr · Rafi …), each showing that person's date-wise reports; filter by this month / last 30 days / this year / last year, and tick one or many to delete. Each staff member sees only their own." },
      { kind: "changed", text: "Cleaner roles: a plain staff member now sees only Report (+ My Projects) and nothing else; a manager sees everything except the Vault; and only an admin can change anyone's role. The Audit log is now its own item, above Changelog." },
      { kind: "new", text: "New “My Projects”: any staff or manager who ALSO holds a share (bought a plot or joined a scheme) can see their own investment and transactions right here, like the investor app. Linked by mobile or a new “Investor ID” field on the staff form." },
    ],
  },
  {
    version: "1.7.3",
    date: "2026-07-14",
    title: "Deposit dividend now compounds — earns like principal",
    changes: [
      { kind: "fixed", text: "A credited/reinvested dividend now counts as part of a member's running balance, so money left in keeps earning next cycle — exactly like the passbook (before, dividends were skipped, understating the balance). Anyone who withdraws still stops earning from their withdrawal date. Example: Muddassir's profit corrects from ৳1,55,692 to ৳1,95,118, matching his sheet's ৳10,00,000 remaining. Special Deposit total profit rose ৳1,13,331 across 62 members; General Deposit A is unaffected (no dividends there)." },
    ],
  },
  {
    version: "1.7.2",
    date: "2026-07-14",
    title: "Deposit dividend now exact — plus deposit-hub polish",
    changes: [
      { kind: "fixed", text: "Deposit dividend (লভ্যাংশ) is now day-counted on a 365-day year instead of 360. So one full year pays exactly the stated rate (e.g. ৳15,000/lakh) and a clean 2-year hold is exactly double — no more ~1.4% overpay (a ৳2,00,000 two-year balance now shows ৳60,000, not ৳60,833). Every member's Profit recalculates automatically; applies to General Deposit A and Special Deposit." },
      { kind: "new", text: "A customer's detail popup (👁) now shows a “Remaining” figure — how much they currently have in the company (total deposits − withdrawals), whether or not a final withdrawal was taken." },
      { kind: "new", text: "Add-transaction always offers a Dividend (লভ্যাংশ) type now, so a member's dividend can be recorded directly from the transactions box." },
      { kind: "improved", text: "“Shares / units” on the Add-customer form is now clearly optional — deposit schemes don't need it, while real-estate projects still use it." },
    ],
  },
  {
    version: "1.7.1",
    date: "2026-07-14",
    title: "Payment Method page — send us money, the easy way",
    changes: [
      { kind: "new", text: "A new “Payment Method” page (linked from the footer, under Contact) lays out all six company bank accounts — Dutch-Bangla, Al-Arafah Islami, Sonali, Islami and Bank Asia — as clean, colour-coded cards. Each account and routing number has a one-tap Copy button, so customers can pay in seconds without mistyping. Bengali + English, with a reminder to send the receipt after paying." },
    ],
  },
  {
    version: "1.7.0",
    date: "2026-07-14",
    title: "Book a project visit — right from the site",
    changes: [
      { kind: "new", text: "A bold “Book a Visit” button now sits in the header, just left of Login (and always visible on mobile, where most visitors are). It opens a new, fully-branded /booking page on promisepd.com — a striking hero plus the live scheduler embedded right in — so anyone can pick a time between 11 AM – 12 PM and confirm their project visit without leaving the site. Bengali + English." },
    ],
  },
  {
    version: "1.6.10",
    date: "2026-07-13",
    title: "Deposit schemes: automatic dividend (লভ্যাংশ) calculation",
    changes: [
      { kind: "new", text: "General Deposit A and Special Deposit now calculate every member's yearly Shariah Mudaraba dividend automatically — day-weighted on the running balance (deposits add, withdrawals subtract), paid 16 July. Each member earns for exactly how much money was in the company and for how many days, so someone who paid in and later withdrew still earns for the days it was held." },
      { kind: "new", text: "Each scheme shows its editable rate, plus a sortable Profit column listing every member's dividend (in the CSV export too). Sub-lakh balances use the per-thousand rate and lakh+ balances the per-lakh rate — same rate, exact for every amount." },
      { kind: "new", text: "The rate is one editable number per scheme (Special ৳13,000/lakh/year, General A ৳15,000/lakh/year) plus the cycle dates — change it once a year and every member's profit recalculates instantly." },
    ],
  },
  {
    version: "1.6.9",
    date: "2026-07-13",
    title: "Projectify — a full customer hub for every project",
    changes: [
      { kind: "new", text: "A brand-new “Projectify” section: all 9 projects as cards showing total collected, customers and progress — grouped Real Estate + Deposit Schemes. Imported the complete master-book ledger: 779 customers, ৳20.11 crore collected, with every customer's full profile and dated payment history." },
      { kind: "new", text: "Inside each project you can now add / edit / delete customers and manage each one's transactions — just like App Users. Every row has 👁 history, ✏️ edit, 🗑 delete and 💳 transactions; the list is searchable, sortable and CSV-exportable." },
      { kind: "new", text: "New Reference field: pick the marketing officer who brought a customer (autocomplete by name / mobile / ID). On selecting the officer for a real-estate sale, their points + commission are added and kept in sync automatically in the Marketing section." },
      { kind: "new", text: "An “All Customers” card gathers every project's customers into one App-Users-style screen (filter by project, add anywhere → shows everywhere). Transaction types now match App Users, and adding a deposit / withdrawal texts the customer — same SMS gateway." },
    ],
  },
  {
    version: "1.6.8",
    date: "2026-07-10",
    title: "Projectify build: the office books come in",
    changes: [
      { kind: "new", text: "Behind the scenes, all nine project books — customers, payments, receipt numbers, joining dates — were imported from the office Excel files into the new customer-hub tables, ready for the Projectify launch." },
    ],
  },
  {
    version: "1.6.7",
    date: "2026-07-07",
    title: "Officer history: per-project client deposit + % paid",
    changes: [
      { kind: "fixed", text: "In an officer's history (👁), “মোট জমা” now shows the client's deposit into THAT specific project — the exact figure the investor sees in their own app — instead of their company-wide total across every project. So a self-referral like Ahbab shows only the Ahbab deposit, not other projects referred by other partners." },
      { kind: "new", text: "Beside each deposit it now shows the percentage of that client's share paid so far (e.g. ৳50,000 of a ৳5L share = 10%)." },
      { kind: "improved", text: "Facebook activity entries now read “Like / Comment / Share” instead of a bare dash." },
    ],
  },
  {
    version: "1.6.6",
    date: "2026-07-05",
    title: "Projectify blueprint signed off",
    changes: [
      { kind: "new", text: "The customer-hub design is locked: the nine project books become one dashboard section — per-project customer lists, payment ledgers with receipts, deposit dividends, and a combined all-customers view. Import plan for the office Excel books agreed." },
    ],
  },
  {
    version: "1.6.5",
    date: "2026-07-02",
    title: "Deposit schemes: the Mudaraba model mapped",
    changes: [
      { kind: "new", text: "Groundwork for automatic dividends: each scheme's rate table drafted, the day-weighted running-balance (Mudaraba) model designed, and the 15-July cycle alignment agreed with management." },
    ],
  },
  {
    version: "1.6.4",
    date: "2026-06-29",
    title: "Imported points verified to the taka",
    changes: [
      { kind: "improved", text: "Post-import audit of the officer ledgers: spot-checks against the master sheet per officer, duplicate-guard re-runs, and leaderboard totals cross-checked — the imported history stands to the taka." },
    ],
  },
  {
    version: "1.6.3",
    date: "2026-06-26",
    title: "All marketing officers' historical points imported",
    changes: [
      { kind: "new", text: "Imported the full point ledger for 40 more officers straight from the master sheet — each sale entered with its real date, client, project and commission (FB & attendance as points only, no income). 60 officers now appear on the leaderboard." },
      { kind: "improved", text: "Total commission paid to partners jumped accordingly, and every imported officer's history (👁) shows the dated, itemised breakdown." },
    ],
  },
  {
    version: "1.6.2",
    date: "2026-06-25",
    title: "Leaderboard: live “commission paid to partners” counter",
    changes: [
      { kind: "new", text: "The public leaderboard now shows a live, animated counter of the total commission paid to all partners so far (summed straight from the backend) with a motivating line — “আমাদের পার্টনাররা ইতিমধ্যে লক্ষ টাকা আয় করছেন — আপনার পরিশোধও পথেই।” It grows automatically as more is paid out." },
    ],
  },
  {
    version: "1.6.1",
    date: "2026-06-25",
    title: "Leaderboards default to “This year”",
    changes: [
      { kind: "changed", text: "Both the internal Marketing Overview and the public leaderboard now open on “This year” by default (instead of lifetime) — matching each other. Anyone can still switch to Lifetime / Last year / 30 days with the period filter." },
    ],
  },
  {
    version: "1.6.0",
    date: "2026-06-25",
    title: "Public leaderboard now mirrors the internal board · champions podium · calmer #1 card",
    changes: [
      { kind: "fixed", text: "The public leaderboard now ranks by lifetime points by default — exactly matching the internal Marketing Overview, so the names and order are always the same on both. (Visitors can still narrow it to a single year.)" },
      { kind: "new", text: "Added a top-3 champions podium to the public leaderboard with a heartfelt line — “বাইতুল্লাহ’র পথে এই মেহনতে আমরা যুক্ত হয়েছি — আপনি যুক্ত হয়েছেন তো?” — and a “পার্টনার হোন” button that goes straight to the partner page." },
      { kind: "improved", text: "Removed the rotating light on the #1 podium card in the dashboard — it now sits calm and clean." },
    ],
  },
  {
    version: "1.5.10",
    date: "2026-06-25",
    title: "Award points: fractional quantity + the box stays open for bulk entry",
    changes: [
      { kind: "new", text: "Quantity now accepts fractions like 0.5 — e.g. জমি sold প্রতি শতাংশ where 12 buyers share 6 শতাংশ (0.5 each). Points, fund and income scale to the fraction." },
      { kind: "improved", text: "After “Add points” the dialog now stays open and just clears the quantity + client fields (officer, item and date stay), so one officer's 10–20 sales can be entered back-to-back. Close it with ✕ when done." },
    ],
  },
  {
    version: "1.5.9",
    date: "2026-06-25",
    title: "Marketing: rename point items from the Point values panel",
    changes: [
      { kind: "improved", text: "In “Point values per sale”, each item now has an ✏️ edit button next to delete — tap it to rename the item (e.g. fix a typo or reword it), then “Save all”. Renaming doesn't touch past history entries." },
    ],
  },
  {
    version: "1.5.8",
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
    version: "1.5.7",
    date: "2026-06-25",
    title: "Marketing leaderboard: top-3 podium · officer history · cleaner rows",
    changes: [
      { kind: "new", text: "A top-3 champions podium now sits above the marketing leaderboard — 1st in the centre, 2nd and 3rd flanking — each showing the officer's name, points and income. It follows the date filter, so the podium changes with the period." },
      { kind: "new", text: "Each officer row has a new 👁 view button: open it to see that officer's full referral history with dates — who they brought in, when, the fund raised (investment), income and points for each — plus lifetime totals." },
      { kind: "improved", text: "The Type column is cleaner — it now shows just the role and district (e.g. “Active Marketing Officer · Dhaka”), dropping the extra MD/AMO/MO code badge." },
    ],
  },
  {
    version: "1.5.6",
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
    version: "1.5.5",
    date: "2026-06-22",
    title: "Marketing master-sheet: the import engine",
    changes: [
      { kind: "new", text: "Built the importer for the officers' historical point ledgers: per-officer Excel mapping (F.C, F.T, A.P, P.C, Facebook, attendance), the Dues column treated as a marker (never summed), totals rows skipped, and a dry-run mode so the real import can be replayed safely." },
    ],
  },
  {
    version: "1.5.4",
    date: "2026-06-19",
    title: "Fuzala Complex — project documentary video",
    changes: [
      { kind: "new", text: "The Fuzala Complex project page now features its documentary video — embedded in a clean, framed player right in the middle of the project description, so visitors can watch the full story of the project as they read about it." },
    ],
  },
  {
    version: "1.5.3",
    date: "2026-06-18",
    title: "Unified app icon (final.webp) everywhere · lighter /public",
    changes: [
      { kind: "improved", text: "The new rounded-square Promise City mark (final.webp) is now the single brand icon used everywhere — the PWA install/home-screen icon, the Android & iOS splash screens, and the browser / Google favicon — all regenerated from one source for a consistent look." },
      { kind: "changed", text: "Converted the icon source to WebP and removed unused PNG/JPEG files from the site’s public assets (old logo sources, leftover brand images), keeping the project lean. Live, referenced images are untouched." },
    ],
  },
  {
    version: "1.5.2",
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
    version: "1.5.1",
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
    version: "1.5.0",
    date: "2026-06-17",
    title: "Staff: no duplicate rows · owner-only role changes · manager full view",
    changes: [
      { kind: "fixed", text: "A staff member who also has a login (e.g. an investor made admin) no longer shows up twice — the office-roster row and the account now merge into one row with their role and controls, matched by employee code even when the login has no mobile." },
      { kind: "improved", text: "Role upgrade / downgrade is now restricted to the owner (founder) only. Other admins can still manage staff records, but cannot change anyone's role — so the hierarchy can't be reshuffled by a second admin." },
      { kind: "improved", text: "Managers now see the full dashboard, just like admins (all sections visible). Role changes stay owner-only." },
    ],
  },
  {
    version: "1.4.10",
    date: "2026-06-16",
    title: "Staff can log in by email (handy when they're also an investor)",
    changes: [
      { kind: "new", text: "When adding a dashboard staff member you can now leave Mobile blank and use Email + password as their login. This fixes the “account with this mobile already exists” error for someone who is already an investor — they get a separate admin login by email, while their investor account (mobile + password) stays completely separate and untouched." },
    ],
  },
  {
    version: "1.4.9",
    date: "2026-06-16",
    title: "Faster page speed — lighter, calmer hero (esp. mobile)",
    changes: [
      { kind: "improved", text: "On phones, the hero's always-running decorative animations (blurred blobs, gradient shimmer, button shine) and the headline typewriter now hold still — freeing the mobile main thread for a noticeably snappier load. The desktop experience is unchanged." },
      { kind: "improved", text: "The big architectural backdrop (the largest, slowest image) now serves at a lighter quality that's invisible under its colour wash — roughly half the bytes, so the hero paints faster (better LCP)." },
      { kind: "improved", text: "Removed an unused network preconnect and an extra high-priority image preload, so the main image starts loading sooner." },
    ],
  },
  {
    version: "1.4.8",
    date: "2026-06-16",
    title: "Fix: can't add transactions · marketing TUPAC + TFRAF columns",
    changes: [
      { kind: "fixed", text: "Adding a transaction for any investor failed with “Something went wrong”. Once the transactions table passed 1,000 rows, the next-id generator (which only saw the first 1,000) kept reusing an existing id and the insert was rejected. It now scans every row and retries on a clash, so transactions save reliably again." },
      { kind: "improved", text: "Marketing leaderboard: the Type column now stacks the role badge, position and district together — freeing room for two new columns. TUPAC shows each officer’s distinct clients as a % of all paying customers (e.g. 4 / 309 = 1.3%); TFRAF shows their AFR as a % of the company’s total fund." },
    ],
  },
  {
    version: "1.4.7",
    date: "2026-06-16",
    title: "Signup phone hint — drop the leading 0, accept it either way",
    changes: [
      { kind: "improved", text: "Since the country code (+880) already sits in the selector, the number placeholder now shows “1XXXXXXXXX” instead of “01XXXXXXXXX”." },
      { kind: "fixed", text: "If someone types a leading 0 out of habit (e.g. 01712…), it’s still accepted — the system strips it automatically and never shows an error. Works for every country, not just Bangladesh." },
    ],
  },
  {
    version: "1.4.6",
    date: "2026-06-16",
    title: "Signup — international phone field with country selector",
    changes: [
      { kind: "new", text: "The signup mobile field now has a country-code selector. Bangladesh (+880) is the default since most members are local; tap the flag to pick any of 59 countries (Gulf states, neighbours, Western hubs) with a quick search box. The number is still required — there’s no OTP / verification step." },
      { kind: "improved", text: "Login now also accepts a full international number, so members who signed up with a non-Bangladeshi number (and no email/username) can still log in by typing their number." },
    ],
  },
  {
    version: "1.4.5",
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
    version: "1.4.4",
    date: "2026-06-16",
    title: "Account header polish — language switcher + clearer IDs",
    changes: [
      { kind: "improved", text: "The investor account header now carries the বাং/EN language switcher alongside the settings + logout controls, neatly in the top-right. UID and FID each sit on their own line so the full IDs are always visible (no more truncation)." },
    ],
  },
  {
    version: "1.4.3",
    date: "2026-06-16",
    title: "Investor app: native PWA feel · project popups · in-app settings",
    changes: [
      { kind: "improved", text: "The member /account portal is now a clean standalone app — no public navbar, footer, WhatsApp button or scroll-to-top. The top shows the investor’s avatar + name instead of a “login” button, so it feels like a real installed app, not a marketing page." },
      { kind: "new", text: "Tap any project (My Projects or All Projects) to open a detail popup — full description, status, address, share price and period, plus your invested / profit / progress." },
      { kind: "new", text: "An in-app Settings sheet (the gear icon) lets the investor update their name, email and login number, and change their password — all self-service." },
    ],
  },
  {
    version: "1.4.2",
    date: "2026-06-15",
    title: "Last 7 days everywhere · dashboard date filter · tighter flow chart",
    changes: [
      { kind: "improved", text: "The All Transactions flow chart now has wider bars that fill the width (no big gaps) and is shorter — the table is reachable without long scrolling." },
      { kind: "new", text: "“Last 7 days” added to the All Transactions date filter (for the Tue–Sun weekly accounting), plus CSV + PDF export of the exact filtered view." },
      { kind: "new", text: "The Dashboard has a date-range filter next to “New project” (Last 7 days / 30 days / this year / last year / 12 months / custom): pick a range, Apply, and the Capital-flow card shows that period’s in / out / net / transaction count — with a one-click CSV export." },
    ],
  },
  {
    version: "1.4.1",
    date: "2026-06-15",
    title: "Colourful cards · richer flow chart · transaction SMS",
    changes: [
      { kind: "improved", text: "Stat cards across the whole admin are now soft colourful gradient cards that gently lift on hover (with the icon popping), and the All Transactions summary cards get the same treatment." },
      { kind: "improved", text: "The All Transactions flow chart is redesigned — taller gradient bars on a baseline, a grow-in animation, and a hover tooltip showing each period’s exact in/out." },
      { kind: "new", text: "Adding a transaction now texts the investor (Bangladeshi numbers) through the SMS gateway — e.g. “BDT 50,000.00 has been credited to your account. Ref: TX100951” for a credit, or “debited from your account” for a withdrawal." },
    ],
  },
  {
    version: "1.4.0",
    date: "2026-06-15",
    title: "Dashboard — live, real-data redesign",
    changes: [
      { kind: "improved", text: "The main Dashboard is rebuilt entirely on real investment data: animated KPIs (total balance, total invested, investors + how many are paying, projects + amount raised) and a clean secondary strip (profit, withdrawn, transactions, members, leads, blog)." },
      { kind: "new", text: "An interactive “Capital flow” chart — real money in vs out across the last 12 months, with a hover tooltip showing each month’s figures — replaces the old sample chart." },
      { kind: "new", text: "Live Project-funding bars (raised vs goal), a Top-investors chart, and a Recent-transactions feed, all from real data, alongside recent enquiries." },
    ],
  },
  {
    version: "1.3.10",
    date: "2026-06-15",
    title: "Paying / non-paying filter · attendance is staff-only",
    changes: [
      { kind: "new", text: "App Users: filter by Paying vs Non-paying — paying = anyone who has put in (or moved) any money; non-paying = zero-activity signups. A live count chip shows how many users match the current filter, and every filter option shows its own count." },
      { kind: "fixed", text: "Attendance now lists only staff / employees — investor app users (role “member”) are no longer pulled into the daily roster, so the totals reflect real staff." },
    ],
  },
  {
    version: "1.3.9",
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
    version: "1.3.8",
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
    version: "1.3.7",
    date: "2026-06-15",
    title: "Accurate per-project investment totals",
    changes: [
      { kind: "fixed", text: "On the investor portal, each project’s “Invested” figure is now summed directly from that member’s own transactions for the project, so every payment type (land share, installment, booking money, etc.) is counted. Previously it read a stale cached total that could leave some payments out — e.g. a member’s land-share payments were missing from one project’s total." },
    ],
  },
  {
    version: "1.3.6",
    date: "2026-06-15",
    title: "Flow chart follows your filter · clearer cursors",
    changes: [
      { kind: "improved", text: "The All Transactions flow chart now matches the selected date range — daily bars for short ranges, weekly for medium, monthly for long — instead of always monthly, with bars evenly spaced across the whole range." },
      { kind: "fixed", text: "Buttons, toggles and other clickable controls now show the hand cursor on hover (with smooth transitions), not the plain arrow." },
    ],
  },
  {
    version: "1.3.5",
    date: "2026-06-15",
    title: "A sidebar you arrange · Investments up top",
    changes: [
      { kind: "new", text: "Drag any sidebar item up or down (grab the handle that appears on hover) to arrange the menu your way — the order is remembered on your device." },
      { kind: "changed", text: "Investments now sits right under Dashboard for quick access." },
    ],
  },
  {
    version: "1.3.4",
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
    version: "1.3.3",
    date: "2026-06-15",
    title: "Attendance shows the real day",
    changes: [
      { kind: "fixed", text: "A day with no attendance now clearly says “No attendance taken” — instead of wrongly showing everyone present. Each date shows its own real data." },
      { kind: "new", text: "A “Take today’s attendance” button to start the day; once saved it reads “Today’s attendance taken”, with an Edit option." },
    ],
  },
  {
    version: "1.3.2",
    date: "2026-06-15",
    title: "Bullet-fast dashboard, tuned for Bangladesh",
    changes: [
      { kind: "improved", text: "Every dashboard section loads markedly faster — data queries run in parallel and the session is verified locally (one less round-trip per click)." },
      { kind: "improved", text: "Servers moved to the Singapore region — pages now load 2–3× faster for visitors in Bangladesh." },
      { kind: "fixed", text: "The dashboard “Blog posts” count is now live (it counts published posts too)." },
    ],
  },
  {
    version: "1.3.1",
    date: "2026-06-14",
    title: "Attendance, beautified · edit your own profile",
    changes: [
      { kind: "improved", text: "Attendance gets an animated “% present” gauge and Present/Late/Absent/Leave count cards." },
      { kind: "improved", text: "The chosen status is now a clear, filled button — and a Reset button undoes a day’s marks." },
      { kind: "new", text: "Admins can edit their own profile (name, salary…) right from the Staff list." },
    ],
  },
  {
    version: "1.3.0",
    date: "2026-06-14",
    title: "One-tap attendance + date ranges",
    changes: [
      { kind: "new", text: "Mark the whole team Present / Absent / Late / Leave in ONE tap, tweak anyone individually, then Save the day in one go — no more per-row dropdowns." },
      { kind: "new", text: "Date control with Today / Yesterday / pick-a-day, plus Last 7 days, Last 30 days, This / Last month, This / Last year and a custom range." },
      { kind: "new", text: "Range view shows a per-employee summary (present / late / absent / leave / days marked)." },
    ],
  },
  {
    version: "1.2.10",
    date: "2026-06-14",
    title: "Every employee on attendance + fingerprint import",
    changes: [
      { kind: "new", text: "The attendance roster now lists EVERY employee — with or without a login — so anyone’s hajira can be marked." },
      { kind: "new", text: "ZKTeco fingerprint import (K40 / K50 / K60 / K90): upload the device’s CSV/TXT export and attendance is added by employee code." },
    ],
  },
  {
    version: "1.2.9",
    date: "2026-06-14",
    title: "Company roster",
    changes: [
      { kind: "new", text: "The whole office team (name, designation, district, ID, mobile) now appears in Staff — give anyone a login in one click." },
    ],
  },
  {
    version: "1.2.8",
    date: "2026-06-14",
    title: "Staff management & pay",
    changes: [
      { kind: "new", text: "Add, edit and remove staff from the dashboard — set role, employee code, status and salary (basic + allowance − deduction)." },
      { kind: "new", text: "Attendance: pick any past date to review or mark, not just today." },
    ],
  },
  {
    version: "1.2.7",
    date: "2026-06-14",
    title: "Multi-tagging, full-height sidebar & Secure Vault",
    changes: [
      { kind: "new", text: "Secure Vault — keep every company login (site, URL, email, password) in one private place, with one-tap copy and show/hide." },
      { kind: "new", text: "A post can now be filed under multiple categories AND multiple projects at once (tap the chips to toggle)." },
      { kind: "improved", text: "The dashboard sidebar now runs the full height of every page — no more empty cut-off below the menu." },
    ],
  },
  {
    version: "1.2.6",
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
    version: "1.2.5",
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
    version: "1.2.4",
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
    version: "1.2.3",
    date: "2026-06-14",
    title: "One-click dashboard, no redirect bounce",
    changes: [
      { kind: "improved", text: "The “Dashboard” button now opens the dashboard directly — no more /account → /dashboard hop." },
      { kind: "new", text: "Header shows your avatar + “Dashboard” once signed in (guests still see “Login”)." },
    ],
  },
  {
    version: "1.2.2",
    date: "2026-06-14",
    title: "Dashboard moved to /dashboard",
    changes: [
      { kind: "changed", text: "The admin panel now lives at /dashboard (was /admin); old links 301-redirect automatically." },
      { kind: "changed", text: "Every “MD & CEO” label now reads “Founder & CEO”." },
      { kind: "improved", text: "Story page: the founder is named once, with a more evocative closing line." },
    ],
  },
  {
    version: "1.2.1",
    date: "2026-06-14",
    title: "Marketing roster & leaderboard",
    changes: [
      { kind: "new", text: "Imported the full marketing-officer + director roster (name, mobile, ID, district)." },
      { kind: "new", text: "Award-points officer picker is now searchable by name, mobile or ID number." },
      { kind: "improved", text: "Leaderboard scrolls inside its own box with a pinned header." },
    ],
  },
  {
    version: "1.2.0",
    date: "2026-06-14",
    title: "Blog reading experience",
    changes: [
      { kind: "new", text: "Article sidebar: a premium author card, Popular posts and Recent posts." },
      { kind: "new", text: "Per-post view counting (counts real visits, once per session)." },
      { kind: "improved", text: "Sharp, high-res founder photo across the blog." },
    ],
  },
  {
    version: "1.1.10",
    date: "2026-06-14",
    title: "Rich media in articles",
    changes: [
      { kind: "new", text: "Pasted YouTube / Facebook video links render as inline players (Facebook keeps its true aspect)." },
      { kind: "improved", text: "Sharing a post on WhatsApp / Facebook now shows the post’s own cover image." },
    ],
  },
  {
    version: "1.1.9",
    date: "2026-06-14",
    title: "Admin posts go public",
    changes: [
      { kind: "new", text: "Posts published from the dashboard now appear on the public blog (Bangla + English)." },
      { kind: "fixed", text: "Bangla post URLs no longer 500 in production (slugs are romanised to ASCII)." },
      { kind: "fixed", text: "Removed a hydration warning from the footer’s “report an issue” link." },
    ],
  },
  {
    version: "1.1.8",
    date: "2026-06-14",
    title: "Blog publishing fixes",
    changes: [
      { kind: "fixed", text: "Publishing a post with a Bangla title no longer fails with “Something went wrong”." },
      { kind: "new", text: "Project + category taxonomy for posts (admin can add / delete both)." },
      { kind: "improved", text: "The article editor’s toolbar stays pinned while you write long posts." },
    ],
  },
  {
    version: "1.1.7",
    date: "2026-06-13",
    title: "No more browser pop-ups",
    changes: [
      { kind: "improved", text: "Every confirm / alert / prompt is replaced with on-brand dialogs and toasts." },
    ],
  },
  {
    version: "1.1.6",
    date: "2026-06-13",
    title: "Analytics & follow-ups",
    changes: [
      { kind: "new", text: "Google Analytics tracking + a dashboard Analytics section." },
      { kind: "new", text: "Client follow-up data grid: search, status, custom date range, unique-lead counts." },
      { kind: "new", text: "Award points now capture the sale date and client name / ID." },
    ],
  },
  {
    version: "1.1.5",
    date: "2026-06-13",
    title: "Income & leaderboard depth",
    changes: [
      { kind: "new", text: "Income tracking that feeds the public leaderboard." },
      { kind: "improved", text: "Leaderboard: decimal points, AFR, filters, sort, CSV/PDF export, officer editing." },
      { kind: "fixed", text: "De-duplicated the point-item catalogue (idempotent migration)." },
    ],
  },
  {
    version: "1.1.4",
    date: "2026-06-13",
    title: "Marketing officers & live leaderboard",
    changes: [
      { kind: "new", text: "Marketing officers + points feed a live public leaderboard." },
      { kind: "changed", text: "Marketing split into Overview (leaderboard) and Client follow-up (leads)." },
    ],
  },
  {
    version: "1.1.3",
    date: "2026-06-13",
    title: "Faster, snappier dashboard",
    changes: [
      { kind: "improved", text: "Top progress bar + skeletons give instant navigation feedback." },
      { kind: "improved", text: "Auth-gated pages cache the session lookup and scope the middleware tightly." },
    ],
  },
  {
    version: "1.1.2",
    date: "2026-06-13",
    title: "Blog CMS",
    changes: [
      { kind: "new", text: "Full article editor with SEO, scheduling, cover upload and manageable categories." },
    ],
  },
  {
    version: "1.1.1",
    date: "2026-06-13",
    title: "Admin dashboard — all sections",
    changes: [
      { kind: "new", text: "Projects, Blog, Staff, Attendance, Finance, Marketing, Insights and Settings." },
      { kind: "new", text: "Role system (member / staff / manager / admin) with a super-admin override." },
    ],
  },
  {
    version: "1.1.0",
    date: "2026-06-13",
    title: "Member accounts",
    changes: [
      { kind: "new", text: "Real sign-up / sign-in with mobile or username + password (no OTP / SMS cost)." },
    ],
  },
  {
    version: "1.0.10",
    date: "2026-06-13",
    title: "Fifth division refresh",
    changes: [
      { kind: "changed", text: "Renamed the fifth division to “Ahbab Interior and Architects” + added its logo." },
    ],
  },
  {
    version: "1.0.9",
    date: "2026-06-12",
    title: "Installable app (PWA)",
    changes: [
      { kind: "new", text: "Install Promise City as an app; it opens to the login page." },
      { kind: "improved", text: "Centred the install-prompt screenshot for a cleaner look." },
    ],
  },
  {
    version: "1.0.8",
    date: "2026-06-09",
    title: "Member accounts: the backend takes shape",
    changes: [
      { kind: "new", text: "The installed app now opens straight to the login page, and the member-account backend was drafted — profiles, roles, and mobile-number-as-username login design — ahead of the accounts launch." },
    ],
  },
  {
    version: "1.0.7",
    date: "2026-06-06",
    title: "English site: every corner covered",
    changes: [
      { kind: "improved", text: "The English mirror now covers project and division detail pages, the full blog, auth pages and a bilingual sitemap — with a sweep that removed every Bengali leak from /en." },
      { kind: "fixed", text: "Ahbab Palace 02 corrected per the owner's notes: G+8 with parking on the ground floor, floor-plan button, and the unit diagram put right." },
    ],
  },
  {
    version: "1.0.6",
    date: "2026-06-03",
    title: "Official forms",
    changes: [
      { kind: "new", text: "Six fillable forms (Promise City, Fuzala Tower / Complex, investment, marketing director) — fill in, generate a PDF, email it." },
    ],
  },
  {
    version: "1.0.5",
    date: "2026-05-31",
    title: "Flat-allocation form — the first official form goes digital",
    changes: [
      { kind: "new", text: "The flat-allocation form fills in online: photo and NID uploads, automatic signature placement, per-box digit fields, and a Bengali-safe PDF drawn pixel-perfect on the office template." },
    ],
  },
  {
    version: "1.0.4",
    date: "2026-05-28",
    title: "Bilingual website",
    changes: [
      { kind: "new", text: "Full English mirror at /en with a language switcher and SEO hreflang tags." },
    ],
  },
  {
    version: "1.0.3",
    date: "2026-05-26",
    title: "Project pages tell the whole story",
    changes: [
      { kind: "new", text: "Fuzala Tower share map (350 shares with sold-out badges), unit-availability diagrams for both Ahbab Palace buildings, per-square-foot pricing, and the founder's “পেছনের গল্প” story page." },
      { kind: "improved", text: "Site-wide rebrand to PromisePD with fixed WhatsApp/Facebook link previews." },
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
  {
    version: "0.9.0",
    date: "2026-05-18",
    title: "Countdown to launch",
    changes: [
      { kind: "new", text: "The site takes shape ahead of launch: the Promise Journal blog (12 articles + search), the partner income calculator with the 2026 marketing rules, login/signup, contact, team and leaderboard pages." },
      { kind: "improved", text: "Blue-first colour overhaul, the WebP image pipeline, and a service-worker rewrite that fixed the app freezing on its splash screen." },
    ],
  },
];

export const CURRENT_VERSION = CHANGELOG[0]?.version ?? "1.0.0";
