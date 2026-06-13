-- Member roles — gate for the /admin dashboard.
--
-- Every profile gets a role.  Public sign-ups are 'member' (no admin
-- access).  Staff/manager/admin can reach /admin; the dashboard then
-- shows each role only what it's allowed to see:
--
--   admin   → everything (finance, audit log, staff, settings)
--   manager → projects, blog, marketing, income/expense (no audit/2FA)
--   staff   → own attendance + daily report + own client follow-ups
--   member  → public site only (default; cannot open /admin)
--
-- Run via Supabase SQL Editor after 0004_profiles.sql.

alter table public.profiles
  add column if not exists role text not null default 'member';

alter table public.profiles
  drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('member', 'staff', 'manager', 'admin'));

create index if not exists profiles_role_idx on public.profiles (role);

comment on column public.profiles.role is
  'member | staff | manager | admin. Anything other than member may open /admin (authorised per-section in the app).';

-- ── Make yourself the first admin ─────────────────────────────────
-- After you sign up on the site, run this once with YOUR mobile
-- (canonical 8801XXXXXXXXX form) to unlock the dashboard:
--
--   update public.profiles set role = 'admin'
--   where mobile = '8801XXXXXXXXX';
