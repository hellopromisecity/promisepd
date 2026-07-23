-- 30-day archive (soft delete). "Deleting" a customer only stamps deleted_at:
-- they vanish from every list but stay restorable for 30 days — a financial
-- ledger never hard-deletes by accident.
alter table public.investor_accounts   add column if not exists deleted_at timestamptz;
alter table public.hub_customers       add column if not exists deleted_at timestamptz;

comment on column public.investor_accounts.deleted_at is
  'Soft delete: set = archived (hidden everywhere, login off, restorable 30 days). Null = live.';
comment on column public.hub_customers.deleted_at is
  'Soft delete, follows the linked account: archived book rows leave the project pages and All Customers until restored.';
