# Supabase setup — promisepd

This site uses Supabase (PostgreSQL) for its public forms:

| Form        | Table                       | Where it's used                    |
| ----------- | --------------------------- | ---------------------------------- |
| Contact     | `contact_submissions`       | `/#contact` + `/contact` page      |
| Newsletter  | `newsletter_subscriptions`  | homepage `<Newsletter />` section  |

Writes go through the **service-role key** server-side
(`src/lib/supabase/admin.ts`, called by `src/app/actions.ts`).
Row Level Security is enabled on both tables — the anon key can't
read or write anything. This keeps PII off the browser.

A successful contact submit also emails the team, and a new
newsletter signup gets a branded welcome email — both via Resend
(`src/lib/email.ts`, key in `RESEND_API_KEY`).

## 1. Create the project

1. Go to [supabase.com](https://supabase.com) → **New project**.
2. Choose a region close to Dhaka (Singapore is the usual pick).
3. Save the **anon** + **service-role** keys somewhere safe (Project
   Settings → API).

## 2. Apply the schema

The migration lives at `supabase/migrations/0001_contact.sql`.
Apply it whichever way is easier:

- **SQL Editor** — open the Supabase dashboard, click **SQL Editor**,
  paste the file's contents, hit **Run**. Done.
- **Supabase CLI** — if the project is linked:
  ```bash
  supabase db push
  ```

## 3. Wire the env vars

Copy `.env.example` → `.env.local` and fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi…
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi…
```

In production, set the same three vars in Vercel → Project Settings
→ Environment Variables, then redeploy.

> The site degrades gracefully if these aren't set yet — form
> submissions just `console.log` instead of writing to the DB.

## 4. Verify

Run `npm run dev`, fill in the contact form, then check the
`contact_submissions` table in the Supabase Table Editor. A new row
should appear within a couple of seconds.

## 5. Importing from `admin.promisepd.com`

When the existing admin DB is ready to migrate over:

1. Take a `pg_dump` of the relevant tables from the old DB.
2. Restore into the Supabase project's `public` schema (or a separate
   schema if you want to keep namespaces clean — just update queries
   accordingly).
3. The `contact_submissions` table in `0001_contact.sql` uses plain
   `snake_case` and a `uuid` primary key, matching standard Postgres
   conventions — joins / FKs to existing tables shouldn't need any
   re-shaping.
4. Regenerate `src/lib/supabase/types.ts` to cover the full schema:
   ```bash
   npx supabase gen types typescript --project-id <ref> > src/lib/supabase/types.ts
   ```
