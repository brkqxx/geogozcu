-- =====================================================================
-- GÜNCELLEME 9  —  Gözlemci adı gizliliği, serbest rozetler, Yönetici rozeti kaldırılabilir
-- (Claude tarafından Supabase'e uygulandı; kayıt için duruyor.)
-- =====================================================================

-- 1) GÖZLEMCİ ADI GİZLİ: herkes "B---r U---l" görür, gerçek ad sadece yöneticiye gider
create or replace function public.mask_name(t text) returns text language sql immutable set search_path = public as $$
  select string_agg(
    case when char_length(w) <= 1 then upper(w)
         when char_length(w) = 2 then upper(left(w, 1)) || '-'
         else upper(left(w, 1)) || '---' || lower(right(w, 1)) end, ' ')
  from regexp_split_to_table(btrim(coalesce(t, '')), '\s+') w
$$;
alter table public.reports add column if not exists observer_masked text
  generated always as (public.mask_name(observer_name)) stored;

-- Tablo okuma yetkisi sütun bazında: observer_name hariç her şey okunabilir
revoke select on public.reports from anon, authenticated;
grant select (id, user_id, username, observer_masked, observed_at, lat, lng, address, photo_path, vegetation, risks,
  access_score, notes, status, created_at, photo_paths, category, subcategory, categories, neighborhood, edge_distance,
  slope, water_source, structures, flood_drain, waste_type, waste_amount, risk_score, admin_note, reviewed_at, district,
  flag_reason, road_size, road_depth, road_position, road_traffic, urgent_flow, urgent_since, resolved_at, resolved_by)
  on public.reports to anon, authenticated;

-- Yönetici için gerçek adlar (id → ad)
create or replace function public.admin_observer_names() returns table (id uuid, observer_name text)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Sadece yöneticiler'; end if;
  return query select r.id, r.observer_name from public.reports r;
end; $$;
revoke execute on function public.admin_observer_names() from public, anon;
grant execute on function public.admin_observer_names() to authenticated;

-- 2) "Yönetici" rozeti artık otomatik eklenmez, saklanan bir rozettir (kaldırılabilir)
update public.profiles set special_tags = special_tags || array['Yönetici']
 where is_admin and not ('Yönetici' = any(special_tags));

create or replace function public.profiles_admin_tag() returns trigger language plpgsql set search_path = public as $$
begin
  if new.is_admin and not old.is_admin and not ('Yönetici' = any(new.special_tags)) then
    new.special_tags := new.special_tags || array['Yönetici'];
  elsif not new.is_admin and old.is_admin then
    new.special_tags := array_remove(new.special_tags, 'Yönetici');
  end if;
  return new;
end; $$;
drop trigger if exists profiles_admin_tag on public.profiles;
create trigger profiles_admin_tag before update of is_admin on public.profiles
  for each row execute function public.profiles_admin_tag();

-- 3) Yönetici istediği rozeti verebilir (katalog dışı da). Kendi rozetlerini de kaldırabilir.
create or replace function public.admin_set_special_tags(p_user uuid, p_tags text[])
returns void language plpgsql security definer set search_path = public as $$
declare t text; clean text[] := '{}';
begin
  if not public.is_admin() then raise exception 'Sadece yöneticiler'; end if;
  foreach t in array coalesce(p_tags, '{}') loop
    t := btrim(t);
    if t = '' then continue; end if;
    if char_length(t) > 24 then raise exception 'Rozet adı en fazla 24 karakter olabilir: %', t; end if;
    if public.bad_word_hit(t) is not null then raise exception 'Uygunsuz rozet adı: %', t; end if;
    if not (t = any(clean)) then clean := clean || t; end if;
  end loop;
  if array_length(clean, 1) > 12 then raise exception 'Bir kullanıcıda en fazla 12 rozet olabilir'; end if;
  update public.profiles set special_tags = clean where id = p_user;
  perform public.log_event(auth.uid(), 'settings_update', 'Rozetler: @' || (select username from public.profiles where id = p_user) ||
    ' → ' || coalesce(nullif(array_to_string(clean, ', '), ''), '—'), p_user);
end; $$;
revoke execute on function public.admin_set_special_tags(uuid, text[]) from public, anon;
grant execute on function public.admin_set_special_tags(uuid, text[]) to authenticated;

-- 4) Lider tablosu ve profil: rozetler doğrudan saklanan liste
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
    p.username, p.avatar_url, p.avatar_emoji, p.avatar_color, p.nametag, p.bio, p.special_tags,
    array(select h.old_username from public.username_history h where h.user_id = a.user_id order by h.changed_at desc limit 3),
    a.pts, a.n, a.fire, a.urg, a.hi, a.last_r
  from agg a join public.profiles p on p.id = a.user_id
  where not exists (select 1 from public.bans b where b.user_id = a.user_id and public.ban_active(b))
  order by 1 limit least(greatest(p_limit, 1), 200)
$$;
grant execute on function public.leaderboard(text, text, int) to anon, authenticated;

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
    'badges', p.special_tags,
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

-- user_tags: "Yönetici" artık special_tags içinden gelir (çift eklenmesin)
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
      || coalesce((select special_tags from public.profiles where id = p_user), '{}'),
    'next', (select json_build_object('tag', tag, 'need', need) from tiers where need > s.pts order by need limit 1))
  from s
$$;
revoke execute on function public.user_tags(uuid) from public, anon;
grant execute on function public.user_tags(uuid) to authenticated;
