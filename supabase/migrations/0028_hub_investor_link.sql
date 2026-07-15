-- Link a project-book customer (hub_customers) to their app / investor account
-- (investor_accounts.uid), so a book payment can also be mirrored into their
-- investor account — which is what the PWA reads. Set automatically when the
-- mobile matches, or manually via "Link to app account" when the numbers differ.
alter table public.hub_customers add column if not exists investor_uid text;

comment on column public.hub_customers.investor_uid is
  'Optional link to this customer''s app account (investor_accounts.uid). Book payments mirror into that account so the PWA updates. Auto by mobile, or set manually.';
