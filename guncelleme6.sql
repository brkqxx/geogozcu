-- =====================================================================
-- GÜNCELLEME 6  —  Cihaz/IP kaydı, hesap yasaklama, avatar, rozet (nametag), lider tablosu
-- (Claude tarafından Supabase'e uygulandı; kayıt için duruyor.)
-- =====================================================================

drop function if exists public.tmp_headers_probe();

-- 1) İSTEKTEN IP VE CİHAZ KİMLİĞİ (site her isteğe x-device-id başlığı ekler)
create or replace function public.req_header(name text) returns text language sql stable as $$
  select coalesce(current_setting('request.headers', true), '{}')::json ->> name
$$;
create or replace function public.req_ip() returns text language sql stable as $$
  select nullif(trim(split_part(coalesce(public.req_header('cf-connecting-ip'), public.req_header('x-forwarded-for'), ''), ',', 1)), '')
$$;
create or replace function public.req_device() returns text language sql stable as $$
  select nullif(left(regexp_replace(coalesce(public.req_header('x-device-id'), ''), '[^A-Za-z0-9-]', '', 'g'), 64), '')
$$;

-- 2) KULLANICI CİHAZLARI
create table if not exists public.user_devices (
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id text not null,
  ip text,
  label text check (char_length(label) <= 80),
  user_agent text check (char_length(user_agent) <= 300),
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  primary key (user_id, device_id)
);
alter table public.user_devices enable row level security;
drop policy if exists "cihaz oku" on public.user_devices;
create policy "cihaz oku" on public.user_devices for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());
grant select on public.user_devices to authenticated;

-- 3) YASAKLAR (hesap, cihaz veya IP)
create table if not exists public.bans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  ip text,
  device_id text,
  reason text check (char_length(reason) <= 300),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  check (user_id is not null or ip is not null or device_id is not null)
);
create index if not exists bans_user_idx on public.bans (user_id);
create index if not exists bans_ip_idx on public.bans (ip);
create index if not exists bans_device_idx on public.bans (device_id);
alter table public.bans enable row level security;
drop policy if exists "yasak yonet" on public.bans;
create policy "yasak yonet" on public.bans for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
grant select, insert, update, delete on public.bans to authenticated;

create or replace function public.my_ban() returns json
language sql stable security definer set search_path = public as $$
  select json_build_object('reason', b.reason, 'expires_at', b.expires_at,
    'by', case when b.user_id is not null then 'hesap' when b.device_id is not null then 'cihaz' else 'ip' end)
  from public.bans b
  where (b.expires_at is null or b.expires_at > now())
    and ((b.user_id is not null and b.user_id = auth.uid())
      or (b.device_id is not null and b.device_id = public.req_device())
      or (b.ip is not null and b.ip = public.req_ip()))
    and not public.is_admin()
  order by b.created_at desc limit 1
$$;
create or replace function public.is_banned() returns boolean
language sql stable security definer set search_path = public as $$ select public.my_ban() is not null $$;
grant execute on function public.my_ban() to anon, authenticated;
grant execute on function public.is_banned() to anon, authenticated;

-- Yasaklı kişi bildirim gönderemez, fotoğraf yükleyemez
drop policy if exists "bildirim ekle" on public.reports;
create policy "bildirim ekle" on public.reports
  for insert to authenticated
  with check (user_id = (select auth.uid()) and status in ('approved','pending') and not public.is_banned());

drop policy if exists "foto yukle" on storage.objects;
create policy "foto yukle" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'report-photos' and (storage.foldername(name))[1] = auth.uid()::text and not public.is_banned());

-- Oturum açılınca: son görülme + cihaz/IP kaydı; yasak varsa döndür
drop function if exists public.touch_last_seen();
create or replace function public.touch_last_seen(p_label text default null)
returns json language plpgsql security definer set search_path = public as $$
declare dev text := public.req_device();
begin
  if auth.uid() is null then return null; end if;
  update public.profiles set last_seen = now() where id = auth.uid();
  if dev is not null then
    insert into public.user_devices (user_id, device_id, ip, label, user_agent)
    values (auth.uid(), dev, public.req_ip(), left(p_label, 80), left(public.req_header('user-agent'), 300))
    on conflict (user_id, device_id) do update
      set ip = excluded.ip, label = coalesce(excluded.label, user_devices.label),
          user_agent = excluded.user_agent, last_seen = now();
  end if;
  return public.my_ban();
