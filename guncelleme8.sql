-- =====================================================================
-- GÜNCELLEME 8  —  Profesyonel kullanıcı sistemi
--  * Kullanıcı adı: 72 saatte bir değişir, geçmiş adlar saklanır, büyük/küçük harf duyarsız benzersiz
--  * Yönetilebilir kara liste + Türkçe/sayı/sembol varyasyonlarını yakalayan filtre
--  * Yasak geçmişi (kaldırılan yasaklar silinmez), giriş öncesi yasak bilgisi
--  * Rozetler (Kurucu, Moderatör, VIP…), herkese açık profil, kullanıcı şikâyetleri
--  * Bildirim tercihleri, tanıtım turu, yönetici istatistikleri
-- (Claude tarafından Supabase'e uygulandı; kayıt için duruyor.)
-- =====================================================================

-- 1) KARA LİSTE ----------------------------------------------------------
create table if not exists public.banned_words (
  word text primary key check (word ~ '^[a-z]{2,30}$'),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.banned_words enable row level security;
drop policy if exists "kara liste yonet" on public.banned_words;
create policy "kara liste yonet" on public.banned_words for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
grant select, insert, delete on public.banned_words to authenticated;

-- Kelimeyi sade biçime çevir: Türkçe harf → Latin, büyük → küçük, harf dışı at
create or replace function public.tr_fold(t text) returns text language sql immutable set search_path = public as $$
  select translate(lower(translate(coalesce(t, ''), 'İIĞÜŞÖÇ', 'iiğüşöç')), 'ığüşöçâîû', 'igusocaiu')
$$;

create or replace function public.banned_words_norm() returns trigger language plpgsql set search_path = public as $$
begin
  new.word := regexp_replace(public.tr_fold(new.word), '[^a-z]', '', 'g');
  return new;
end; $$;
drop trigger if exists banned_words_norm on public.banned_words;
create trigger banned_words_norm before insert or update on public.banned_words
  for each row execute function public.banned_words_norm();

insert into public.banned_words (word) values
  ('oe'),('oç'),('amk'),('aq'),('amq'),('sik'),('siktir'),('yarram'),('yarrak'),('yarak'),('sikici'),('sikerim'),
  ('sikeyim'),('orospu'),('orospucocugu'),('piç'),('ibne'),('göt'),('gotveren'),('sg'),('pezevenk'),('amcik'),
  ('amina'),('aminakoyayim'),('anani'),('kahpe'),('kaltak'),('serefsiz'),('pust'),('yavsak'),('gavat'),('dalyarak'),
  ('fuck'),('fck'),('shit'),('bitch'),('asshole'),('dick'),('pussy'),('cunt'),('nigger'),('nigga'),('porno'),('seks'),('sex')
on conflict do nothing;

-- Metinde kara listeden kelime var mı? (bulduğu kelimeyi döndürür)
--  * 0→o, 1→i, 3→e, 4→a, 5→s, 7→t, @→a, $→s gibi gizlemeler çözülür
--  * kısa kelimeler (≤3 harf) sadece tek başına geçerse yakalanır: "ışık" içindeki "sik" sorun olmaz
--  * uzun kelimeler kelime içinde de, harf tekrarıyla (siiiktir) da yakalanır
create or replace function public.bad_word_hit(t text) returns text
language plpgsql stable security definer set search_path = public as $$
declare base text; a text; b text; ga text; gb text; ca text; w text;
begin
  if t is null or btrim(t) = '' then return null; end if;
  base := public.tr_fold(t);
  a := regexp_replace(translate(base, '0@1!|3457$9+', 'oaiiieastsgt'), '[^a-z]+', ' ', 'g');
  b := regexp_replace(regexp_replace(base, '[0-9]+', ' ', 'g'), '[^a-z]+', ' ', 'g');
  ga := replace(a, ' ', ''); gb := replace(b, ' ', '');
  ca := regexp_replace(ga, '(.)\1+', '\1', 'g');
  for w in select word from public.banned_words loop
    if length(w) <= 3 then
      if (' ' || a || ' ') like ('% ' || w || ' %') or (' ' || b || ' ') like ('% ' || w || ' %') or ga = w or gb = w then return w; end if;
    else
      if position(w in ga) > 0 or position(w in gb) > 0 or (w !~ '(.)\1' and position(w in ca) > 0) then return w; end if;
    end if;
  end loop;
  return null;
end; $$;
revoke execute on function public.bad_word_hit(text) from public, anon, authenticated;

-- 2) KULLANICI ADI -------------------------------------------------------
alter table public.profiles add column if not exists username_changed_at timestamptz;
create unique index if not exists profiles_username_ci on public.profiles (lower(username));

