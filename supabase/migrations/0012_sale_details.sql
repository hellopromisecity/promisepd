-- Sale details on each point entry: when the sale happened and which
-- client it was for.  sale_date drives the leaderboard's time-period
-- filter (so back-dated sales land in the right period); client_name +
-- client_id record who the buyer was.
--
-- Run via Supabase SQL Editor after 0011_income.sql.

alter table public.marketing_point_entries
  add column if not exists sale_date   date,
  add column if not exists client_name text,
  add column if not exists client_id   text;

-- Default existing rows' sale_date to their award date.
update public.marketing_point_entries
  set sale_date = created_at::date
  where sale_date is null;
