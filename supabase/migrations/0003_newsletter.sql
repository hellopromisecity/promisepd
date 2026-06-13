-- Newsletter subscriptions — email-only signups from the homepage
-- <Newsletter /> section.  UNIQUE(email) prevents duplicates; a
-- re-submit of an existing email is treated as success by the
-- subscribeNewsletter Server Action (no duplicate row, no error).
--
-- On a NEW signup the action also fires a branded welcome email via
-- Resend (src/lib/email.ts) — which only actually delivers once a
-- verified sending domain is configured; the row is saved either way.
--
-- Run via Supabase SQL Editor or `supabase db push`.

create table if not exists public.newsletter_subscriptions (
  id          uuid         primary key default gen_random_uuid(),
  email       text         not null unique,
  source      text         default 'website',
  created_at  timestamptz  not null default now()
);

create index if not exists newsletter_subscriptions_created_at_idx
  on public.newsletter_subscriptions (created_at desc);

comment on table public.newsletter_subscriptions is
  'Email-only newsletter sign-ups. UNIQUE(email) prevents duplicates.';

-- RLS: only the service-role key (server) can read/write.  Anon key
-- (browser) gets nothing.
alter table public.newsletter_subscriptions enable row level security;

drop policy if exists "service role full access — newsletter"
  on public.newsletter_subscriptions;

create policy "service role full access — newsletter"
  on public.newsletter_subscriptions
  for all
  to service_role
  using (true)
  with check (true);