create table if not exists public.username_history (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  old_username text not null,
  new_username text not null,
  changed_at timestamptz not null default now(),
  changed_by uuid default auth.uid()
);
create index if not exists username_history_user_idx on public.username_history (user_id, changed_at desc);
alter table public.username_history enable row level security;
drop policy if exists "ad gecmisi oku" on public.username_history;
create policy "ad gecmisi oku" on public.username_history for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());
grant select on public.username_history to authenticated;

-- Kayıt formu ve ayarlar için: uygunsa null, değilse sebebi döndürür
create or replace function public.check_username(p text) returns text
language plpgsql stable security definer set search_path = public as $$
begin
  if p is null or p !~ '^[[:alnum:]_.-]{3,24}$' then
    return 'Kullanıcı adı 3-24 karakter olmalı; harf, rakam, nokta, tire ve alt çizgi kullanabilirsin.'; end if;
  if public.tr_fold(p) in ('admin','yonetici','moderator','moderatör','geogozcu','destek','sistem','system','root','kurucu') then
    return 'Bu kullanıcı adı ayrılmış, başka bir ad seç.'; end if;
  if public.bad_word_hit(p) is not null then return 'Bu kullanıcı adı uygunsuz bir ifade içeriyor.'; end if;
  if exists (select 1 from public.profiles where lower(username) = lower(p) and id is distinct from auth.uid()) then
    return 'Bu kullanıcı adı alınmış.'; end if;
  return null;
end; $$;
grant execute on function public.check_username(text) to anon, authenticated;

create or replace function public.update_my_username(new_name text)
returns text language plpgsql security definer set search_path = public as $$
declare msg text; cur public.profiles;
begin
  if auth.uid() is null then raise exception 'Giriş yapmalısın'; end if;
  if public.is_banned() then raise exception 'Hesabın kısıtlı'; end if;
  select * into cur from public.profiles where id = auth.uid();
  if cur.username = new_name then return new_name; end if;
  if cur.username_changed_at is not null and cur.username_changed_at > now() - interval '72 hours' and not public.is_admin() then
    raise exception 'Kullanıcı adını 72 saatte bir değiştirebilirsin. Sonraki hak: %',
      to_char((cur.username_changed_at + interval '72 hours') at time zone 'Europe/Istanbul', 'DD.MM.YYYY HH24:MI');
  end if;
  msg := public.check_username(new_name);
  if msg is not null then raise exception '%', msg; end if;
  insert into public.username_history (user_id, old_username, new_username) values (auth.uid(), cur.username, new_name);
  update public.profiles set username = new_name, username_changed_at = now() where id = auth.uid();
  return new_name;
end; $$;
revoke execute on function public.update_my_username(text) from public, anon;
grant execute on function public.update_my_username(text) to authenticated;

-- Yönetici bekleme süresine takılmadan ad değiştirebilir (uygunsuz ad düzeltme)
create or replace function public.admin_rename_user(p_user uuid, p_name text)
returns void language plpgsql security definer set search_path = public as $$
declare msg text; old text;
begin
  if not public.is_admin() then raise exception 'Sadece yöneticiler'; end if;
  if p_name is null or p_name !~ '^[[:alnum:]_.-]{3,24}$' then raise exception 'Geçersiz kullanıcı adı'; end if;
  if exists (select 1 from public.profiles where lower(username) = lower(p_name) and id <> p_user) then raise exception 'Bu kullanıcı adı alınmış'; end if;
  select username into old from public.profiles where id = p_user;
  if old = p_name then return; end if;
  insert into public.username_history (user_id, old_username, new_username) values (p_user, old, p_name);
  update public.profiles set username = p_name where id = p_user;
  perform public.log_event(auth.uid(), 'settings_update', 'Yönetici adı değiştirdi: @' || old || ' → @' || p_name, p_user);
