-- =====================================================================
-- GÜNCELLEME 14  —  Yönetici veri içe aktarma (eski saha gözlemleri)
-- (Claude tarafından Supabase'e uygulandı; kayıt için duruyor.)
-- reports.source = 'import' olan kayıtlar yönetici panelindeki "Veri içe aktar" ile eklenir:
--   * gözlemci adı herkese maskeli görünür (reports_privacy tetikleyicisi), "@kullanıcı" yerine
--     "Yönetici tarafından eklendi" yazar
--   * puan / rozet / lider tablosu / profil sayılarına KATILMAZ
--   * source_ref aynı satırın ikinci kez eklenmesini engeller
-- Harita bağlantıları (Google / Apple) "resolve-maps" sunucu fonksiyonuyla kesin koordinata çevrilir
-- (supabase-functions/resolve-maps/index.ts).
-- =====================================================================
alter table public.reports add column if not exists source text;
alter table public.reports add column if not exists source_ref text;
create unique index if not exists reports_source_ref_uq on public.reports (source_ref) where source_ref is not null;

create or replace function public.report_points(r reports) returns integer
language sql immutable set search_path = public as $$
  select case when r.status <> 'approved' or r.source = 'import' then 0 else
    10 + case when coalesce(r.risk_score,0) >= 67 then 5 else 0 end
       + case when r.category = 'fire' then 3 else 0 end
       + case when r.category = 'urgent' then 3 else 0 end
       + case when r.resolved_at is not null then 5 else 0 end end
$$;
-- leaderboard(), user_tags() ve public_profile() de "source is distinct from 'import'" filtresiyle
-- yeniden tanımlandı (tam metinleri Supabase'deki migration geçmişinde: guncelleme14_admin_import,
-- guncelleme14b_profile_recent).
