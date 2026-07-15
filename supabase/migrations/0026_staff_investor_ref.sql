-- Link a staff/manager profile to their OWN investor account, so employees
-- who are also customers (bought a plot / share) can see their transactions
-- under the dashboard "My Projects" section.
--
-- Value is their investor File ID (fid) or UID; if left blank, "My Projects"
-- still resolves by matching their mobile to investor_accounts.phone_number.
alter table public.profiles add column if not exists investor_ref text;

comment on column public.profiles.investor_ref is
  'Optional link to this person''s investor account (fid or uid). Powers the dashboard "My Projects" section; falls back to mobile match when blank.';
