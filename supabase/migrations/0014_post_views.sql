-- Dynamic blog view counts.  A small per-slug counter that's bumped once
-- per reader session when an article opens, shown on the article, the
-- blog list and the sidebar's "popular" ranking.  Works for BOTH the
-- code-defined posts and the admin-published DB posts (keyed by slug).
--
-- The displayed number = the post's base count (hand-set in code / the
-- blog_posts.views column) + this tracked delta, so existing posts keep
-- their realistic starting numbers and grow from there.
--
-- Run via Supabase SQL Editor after 0013_blog_taxonomy.sql.

create table if not exists public.post_views (
  slug       text        primary key,
  views      integer     not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.post_views enable row level security;

drop policy if exists "anyone reads post_views" on public.post_views;
create policy "anyone reads post_views"
  on public.post_views for select to anon, authenticated using (true);

drop policy if exists "service role post_views" on public.post_views;
create policy "service role post_views"
  on public.post_views for all to service_role using (true) with check (true);

-- Atomic upsert-and-increment; returns the new tracked total.
create or replace function public.increment_post_view(p_slug text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  if p_slug is null or length(trim(p_slug)) = 0 then
    return 0;
  end if;
  insert into public.post_views (slug, views)
    values (p_slug, 1)
  on conflict (slug)
    do update set views = public.post_views.views + 1, updated_at = now()
  returning views into new_count;
  return new_count;
end;
$$;

grant execute on function public.increment_post_view(text) to anon, authenticated, service_role;
