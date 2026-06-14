-- ── Staff management fields on profiles ──────────────────────────
-- Turns the read-only member list into a real staff roster: an
-- employee code and a salary breakdown per person.  Net pay =
-- salary + allowance − deduction.
--
-- NO gender column — the office has no female staff, so the field
-- isn't collected.
--
-- All columns are nullable / defaulted so existing member rows (who
-- aren't staff) are unaffected.  Access stays service-role-only via the
-- server actions (profiles already has RLS from 0004).

alter table public.profiles
  add column if not exists employee_code text,
  add column if not exists salary    numeric(12,2) not null default 0,
  add column if not exists allowance numeric(12,2) not null default 0,
  add column if not exists deduction numeric(12,2) not null default 0,
  add column if not exists status    text not null default 'active';

-- Constrain status to the three valid states (idempotent).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_status_check'
  ) then
    alter table public.profiles
      add constraint profiles_status_check
      check (status in ('active', 'inactive', 'suspended'));
  end if;
end $$;

create index if not exists profiles_employee_code_idx
  on public.profiles (employee_code);
