-- 0035: the SMS log records the gateway's VERDICT, not just the attempt.
--
-- Until 2026-10-17 every send was logged as if it went out, even when the
-- gateway address was unreachable (it had moved; the app still called the
-- old IP) — so the SMS page showed normal usage while no customer got a
-- text. The app now reads the gateway's answer and stores it here:
--   status     'sent'   = gateway accepted (Status "0", a Message_ID came back)
--              'failed' = unreachable or rejected (reason in `error`)
--   message_id the gateway's id for an accepted text
--   message    the text itself (first 300 chars), so a manager can see what
--              the customer was told
-- Rows written before this migration default to 'sent' but were never
-- verified — treat anything before 2026-10-17 as "attempted".
--
-- Run in the Supabase SQL editor. The app works before and after (it retries
-- the log insert without these columns when they are missing).

alter table public.sms_log add column if not exists status     text not null default 'sent';
alter table public.sms_log add column if not exists error      text;
alter table public.sms_log add column if not exists message_id text;
alter table public.sms_log add column if not exists message    text;

create index if not exists sms_log_status_idx on public.sms_log (status, created_at desc);

comment on column public.sms_log.status     is 'sent = gateway accepted (Status 0); failed = unreachable or rejected (see error). Pre-0035 rows default to sent but were not verified.';
comment on column public.sms_log.error      is 'Why a send failed (network / gateway Status + description).';
comment on column public.sms_log.message_id is 'Khudebarta Message_ID of an accepted text.';
comment on column public.sms_log.message    is 'The text sent (first 300 chars).';
