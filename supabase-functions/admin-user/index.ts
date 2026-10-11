// Yönetici işlemleri (Supabase Edge Function): şifre belirleme, hesap SİLME, eski Auth kilitlerini açma.
// Tüm yöneticiler aynı yetkiye sahiptir; 'Kurucu' yalnızca görünen bir rozettir.
// Yöneticiler birbirini silemez ve birbirinin şifresini değiştiremez (önce yöneticilik alınmalı).
// Sürüm 10'dan itibaren banlar Auth kilidi kullanmaz: banlı kişi oturumda kalır ama uygulama içinde sadece haritayı görür.
// Gizli service_role anahtarı yalnızca sunucuda durur, tarayıcıya hiç gitmez.
import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-device-id',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'POST bekleniyor' }, 405);

  const url = Deno.env.get('SUPABASE_URL')!;
  const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const authHeader = req.headers.get('Authorization') ?? '';

  // 1) Çağıran kim? Yönetici mi?
  const asCaller = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
  const { data: { user } } = await asCaller.auth.getUser();
  if (!user) return json({ error: 'Giriş gerekli' }, 401);
  const admin = createClient(url, service, { auth: { persistSession: false } });
  const { data: caller } = await admin.from('profiles').select('is_admin').eq('id', user.id).maybeSingle();
  if (!caller || !caller.is_admin) return json({ error: 'Sadece yöneticiler' }, 403);

  let body: { action?: string; user_id?: string; hours?: number | null; password?: string };
  try { body = await req.json(); } catch { return json({ error: 'Geçersiz istek' }, 400); }
  const { action, user_id } = body;
  if (!user_id || !/^[0-9a-f-]{36}$/i.test(user_id)) return json({ error: 'Geçersiz kullanıcı' }, 400);
  if (user_id === user.id) return json({ error: 'Kendi hesabın için Ayarlar → Güvenlik bölümünü kullan' }, 400);

  // Yöneticiler kilitlenemez
  const { data: target } = await admin.from('profiles').select('is_admin, username, email, special_tags').eq('id', user_id).maybeSingle();
  if (!target) return json({ error: 'Kullanıcı bulunamadı' }, 404);
  if (action === 'ban' && target.is_admin) return json({ error: 'Önce yöneticiliğini kaldır' }, 400);

  // Hesabı kalıcı sil (kullanıcı, bildirimleri, oyları, fotoğrafları). Yönetici hesapları silinemez.
  if (action === 'delete_user') {
    if (target.is_admin) return json({ error: 'Yöneticiler birbirini silemez. Önce bu kişinin yöneticiliğini al.' }, 403);
    // fotoğrafları depodan temizle
    const { data: reps } = await admin.from('reports').select('photo_paths, photo_path').eq('user_id', user_id);
    const paths = (reps || []).flatMap((r: { photo_paths: string[] | null; photo_path: string | null }) => r.photo_paths?.length ? r.photo_paths : (r.photo_path ? [r.photo_path] : []));
    for (let i = 0; i < paths.length; i += 100) await admin.storage.from('report-photos').remove(paths.slice(i, i + 100));
    const { data: av } = await admin.storage.from('avatars').list(user_id);
    if (av && av.length) await admin.storage.from('avatars').remove(av.map((f: { name: string }) => user_id + '/' + f.name));
    await admin.rpc('log_event', { p_user: user.id, p_action: 'user_delete', p_detail: '@' + target.username + ' (' + (target.email || '?') + ') hesabı silindi · ' + paths.length + ' fotoğraf', p_target: null });
    const { error } = await admin.auth.admin.deleteUser(user_id);
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true, action, username: target.username, photos: paths.length });
  }
  // Yönetici kullanıcıya yeni şifre belirler (başka bir yöneticinin şifresi değiştirilemez)
  if (action === 'set_password') {
    if (target.is_admin) return json({ error: 'Başka bir yöneticinin şifresi değiştirilemez.' }, 403);
    const pw = String(body.password ?? '');
    if (pw.length < 8 || pw.length > 72) return json({ error: 'Şifre 8-72 karakter olmalı' }, 400);
    const { error } = await admin.auth.admin.updateUserById(user_id, { password: pw });
    if (error) return json({ error: error.message }, 500);
    await admin.rpc('log_event', { p_user: user.id, p_action: 'admin_password', p_detail: '@' + target.username + ' için yeni şifre belirlendi', p_target: user_id });
    return json({ ok: true, action, username: target.username });
  }

  let ban_duration: string;
  if (action === 'ban') {
    const h = Number(body.hours);
    ban_duration = Number.isFinite(h) && h > 0 ? `${Math.round(h)}h` : '876000h'; // ~100 yıl = süresiz
  } else if (action === 'unban') {
    ban_duration = 'none';
  } else {
    return json({ error: 'Bilinmeyen işlem' }, 400);
  }

  const { error } = await admin.auth.admin.updateUserById(user_id, { ban_duration });
  if (error) return json({ error: error.message }, 500);
  return json({ ok: true, action, username: target.username, ban_duration });
});
