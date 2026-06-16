# Supabase backup (daily `.sql.gz`, like the old system)

`backup-supabase.ps1` dumps the live Supabase database (schema + data) to a
compressed `promisecity-YYYYMMDD-HHMMSS.sql.gz` and rotates the copies into
`daily / weekly / monthly` folders — the same scheme the old
`admin.promisepd.com` server used.

Backups are written to:

```
C:\Users\<you>\Downloads\backup\promisecity-supabase\
  ├─ daily\     (last 14)
  ├─ weekly\    (last 8)
  ├─ monthly\   (last 12)
  ├─ last\      promisecity-latest.sql.gz   ← always the newest
  └─ logs\
```

No PostgreSQL install is needed — the script uses the Supabase CLI via
`npx supabase db dump`, which carries its own matching `pg_dump`. (Needs
internet at run time.)

---

## One-time setup (2 minutes)

### 1. Get the database connection string

Supabase dashboard → your project → **Project Settings → Database →
Connection string** → choose the **Session pooler** tab (works on normal
home internet / IPv4). It looks like:

```
postgresql://postgres.abcdefgh:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
```

Replace `[YOUR-PASSWORD]` with your database password. (Forgot it? Reset it in
the same Database settings page — that does **not** affect the website, only
direct DB access.) If the password contains symbols like `@ : / ? # &`,
percent-encode them (`@`→`%40`, `#`→`%23`, …).

### 2. Put it in `.env.local`

Add one line to `D:\promisepd\.env.local` (this file is git-ignored, so the
password stays only on your PC — it is never committed or sent anywhere):

```
SUPABASE_DB_URL=postgresql://postgres.abcdefgh:YOUR_ENCODED_PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
```

---

## Test it once (make sure it works)

In PowerShell, from the project folder:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\backup-supabase.ps1
```

You should see `=== backup OK ===` and a fresh file under
`…\promisecity-supabase\daily\`. If `SUPABASE_DB_URL` is missing or wrong,
it tells you exactly what to fix and does **not** touch existing backups.

---

## Schedule it daily (set & forget)

```powershell
powershell -ExecutionPolicy Bypass -File scripts\register-backup-task.ps1
```

This registers a Windows scheduled task "PromiseCity Supabase Backup" that runs
every day at 02:00. If the PC is off at 2 AM, it runs the next time the PC is
on (`StartWhenAvailable`). Change the time by editing `$At` in that script.

Run on demand any time:

```powershell
Start-ScheduledTask -TaskName "PromiseCity Supabase Backup"
```

---

## How to restore (if you ever need to)

```powershell
# 1. unzip
$gz = "$env:USERPROFILE\Downloads\backup\promisecity-supabase\last\promisecity-latest.sql.gz"
$sql = "$env:TEMP\restore.sql"
$in=[System.IO.File]::OpenRead($gz); $out=[System.IO.File]::Create($sql)
$d=New-Object System.IO.Compression.GzipStream($in,[System.IO.Compression.CompressionMode]::Decompress)
$d.CopyTo($out); $d.Dispose(); $out.Dispose(); $in.Dispose()

# 2. load into a database (a fresh Supabase project, or local Postgres)
#    e.g. with the Supabase CLI:  npx supabase db reset --db-url "<target-url>"
#    then:  psql "<target-url>" -f $sql      (psql comes with PostgreSQL tools)
```

The dump is plain SQL (public schema DDL, then data) — readable, portable, and
restorable to any Postgres, not just Supabase.

---

## Good habits

- Keep a **second copy** of the `promisecity-supabase` folder somewhere off this
  PC — Google Drive, a pen drive, an external disk. It's tiny.
- The login accounts themselves (`auth` schema) are managed + backed up by
  Supabase on their side; this backup covers all your **business data** in the
  `public` schema (investors, investments, transactions, marketing, profiles…).
- Never commit `.env.local`. The connection string (with the password) lives
  only there.
