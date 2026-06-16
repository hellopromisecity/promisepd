# PromiseCity — Disaster Recovery Guide

**How to bring all your data back if the live database is ever lost, corrupted,
or you need a copy somewhere else.** Whole thing takes about 6–10 minutes.

Keep this file with your backups. If you're reading it during a real emergency:
stay calm — your data is safe in the `.json.gz` snapshots in this folder, and
the steps below put it back.

---

## The one idea to understand first

A backup file holds your **DATA** (every row). The database **STRUCTURE**
(tables, columns, rules) lives in your code at `D:\promisepd\supabase\migrations\`.

> **Restore = rebuild the structure from the code, then pour the data back in.**
> Two steps. That's it.

---

## What you need

1. A backup snapshot — newest is `D:\promisepdbackup\last\promisecity-latest.json.gz`
   (older dated copies are in `daily\`, `weekly\`, `monthly\`).
2. The code folder `D:\promisepd` (has the migrations + the restore script).
3. Node.js installed (already on this PC).
4. Your Supabase account login.

---

## Step 1 — Prepare the target database  (~3 min)

**If the old project is GONE — make a new one:**
1. Go to https://supabase.com/dashboard → **New project**.
2. Region: **Southeast Asia (Singapore)** (same as before — fast for Bangladesh).
3. Set a database password and **save it**.
4. Wait ~2 minutes for it to be ready.
5. Open **Project Settings → API** and copy three things:
   - **Project URL**  (e.g. `https://abcd.supabase.co`)
   - **service_role** key (secret)
   - **anon / publishable** key

**If the project still exists and you just need to reload data:** skip to Step 2
and use the existing URL + keys.

---

## Step 2 — Rebuild the tables  (~2 min)

1. In the project: **SQL Editor → New query**.
2. Open the files in `D:\promisepd\supabase\migrations\` **in number order**
   (0001…, 0002…, and so on).
3. Paste each file's contents and click **Run**, one after another, in order.
   This recreates every table, index, security rule, function and trigger.

(If a file errors with "already exists", it's fine — that part was already
created; move to the next file.)

---

## Step 3 — Load the data back  (~1 min)

Open **PowerShell** in `D:\promisepd`, then:

```powershell
# 1) See what WOULD be restored — safe, writes nothing:
node scripts\restore-supabase.mjs --file "D:\promisepdbackup\last\promisecity-latest.json.gz"

# 2) Actually restore into the NEW project (use ITS url + service key):
node scripts\restore-supabase.mjs --file "D:\promisepdbackup\last\promisecity-latest.json.gz" --target-url "https://NEW-PROJECT.supabase.co" --target-key "NEW_SERVICE_ROLE_KEY" --confirm
```

You'll see `restored N/N` for each table. It loads parent tables first so
nothing breaks. (To restore an older day, point `--file` at any snapshot in
`daily\`, `weekly\`, or `monthly\`.)

---

## Step 4 — Point the website at the new project  (~2 min)

1. Edit `D:\promisepd\.env.local` and set these to the NEW project's values:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (the anon/publishable key)
   - `SUPABASE_SERVICE_ROLE_KEY`
2. Set the **same three** in **Vercel → your project → Settings → Environment
   Variables**, then **Redeploy**. (Also re-add the `KHUDEBARTA_*` SMS keys if
   this is a fresh setup.)

---

## Step 5 — Verify  (~1 min)

```powershell
# Back up the NEW project and confirm the row counts match (~2477 rows / 25 tables):
node scripts\backup-supabase.mjs
```

Then open the site, log in as a test member, and check the dashboard shows the
investors and transactions. If the numbers match — **you're fully recovered.**

---

## Good to know

- The restore script is **dry-run by default** (writes nothing until you add
  `--confirm`), and it **refuses to touch the live project** unless you also add
  `--allow-prod`. So you can't damage anything by accident.
- **Login accounts**: members' passwords live in Supabase's own `auth` system,
  which Supabase backs up on their side. On a brand-new project, all profiles +
  business data come back from this backup; members can log in again after a
  password reset from the dashboard, or by re-registering with their mobile.
- **Automatic backups**: this PC saves a fresh snapshot to `D:\promisepdbackup`
  every day at 2:00 AM (kept: 14 daily, 8 weekly, 12 monthly). Each is ~130 KB.
- **Extra safety**: once a month, copy the `D:\promisepdbackup` folder to Google
  Drive or a pen drive, so even a dead PC can't lose your backups.

---

*Promise City — keep this guide next to your backups.*
