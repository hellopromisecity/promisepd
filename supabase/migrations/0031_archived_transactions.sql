-- 0031: Archive center — deleted transactions get a 30-day recycle bin.
--
-- Deleting a payment/transaction (from any dashboard surface) now snapshots
-- the book payment + its mirrored app transaction here BEFORE the live rows
-- are removed. The Archive page (/dashboard/archive → Transactions) lists
-- these, restorable in one click for 30 days; expired rows are purged lazily
-- whenever the Archive page loads.
--
-- Run this in the Supabase SQL editor.

create table if not exists public.archived_transactions (
  id uuid primary key default gen_random_uuid(),
  deleted_at timestamptz not null default now(),
  -- display fields (denormalised so the archive list needs no joins)
  customer_name text,
  project_key text,
  project_name text,
  kind text,               -- deposit / withdrawal / dividend / app
  amount numeric,
  txn_date timestamptz,
  customer_id uuid,        -- hub_customers.id (may no longer exist)
  investor_uid text,       -- investor_accounts.uid (may be null)
  -- full row snapshots for restore
  payment jsonb,           -- hub_customer_payments row (null if app-only)
  mirror jsonb             -- investor_transactions row (null if never mirrored)
);

create index if not exists archived_transactions_deleted_at_idx
  on public.archived_transactions (deleted_at);

alter table public.archived_transactions enable row level security;
-- service-role only — no public policies on purpose.
