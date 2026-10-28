-- 0036 · v2.6.7 — one-time fix for app transactions that were created when a
-- manager EDITED an old (July-migration) book payment that had no app copy
-- yet. The edit created the copy but never stamped who did it, so those rows
-- showed no "by <name>" in Transactionify. The audit log recorded the edit
-- (entity hub_payment, action update) at the same second, so the editor's
-- name is read back from there. Only rows with NO name are touched.
-- Run in the Supabase SQL editor; safe to run more than once.

-- 1) the book payment that was edited (match the audit entry within 10 s of
--    the app copy's creation)
update hub_customer_payments p
set created_by_name = a.actor_name
from investor_transactions t, audit_logs a
where p.mirror_tx = t.transaction_id
  and p.created_by_name is null
  and t.created_by_name is null
  and a.entity = 'hub_payment'
  and a.entity_id = p.id::text
  and a.action = 'update'
  and a.actor_name is not null
  and abs(extract(epoch from (a.created_at - t.created_at))) < 10;

-- 2) the app copy that edit created
update investor_transactions t
set created_by_name = a.actor_name
from hub_customer_payments p, audit_logs a
where p.mirror_tx = t.transaction_id
  and t.created_by_name is null
  and a.entity = 'hub_payment'
  and a.entity_id = p.id::text
  and a.action = 'update'
  and a.actor_name is not null
  and abs(extract(epoch from (a.created_at - t.created_at))) < 10;
