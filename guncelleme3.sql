-- =====================================================================
-- GÜNCELLEME 3  —  Supabase > SQL Editor > New query > yapıştır > Run
-- Önce guncelleme.sql ve guncelleme2.sql çalıştırılmış olmalı.
-- Mevcut verilere dokunmaz. Birkaç kez çalıştırsan da sorun olmaz.
-- =====================================================================

-- 1) YENİ KATEGORİ: YOL ÇUKURU VE YOL HASARI ('road')
alter table public.reports drop constraint if exists reports_category_ok;
alter table public.reports add constraint reports_category_ok
  check (category in ('fire','waste','flood','infra','road'));

-- 2) YOL HASARI SORULARI
alter table public.reports add column if not exists road_size text;      -- small / mid / large
alter table public.reports add column if not exists road_depth text;     -- shallow / mid / deep
alter table public.reports add column if not exists road_position text;  -- lane / edge / crossing / sidewalk
alter table public.reports add column if not exists road_traffic text;   -- low / mid / high

alter table public.reports drop constraint if exists reports_road_ok;
alter table public.reports add constraint reports_road_ok check (
  (road_size     is null or road_size     in ('small','mid','large')) and
  (road_depth    is null or road_depth    in ('shallow','mid','deep')) and
  (road_position is null or road_position in ('lane','edge','crossing','sidewalk')) and
  (road_traffic  is null or road_traffic  in ('low','mid','high'))
);

-- 3) GOOGLE İLE GİRİŞ İÇİN PROFİL TETİKLEYİCİSİ
-- Google'dan gelen kullanıcıda "username" yoktur; e-postanın baş kısmı kullanılır.
-- Aynı kullanıcı adı zaten varsa sonuna sayı eklenir, böylece kayıt hata vermez.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  base text;
  candidate text;
  n int := 0;
begin
  base := coalesce(
    nullif(new.raw_user_meta_data->>'username', ''),
    nullif(regexp_replace(split_part(new.email, '@', 1), '[^A-Za-z0-9_.-]', '', 'g'), ''),
    'kullanici'
  );
  base := left(base, 20);
  candidate := base;
  while exists (select 1 from public.profiles where username = candidate) loop
    n := n + 1;
    candidate := base || n::text;
  end loop;

  insert into public.profiles (id, username, email)
  values (new.id, candidate, new.email);
  return new;
end; $$;

-- 4) GÜVENLİK: tetikleyici fonksiyonu API'den çağrılamasın
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- 5) SUNUCU TARAFI İÇERİK DENETİMİ
-- Tarayıcıdaki filtre atlatılsa bile kaba söz içeren bildirim yayına girmez, incelemeye düşer.
create or replace function public.moderate_report()
returns trigger language plpgsql set search_path = public as $$
declare
  txt text;
  glued text;
  bad text[] := array['amk','aq','amq','orospu','orospucocugu','pic','pezevenk','yarrak','yarak','sik','sikerim',
    'sikeyim','siktir','got','gotveren','gotlek','amcik','amina','aminakoyayim','anani','gerizekali','aptal','salak',
    'ibne','kahpe','kaltak','serefsiz','namussuz','pust','porno','sex','seks','fuck','fck','shit','bitch','asshole',
    'dick','pussy','cunt','nigga','nigger'];
  w text;
begin
  txt := lower(coalesce(new.observer_name,'') || ' ' || coalesce(new.notes,'') || ' ' || coalesce(new.address,'') || ' ' ||
               coalesce(new.neighborhood,'') || ' ' || coalesce(new.username,''));
  txt := translate(txt, 'ığüşöçİ0@1!|3457', 'igusociooiiieast');
  txt := regexp_replace(txt, '[^a-z ]', ' ', 'g');
  glued := replace(txt, ' ', '');
  foreach w in array bad loop
    if txt ~ ('(^| )' || w || '( |$)') or (length(w) >= 5 and position(w in glued) > 0) then
      new.status := 'pending';
      new.flag_reason := coalesce(new.flag_reason, 'Uygunsuz dil tespit edildi (sunucu denetimi)');
      exit;
    end if;
  end loop;
  return new;
end; $$;
revoke execute on function public.moderate_report() from public, anon, authenticated;

drop trigger if exists reports_moderate on public.reports;
create trigger reports_moderate
  before insert on public.reports
  for each row execute function public.moderate_report();