-- OFFSKULL COMICS: база, авторизация и хранилище

create table if not exists public.site_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.site_admins enable row level security;

drop policy if exists "Admin sees own role" on public.site_admins;
create policy "Admin sees own role"
on public.site_admins for select to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.is_site_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.site_admins
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

drop policy if exists "Everyone reads site" on public.site_content;
create policy "Everyone reads site"
on public.site_content for select to anon, authenticated
using (true);

drop policy if exists "Admin inserts site" on public.site_content;
create policy "Admin inserts site"
on public.site_content for insert to authenticated
with check (public.is_site_admin());

drop policy if exists "Admin updates site" on public.site_content;
create policy "Admin updates site"
on public.site_content for update to authenticated
using (public.is_site_admin())
with check (public.is_site_admin());

drop policy if exists "Admin deletes site" on public.site_content;
create policy "Admin deletes site"
on public.site_content for delete to authenticated
using (public.is_site_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'offskull-media',
  'offskull-media',
  true,
  20971520,
  array['image/jpeg','image/png','image/webp','image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Everyone reads media" on storage.objects;
create policy "Everyone reads media"
on storage.objects for select to anon, authenticated
using (bucket_id = 'offskull-media');

drop policy if exists "Admin uploads media" on storage.objects;
create policy "Admin uploads media"
on storage.objects for insert to authenticated
with check (bucket_id = 'offskull-media' and public.is_site_admin());

drop policy if exists "Admin updates media" on storage.objects;
create policy "Admin updates media"
on storage.objects for update to authenticated
using (bucket_id = 'offskull-media' and public.is_site_admin())
with check (bucket_id = 'offskull-media' and public.is_site_admin());

drop policy if exists "Admin deletes media" on storage.objects;
create policy "Admin deletes media"
on storage.objects for delete to authenticated
using (bucket_id = 'offskull-media' and public.is_site_admin());

-- После создания пользователя в Authentication → Users
-- замените email ниже и выполните последнюю команду отдельно:
--
-- insert into public.site_admins (user_id)
-- select id from auth.users
-- where lower(email) = lower('ВАШ_ЛОГИН@example.com')
-- on conflict (user_id) do nothing;
