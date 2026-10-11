-- =====================================================================
-- GÜNCELLEME 5  —  Acil altyapı arızası kategorisi, "çözüldü" işareti
-- (Claude tarafından Supabase'e zaten uygulandı; kayıt için duruyor.)
-- =====================================================================

-- Yol ve acil durum bildirimlerinde itfaiye erişimi sorulmuyor
alter table public.reports alter column access_score drop not null;

-- Yeni kategori: acil altyapı arızası (patlak boru vb.)
alter table public.reports drop constraint if exists reports_category_ok;
alter table public.reports add constraint reports_category_ok
  check (category in ('fire','waste','flood','infra','road','urgent'));

alter table public.reports add column if not exists urgent_flow text;   -- leak / flow / burst
alter table public.reports add column if not exists urgent_since text;  -- now / hours / days
alter table public.reports add column if not exists resolved_at timestamptz;
alter table public.reports add column if not exists resolved_by uuid references auth.users(id) on delete set null;

alter table public.reports drop constraint if exists reports_urgent_ok;
alter table public.reports add constraint reports_urgent_ok check (
  (urgent_flow  is null or urgent_flow  in ('leak','flow','burst')) and
  (urgent_since is null or urgent_since in ('now','hours','days'))
);
create index if not exists reports_urgent_open_idx on public.reports (created_at desc)
  where category = 'urgent' and resolved_at is null;

-- trg_reports_log fonksiyonu "çözüldü" olayını da günlüğe yazacak ve
-- bildirim sahibine "Bildirdiğin sorun çözüldü" mesajı gönderecek şekilde güncellendi
-- (tam metni guncelleme4.sql'deki fonksiyonun genişletilmiş hâlidir).
