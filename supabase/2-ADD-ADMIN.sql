-- СНАЧАЛА:
-- Supabase → Authentication → Users → Add user.
-- Создайте пользователя с вашим логином и паролем.
--
-- ЗАТЕМ замените текст YOUR_ADMIN_LOGIN@example.com
-- на логин, который вы указали при создании пользователя.

insert into public.site_admins (user_id)
select id
from auth.users
where lower(email) = lower('YOUR_ADMIN_LOGIN@example.com')
on conflict (user_id) do nothing;

-- Проверка:
select
  u.email as admin_login,
  a.created_at
from public.site_admins a
join auth.users u on u.id = a.user_id;
