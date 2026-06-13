-- Blog CMS upgrade — richer article fields + admin-manageable categories.
-- Powers the full editor (SEO meta, layout, author, access type, region,
-- custom CSS / JSON-LD schema, scheduling, views) and the article list
-- (status tabs, type, category, views, internal-link count).
--
-- Run via Supabase SQL Editor after 0006_admin_dashboard.sql.

alter table public.blog_posts
  add column if not exists meta_title       text,
  add column if not exists meta_description text,
  add column if not exists layout           text not null default 'sidebar',
  add column if not exists author_role      text,
  add column if not exists category         text,
  add column if not exists access_type      text not null default 'free',
  add column if not exists region           text default 'Worldwide',
  add column if not exists custom_css        text,
  add column if not exists custom_schema     text,
  add column if not exists status            text not null default 'draft',
  add column if not exists scheduled_at      timestamptz,
  add column if not exists views             integer not null default 0;

alter table public.blog_posts drop constraint if exists blog_posts_layout_check;
alter table public.blog_posts add constraint blog_posts_layout_check
  check (layout in ('full', 'sidebar'));
alter table public.blog_posts drop constraint if exists blog_posts_access_check;
alter table public.blog_posts add constraint blog_posts_access_check
  check (access_type in ('free', 'premium'));
alter table public.blog_posts drop constraint if exists blog_posts_status_check;
alter table public.blog_posts add constraint blog_posts_status_check
  check (status in ('draft', 'published', 'scheduled'));

-- Backfill status from the legacy published flag.
update public.blog_posts
  set status = case when published then 'published' else 'draft' end;

create index if not exists blog_posts_status_idx2 on public.blog_posts (status);
create index if not exists blog_posts_category_idx on public.blog_posts (category);

-- ── Categories (admin can create / delete) ────────────────────────
create table if not exists public.blog_categories (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null unique,
  slug       text        not null unique,
  created_at timestamptz not null default now()
);

insert into public.blog_categories (name, slug) values
  ('Buying Guide',      'buying-guide'),
  ('Investment',        'investment'),
  ('Project Updates',   'project-updates'),
  ('Legal & Documents', 'legal-documents'),
  ('Lifestyle',         'lifestyle'),
  ('Market News',       'market-news')
on conflict (name) do nothing;

alter table public.blog_categories enable row level security;
drop policy if exists "service role full access — blog_categories" on public.blog_categories;
create policy "service role full access — blog_categories"
  on public.blog_categories for all to service_role using (true) with check (true);
