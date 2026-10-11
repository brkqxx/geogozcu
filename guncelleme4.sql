-- =====================================================================
-- GÜNCELLEME 4  —  Etkinlik günlüğü, kullanıcı bildirimleri, ayarlar
-- (Bu dosya Claude tarafından Supabase'e zaten uygulandı; kayıt için duruyor.)
-- =====================================================================

-- 1) ETKİNLİK GÜNLÜĞÜ (LOG)
create table if not exists public.activity_log (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  username text,
  action text not null,
  detail text check (char_length(detail) <= 500),
  target_id uuid,
  created_at timestamptz not null default now()
);
create index if not exists activity_log_user_idx on public.activity_log (user_id, created_at desc);
create index if not exists activity_log_created_idx on public.activity_log (created_at desc);

alter table public.activity_log enable row level security;
drop policy if exists "log oku" on public.activity_log;
create policy "log oku" on public.activity_log
  for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());
-- Tarayıcı sadece kendi adına giriş/çıkış/ayar olayı yazabilir; geri kalanını tetikleyiciler yazar
drop policy if exists "log yaz" on public.activity_log;
create policy "log yaz" on public.activity_log
  for insert to authenticated
  with check (user_id = (select auth.uid()) and action in ('login','logout','settings_update','password_change'));
grant select, insert on public.activity_log to authenticated;

create or replace function public.log_event(p_user uuid, p_action text, p_detail text, p_target uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  -- hesap silinirken kullanıcı artık yoksa kaydı isimsiz yaz (yabancı anahtar hatası olmasın)
  if p_user is not null and not exists (select 1 from auth.users where id = p_user) then p_user := null; end if;
  insert into public.activity_log (user_id, username, action, detail, target_id)
  values (p_user, (select username from public.profiles where id = p_user), p_action, left(p_detail, 500), p_target);
end; $$;
revoke execute on function public.log_event(uuid, text, text, uuid) from public, anon, authenticated;

-- 2) KULLANICI BİLDİRİMLERİ (yönetici → kullanıcı / herkes)
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,   -- boşsa herkese
  title text not null check (char_length(title) between 1 and 120),
  body text check (char_length(body) <= 1000),
  kind text not null default 'info' check (kind in ('info','success','warning','alert')),
  link text check (char_length(link) <= 200),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);

create table if not exists public.notification_reads (
  user_id uuid not null references auth.users(id) on delete cascade,
  notification_id uuid not null references public.notifications(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (user_id, notification_id)
);

alter table public.notifications enable row level security;
alter table public.notification_reads enable row level security;

drop policy if exists "bildirim kutusu oku" on public.notifications;
create policy "bildirim kutusu oku" on public.notifications
  for select to authenticated using (user_id is null or user_id = (select auth.uid()) or public.is_admin());
drop policy if exists "bildirim kutusu yaz" on public.notifications;
create policy "bildirim kutusu yaz" on public.notifications
  for insert to authenticated with check (public.is_admin());
drop policy if exists "bildirim kutusu sil" on public.notifications;
create policy "bildirim kutusu sil" on public.notifications
  for delete to authenticated using (public.is_admin());

drop policy if exists "okundu oku" on public.notification_reads;
create policy "okundu oku" on public.notification_reads
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "okundu yaz" on public.notification_reads;
create policy "okundu yaz" on public.notification_reads
  for insert to authenticated with check (user_id = (select auth.uid()));

grant select, insert, delete on public.notifications to authenticated;
grant select, insert on public.notification_reads to authenticated;

-- Canlı bildirim (zil anında güncellensin)
do $$ begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null; end $$;

-- 3) TETİKLEYİCİLER: olayları günlüğe yaz, durum değişince kullanıcıya haber ver
create or replace function public.trg_reports_log()
returns trigger language plpgsql security definer set search_path = public as $$
declare actor uuid := coalesce(auth.uid(), coalesce(new.user_id, old.user_id));
begin
  if tg_op = 'INSERT' then
    perform public.log_event(new.user_id, 'report_create',
      new.category || '/' || coalesce(new.subcategory,'') || ' · ' || coalesce(new.district,'') || ' · ' || new.status, new.id);
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status then
    perform public.log_event(actor, 'report_status', old.status || ' → ' || new.status || ' · ' || coalesce(new.district,''), new.id);
    if new.user_id <> actor then
      insert into public.notifications (user_id, title, body, kind, link, created_by)
      values (new.user_id,
        case new.status when 'approved' then 'Bildirimin yayına alındı'
                        when 'rejected' then 'Bildirimin yayından kaldırıldı'
                        else 'Bildirimin incelemeye alındı' end,
        coalesce(new.district,'') || ' bölgesindeki bildirimin durumu güncellendi.' ||
          coalesce(' Yönetici notu: ' || new.admin_note, ''),
        case new.status when 'approved' then 'success' when 'rejected' then 'warning' else 'info' end,
        '#/bildirimlerim', actor);
    end if;
  elsif tg_op = 'DELETE' then
    perform public.log_event(actor, 'report_delete', old.category || ' · ' || coalesce(old.district,''), old.id);
  end if;
  return coalesce(new, old);
