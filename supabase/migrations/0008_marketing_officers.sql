-- Marketing officers + points — powers the admin Marketing Overview
-- (manage officers, award points per project) and the public Leaderboard
-- (ranked by points).
--
-- Officer types: MO (Marketing Officer), AMO (Active Marketing Officer),
-- MD (Marketing Director), HM (Head of Marketing).
--
-- Points: awarding a point picks an officer + a project + quantity; the
-- project's per-unit value × quantity is added to the officer's running
-- `points` total (and recorded as a point entry for history).
--
-- Run via Supabase SQL Editor after 0007_blog_cms.sql.

create table if not exists public.marketing_officers (
  id           uuid        primary key default gen_random_uuid(),
  name         text        not null,
  officer_type text        not null default 'MO'
               check (officer_type in ('MO', 'AMO', 'MD', 'HM')),
  position     text,
  officer_code text,                       -- e.g. D-2025003
  district     text,
  mobile       text,
  reference    text,
  points       integer     not null default 0,
  active       boolean     not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists marketing_officers_points_idx on public.marketing_officers (points desc);
create index if not exists marketing_officers_type_idx   on public.marketing_officers (officer_type);

drop trigger if exists marketing_officers_updated_at on public.marketing_officers;
create trigger marketing_officers_updated_at before update on public.marketing_officers
  for each row execute function public.set_updated_at();

create table if not exists public.marketing_point_entries (
  id           uuid        primary key default gen_random_uuid(),
  officer_id   uuid        not null references public.marketing_officers (id) on delete cascade,
  project_slug text,
  quantity     integer     not null default 1,
  points       integer     not null default 0,
  note         text,
  created_by   uuid        references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now()
);
create index if not exists marketing_point_entries_officer_idx on public.marketing_point_entries (officer_id);
create index if not exists marketing_point_entries_date_idx     on public.marketing_point_entries (created_at desc);

alter table public.marketing_officers      enable row level security;
alter table public.marketing_point_entries enable row level security;

do $$
declare t text;
begin
  foreach t in array array['marketing_officers', 'marketing_point_entries'] loop
    execute format('drop policy if exists "service role full access — %1$s" on public.%1$I', t);
    execute format(
      'create policy "service role full access — %1$s" on public.%1$I for all to service_role using (true) with check (true)', t);
  end loop;
end $$;
