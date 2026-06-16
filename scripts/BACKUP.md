# Supabase backup (daily, like the old system)

`backup-supabase.mjs` exports **every row of every table** from the live
Supabase database to one gzipped JSON snapshot and rotates copies into
`daily / weekly / monthly` folders — the same scheme the old
`admin.promisepd.com` server used.

It reads over PostgREST using the **service-role key** (which bypasses RLS, so
it sees every row) and pages past Supabase's 1000-row cap. No Docker, no
PostgreSQL install, no extra credentials — it uses the keys already in
`.env.local`. The table **schema** (DDL, RLS, functions, triggers) is version
-controlled in `supabase/migrations/`, so this data snapshot + the git repo is a
complete, restorable backup.

Backups land in:

```
C:\Users\<you>\Downloads\backup\promisecity-supabase\
  ├─ daily\     (last 14)
  ├─ weekly\    (last 8)
  ├─ monthly\   (last 12)
  ├─ last\      promisecity-latest.json.gz   ← always the newest
  └─ logs\
```

---

## Setup

Nothing to set up. The script uses `NEXT_PUBLIC_SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY`, which are already in `.env.local`. (A
`SUPABASE_DB_PASSWORD` line, if present, is not used and can be removed.)

## Test it once

From the project folder:

```powershell
node scripts\backup-supabase.mjs
```

You should see each table listed with its row count and `=== backup OK ===`,
plus a fresh file under `…\promisecity-supabase\daily\`.

## Schedule it daily

```powershell
powershell -ExecutionPolicy Bypass -File scripts\register-backup-task.ps1
```

Registers a Windows task "PromiseCity Supabase Backup" that runs every day at
02:00 (missed runs catch up when the PC next turns on). It calls
`backup-supabase.ps1`, a thin wrapper that runs the Node script above. Run on
demand any time:

```powershell
Start-ScheduledTask -TaskName "PromiseCity Supabase Backup"
```

---

## What's inside a snapshot

A gzipped JSON file:

```json
{
  "_meta": { "created": "2026-06-16T...", "tables": 25, "total_rows": 2477, "errors": [] },
  "tables": {
    "investor_accounts":     [ { ...row... }, ... ],
    "investor_transactions": [ { ...row... }, ... ],
    ...
  }
}
```

Inspect the latest one:

```powershell
node -e "const z=require('zlib'),f=require('fs');const p=process.env.USERPROFILE+'\\Downloads\\backup\\promisecity-supabase\\last\\promisecity-latest.json.gz';const j=JSON.parse(z.gunzipSync(f.readFileSync(p)));console.log(j._meta);"
```

---

## How to restore

Restore is a short process — not one click — because a snapshot holds the data,
while the table structure lives in `supabase/migrations/`.

1. **Recreate the schema** on a fresh Supabase project (or local Postgres): run
   the SQL files in `supabase/migrations/` in order (Supabase dashboard → SQL
   Editor).
2. **Load the data back** with `restore-supabase.mjs` (parents-first so foreign
   keys resolve). It is dry-run by default and refuses to write to the live
   project unless forced:

   ```powershell
   # see exactly what would be restored (safe, no writes):
   node scripts\restore-supabase.mjs

   # restore into the recovery project (its own URL + service key):
   node scripts\restore-supabase.mjs --target-url <url> --target-key <service_key> --confirm

   # restore just some tables:
   node scripts\restore-supabase.mjs --only investor_accounts,investments --target-url ... --target-key ... --confirm
   ```

   Use `--file <path>` to restore an older snapshot instead of the latest.

The login accounts themselves (`auth` schema) are managed and backed up by
Supabase on their side; this snapshot covers all **business data** in the
`public` schema (investors, investments, transactions, marketing, profiles,
vault, …).

---

## Good habits

- Keep a **second copy** of the `promisecity-supabase` folder off this PC —
  Google Drive, a pen drive, an external disk. Each snapshot is ~130 KB.
- The snapshot includes `vault_credentials` and other sensitive rows, so keep
  the backup folder private (don't share or upload it publicly).
