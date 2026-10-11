// Kayıt (Supabase Edge Function): e-posta doğrulaması GÖNDERMEDEN onaylı hesap açar.
// Neden? Supabase'in ücretsiz mail sunucusu saatte birkaç mail atıyor; sahada 5-10 kişi aynı anda
// kayıt olunca "çok fazla istek" hatası veriyordu. Kötüye kullanıma karşı: IP başına saatte 10 kayıt,
// banlı IP/cihaz engeli, kullanıcı adı kara liste/benzersizlik denetimi.
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

  let body: { email?: string; password?: string; username?: string };
  try { body = await req.json(); } catch { return json({ error: 'Geçersiz istek' }, 400); }
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const username = String(body.username || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 200) return json({ error: 'Geçerli bir e-posta yaz.' }, 400);
  if (password.length < 8 || password.length > 72) return json({ error: 'Şifre 8-72 karakter olmalı.' }, 400);

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const ip = (req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || null;
  const device = (req.headers.get('x-device-id') || '').replace(/[^A-Za-z0-9-]/g, '').slice(0, 64) || null;

  // banlı IP / cihaz
  const now = new Date().toISOString();
  const { data: bans } = await admin.from('bans').select('ip, device_id, expires_at, lifted_at')
    .is('lifted_at', null).or(`expires_at.is.null,expires_at.gt.${now}`);
  if ((bans || []).some((b) => (ip && b.ip === ip) || (device && b.device_id === device)))
    return json({ error: 'Bu cihaz veya bağlantı kısıtlanmış, kayıt olunamaz.' }, 403);

  // hız sınırı: aynı IP'den 1 saatte en fazla 10 kayıt
  if (ip) {
    const since = new Date(Date.now() - 3600e3).toISOString();
    const { count } = await admin.from('signup_attempts').select('id', { count: 'exact', head: true }).eq('ip', ip).gte('created_at', since);
    if ((count || 0) >= 10) return json({ error: 'Bu bağlantıdan çok fazla kayıt yapıldı. Biraz sonra tekrar dene.' }, 429);
  }

  // kullanıcı adı: biçim, kara liste, benzersizlik
  const { data: problem, error: chkErr } = await admin.rpc('check_username', { p: username });
  if (chkErr) return json({ error: 'Kullanıcı adı denetlenemedi.' }, 500);
  if (problem) return json({ error: problem }, 400);

  await admin.from('signup_attempts').insert({ ip });
  const { error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { username } });
  if (error) {
    if (/already|registered|exists/i.test(error.message)) return json({ error: 'Bu e-posta zaten kayıtlı. Giriş yapmayı dene.', code: 'exists' }, 409);
    if (/password/i.test(error.message)) return json({ error: 'Bu şifre çok zayıf, daha güçlü bir şifre seç.' }, 400);
    return json({ error: error.message }, 500);
  }
  return json({ ok: true });
});
