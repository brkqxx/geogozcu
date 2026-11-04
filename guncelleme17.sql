-- GÜNCELLEME 17 (Kasım 2026): fotoğraf ve avatar kovalarında herkese açık listeleme kapatıldı.
-- Kovalar herkese açık kalır (fotoğraflar bağlantıyla görünür); ama kovadaki tüm dosyaların listesi
-- (onay bekleyen/reddedilen bildirim fotoğrafları, kullanıcı kimliği klasörleri) artık yalnız
-- dosyanın sahibine ve yöneticiye görünür. (Supabase'e uygulandı: guncelleme17_depo_listeleme)
drop policy if exists "foto oku" on storage.objects;
drop policy if exists "avatar oku" on storage.objects;
create policy "foto oku" on storage.objects for select to authenticated
  using (bucket_id = 'report-photos' and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_admin()));
create policy "avatar oku" on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_admin()));
