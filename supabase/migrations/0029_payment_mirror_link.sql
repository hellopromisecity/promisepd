-- Each book payment remembers WHICH app transaction mirrors it, so a later
-- edit/delete updates exactly the right one (no more heuristic matching by
-- amount+date, which a timezone slip could miss and duplicate).
alter table public.hub_customer_payments add column if not exists mirror_tx text;

comment on column public.hub_customer_payments.mirror_tx is
  'transaction_id of this payment''s mirrored investor_transactions row. Set on add; edits rewrite that exact row, deletes remove it. Null on old rows — the code falls back to matching and self-heals the link.';
