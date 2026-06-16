-- 0020: allow EMAIL-only logins (for staff / admins).
--
-- Until now every account needed a unique mobile (the login id). Staff who log
-- into the dashboard should be able to use EMAIL + password instead — and a
-- person who is already an investor (mobile account) can get a SEPARATE admin
-- account keyed by their email, with no collision.
--
-- Members / investors still have a mobile. Email-only staff get a NULL mobile.
-- Postgres treats NULLs as distinct in a UNIQUE constraint, so many email-only
-- accounts coexist fine.

alter table public.profiles alter column mobile drop not null;

-- Store NULL (not '') when no mobile is supplied at signup, so two email-only
-- accounts never clash on unique(mobile) during the trigger's initial insert.
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
    nullif(coalesce(new.raw_user_meta_data ->> 'mobile', ''), ''),
    nullif(lower(new.raw_user_meta_data ->> 'username'), ''),
    nullif(new.raw_user_meta_data ->> 'email', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
