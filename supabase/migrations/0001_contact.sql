-- Initial schema for promisepd marketing site.
--
-- One table backs the public contact form:
--   * contact_submissions — every "Get in touch" form post.
--
-- snake_case is used throughout to match Postgres convention and the
-- existing admin.promisepd.com schema the previous developer built,
-- so future joins / data migrations stay friction-free.
--
-- Run via the Supabase CLI:
--     supabase db push
-- …or paste this whole file into the Supabase SQL Editor for a quick
-- one-shot apply against a fresh project.

-- ============================================================
-- contact_submissions
-- ============================================================
create table if not exists public.contact_submissions (
  id          uuid                primary key default gen_random_uuid(),
  name        text                not null,
  email       text                not null,
  phone       text,
  interest    text,
  message     text                not null,
  -- Free-text marker so we can tell where a lead came from once we
  -- start running ads or syndicating the form to other surfaces.
  source      text                default 'website',
  created_at  timestamptz         not null default now()
);

create index if not exists contact_submissions_created_at_idx
  on public.contact_submissions (created_at desc);

create index if not exists contact_submissions_email_idx
  on public.contact_submissions (email);

comment on table public.contact_submissions is
  'Public contact-form submissions from the marketing site.';

-- ============================================================
-- Row Level Security
-- ============================================================
-- The table is RLS-enabled.  Reads + writes go ONLY through the
-- service-role key (used by the Server Action in src/app/actions.ts).
-- The anon key cannot see or insert anything.  This keeps PII off
-- the browser even if someone reads the JS bundle.

alter table public.contact_submissions enable row level security;

-- Drop-and-recreate so re-running the migration is idempotent.
drop policy if exists "service role full access — contact"
  on public.contact_submissions;

create policy "service role full access — contact"
  on public.contact_submissions
  for all
  to service_role
  using (true)
  with check (true);
