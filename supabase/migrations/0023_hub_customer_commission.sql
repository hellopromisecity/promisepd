-- Link a hub customer to the marketing officer who referred them + the auto
-- point/commission entry that referral generated, so adds/edits/deletes keep
-- the marketing officer's points in sync.
alter table public.hub_customers
  add column if not exists reference_officer_id uuid,
  add column if not exists commission_entry_id   uuid;