end; $$;
revoke execute on function public.trg_reports_log() from public, anon, authenticated;

drop trigger if exists reports_log on public.reports;
create trigger reports_log after insert or update or delete on public.reports
  for each row execute function public.trg_reports_log();

create or replace function public.trg_profiles_log()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    perform public.log_event(new.id, 'signup', new.username, new.id);
  elsif new.is_admin is distinct from old.is_admin then
    perform public.log_event(auth.uid(), 'admin_toggle',
      new.username || (case when new.is_admin then ' yönetici yapıldı' else ' yöneticilikten alındı' end), new.id);
  elsif new.username is distinct from old.username then
    perform public.log_event(new.id, 'settings_update', 'Kullanıcı adı: ' || old.username || ' → ' || new.username, new.id);
  end if;
  return new;
end; $$;
revoke execute on function public.trg_profiles_log() from public, anon, authenticated;

drop trigger if exists profiles_log on public.profiles;
create trigger profiles_log after insert or update on public.profiles
  for each row execute function public.trg_profiles_log();

create or replace function public.trg_notifications_log()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- sadece yöneticinin elle gönderdikleri (otomatik durum bildirimleri hariç)
  if new.link is distinct from '#/bildirimlerim' then
    perform public.log_event(new.created_by, 'notification_send',
      coalesce((select '@' || username from public.profiles where id = new.user_id), 'Herkese') || ': ' || new.title, new.id);
  end if;
  return new;
end; $$;
revoke execute on function public.trg_notifications_log() from public, anon, authenticated;

drop trigger if exists notifications_log on public.notifications;
create trigger notifications_log after insert on public.notifications
  for each row execute function public.trg_notifications_log();

-- 4) AYARLAR: kullanıcı kendi adını değiştirebilir, hesabını silebilir
create or replace function public.update_my_username(new_name text)
returns text language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Giriş yapmalısın'; end if;
  if new_name !~ '^[[:alnum:]_.-]{3,24}$' then
    raise exception 'Kullanıcı adı 3-24 karakter olmalı; harf, rakam, nokta, tire, alt çizgi';
  end if;
  if exists (select 1 from public.profiles where username = new_name and id <> auth.uid()) then
    raise exception 'Bu kullanıcı adı alınmış';
  end if;
  update public.profiles set username = new_name where id = auth.uid();
  return new_name;
end; $$;
revoke execute on function public.update_my_username(text) from public, anon;
grant execute on function public.update_my_username(text) to authenticated;

create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then raise exception 'Giriş yapmalısın'; end if;
  delete from auth.users where id = auth.uid();
end; $$;
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- Profil tablosuna son görülme
alter table public.profiles add column if not exists last_seen timestamptz;
create or replace function public.touch_last_seen()
returns void language sql security definer set search_path = public as $$
  update public.profiles set last_seen = now() where id = auth.uid();
$$;
revoke execute on function public.touch_last_seen() from public, anon;
grant execute on function public.touch_last_seen() to authenticated;
