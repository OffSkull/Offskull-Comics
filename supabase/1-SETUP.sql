-- OFFSKULL COMICS: база, защита и хранилище
-- Выполните этот файл в Supabase → SQL Editor.

create table if not exists public.site_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.site_admins enable row level security;

drop policy if exists "Admin can view own admin record"
on public.site_admins;

create policy "Admin can view own admin record"
on public.site_admins
for select
to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.is_site_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.site_admins
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_site_admin() from public;
grant execute on function public.is_site_admin() to anon, authenticated;

create table if not exists public.site_content (
  id text primary key,
  content jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.site_content enable row level security;

grant select on public.site_content to anon, authenticated;
grant insert, update, delete on public.site_content to authenticated;

drop policy if exists "Everyone can read site content"
on public.site_content;

create policy "Everyone can read site content"
on public.site_content
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can insert site content"
on public.site_content;

create policy "Admins can insert site content"
on public.site_content
for insert
to authenticated
with check (public.is_site_admin());

drop policy if exists "Admins can update site content"
on public.site_content;

create policy "Admins can update site content"
on public.site_content
for update
to authenticated
using (public.is_site_admin())
with check (public.is_site_admin());

drop policy if exists "Admins can delete site content"
on public.site_content;

create policy "Admins can delete site content"
on public.site_content
for delete
to authenticated
using (public.is_site_admin());

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'offskull-media',
  'offskull-media',
  true,
  20971520,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Everyone can view OffSkull media"
on storage.objects;

create policy "Everyone can view OffSkull media"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'offskull-media');

drop policy if exists "Admins can upload OffSkull media"
on storage.objects;

create policy "Admins can upload OffSkull media"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'offskull-media'
  and public.is_site_admin()
);

drop policy if exists "Admins can update OffSkull media"
on storage.objects;

create policy "Admins can update OffSkull media"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'offskull-media'
  and public.is_site_admin()
)
with check (
  bucket_id = 'offskull-media'
  and public.is_site_admin()
);

drop policy if exists "Admins can delete OffSkull media"
on storage.objects;

create policy "Admins can delete OffSkull media"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'offskull-media'
  and public.is_site_admin()
);
