-- =====================================================================
-- GÜNCELLEME  —  Supabase > SQL Editor > New query > yapıştır > Run
-- Mevcut verilere dokunmaz, sadece ekler. Birkaç kez çalıştırsan da sorun olmaz.
-- =====================================================================

-- 1) İZİNLER (42501 "permission denied" hatasını bu bölüm çözer)
grant usage on schema public to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;
grant select on public.reports to anon, authenticated;
grant insert, update, delete on public.reports to authenticated;
grant select, update on public.profiles to authenticated;

-- 2) ÇOKLU FOTOĞRAF (en fazla 3)
alter table public.reports add column if not exists photo_paths text[];
update public.reports set photo_paths = array[photo_path]
  where photo_paths is null and photo_path is not null;
alter table public.reports alter column photo_path drop not null;

alter table public.reports drop constraint if exists reports_photo_count;
alter table public.reports add constraint reports_photo_count
  check (photo_paths is null or (array_length(photo_paths,1) between 1 and 3));

-- 3) KATEGORİ VE YENİ ANKET ALANLARI
alter table public.reports add column if not exists category text;
alter table public.reports add column if not exists subcategory text;
alter table public.reports add column if not exists categories text[] default '{}';
alter table public.reports add column if not exists neighborhood text;
alter table public.reports add column if not exists edge_distance text;
alter table public.reports add column if not exists slope text;
alter table public.reports add column if not exists water_source text;
alter table public.reports add column if not exists structures text;
alter table public.reports add column if not exists flood_drain text;
alter table public.reports add column if not exists waste_type text;
alter table public.reports add column if not exists waste_amount text;
alter table public.reports add column if not exists risk_score int;
alter table public.reports add column if not exists admin_note text;
alter table public.reports add column if not exists reviewed_at timestamptz;

-- Eski kayıtlar yangın kategorisine geçsin, yeni kayıtlarda kategori zorunlu
update public.reports set category = 'fire' where category is null;
alter table public.reports drop constraint if exists reports_category_ok;
alter table public.reports add constraint reports_category_ok
  check (category in ('fire','waste','flood','infra'));
alter table public.reports alter column vegetation drop not null;

-- Risk puanı 0-100 arasında olmalı
alter table public.reports drop constraint if exists reports_score_ok;
alter table public.reports add constraint reports_score_ok
  check (risk_score is null or risk_score between 0 and 100);

-- Hızlı filtreleme için dizinler
create index if not exists reports_status_idx on public.reports (status);
create index if not exists reports_category_idx on public.reports (category);
create index if not exists reports_subcategory_idx on public.reports (subcategory);

-- 4) RLS: yönetici başka kullanıcıyı yönetici yapabilsin
drop policy if exists "profil oku" on public.profiles;
create policy "profil oku" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists "profil guncelle" on public.profiles;
create policy "profil guncelle" on public.profiles
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Bildirim kuralları (zaten varsa aynısını yazar, zarar vermez)
drop policy if exists "bildirim oku" on public.reports;
create policy "bildirim oku" on public.reports
  for select using (status = 'approved' or user_id = auth.uid() or public.is_admin());

drop policy if exists "bildirim ekle" on public.reports;
create policy "bildirim ekle" on public.reports
  for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending');

drop policy if exists "bildirim guncelle" on public.reports;
create policy "bildirim guncelle" on public.reports
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "bildirim sil" on public.reports;
create policy "bildirim sil" on public.reports
  for delete to authenticated using (public.is_admin());

-- 5) Kullanıcı kendi fotoğrafını silebilsin (vazgeçtiğinde temizlensin)
drop policy if exists "foto sil" on storage.objects;
create policy "foto sil" on storage.objects
  for delete to authenticated
  using (bucket_id = 'report-photos'
         and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- 6) KENDİNİ YÖNETİCİ YAP (e-postanı yaz, baştaki -- işaretlerini sil)
-- update public.profiles set is_admin = true where email = 'SENIN_EPOSTAN@ornek.com';
