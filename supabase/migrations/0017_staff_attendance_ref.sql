-- ── Attendance by employee code (staff_ref) ──────────────────────
-- The attendance table keyed rows by member_id (an account).  But the
-- company roster (src/lib/staff-roster.ts) has employees with NO login
-- account — they still need their hajira marked, and the ZKTeco
-- fingerprint import matches by employee code.  So we add a stable
-- text key `staff_ref` (= the roster employee code, e.g. "MC-2025001",
-- or "uid:<id>" for an account that isn't on the roster) and key
-- attendance on it.  member_id stays as an optional link to the account.

alter table public.attendance
  add column if not exists staff_ref text;

-- An account may not exist for a roster-only employee.
alter table public.attendance
  alter column member_id drop not null;

-- Drop the legacy uniqueness on (member_id, date) — staff_ref is the
-- key now.  Leaving it in place would reject account-holder marks once
-- a row for that (member_id, date) already exists.  Drop ANY unique
-- constraint covering exactly (member_id, date), whatever its name.
do $$
declare c text;
begin
  for c in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace ns on ns.oid = rel.relnamespace
    where ns.nspname = 'public' and rel.relname = 'attendance' and con.contype = 'u'
      and con.conkey @> array[
        (select attnum from pg_attribute where attrelid = rel.oid and attname = 'member_id'),
        (select attnum from pg_attribute where attrelid = rel.oid and attname = 'date')
      ]::smallint[]
  loop
    execute format('alter table public.attendance drop constraint %I', c);
  end loop;
end $$;

-- Backfill existing rows with a stable ref.  Roster employees map to
-- their code (snapshot of staff-roster.ts at this migration) so old
-- self-check-ins line up with the new keying; everyone else → uid:<id>.
update public.attendance a
set staff_ref = case p.mobile
    when '8801910065136' then 'MC-2025001'
    when '8801910065137' then 'M-2025001'
    when '8801676737322' then 'E-2025001'
    when '8801908324298' then 'SO-2026001'
    when '8801718403704' then 'DR-2025001'
    when '8801934748994' then 'OA-2025001'
    else 'uid:' || a.member_id::text
  end
from public.profiles p
where a.member_id = p.id and a.staff_ref is null;

update public.attendance
  set staff_ref = 'uid:' || member_id::text
  where staff_ref is null and member_id is not null;

-- One attendance row per employee per day, keyed by the stable ref.
-- (Non-partial so it can serve as the ON CONFLICT arbiter for upserts;
-- NULL staff_refs are treated as distinct by Postgres, which is fine —
-- every row written from here on carries a staff_ref.)
create unique index if not exists attendance_staff_ref_date_key
  on public.attendance (staff_ref, date);