end; $$;
revoke execute on function public.admin_rename_user(uuid, text) from public, anon;
grant execute on function public.admin_rename_user(uuid, text) to authenticated;

-- Kayıtta uygunsuz/ayrılmış ad gelirse güvenli bir ad ver; erken katılan rozetleri
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare base text; candidate text; n int := 0;
begin
  base := coalesce(nullif(new.raw_user_meta_data->>'username', ''),
    nullif(regexp_replace(split_part(new.email, '@', 1), '[^A-Za-z0-9_.-]', '', 'g'), ''), 'gozcu');
  base := left(base, 20);
  if length(base) < 3 or public.bad_word_hit(base) is not null
     or public.tr_fold(base) in ('admin','yonetici','moderator','geogozcu','destek','sistem','system','root','kurucu') then
    base := 'gozcu';
  end if;
  candidate := base;
  while exists (select 1 from public.profiles where lower(username) = lower(candidate)) loop
    n := n + 1; candidate := base || n::text;
  end loop;
  insert into public.profiles (id, username, email, special_tags)
  values (new.id, candidate, new.email,
    case when now() < '2027-01-01' then array['Erken Katılan','Beta Kullanıcısı'] else '{}'::text[] end);
  return new;
end; $$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Profil tablosunda ad değişikliğini sadece yukarıdaki fonksiyonlar yapabilsin (eski "profil guncelle" yönetici kuralı kalır)

-- 3) YASAK GEÇMİŞİ -------------------------------------------------------
alter table public.bans add column if not exists lifted_at timestamptz;
alter table public.bans add column if not exists lifted_by uuid references auth.users(id) on delete set null;

create or replace function public.ban_active(b public.bans) returns boolean language sql stable set search_path = public as $$
  select b.lifted_at is null and (b.expires_at is null or b.expires_at > now())
$$;

create or replace function public.my_ban() returns json
language sql stable security definer set search_path = public as $$
  select json_build_object('reason', b.reason, 'expires_at', b.expires_at, 'created_at', b.created_at,
    'by', case when b.user_id is not null then 'hesap' when b.device_id is not null then 'cihaz' else 'ip' end)
  from public.bans b
  where public.ban_active(b)
    and ((b.user_id is not null and b.user_id = auth.uid())
      or (b.device_id is not null and b.device_id = public.req_device())
      or (b.ip is not null and b.ip = public.req_ip()))
    and not public.is_admin()
  order by b.expires_at desc nulls first limit 1
$$;

-- Giriş başarısız olunca (hesap kilitli) sebebi ve bitişi göstermek için
create or replace function public.ban_lookup(p_email text) returns json
language sql stable security definer set search_path = public as $$
  select json_build_object('reason', b.reason, 'expires_at', b.expires_at, 'by', 'hesap')
  from public.bans b join auth.users u on u.id = b.user_id
  where lower(u.email) = lower(trim(p_email)) and public.ban_active(b)
  order by b.expires_at desc nulls first limit 1
$$;
grant execute on function public.ban_lookup(text) to anon, authenticated;

create or replace function public.admin_unban_user(p_user uuid)
returns int language plpgsql security definer set search_path = public as $$
declare n int; uname text;
begin
  if not public.is_admin() then raise exception 'Sadece yöneticiler'; end if;
  update public.bans b set lifted_at = now(), lifted_by = auth.uid()
   where b.lifted_at is null and (b.user_id = p_user
     or b.device_id in (select device_id from public.user_devices where user_id = p_user)
     or b.ip in (select ip from public.user_devices where user_id = p_user and ip is not null));
  get diagnostics n = row_count;
  select username into uname from public.profiles where id = p_user;
  perform public.log_event(auth.uid(), 'user_unban', '@' || coalesce(uname,'?'), p_user);
  return n;
end; $$;
revoke execute on function public.admin_unban_user(uuid) from public, anon;
grant execute on function public.admin_unban_user(uuid) to authenticated;

