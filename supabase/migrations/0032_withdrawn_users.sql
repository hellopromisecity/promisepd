-- Withdrawn users: an admin can mark an app account as "withdrawn" (the
-- customer took their money out / left). Purely a manual flag — nothing is
-- computed from balances. All Customers paints the row red and offers a
-- "Withdrawn (N)" filter that counts ONLY these manual marks.
--
-- Run via Supabase SQL Editor after 0031.

alter table public.investor_accounts
  add column if not exists withdrawn_at timestamptz;

create index if not exists investor_accounts_withdrawn_idx
  on public.investor_accounts (withdrawn_at)
  where withdrawn_at is not null;
