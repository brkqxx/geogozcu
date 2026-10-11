-- =====================================================================
-- GÜNCELLEME 7  —  Moderasyon: sadece gerçekten şüpheli bildirimler yönetici onayına düşer
-- (Claude tarafından Supabase'e uygulandı; kayıt için duruyor.)
-- Tarayıcı: küfür ve anlamsız/deneme yazısı → onay bekler; hafif eksikler → yayında + yöneticiye not.
-- Sunucu: küfür + 15 dakikada 5'ten fazla bildirim (spam) → onay bekler.
-- =====================================================================
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
  recent int;
begin
  txt := lower(coalesce(new.observer_name,'') || ' ' || coalesce(new.notes,'') || ' ' || coalesce(new.address,'') || ' ' ||
               coalesce(new.neighborhood,'') || ' ' || coalesce(new.username,''));
  txt := translate(txt, 'ığüşöçİ0@1!|3457', 'igusociooiiieast');
  txt := regexp_replace(txt, '[^a-z ]', ' ', 'g');
  glued := replace(txt, ' ', '');
  foreach w in array bad loop
    if txt ~ ('(^| )' || w || '( |$)') or (length(w) >= 5 and position(w in glued) > 0) then
      new.status := 'pending';
      new.flag_reason := 'Uygunsuz dil tespit edildi (sunucu denetimi)';
      return new;
    end if;
  end loop;
  -- 15 dakikada 5'ten fazla bildirim: spam olabilir
  select count(*) into recent from public.reports
   where user_id = new.user_id and created_at > now() - interval '15 minutes';
  if recent >= 5 and not public.is_admin() then
    new.status := 'pending';
    new.flag_reason := 'Kısa sürede çok fazla bildirim (' || (recent + 1) || ' / 15 dk)';
  end if;
  return new;
end; $$;
revoke execute on function public.moderate_report() from public, anon, authenticated;