-- 4) BİLDİRİM TERCİHLERİ, TANITIM TURU ----------------------------------
alter table public.profiles add column if not exists notify_push boolean not null default true;
alter table public.profiles add column if not exists notify_email boolean not null default false;
alter table public.profiles add column if not exists notify_system boolean not null default true;
alter table public.profiles add column if not exists onboarded_at timestamptz;

create or replace function public.set_my_settings(p jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Giriş yapmalısın'; end if;
  update public.profiles set
    notify_push   = coalesce((p ->> 'notify_push')::boolean, notify_push),
    notify_email  = coalesce((p ->> 'notify_email')::boolean, notify_email),
    notify_system = coalesce((p ->> 'notify_system')::boolean, notify_system),
    onboarded_at  = case when (p ->> 'onboarded')::boolean then now() else onboarded_at end
  where id = auth.uid();
end; $$;
revoke execute on function public.set_my_settings(jsonb) from public, anon;
grant execute on function public.set_my_settings(jsonb) to authenticated;

-- 5) ROZETLER: mevcut kullanıcılara erken katılan + beta, yöneticilere kurucu
update public.profiles set special_tags = (
  select array_agg(distinct t) from unnest(special_tags || array['Erken Katılan','Beta Kullanıcısı']
    || case when is_admin then array['Kurucu'] else '{}'::text[] end) t);

-- 6) LİDER TABLOSU: rozetler ve eski adlar da gelsin -----------------------
drop function if exists public.leaderboard(text, text, int);
create or replace function public.leaderboard(p_period text default 'all', p_cat text default 'all', p_limit int default 50)
returns table (rank int, is_me boolean, username text, avatar_url text, avatar_emoji text, avatar_color text,
  nametag text, bio text, badges text[], prev_names text[], points int, reports int, fire int, urgent int, high int, last_report timestamptz)
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
    p.special_tags || case when p.is_admin and not ('Yönetici' = any(p.special_tags)) then array['Yönetici'] else '{}'::text[] end,
    array(select h.old_username from public.username_history h where h.user_id = a.user_id order by h.changed_at desc limit 3),
    a.pts, a.n, a.fire, a.urg, a.hi, a.last_r
  from agg a join public.profiles p on p.id = a.user_id
  where not exists (select 1 from public.bans b where b.user_id = a.user_id and public.ban_active(b))
  order by 1 limit least(greatest(p_limit, 1), 200)
$$;
grant execute on function public.leaderboard(text, text, int) to anon, authenticated;

-- 7) HERKESE AÇIK PROFİL (e-posta yok). Eski adla aranırsa da bulur.
create or replace function public.public_profile(p_username text) returns json
language plpgsql stable security definer set search_path = public as $$
declare p public.profiles; via text := null; tags json; rk int;
begin
  select * into p from public.profiles where lower(username) = lower(p_username);
  if p.id is null then
    select pr.* into p from public.username_history h join public.profiles pr on pr.id = h.user_id
     where lower(h.old_username) = lower(p_username) order by h.changed_at desc limit 1;
    if p.id is null then return null; end if;
    via := p_username;
  end if;
  tags := public.user_tags(p.id);
  select l.rank into rk from public.leaderboard('all', 'all', 200) l where l.username = p.username;
  return json_build_object(
    'id', p.id, 'username', p.username, 'found_via_old_name', via,
    'avatar_url', p.avatar_url, 'avatar_emoji', p.avatar_emoji, 'avatar_color', p.avatar_color,
    'nametag', p.nametag, 'bio', p.bio, 'created_at', p.created_at, 'is_me', p.id = auth.uid(),
    'badges', p.special_tags || case when p.is_admin and not ('Yönetici' = any(p.special_tags)) then array['Yönetici'] else '{}'::text[] end,
    'banned', exists (select 1 from public.bans b where b.user_id = p.id and public.ban_active(b)),
    'points', tags -> 'points', 'reports', tags -> 'reports', 'fire', tags -> 'fire', 'urgent', tags -> 'urgent', 'rank', rk,
    'username_changed_at', p.username_changed_at,
    'history', coalesce((select json_agg(json_build_object('old', h.old_username, 'new', h.new_username, 'at', h.changed_at) order by h.changed_at desc)
                from public.username_history h where h.user_id = p.id), '[]'::json),
    'recent', coalesce((select json_agg(x) from (select r.id, r.category, r.subcategory, r.district, r.neighborhood, r.created_at,
                r.risk_score, coalesce(r.photo_paths[1], r.photo_path) photo, r.lat, r.lng
                from public.reports r where r.user_id = p.id and r.status = 'approved' order by r.created_at desc limit 6) x), '[]'::json)
  );
