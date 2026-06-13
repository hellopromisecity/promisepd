# Promise Proper Development Ltd. — Website

A modern, fully-Bengali, light-themed PWA for the Promise Group — Dhaka's
trusted property and services partner. Five business divisions: Promise
City (real estate), Ahbab Real Estate (construction), Promise International
(savings), Ahbab Travels & Tours (Hajj/Umrah), Interior & 3D Design.

**Live company URL:** https://promisepd.com

## Stack

- **Next.js 16** (App Router, Turbopack) + React 19 + TypeScript
- **Tailwind CSS v4** (CSS-first config)
- **Framer Motion** — parallax blobs, animated counters, marquee
- **Convex** — contact form + newsletter backend
- **Noto Sans Bengali** — Bengali web font
- **PWA** — installable, offline-capable service worker

## Brand

Only 3 colors and their mixes are used across the entire site:

- **Red** `#E11D2E` (logo's vivid red)
- **Blue** `#1E40AF` (logo's royal blue)
- **Ash** `#94A3B8` (logo's silver/grey)

## Project structure

```
.
├── convex/                 # Convex schema + mutations
├── public/                 # logo.png, promo.mp4, sw.js
├── src/
│   ├── app/                # App Router (pages, actions, manifest)
│   ├── components/         # All UI sections
│   └── lib/                # site data + helpers
├── vercel.json             # Tells Vercel this is Next.js
├── next.config.ts
└── package.json
```

## Run locally

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run start    # serve production build
```

## Convex backend (optional)

The contact form gracefully falls back to a console log if Convex isn't
configured. To wire it up:

```bash
npx convex dev   # interactive — needs a Convex account
```

This generates `.env.local` with `NEXT_PUBLIC_CONVEX_URL`. After that,
submissions persist to the `contactSubmissions` and `newsletter` tables.

## Deploy

This repo is configured for **Vercel** — push to `main` and it auto-deploys.
The `vercel.json` at the root signals the Next.js framework; no extra
configuration is needed in the Vercel dashboard.
