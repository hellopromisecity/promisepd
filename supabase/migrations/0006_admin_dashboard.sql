-- Admin dashboard backbone — attendance, finance, marketing follow-ups,
-- daily reports, audit log, DB-managed blog posts, project availability
-- overrides, org settings, profile avatars.
--
-- Security model: every table here is locked to the SERVICE ROLE only.
-- All reads/writes go through Server Actions which first check the
-- caller's profiles.role (src/lib/admin-guard.ts).  The anon (browser)
-- key gets nothing.
--
-- Run via Supabase SQL Editor after 0005_roles.sql.

-- Profile avatar (Settings page; uploaded via the WebP pipeline).
alter table public.profiles add column if not exists avatar_url text;

-- Shared updated_at trigger.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── Audit log ─────────────────────────────────────────────────────
-- Who did what, when: logins, creates, updates, deletes.
create table if not exists public.audit_logs (
  id          uuid        primary key default gen_random_uuid(),
  actor_id    uuid        references public.profiles (id) on delete set null,
  actor_name  text,
  action      text        not null,   -- login | logout | signup | create | update | delete
  entity      text        not null,   -- auth | project | blog_post | transaction | ...
  entity_id   text,
  detail      text,                   -- human-readable summary
  created_at  timestamptz not null default now()
);
create index if not exists audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index if not exists audit_logs_actor_idx      on public.audit_logs (actor_id);
create index if not exists audit_logs_entity_idx     on public.audit_logs (entity);

-- ── Attendance ────────────────────────────────────────────────────
create table if not exists public.attendance (
  id          uuid        primary key default gen_random_uuid(),
  member_id   uuid        not null references public.profiles (id) on delete cascade,
  date        date        not null,
  check_in    timestamptz,
  check_out   timestamptz,
  status      text        not null default 'present'
              check (status in ('present','late','absent','leave','holiday')),
  note        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (member_id, date)
);
create index if not exists attendance_date_idx on public.attendance (date desc);
drop trigger if exists attendance_updated_at on public.attendance;
create trigger attendance_updated_at before update on public.attendance
  for each row execute function public.set_updated_at();

-- ── Finance: accounts (bank & cash) ───────────────────────────────
create table if not exists public.finance_accounts (
  id              uuid        primary key default gen_random_uuid(),
  name            text        not null,
  type            text        not null default 'bank'
                  check (type in ('bank','cash','mobile')),
  account_number  text,
  opening_balance numeric(14,2) not null default 0,
  note            text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
drop trigger if exists finance_accounts_updated_at on public.finance_accounts;
create trigger finance_accounts_updated_at before update on public.finance_accounts
  for each row execute function public.set_updated_at();

-- ── Finance: transactions (income + expenses) ─────────────────────
create table if not exists public.transactions (
  id           uuid        primary key default gen_random_uuid(),
  type         text        not null check (type in ('income','expense')),
  amount       numeric(14,2) not null check (amount >= 0),
  category     text        not null,
  account_id   uuid        references public.finance_accounts (id) on delete set null,
  project_slug text,
  txn_date     date        not null default current_date,
  description  text,
  party        text,                  -- client / vendor name
  method       text,                  -- cash | cheque | bank transfer | bkash ...
  created_by   uuid        references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists transactions_date_idx    on public.transactions (txn_date desc);
create index if not exists transactions_type_idx    on public.transactions (type);
create index if not exists transactions_account_idx on public.transactions (account_id);
drop trigger if exists transactions_updated_at on public.transactions;
create trigger transactions_updated_at before update on public.transactions
  for each row execute function public.set_updated_at();

-- ── Marketing: client follow-ups ──────────────────────────────────
create table if not exists public.client_followups (
  id            uuid        primary key default gen_random_uuid(),
  client_name   text        not null,
  mobile        text,
  email         text,
  interest      text,                 -- project slug / free text
  source        text,                 -- website | referral | facebook | walk-in ...
  status        text        not null default 'new'
                check (status in ('new','contacted','interested','negotiation','closed_won','closed_lost')),
  assigned_to   uuid        references public.profiles (id) on delete set null,
  next_followup date,
  note          text,
  created_by    uuid        references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists client_followups_status_idx on public.client_followups (status);
create index if not exists client_followups_next_idx   on public.client_followups (next_followup);
drop trigger if exists client_followups_updated_at on public.client_followups;
create trigger client_followups_updated_at before update on public.client_followups
  for each row execute function public.set_updated_at();

-- ── Insights: daily work reports (message box) ────────────────────
create table if not exists public.daily_reports (
  id          uuid        primary key default gen_random_uuid(),
  member_id   uuid        not null references public.profiles (id) on delete cascade,
  report_date date        not null default current_date,
  body        text        not null,
  created_at  timestamptz not null default now()
);
create index if not exists daily_reports_date_idx   on public.daily_reports (report_date desc);
create index if not exists daily_reports_member_idx on public.daily_reports (member_id);

-- ── Blog posts (DB-managed; merged with the code-defined posts) ───
create table if not exists public.blog_posts (
  id           uuid        primary key default gen_random_uuid(),
  slug         text        not null unique,
  title        text        not null,
  excerpt      text,
  cover_url    text,
  body         text        not null,  -- plain text; blank line = new paragraph
  title_en     text,
  excerpt_en   text,
  body_en      text,
  tags         text[],
  published    boolean     not null default false,
  published_at timestamptz,
  author_name  text        default 'PromisePD',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists blog_posts_published_idx on public.blog_posts (published, published_at desc);
drop trigger if exists blog_posts_updated_at on public.blog_posts;
create trigger blog_posts_updated_at before update on public.blog_posts
  for each row execute function public.set_updated_at();

-- ── Project availability overrides ────────────────────────────────
-- The rich project content stays in code (src/lib/site.ts); the bits
-- that actually change (sold counts, unit statuses, parking, status
-- line) are editable from the admin and override the code values.
create table if not exists public.project_overrides (
  slug       text        primary key,
  status     text,
  buildings  jsonb,       -- { total, soldOut, nowBooking }
  unit_map   jsonb,       -- full unitMap shape incl. parking
  share_map  jsonb,       -- { total, sold, note }
  facts      jsonb,       -- optional key-value quick-fact overrides
  updated_at timestamptz  not null default now()
);
drop trigger if exists project_overrides_updated_at on public.project_overrides;
create trigger project_overrides_updated_at before update on public.project_overrides
  for each row execute function public.set_updated_at();

-- ── Org settings (key-value: site_name, logo_url, …) ──────────────
create table if not exists public.org_settings (
  key        text        primary key,
  value      jsonb       not null,
  updated_at timestamptz not null default now()
);

-- ── RLS: service role only, across the board ─────────────────────
alter table public.audit_logs        enable row level security;
alter table public.attendance        enable row level security;
alter table public.finance_accounts  enable row level security;
alter table public.transactions      enable row level security;
alter table public.client_followups  enable row level security;
alter table public.daily_reports     enable row level security;
alter table public.blog_posts        enable row level security;
alter table public.project_overrides enable row level security;
alter table public.org_settings      enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'audit_logs','attendance','finance_accounts','transactions',
    'client_followups','daily_reports','blog_posts',
    'project_overrides','org_settings'
  ] loop
    execute format('drop policy if exists "service role full access — %1$s" on public.%1$I', t);
    execute format(
      'create policy "service role full access — %1$s" on public.%1$I for all to service_role using (true) with check (true)', t);
  end loop;
end $$;
