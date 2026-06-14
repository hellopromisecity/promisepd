-- ── Performance indexes for hot dashboard queries ───────────────
-- Income/Expenses filter transactions by `type` and sort by txn_date
-- then created_at; the single-column indexes from 0006 force an extra
-- in-memory sort.  A composite lets one index scan return rows already
-- filtered AND ordered.
create index if not exists transactions_type_date_idx
  on public.transactions (type, txn_date desc, created_at desc);

-- The marketing follow-up page (staff view) filters client_followups by
-- created_by OR assigned_to — neither was indexed (0006 only indexed
-- status + next_followup), forcing a sequential scan.
create index if not exists client_followups_created_by_idx
  on public.client_followups (created_by);
create index if not exists client_followups_assigned_to_idx
  on public.client_followups (assigned_to);