end; $$;
grant execute on function public.public_profile(text) to anon, authenticated;

-- 8) KULLANICI ŞİKÂYETLERİ ----------------------------------------------
create table if not exists public.user_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  target_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (reason in ('uygunsuz_ad','uygunsuz_icerik','sahte_bildirim','spam','taciz','diger')),
  details text check (char_length(details) <= 500),
  status text not null default 'open' check (status in ('open','resolved','dismissed')),
  admin_note text check (char_length(admin_note) <= 300),
  resolved_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  check (reporter_id <> target_id)
);
create unique index if not exists user_reports_open_once on public.user_reports (reporter_id, target_id) where status = 'open';
alter table public.user_reports enable row level security;
drop policy if exists "sikayet ekle" on public.user_reports;
create policy "sikayet ekle" on public.user_reports for insert to authenticated
  with check (reporter_id = (select auth.uid()) and not public.is_banned());
drop policy if exists "sikayet oku" on public.user_reports;
create policy "sikayet oku" on public.user_reports for select to authenticated
  using (reporter_id = (select auth.uid()) or public.is_admin());
drop policy if exists "sikayet guncelle" on public.user_reports;
create policy "sikayet guncelle" on public.user_reports for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
grant select, insert, update on public.user_reports to authenticated;

-- 9) YÖNETİCİ İSTATİSTİKLERİ --------------------------------------------
create or replace function public.admin_stats() returns json
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Sadece yöneticiler'; end if;
  return json_build_object(
    'users', (select count(*) from public.profiles),
    'dau', (select count(distinct id) from public.profiles where last_seen > now() - interval '24 hours'),
    'wau', (select count(distinct id) from public.profiles where last_seen > now() - interval '7 days'),
    'new_24h', (select count(*) from public.profiles where created_at > now() - interval '24 hours'),
    'new_7d', (select count(*) from public.profiles where created_at > now() - interval '7 days'),
    'banned', (select count(distinct user_id) from public.bans b where b.user_id is not null and public.ban_active(b)),
    'open_reports', (select count(*) from public.user_reports where status = 'open'),
    'pending', (select count(*) from public.reports where status = 'pending'),
    'signups_14d', (select json_agg(json_build_object('d', d::date, 'n',
        (select count(*) from public.profiles p where p.created_at::date = d::date)) order by d)
        from generate_series(current_date - 13, current_date, interval '1 day') d),
    'top', coalesce((select json_agg(x) from (
        select p.username, p.avatar_url, p.avatar_emoji, p.avatar_color,
          count(r.*) filter (where r.created_at > now() - interval '30 days')::int reports_30d,
          max(p.last_seen) last_seen
        from public.profiles p left join public.reports r on r.user_id = p.id
        group by p.id order by 5 desc, 6 desc nulls last limit 5) x), '[]'::json)
  );
end; $$;
revoke execute on function public.admin_stats() from public, anon;
grant execute on function public.admin_stats() to authenticated;

-- 10) Sunucu içerik denetimi artık kara liste tablosunu kullanır
create or replace function public.moderate_report()
returns trigger language plpgsql security definer set search_path = public as $$
declare recent int;
begin
  if public.bad_word_hit(concat_ws(' ', new.observer_name, new.notes, new.address, new.neighborhood)) is not null then
    new.status := 'pending';
    new.flag_reason := 'Uygunsuz dil tespit edildi (sunucu denetimi)';
    return new;
  end if;
  select count(*) into recent from public.reports
   where user_id = new.user_id and created_at > now() - interval '15 minutes';
  if recent >= 5 and not public.is_admin() then
    new.status := 'pending';
    new.flag_reason := 'Kısa sürede çok fazla bildirim (' || (recent + 1) || ' / 15 dk)';
  end if;
  return new;
end; $$;
revoke execute on function public.moderate_report() from public, anon, authenticated;
