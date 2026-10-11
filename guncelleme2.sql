-- =====================================================================
-- GÜNCELLEME 2  —  Supabase > SQL Editor > New query > yapıştır > Run
-- Önce guncelleme.sql çalıştırılmış olmalı. Mevcut verilere dokunmaz.
-- =====================================================================

-- 1) İLÇE ALANI (artık İzmir geneli)
alter table public.reports add column if not exists district text;
update public.reports set district = 'Gaziemir' where district is null;

-- 2) OTOMATİK YAYIN  —  yönetici onayı kalktı
-- Bildirimler doğrudan yayına girer. Sadece filtreye takılanlar incelemeye düşer.
alter table public.reports alter column status set default 'approved';

alter table public.reports add column if not exists flag_reason text;

-- Kullanıcı kaydı artık 'approved' veya 'pending' olarak açabilir,
-- ama kendi kaydını 'rejected' yapamaz ve başkasının adına ekleyemez.
drop policy if exists "bildirim ekle" on public.reports;
create policy "bildirim ekle" on public.reports
  for insert to authenticated
  with check (user_id = auth.uid() and status in ('approved','pending'));

-- Eskiden onay bekleyen kayıtları yayına al (istemezsen bu satırı silebilirsin)
update public.reports set status = 'approved' where status = 'pending' and flag_reason is null;

-- 3) KULLANICI KENDİ BİLDİRİMİNİ SİLEBİLSİN
drop policy if exists "bildirim sil" on public.reports;
create policy "bildirim sil" on public.reports
  for delete to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- 4) Bu sürümde kullanılan sütunların hepsi var mı, garantiye al
alter table public.reports add column if not exists photo_paths text[];
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

create index if not exists reports_district_idx on public.reports (district);
