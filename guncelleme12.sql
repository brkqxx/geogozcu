-- =====================================================================
-- GÜNCELLEME 12  —  Sunucu rolü (service_role) izinleri
-- (Claude tarafından Supabase'e uygulandı; kayıt için duruyor.)
-- Sorun: service_role'ün public şemadaki hiçbir tabloda izni yoktu. Bu yüzden
--   * admin-user fonksiyonu yöneticiyi okuyamıyor, "Sadece yöneticiler" diyordu (hesap silme çalışmıyordu)
--   * signup fonksiyonunun IP sınırı (saatte 10 kayıt) ve ban kontrolü sessizce çalışmıyordu.
-- service_role yalnızca sunucu fonksiyonlarında kullanılır, tarayıcıya hiç gitmez.
-- =====================================================================
grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
alter default privileges in schema public grant execute on functions to service_role;
