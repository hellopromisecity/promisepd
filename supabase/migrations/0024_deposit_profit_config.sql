-- Deposit-scheme profit (লভ্যাংশ) engine.
--
-- Shariah Mudaraba, day-weighted on the running balance. A member pays in and
-- withdraws freely through the cycle; profit = daily-rate × Σ(balance × days it
-- was actually held) — "koto taka koto din joma chilo".
--    Special Deposit   : ৳13,000 / lakh / YEAR  (= ৳36.111 / lakh / day, 360-day;
--                        = ৳130 / thousand / year for sub-lakh balances — same rate).
--    General Deposit A : ৳15,000 / lakh / YEAR  (= ৳41.667 / lakh / day, 360-day;
--                        note quotes ৳30,000 over 2 years = ৳15,000 / year).
-- Both pay out every 16 July.
-- One editable row per scheme — change `per_lakh` (or the dates) and every
-- member's profit recomputes automatically.

create table if not exists public.deposit_profit_config (
  project_key  text        primary key,          -- 'general-deposit-a', 'special-deposit', …
  enabled      boolean     not null default true,
  per_lakh     numeric(14, 2) not null default 0,  -- dividend per 1,00,000 over one full cycle
  cycle_days   int         not null default 720,    -- days in a full cycle (24 months × 30)
  cycle_start  date,                                 -- scheme start; money in before this earns from here
  payout_date  date,                                 -- "as of" date — current profit is accrued to here
  next_payout  date,                                 -- projection target (next cycle's end)
  note         text,
  updated_at   timestamptz not null default now()
);

alter table public.deposit_profit_config enable row level security;
create policy "service role — deposit_profit_config"
  on public.deposit_profit_config for all to service_role using (true) with check (true);

-- Seed the two schemes MD Sir specified. `do nothing` on conflict so re-running
-- never clobbers a rate an admin has since edited in the dashboard.
insert into public.deposit_profit_config (project_key, enabled, per_lakh, cycle_days, cycle_start, payout_date, next_payout)
values
  ('special-deposit',   true, 13000, 360, date '2025-07-16', date '2026-07-16', date '2027-07-16'),
  ('general-deposit-a', true, 15000, 360, date '2025-07-16', date '2026-07-16', date '2027-07-16')
on conflict (project_key) do nothing;
