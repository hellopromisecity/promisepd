-- ── Secure Vault ─────────────────────────────────────────────────
-- A private store for company logins (hosting, analytics, Supabase,
-- domain registrar, etc.).  Read / written ONLY through the service
-- role from server actions that first assert a manager+ session — there
-- is no anon/authenticated policy, so the browser can never read it
-- directly.  Mirrors the service-role-only pattern used by every other
-- admin table (see 0006).

create table if not exists public.vault_credentials (
  id          uuid        primary key default gen_random_uuid(),
  site_name   text        not null,
  site_url    text,
  login_url   text,
  username    text,                     -- email / username
  password    text,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists vault_credentials_name_idx
  on public.vault_credentials (site_name);

drop trigger if exists vault_credentials_updated_at on public.vault_credentials;
create trigger vault_credentials_updated_at before update on public.vault_credentials
  for each row execute function public.set_updated_at();

alter table public.vault_credentials enable row level security;

drop policy if exists "service role full access — vault_credentials" on public.vault_credentials;
create policy "service role full access — vault_credentials"
  on public.vault_credentials for all to service_role using (true) with check (true);
