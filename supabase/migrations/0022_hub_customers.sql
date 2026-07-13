-- Project Hub — the complete paying-customer ledger, imported from the
-- master per-project Excel books (the Drive "Allprojects" set). This is the
-- authoritative "who paid how much, per project" record, far larger than the
-- app-only investor_accounts. Deliberately SEPARATE from the ported investor
-- platform (investor_accounts / investments / investor_transactions) so that
-- system stays 100% untouched.
--
-- One hub_customers row per (project, customer file). The SAME person can
-- appear under several projects — that's expected; each project counts its
-- own list independently.

create table if not exists public.hub_customers (
  id              uuid primary key default gen_random_uuid(),
  project_key     text        not null,          -- 'fuzala-tower', 'special-deposit', …
  project_name    text        not null,
  project_type    text        not null,          -- 'realestate' | 'deposit'
  sort_order      int         not null default 0,
  source_tab      text,                            -- the customer's sheet-tab name (unique within a book)
  file_no         text,
  name            text        not null default '',
  mobile          text,
  mobile2         text,
  district        text,
  nid             text,
  reference       text,                            -- marketing officer who brought them
  joining_date    date,
  expiry_date     date,
  total_price     numeric(16, 2) not null default 0,  -- commitment / potential value
  total_paid      numeric(16, 2) not null default 0,
  total_remaining numeric(16, 2) not null default 0,
  dividend        numeric(16, 2) not null default 0,
  withdrawn       numeric(16, 2) not null default 0,
  balance         numeric(16, 2) not null default 0,
  payments_count  int         not null default 0,
  bio             jsonb       not null default '{}'::jsonb,  -- father/mother/nominee/unit details/etc.
  created_at      timestamptz not null default now(),
  unique (project_key, source_tab)
);
create index if not exists hub_customers_project_idx on public.hub_customers (project_key);
create index if not exists hub_customers_name_idx    on public.hub_customers (name);
create index if not exists hub_customers_file_idx     on public.hub_customers (file_no);

create table if not exists public.hub_customer_payments (
  id           uuid primary key default gen_random_uuid(),
  customer_id  uuid        not null references public.hub_customers (id) on delete cascade,
  seq          int         not null default 0,
  date         date,
  description  text,
  amount       numeric(16, 2) not null default 0,
  receipt_no   text,
  kind         text        not null default 'deposit',  -- deposit | dividend | withdrawal
  created_at   timestamptz not null default now()
);
create index if not exists hub_payments_customer_idx on public.hub_customer_payments (customer_id);

-- Admin-only, like the rest of the dashboard (server reads via the service role).
alter table public.hub_customers          enable row level security;
alter table public.hub_customer_payments  enable row level security;
create policy "service role — hub_customers"         on public.hub_customers         for all to service_role using (true) with check (true);
create policy "service role — hub_customer_payments" on public.hub_customer_payments for all to service_role using (true) with check (true);
