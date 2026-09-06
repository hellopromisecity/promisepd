-- Finance module (sidebar → Finance: Overview / Bank & Cash / Income / Expense).
--
-- Heads (খাত) become a real table so the owner can add custom ones from the
-- form; transactions point at a head, keep the head name in `category` for
-- display/back-compat, and carry an optional `head_detail` (what exactly,
-- required when the head is "Others") plus a `reference` (cheque no / TXN).
--
-- Run via Supabase SQL Editor after 0032.

create table if not exists public.finance_heads (
  id          uuid        primary key default gen_random_uuid(),
  kind        text        not null check (kind in ('income','expense')),
  name        text        not null,
  name_bn     text,
  sort        int         not null default 100,
  is_default  boolean     not null default false,
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now(),
  unique (kind, name)
);
alter table public.finance_heads enable row level security; -- service role only

alter table public.transactions add column if not exists head_id     uuid references public.finance_heads (id) on delete set null;
alter table public.transactions add column if not exists head_detail text;
alter table public.transactions add column if not exists reference   text;
create index if not exists transactions_head_idx on public.transactions (head_id);

-- Default heads (the owner's ledger). Re-runnable.
insert into public.finance_heads (kind, name, name_bn, sort, is_default) values
  ('income',  'Capital',        'মূলধন',         1,  true),
  ('income',  'Cash sale',      'নগদ বিক্রয়',    2,  true),
  ('income',  'Booking money',  'বুকিং মানি',    3,  true),
  ('income',  'Installment',    'কিস্তি',         4,  true),
  ('income',  'Service charge', 'সার্ভিস চার্জ',  5,  true),
  ('income',  'Miscellaneous',  'বিবিধ',          6,  true),
  ('income',  'Others',         'অন্যান্য',       99, true),
  ('expense', 'Registration',                              null, 1,  true),
  ('expense', 'Office rent',                               null, 2,  true),
  ('expense', 'Salary',                                    null, 3,  true),
  ('expense', 'Furniture',                                 null, 4,  true),
  ('expense', 'Stationery',                                null, 5,  true),
  ('expense', 'Accommodation',                             null, 6,  true),
  ('expense', 'Transportation',                            null, 7,  true),
  ('expense', 'Electricity, net and garbage bills',        null, 8,  true),
  ('expense', 'Staff lunch',                               null, 9,  true),
  ('expense', 'Land purchase, documents and registration', null, 10, true),
  ('expense', 'Promotion',                                 null, 11, true),
  ('expense', 'Marketing Director honorarium',             null, 12, true),
  ('expense', 'Miscellaneous',                             null, 13, true),
  ('expense', 'Car gas, oil etc.',                         null, 14, true),
  ('expense', 'Sales commission',                          null, 15, true),
  ('expense', 'Others',                                    'অন্যান্য', 99, true)
on conflict (kind, name) do nothing;
