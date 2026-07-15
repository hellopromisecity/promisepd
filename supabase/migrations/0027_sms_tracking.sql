-- SMS usage tracking for the dashboard "SMS" section.
--
-- We can't read the KhudeBarta balance live (their portal is SSO-only), so we
-- track it ourselves: every SMS the app sends is logged here, and the dashboard
-- subtracts the cost of sends since the last balance checkpoint.

-- One row per SMS the app sends (for counts + cost).
create table if not exists public.sms_log (
  id uuid primary key default gen_random_uuid(),
  recipient text,
  kind text not null default 'transaction',   -- transaction | reset | bulk | profit
  segments int not null default 1,             -- SMS units (70 Unicode / 160 ASCII per unit)
  created_at timestamptz not null default now()
);
create index if not exists sms_log_created_idx on public.sms_log (created_at desc);

-- Balance checkpoint + per-SMS rate (single row, id = 1). "balance" is what you
-- last topped up to; the dashboard shows balance − (cost of sends since balance_at).
create table if not exists public.sms_config (
  id int primary key default 1 check (id = 1),
  balance numeric not null default 0,          -- BDT, as of balance_at
  balance_at timestamptz not null default now(),
  rate numeric not null default 0.35,          -- BDT per SMS unit — set to your KhudeBarta rate
  updated_at timestamptz not null default now()
);

insert into public.sms_config (id, balance, balance_at, rate)
  values (1, 2011.14, now(), 0.35)
  on conflict (id) do nothing;
