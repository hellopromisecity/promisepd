-- Decimal points + AFR (Approximate Fund Raising) tracking.
--
-- - points become numeric so fractional values (e.g. 0.20 / FB activity)
--   are allowed everywhere.
-- - AFR: each point item carries an approximate fund value per unit
--   (e.g. an Ahbab Palace share ≈ ৳50,00,000 raised for the company).
--   Awarding points also accrues that fund value to the officer, so we
--   can see how much each officer has raised.
--
-- Run via Supabase SQL Editor after 0009_point_items.sql.

alter table public.marketing_point_items
  alter column points type numeric(12,2) using points::numeric;
alter table public.marketing_point_items
  add column if not exists afr numeric(16,2) not null default 0;

alter table public.marketing_point_entries
  alter column points type numeric(12,2) using points::numeric;
alter table public.marketing_point_entries
  add column if not exists afr numeric(16,2) not null default 0;

alter table public.marketing_officers
  alter column points type numeric(12,2) using points::numeric;
alter table public.marketing_officers
  add column if not exists afr_total numeric(16,2) not null default 0;
