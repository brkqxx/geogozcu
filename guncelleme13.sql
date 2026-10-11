-- =====================================================================
-- GÜNCELLEME 13  —  Yönetici fotoğraf düzenleme
-- (Claude tarafından Supabase'e uygulandı; kayıt için duruyor.)
-- Yöneticiler herhangi bir bildirime fotoğraf ekleyebilir veya döndürülmüş hâlini yükleyebilir.
-- (Silme izni zaten vardı: "foto sil" kuralı yöneticilere açık.)
-- =====================================================================
drop policy if exists "foto yukle yonetici" on storage.objects;
create policy "foto yukle yonetici" on storage.objects for insert to authenticated
  with check (bucket_id = 'report-photos' and public.is_admin());
