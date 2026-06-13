-- Member accounts — profile rows backing Supabase Auth.
--
-- Auth model: "mobile / username + password" with NO OTP / SMS (zero
-- SMS cost).  Supabase Auth's password flow needs an email, so each
-- member is created — via the service-role admin API with
-- email_confirm:true — under a deterministic SYNTHETIC email derived
-- from their mobile, e.g.  8801712345678@users.promisepd.app.  That
-- address is never emailed; it is only the internal auth key.  The
-- human-facing identifiers (name, mobile, optional username / real
-- email) live in this table.
--
-- A trigger copies the signup metadata into public.profiles whenever a
-- new auth.users row is inserted, so the Server Action only has to call
-- supabase.auth.admin.createUser({ ..., user_metadata }).
--
-- Run via Supabase SQL Editor or `supabase db push`.

create table if not exists public.profiles (
  id          uuid        primary key references auth.users (id) on delete cascade,
  name        text        not null,
  mobile      text        not null unique,        -- canonical 8801XXXXXXXXX (login id)
  username    text        unique,                 -- optional, stored lower-case
  email       text,                               -- optional real contact email
  created_at  timestamptz not null default now()
);

create index if not exists profiles_username_idx on public.profiles (username);
create index if not exists profiles_mobile_idx   on public.profiles (mobile);

comment on table public.profiles is
  'Member accounts. mobile = canonical 8801XXXXXXXXX (unique login id); username optional & unique. Backed by a synthetic-email auth.users row (no SMS/OTP).';

-- Auto-create the profile row from the signup metadata.  SECURITY
-- DEFINER so it can write through RLS; pinned search_path for safety.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, mobile, username, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.raw_user_meta_data ->> 'mobile', ''),
    nullif(lower(new.raw_user_meta_data ->> 'username'), ''),
    nullif(new.raw_user_meta_data ->> 'email', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS: a logged-in member can read / update ONLY their own row.  The
-- service-role key (server actions) bypasses RLS, which is what powers
-- the username/email -> mobile resolution at login time.
alter table public.profiles enable row level security;

drop policy if exists "members read own profile" on public.profiles;
create policy "members read own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "members update own profile" on public.profiles;
create policy "members update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "service role full access — profiles" on public.profiles;
create policy "service role full access — profiles"
  on public.profiles for all
  to service_role
  using (true) with check (true);
