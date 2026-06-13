-- Admin-editable point catalogue for the marketing leaderboard.
--
-- Replaces the hard-coded per-project point values with a table the admin
-- can edit + extend.  Awarding points picks an item here (label + points
-- per sale) × quantity → added to the officer's total.  Seeded from the
-- partner programme's official point rules (see src/lib/partner.ts).
--
-- Idempotent + self-healing: safe to run more than once — it de-dups any
-- existing rows, enforces a UNIQUE(label) so the seed can never duplicate,
-- and only seeds rows that aren't already present.
--
-- Run via Supabase SQL Editor after 0008_marketing_officers.sql.

create table if not exists public.marketing_point_items (
  id         uuid        primary key default gen_random_uuid(),
  label      text        not null,
  points     integer     not null default 1,
  sort       integer     not null default 0,
  active     boolean     not null default true,
  created_at timestamptz not null default now()
);

-- Record the awarded item's label on each entry (self-contained history).
alter table public.marketing_point_entries add column if not exists item_label text;

-- Remove any pre-existing duplicate labels (keep the oldest of each).
delete from public.marketing_point_items a
  using public.marketing_point_items b
  where a.label = b.label and a.ctid > b.ctid;

-- Enforce uniqueness so the seed (and any future re-run) cannot duplicate.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'marketing_point_items_label_key'
  ) then
    alter table public.marketing_point_items
      add constraint marketing_point_items_label_key unique (label);
  end if;
end $$;

insert into public.marketing_point_items (label, points, sort) values
  ('ফুজালা টাওয়ার শেয়ার (প্রতি শেয়ার)',        1, 1),
  ('ফুজালা কমপ্লেক্স শেয়ার (প্রতি শেয়ার)',       1, 2),
  ('জমি (প্রতি শতাংশ)',                            1, 3),
  ('আহবাব রিয়েল এস্টেট ফ্ল্যাট (প্রতি ফ্ল্যাট)',  5, 4),
  ('অ্যাক্টিভ মার্কেটিং অফিসার নিয়োগ (প্রতি অফিসার)', 2, 5)
on conflict (label) do nothing;

alter table public.marketing_point_items enable row level security;
drop policy if exists "service role full access — marketing_point_items" on public.marketing_point_items;
create policy "service role full access — marketing_point_items"
  on public.marketing_point_items for all to service_role using (true) with check (true);
