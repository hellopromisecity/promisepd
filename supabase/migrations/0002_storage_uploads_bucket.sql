-- Public "uploads" bucket — destination for the image-upload
-- pipeline (src/app/actions/upload-image.ts).
--
-- Every file landing here has already been resized + re-encoded to
-- WebP by `src/lib/image.ts` (see AGENTS.md for the rule).  Writes
-- are gated behind the service-role key on the server; the anon key
-- can only read.
--
-- Run via Supabase SQL Editor or `supabase db push`.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'uploads',
  'uploads',
  true,
  10485760, -- 10 MB ceiling on the *output* WebP (input may be larger
            -- pre-optimisation; the pipeline caps at 25 MB inbound).
  array['image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Public read access — anyone with the URL can fetch.
drop policy if exists "Public read uploads" on storage.objects;
create policy "Public read uploads"
  on storage.objects for select
  to public
  using (bucket_id = 'uploads');

-- Writes are restricted to the service role (the Server Action key).
drop policy if exists "Service role write uploads" on storage.objects;
create policy "Service role write uploads"
  on storage.objects for all
  to service_role
  using (bucket_id = 'uploads')
  with check (bucket_id = 'uploads');
