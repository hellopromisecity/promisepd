-- 0034: Payment method + who-added on every transaction.
--
-- The MD wants two things visible on each entry: HOW the money moved
-- (Cash / Bank / Bkash / Nagad / Rocket) and WHO in the office recorded it —
-- the way the Audit log already shows actor + time. Both the app ledger
-- (investor_transactions) and the project book (hub_customer_payments) get
-- the two columns, so a mirrored pair carries the same values on both sides.
--
-- Backfill: the Audit log has logged every app-side "Added …" since the
-- platform launched (entity = investor_transaction, action = create), so the
-- recorder's name is copied from there for existing rows. Book-side payments
-- were never audit-logged before 2.5.10, so older ones stay blank.
--
-- The code works before AND after this migration (it retries without the new
-- columns when they are missing), so run it in the Supabase SQL editor at
-- any time; until then the Payment method picker saves nothing.

alter table public.investor_transactions  add column if not exists payment_method  text;
alter table public.investor_transactions  add column if not exists created_by_name text;
alter table public.hub_customer_payments  add column if not exists payment_method  text;
alter table public.hub_customer_payments  add column if not exists created_by_name text;

comment on column public.investor_transactions.payment_method  is 'How the money moved: Cash / Bank / Bkash / Nagad / Rocket (free text, normalised by the app).';
comment on column public.investor_transactions.created_by_name is 'Name of the staff member who recorded the entry (from the session at insert time; backfilled from audit_logs).';
comment on column public.hub_customer_payments.payment_method  is 'Same as investor_transactions.payment_method — mirrored pairs carry the same value.';
comment on column public.hub_customer_payments.created_by_name is 'Same as investor_transactions.created_by_name.';

-- who added each existing app transaction — first "create" audit event per id
update public.investor_transactions t
   set created_by_name = a.actor_name
  from (
    select distinct on (entity_id) entity_id, actor_name
      from public.audit_logs
     where entity = 'investor_transaction' and action = 'create' and actor_name is not null
     order by entity_id, created_at asc
  ) a
 where a.entity_id = t.transaction_id
   and t.created_by_name is null;

-- the book payment linked to that transaction inherits the same recorder
update public.hub_customer_payments p
   set created_by_name = t.created_by_name
  from public.investor_transactions t
 where p.mirror_tx = t.transaction_id
   and p.created_by_name is null
   and t.created_by_name is not null;
