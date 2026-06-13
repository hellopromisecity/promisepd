-- Income (officer commission per sale) alongside AFR.
--
-- AFR = fund the officer raised for the company; income = the officer's
-- own earning/commission for that sale.  Each point item carries an
-- income-per-unit; awarding accrues it to the officer's income_total
-- (shown as the "আয় / Income" column on the leaderboard).  Seeded from
-- the partner programme's commission table (src/lib/partner.ts).
--
-- Run via Supabase SQL Editor after 0010_afr_decimal_points.sql.

alter table public.marketing_point_items add column if not exists income numeric(16,2) not null default 0;
alter table public.marketing_point_entries add column if not exists income numeric(16,2) not null default 0;
alter table public.marketing_officers add column if not exists income_total numeric(16,2) not null default 0;

-- Seed commission for the original items (only if not yet set).
update public.marketing_point_items set income = 20000 where label = 'ফুজালা টাওয়ার শেয়ার (প্রতি শেয়ার)' and income = 0;
update public.marketing_point_items set income = 15000 where label = 'ফুজালা কমপ্লেক্স শেয়ার (প্রতি শেয়ার)' and income = 0;
update public.marketing_point_items set income = 10000 where label = 'জমি (প্রতি শতাংশ)' and income = 0;
update public.marketing_point_items set income = 50000 where label = 'আহবাব রিয়েল এস্টেট ফ্ল্যাট (প্রতি ফ্ল্যাট)' and income = 0;
update public.marketing_point_items set income = 20000 where label = 'অ্যাক্টিভ মার্কেটিং অফিসার নিয়োগ (প্রতি অফিসার)' and income = 0;
