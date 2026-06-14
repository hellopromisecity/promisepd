-- Blog taxonomy alignment — make the admin CMS share the SAME projects
-- and categories the public /blog uses (src/lib/blog.ts), and let admins
-- manage both lists (add / delete) like categories.
--
--   • blog_posts.project        — which Fuzala / Ahbab unit a post promotes
--   • blog_categories (reseed)   — প্রকল্প / নোটিশ / নিয়মাবলী / Resources
--   • blog_projects (new table)  — the 5 project units, admin-manageable
--
-- Run via Supabase SQL Editor after 0012_sale_details.sql.

-- ── 1. Per-post project tag ───────────────────────────────────────
alter table public.blog_posts
  add column if not exists project text;
create index if not exists blog_posts_project_idx on public.blog_posts (project);

-- ── 2. Reseed categories to match the public site ─────────────────
-- Drop the placeholder English defaults (only ever seed data, no posts
-- reference them yet) and insert the real Bangla categories.
delete from public.blog_categories
  where slug in (
    'buying-guide', 'investment', 'project-updates',
    'legal-documents', 'lifestyle', 'market-news'
  );

insert into public.blog_categories (name, slug) values
  ('প্রকল্প',    'projects'),
  ('নোটিশ',     'notice'),
  ('নিয়মাবলী',  'rules'),
  ('Resources', 'resources')
on conflict (name) do nothing;

-- ── 3. Projects (admin can create / delete) ───────────────────────
-- Mirrors src/lib/blog.ts > BLOG_PROJECTS so the admin's project picker
-- matches the public "প্রকল্প" filter dropdown exactly.
create table if not exists public.blog_projects (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null unique,
  slug       text        not null unique,
  sort       integer     not null default 0,
  created_at timestamptz not null default now()
);

insert into public.blog_projects (name, slug, sort) values
  ('ফুজালা টাওয়ার',              'fuzala-tower',          1),
  ('ফুজালা কমপ্লেক্স',           'fuzala-complex',        2),
  ('আহবাব প্যালেস ০১',           'ahbab-palace-01',       3),
  ('আহবাব প্যালেস ০২ · ১২০০ sft', 'ahbab-palace-02-1200',  4),
  ('আহবাব প্যালেস ০২ · ১৮০০ sft', 'ahbab-palace-02-1800',  5)
on conflict (name) do nothing;

alter table public.blog_projects enable row level security;
drop policy if exists "service role full access — blog_projects" on public.blog_projects;
create policy "service role full access — blog_projects"
  on public.blog_projects for all to service_role using (true) with check (true);
