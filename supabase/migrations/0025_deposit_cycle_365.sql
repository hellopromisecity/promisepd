-- Deposit dividend day-count basis: 360 → 365.
--
-- The per-lakh yearly rate (e.g. ৳15,000/lakh/year for General Deposit A) was
-- divided by a 360-day year to get the daily rate. But days are counted on the
-- real calendar, so a full year (365 days) paid 365/360 ≈ 1.4% too much — a
-- 2-year hold (730 days) paid ৳60,833 per ৳2,00,000 instead of the intended
-- ৳60,000. Using a 365-day year makes one real year pay EXACTLY the stated
-- per-lakh rate, so a clean 2-year hold = 2 × the annual rate.
--
-- Only the divisor changes; per_lakh, cycle dates and the running-balance
-- day-weighting are untouched.
update public.deposit_profit_config
   set cycle_days = 365, updated_at = now()
 where project_key in ('general-deposit-a', 'special-deposit')
   and cycle_days = 360;