end; $$;
revoke execute on function public.touch_last_seen(text) from public, anon;
grant execute on function public.touch_last_seen(text) to authenticated;

-- Yönetici: kullanıcıyı (isteğe bağlı cihaz ve IP'leriyle) yasakla / yasağı kaldır
create or replace function public.admin_ban_user(p_user uuid, p_reason text, p_days int default null,
  p_devices boolean default true, p_ips boolean default false)
returns int language plpgsql security definer set search_path = public as $$
declare n int := 0; exp timestamptz := case when p_days is null or p_days <= 0 then null else now() + make_interval(days => p_days) end;
  uname text;
begin
  if not public.is_admin() then raise exception 'Sadece yöneticiler yasaklayabilir'; end if;
  if p_user = auth.uid() then raise exception 'Kendini yasaklayamazsın'; end if;
  if exists (select 1 from public.profiles where id = p_user and is_admin) then raise exception 'Önce yöneticiliğini kaldır'; end if;
  insert into public.bans (user_id, reason, expires_at) values (p_user, p_reason, exp); n := 1;
  if p_devices then
    insert into public.bans (device_id, reason, expires_at)
      select distinct device_id, p_reason, exp from public.user_devices where user_id = p_user;
    get diagnostics n = row_count; n := n + 1;
  end if;
  if p_ips then
    insert into public.bans (ip, reason, expires_at)
      select distinct ip, p_reason, exp from public.user_devices where user_id = p_user and ip is not null;
  end if;
  select username into uname from public.profiles where id = p_user;
  perform public.log_event(auth.uid(), 'user_ban', '@' || coalesce(uname,'?') || ' · ' || coalesce(p_reason,'') ||
    case when exp is null then ' · süresiz' else ' · ' || p_days || ' gün' end ||
    case when p_devices then ' · cihazlarıyla' else '' end || case when p_ips then ' · IP ile' else '' end, p_user);
  return n;
end; $$;
revoke execute on function public.admin_ban_user(uuid, text, int, boolean, boolean) from public, anon;
grant execute on function public.admin_ban_user(uuid, text, int, boolean, boolean) to authenticated;

create or replace function public.admin_unban_user(p_user uuid)
returns int language plpgsql security definer set search_path = public as $$
declare n int; uname text;
begin
  if not public.is_admin() then raise exception 'Sadece yöneticiler'; end if;
  delete from public.bans b where b.user_id = p_user
     or b.device_id in (select device_id from public.user_devices where user_id = p_user)
     or b.ip in (select ip from public.user_devices where user_id = p_user and ip is not null);
  get diagnostics n = row_count;
  select username into uname from public.profiles where id = p_user;
  perform public.log_event(auth.uid(), 'user_unban', '@' || coalesce(uname,'?'), p_user);
  return n;
end; $$;
revoke execute on function public.admin_unban_user(uuid) from public, anon;
grant execute on function public.admin_unban_user(uuid) to authenticated;

-- 4) AVATAR, ROZET (NAMETAG), KISA TANITIM
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists avatar_emoji text;
alter table public.profiles add column if not exists avatar_color text;
alter table public.profiles add column if not exists nametag text;
alter table public.profiles add column if not exists special_tags text[] not null default '{}';
alter table public.profiles add column if not exists bio text check (char_length(bio) <= 160);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
drop policy if exists "avatar oku" on storage.objects;
create policy "avatar oku" on storage.objects for select using (bucket_id = 'avatars');
drop policy if exists "avatar yukle" on storage.objects;
create policy "avatar yukle" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text and not public.is_banned());
drop policy if exists "avatar guncelle" on storage.objects;
create policy "avatar guncelle" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "avatar sil" on storage.objects;
create policy "avatar sil" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- 5) PUAN: yayındaki her bildirim 10, yüksek risk +5, orman yangını (ana odak) +3, acil +3, çözüldü +5
create or replace function public.report_points(r public.reports) returns int language sql immutable as $$
  select case when r.status <> 'approved' then 0 else
    10 + case when coalesce(r.risk_score,0) >= 67 then 5 else 0 end
       + case when r.category = 'fire' then 3 else 0 end
       + case when r.category = 'urgent' then 3 else 0 end
       + case when r.resolved_at is not null then 5 else 0 end end
