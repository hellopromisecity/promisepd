-- Allow fractional quantities on marketing point entries.
--
-- Some sales are fractional: e.g. a plot of জমি sold "প্রতি শতাংশ" where
-- 12 buyers share 6 শতাংশ → each officer's award is for 0.5 শতাংশ. The
-- quantity field was `integer`, so anything below 1 got rounded. Widen it to
-- numeric so 0.5 / 0.25 / … can be recorded.
--
-- Safe, backward-compatible type widening: existing whole-number quantities
-- are preserved exactly; no data loss.

alter table public.marketing_point_entries
  alter column quantity type numeric(12, 2) using quantity::numeric;
