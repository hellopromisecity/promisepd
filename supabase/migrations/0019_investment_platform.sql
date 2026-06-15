-- ── Investment platform (ported from the legacy admin.promisepd.com) ──
--
-- The old system (FastAPI + PostgreSQL) ran an investor platform: app
-- users invest in projects, and every deposit / profit / withdrawal is a
-- transaction.  This migration recreates that domain inside the same
-- Supabase project, alongside the existing marketing/staff tables.
--
-- Faithful mapping from the old schema:
--   users                 -> investor_accounts (+ auth.users for login)
--   new_projects          -> investment_projects
--   transaction_types     -> investment_types
--   new_investments       -> investments
--   new_transactions      -> investor_transactions
--   unsubscribe_requests  -> investor_unsubscribe_requests
--
-- Legacy string keys (uid "U…", project_id "P…", transaction_id "T…") are
-- kept verbatim so all 379 investment + 972 transaction relationships
-- import 1:1.  Each investor also gets an auth.users row (bcrypt password
-- carried over) and, via the on_auth_user_created trigger, a profiles row.
--
-- Security: service-role only (same as every other dashboard table).
-- Member self-read policies come in the investor-UI phase.
--
-- Run via Supabase SQL Editor after 0018.

-- ── Investment projects (was new_projects) ────────────────────────
create table if not exists public.investment_projects (
  project_id            text        primary key,           -- legacy "P…" id
  project_name          text        not null,
  status                text        not null,
  project_address       text,
  project_details       text,
  total_amount_required numeric(16,2),
  per_user_share_amount numeric(16,2),
  hide_total_amount     boolean     not null default false,
  hide_share_price      boolean     not null default false,
  current_funded_amount numeric(16,2) not null default 0,
  project_progress      numeric(6,2)  not null default 0,
  start_date            date,
  end_date              date,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index if not exists investment_projects_status_idx on public.investment_projects (status);
drop trigger if exists investment_projects_updated_at on public.investment_projects;
create trigger investment_projects_updated_at before update on public.investment_projects
  for each row execute function public.set_updated_at();

-- ── Transaction types (was transaction_types) ─────────────────────
-- name is the key the transactions reference; operator +/- and the
-- classification drive how a transaction moves a balance.
create table if not exists public.investment_types (
  name           text    primary key,
  operator       text    not null check (operator in ('+','-')),
  classification text    not null,
  is_editable    boolean not null default true,
  is_active      boolean not null default true,
  sort_order     integer not null default 0
);

-- ── Investor accounts (was users) ─────────────────────────────────
-- Keyed by the legacy uid; profile_id links to the Supabase auth user
-- (created during the login import).  balance is the same JSON shape
-- the old app stored: {total_investment,total_profit,total_withdrawn,
-- total_balance}.
create table if not exists public.investor_accounts (
  uid          text        primary key,                    -- legacy "U…" id
  profile_id   uuid        references public.profiles (id) on delete set null,
  fid          text,                                        -- friendly / display id
  full_name    text        not null default '',
  phone_number text        not null,
  email        text,
  language     text        not null default 'en',
  is_verified  boolean     not null default false,
  is_active    boolean     not null default true,
  balance      jsonb,
  last_login   timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists investor_accounts_profile_idx on public.investor_accounts (profile_id);
create index if not exists investor_accounts_phone_idx   on public.investor_accounts (phone_number);
drop trigger if exists investor_accounts_updated_at on public.investor_accounts;
create trigger investor_accounts_updated_at before update on public.investor_accounts
  for each row execute function public.set_updated_at();

-- ── Investments (was new_investments) ─────────────────────────────
create table if not exists public.investments (
  id                      uuid        primary key default gen_random_uuid(),
  uid                     text        not null references public.investor_accounts (uid) on delete cascade,
  project_id              text        not null references public.investment_projects (project_id) on delete cascade,
  total_paid              numeric(16,2) not null default 0,
  custom_share_price      numeric(16,2),
  discount                numeric(16,2) not null default 0,
  user_specific_start_date date,
  user_specific_end_date   date,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  unique (uid, project_id)
);
create index if not exists investments_uid_idx     on public.investments (uid);
create index if not exists investments_project_idx on public.investments (project_id);
drop trigger if exists investments_updated_at on public.investments;
create trigger investments_updated_at before update on public.investments
  for each row execute function public.set_updated_at();

-- ── Investor transactions (was new_transactions) ──────────────────
create table if not exists public.investor_transactions (
  transaction_id text        primary key,                  -- legacy "T…" id
  rashid_number  text,                                      -- receipt / রশিদ number
  uid            text        not null references public.investor_accounts (uid) on delete cascade,
  project_id     text        references public.investment_projects (project_id) on delete set null,
  date           timestamptz not null,
  amount         numeric(16,2) not null,
  type           text        not null references public.investment_types (name),
  description    text,
  created_at     timestamptz not null default now()
);
create index if not exists investor_transactions_uid_idx     on public.investor_transactions (uid);
create index if not exists investor_transactions_date_idx    on public.investor_transactions (date desc);
create index if not exists investor_transactions_project_idx on public.investor_transactions (project_id);
create index if not exists investor_transactions_type_idx    on public.investor_transactions (type);

-- ── Unsubscribe requests (was unsubscribe_requests) ───────────────
create table if not exists public.investor_unsubscribe_requests (
  id           uuid        primary key default gen_random_uuid(),
  uid          text        not null references public.investor_accounts (uid) on delete cascade,
  project_id   text        not null references public.investment_projects (project_id) on delete cascade,
  status       text        not null default 'pending',
  requested_at timestamptz not null default now(),
  reviewed_at  timestamptz,
  reviewed_by  text,
  admin_notes  text
);
create index if not exists investor_unsub_status_idx on public.investor_unsubscribe_requests (status);

-- ── RLS: service role only (member self-read added in the investor-UI phase) ──
alter table public.investment_projects            enable row level security;
alter table public.investment_types               enable row level security;
alter table public.investor_accounts              enable row level security;
alter table public.investments                    enable row level security;
alter table public.investor_transactions          enable row level security;
alter table public.investor_unsubscribe_requests  enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'investment_projects','investment_types','investor_accounts',
    'investments','investor_transactions','investor_unsubscribe_requests'
  ] loop
    execute format('drop policy if exists "service role full access — %1$s" on public.%1$I', t);
    execute format(
      'create policy "service role full access — %1$s" on public.%1$I for all to service_role using (true) with check (true)', t);
  end loop;
end $$;