$$;

-- Puan ve sayılara göre kazanılan rozetler
create or replace function public.user_tags(p_user uuid) returns json
language sql stable security definer set search_path = public as $$
  with s as (
    select coalesce(sum(public.report_points(r)), 0)::int pts,
           count(*) filter (where r.status = 'approved')::int n,
           count(*) filter (where r.status = 'approved' and r.category = 'fire')::int fire,
           count(*) filter (where r.status = 'approved' and r.category = 'urgent')::int urg,
           count(*) filter (where r.status = 'approved' and coalesce(r.risk_score,0) >= 67)::int hi
    from public.reports r where r.user_id = p_user
  ), tiers(tag, need) as (values
    ('Yeni Gözlemci',0),('Mahalle Gözcüsü',20),('Doğa Dostu',60),('Orman Bekçisi',100),
    ('Risk Avcısı',200),('Yangın Kalkanı',400),('Gaziemir Efsanesi',800))
  select json_build_object(
    'points', s.pts, 'reports', s.n, 'fire', s.fire, 'urgent', s.urg, 'high', s.hi,
    'unlocked', (select array_agg(tag order by need) from tiers where need <= s.pts)
      || case when s.fire >= 5 then array['Ateş Gözcüsü'] else '{}'::text[] end
      || case when s.urg >= 3 then array['Acil Durum Kahramanı'] else '{}'::text[] end
      || case when s.hi >= 5 then array['Keskin Göz'] else '{}'::text[] end
      || coalesce((select special_tags from public.profiles where id = p_user), '{}')
      || case when (select is_admin from public.profiles where id = p_user) then array['Yönetici'] else '{}'::text[] end,
    'next', (select json_build_object('tag', tag, 'need', need) from tiers where need > s.pts order by need limit 1))
  from s
$$;
revoke execute on function public.user_tags(uuid) from public, anon;
grant execute on function public.user_tags(uuid) to authenticated;

-- Kullanıcı kendi profilini günceller (rozet sadece kazanılanlardan seçilebilir)
create or replace function public.update_my_profile(p_emoji text, p_color text, p_nametag text, p_bio text, p_avatar_url text)
returns void language plpgsql security definer set search_path = public as $$
declare tags json;
begin
  if auth.uid() is null then raise exception 'Giriş yapmalısın'; end if;
  if public.is_banned() then raise exception 'Hesabın kısıtlı'; end if;
  if p_color is not null and p_color !~ '^#[0-9A-Fa-f]{6}$' then raise exception 'Geçersiz renk'; end if;
  if p_emoji is not null and char_length(p_emoji) > 8 then raise exception 'Geçersiz emoji'; end if;
  if p_avatar_url is not null and position('/avatars/' || auth.uid()::text || '/' in p_avatar_url) = 0 then
    raise exception 'Geçersiz avatar adresi'; end if;
  tags := public.user_tags(auth.uid());
  if p_nametag is not null and not (p_nametag = any (array(select json_array_elements_text(tags -> 'unlocked')))) then
    raise exception 'Bu rozeti henüz kazanmadın'; end if;
  update public.profiles set avatar_emoji = p_emoji, avatar_color = p_color, nametag = p_nametag,
    bio = nullif(left(trim(p_bio), 160), ''), avatar_url = p_avatar_url
  where id = auth.uid();
end; $$;
revoke execute on function public.update_my_profile(text, text, text, text, text) from public, anon;
grant execute on function public.update_my_profile(text, text, text, text, text) to authenticated;

-- Yönetici özel rozet verir (ör. "Proje Ekibi")
create or replace function public.admin_set_special_tags(p_user uuid, p_tags text[])
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Sadece yöneticiler'; end if;
  update public.profiles set special_tags = coalesce(p_tags, '{}') where id = p_user;
  perform public.log_event(auth.uid(), 'settings_update', 'Özel rozet: @' || (select username from public.profiles where id = p_user) ||
    ' → ' || coalesce(array_to_string(p_tags, ', '), '—'), p_user);
end; $$;
revoke execute on function public.admin_set_special_tags(uuid, text[]) from public, anon;
grant execute on function public.admin_set_special_tags(uuid, text[]) to authenticated;

