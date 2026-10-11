-- SÜRÜM 10: bakım modu, tek satır ban kaydı (hesap + cihaz + IP birlikte)
-- Supabase SQL Editor'de bir kez çalıştırılır. Var olan verilere dokunmaz, sadece ekler.

-- 1) Ban grupları: bir banla oluşan hesap/cihaz/IP satırları aynı group_id'yi taşır
alter table public.bans add column if not exists group_id uuid;

-- eski kayıtlar: aynı anda oluşturulanlar tek grup sayılır
update public.bans b set group_id = g.gid
from (select created_at, (array_agg(id order by user_id nulls last, id))[1] gid from public.bans group by created_at) g
where b.group_id is null and b.created_at = g.created_at;

create index if not exists bans_group_idx on public.bans (group_id);

create or replace function public.admin_ban_user(p_user uuid, p_reason text, p_days integer default null,
  p_devices boolean default true, p_ips boolean default false)
returns integer language plpgsql security definer set search_path to 'public' as $$
declare n int := 0; g uuid := gen_random_uuid(); uname text;
  exp timestamptz := case when p_days is null or p_days <= 0 then null else now() + make_interval(days => p_days) end;
begin
  if not public.is_admin() then raise exception 'Sadece yöneticiler yasaklayabilir'; end if;
  if p_user = auth.uid() then raise exception 'Kendini yasaklayamazsın'; end if;
  if exists (select 1 from public.profiles where id = p_user and is_admin) then raise exception 'Önce yöneticiliğini kaldır'; end if;
  insert into public.bans (user_id, reason, expires_at, group_id) values (p_user, p_reason, exp, g); n := 1;
  if p_devices then
    insert into public.bans (device_id, reason, expires_at, group_id)
      select distinct device_id, p_reason, exp, g from public.user_devices where user_id = p_user;
  end if;
  if p_ips then
    insert into public.bans (ip, reason, expires_at, group_id)
      select distinct ip, p_reason, exp, g from public.user_devices where user_id = p_user and ip is not null;
  end if;
  select username into uname from public.profiles where id = p_user;
  perform public.log_event(auth.uid(), 'user_ban', '@' || coalesce(uname,'?') || ' · ' || coalesce(p_reason,'') ||
    case when exp is null then ' · süresiz' else ' · ' || p_days || ' gün' end ||
    case when p_devices then ' · cihazlarıyla' else '' end || case when p_ips then ' · IP ile' else '' end, p_user);
  return n;
end; $$;

-- Tek bir banı (hesap + cihaz + IP satırları) birlikte kaldır
create or replace function public.admin_lift_ban(p_ban uuid)
returns integer language plpgsql security definer set search_path to 'public' as $$
declare g uuid; uid uuid; n int; uname text;
begin
  if not public.is_admin() then raise exception 'Sadece yöneticiler'; end if;
  select coalesce(group_id, id) into g from public.bans where id = p_ban;
  if g is null then raise exception 'Kayıt bulunamadı'; end if;
  update public.bans set lifted_at = now(), lifted_by = auth.uid()
   where lifted_at is null and (group_id = g or id = p_ban);
  get diagnostics n = row_count;
  select user_id into uid from public.bans where (group_id = g or id = p_ban) and user_id is not null limit 1;
  if uid is not null then
    select username into uname from public.profiles where id = uid;
    perform public.log_event(auth.uid(), 'user_unban', '@' || coalesce(uname,'?'), uid);
  end if;
  return n;
end; $$;
revoke all on function public.admin_lift_ban(uuid) from public, anon;
grant execute on function public.admin_lift_ban(uuid) to authenticated;

-- 2) Bakım modu: açıkken yöneticiler dışında kimse siteyi kullanamaz
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid
);
alter table public.app_settings enable row level security;
drop policy if exists "ayarlar okunur" on public.app_settings;
create policy "ayarlar okunur" on public.app_settings for select to anon, authenticated using (true);
drop policy if exists "ayarlar yonet" on public.app_settings;
create policy "ayarlar yonet" on public.app_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());
grant select on public.app_settings to anon, authenticated;
insert into public.app_settings (key, value) values ('maintenance', '{"on": false, "message": null}')
on conflict (key) do nothing;

create or replace function public.admin_set_maintenance(p_on boolean, p_message text default null)
returns json language plpgsql security definer set search_path to 'public' as $$
declare v jsonb := jsonb_build_object('on', p_on, 'message', nullif(trim(p_message), ''));
begin
  if not public.is_admin() then raise exception 'Sadece yöneticiler'; end if;
  insert into public.app_settings (key, value, updated_at, updated_by) values ('maintenance', v, now(), auth.uid())
  on conflict (key) do update set value = excluded.value, updated_at = now(), updated_by = auth.uid();
  perform public.log_event(auth.uid(), 'maintenance', case when p_on then 'Bakım modu açıldı' else 'Bakım modu kapatıldı' end, null);
  return v;
end; $$;
revoke all on function public.admin_set_maintenance(boolean, text) from public, anon;
grant execute on function public.admin_set_maintenance(boolean, text) to authenticated;
