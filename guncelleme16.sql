-- guncelleme16.sql — güvenlik sıkılaştırma (4 Kasım 2026)
-- 1) Yönetici olmayan kullanıcı, API'yi doğrudan çağırarak rapora başkasının kullanıcı adını,
--    yönetici notunu, inceleme/çözülme tarihini, "içe aktarıldı" kaynağını ya da geçmiş bir
--    oluşturma tarihini yazamaz. Bu alanları sunucu belirler.
-- 2) activity_log'a yazılan kullanıcı adı her zaman gerçek profilden alınır (sahte kayıt yok).
-- 3) anon/authenticated rollerinden gereksiz TRUNCATE / TRIGGER / REFERENCES yetkileri alınır.

create or replace function public.reports_sanitize()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.is_admin() then return new; end if;
  new.user_id      := auth.uid();
  new.username     := (select username from public.profiles where id = auth.uid());
  new.created_at   := now();
  new.admin_note   := null;
  new.reviewed_at  := null;
  new.resolved_at  := null;
  new.resolved_by  := null;
  new.fix_flagged_at := null;
  new.flag_reason  := null;
  new.source       := null;
  new.source_ref   := null;
  if new.status is distinct from 'pending' then new.status := 'approved'; end if;
  if new.observed_at is null or new.observed_at > now() + interval '10 minutes' then
    new.observed_at := now();
  end if;
  return new;
end; $$;

-- Tetikleyiciler ada göre sıralı çalışır: "aa" önce (moderate_report ve zz_privacy'den önce).
drop trigger if exists reports_aa_sanitize on public.reports;
create trigger reports_aa_sanitize before insert on public.reports
  for each row execute function public.reports_sanitize();

create or replace function public.activity_log_sanitize()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.username := (select username from public.profiles where id = new.user_id);
  return new;
end; $$;

drop trigger if exists activity_log_sanitize on public.activity_log;
create trigger activity_log_sanitize before insert on public.activity_log
  for each row execute function public.activity_log_sanitize();

revoke execute on function public.reports_sanitize() from public, anon, authenticated;
revoke execute on function public.activity_log_sanitize() from public, anon, authenticated;

do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('revoke truncate, trigger, references on public.%I from anon, authenticated', t);
  end loop;
end $$;