-- 6) LİDER TABLOSU (herkese açık: e-posta yok, sadece kullanıcı adı, avatar, rozet, puan)
create or replace function public.leaderboard(p_period text default 'all', p_cat text default 'all', p_limit int default 50)
returns table (rank int, is_me boolean, username text, avatar_url text, avatar_emoji text, avatar_color text,
  nametag text, bio text, points int, reports int, fire int, urgent int, high int, last_report timestamptz)
language sql stable security definer set search_path = public as $$
  with r as (
    select * from public.reports
    where status = 'approved'
      and (p_cat = 'all' or category = p_cat)
      and created_at >= case p_period when 'week' then now() - interval '7 days'
                                      when 'month' then now() - interval '30 days' else '-infinity'::timestamptz end
  ), agg as (
    select r.user_id, sum(public.report_points(r))::int pts, count(*)::int n,
      count(*) filter (where category = 'fire')::int fire, count(*) filter (where category = 'urgent')::int urg,
      count(*) filter (where coalesce(risk_score,0) >= 67)::int hi, max(created_at) last_r
    from r group by r.user_id
  )
  select (row_number() over (order by a.pts desc, a.n desc, a.last_r asc))::int, a.user_id = auth.uid(),
    p.username, p.avatar_url, p.avatar_emoji, p.avatar_color, p.nametag, p.bio,
    a.pts, a.n, a.fire, a.urg, a.hi, a.last_r
  from agg a join public.profiles p on p.id = a.user_id
  where not exists (select 1 from public.bans b where b.user_id = a.user_id and (b.expires_at is null or b.expires_at > now()))
  order by 1 limit least(greatest(p_limit, 1), 200)
$$;
grant execute on function public.leaderboard(text, text, int) to anon, authenticated;

-- Durum değişikliğinde/çözülmede rozet kazanıldıysa kutlama bildirimi (günlükte de görünür)
create or replace function public.trg_reports_points()
returns trigger language plpgsql security definer set search_path = public as $$
declare before_pts int; after_pts int; t record;
begin
  if new.status = 'approved' and (tg_op = 'INSERT' or old.status is distinct from 'approved' or old.resolved_at is distinct from new.resolved_at) then
    select coalesce(sum(public.report_points(r)),0) into after_pts from public.reports r where r.user_id = new.user_id;
    before_pts := after_pts - public.report_points(new) + case when tg_op = 'UPDATE' then public.report_points(old) else 0 end;
    for t in select * from (values ('Mahalle Gözcüsü',20),('Doğa Dostu',60),('Orman Bekçisi',100),('Risk Avcısı',200),
                                   ('Yangın Kalkanı',400),('Gaziemir Efsanesi',800)) v(tag, need)
             where need > before_pts and need <= after_pts loop
      if not exists (select 1 from public.notifications where user_id = new.user_id and title = 'Yeni rozet: ' || t.tag || ' 🏅') then
        insert into public.notifications (user_id, title, body, kind, link)
        values (new.user_id, 'Yeni rozet: ' || t.tag || ' 🏅', after_pts || ' puana ulaştın! Rozeti Ayarlar > Profil’den takabilirsin.', 'success', '#/liderler');
      end if;
    end loop;
  end if;
  return new;
end; $$;
revoke execute on function public.trg_reports_points() from public, anon, authenticated;
drop trigger if exists reports_points on public.reports;
create trigger reports_points after insert or update on public.reports
  for each row execute function public.trg_reports_points();

-- Otomatik bildirimler (durum, rozet) günlüğe "yönetici bildirimi" diye yazılmasın
create or replace function public.trg_notifications_log()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(new.link, '') not in ('#/bildirimlerim', '#/liderler') then
    perform public.log_event(new.created_by, 'notification_send',
      coalesce((select '@' || username from public.profiles where id = new.user_id), 'Herkese') || ': ' || new.title, new.id);
  end if;
  return new;
end; $$;
revoke execute on function public.trg_notifications_log() from public, anon, authenticated;
-- Güvenlik taraması: fonksiyonların arama yolu sabitlendi
alter function public.req_header(text) set search_path = public;
alter function public.req_ip() set search_path = public;
alter function public.req_device() set search_path = public;
alter function public.report_points(public.reports) set search_path = public;