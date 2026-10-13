// Playwright yardımcı: gerçek hesaba dokunmadan "giriş yapılmış" deneme.
// Sahte oturum localStorage'a yazılır; Supabase istekleri yakalanır: auth/profil sahte, diğer okumalar anonim anahtarla gerçek veritabanından,
// yazma (POST/PATCH/DELETE) ve dosya yükleme istekleri sahte cevapla kesilir — hiçbir veri değişmez.
module.exports = async function sahteOturum(page, { admin = false, name = 'deneme' } = {}) {
  const REF = 'ogrkwkefbhofmxeukuhe';
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  const exp = Math.floor(Date.now() / 1000) + 3600 * 24;
  const uid = '00000000-0000-4000-8000-000000000001';
  const user = { id: uid, aud: 'authenticated', role: 'authenticated', email: 'deneme@ornek.test', email_confirmed_at: '2026-01-01T00:00:00Z', app_metadata: { provider: 'email' }, user_metadata: { username: name }, created_at: '2026-01-01T00:00:00Z' };
  const token = b64({ alg: 'HS256', typ: 'JWT' }) + '.' + b64({ sub: uid, role: 'authenticated', aud: 'authenticated', exp, email: user.email }) + '.sahte';
  const session = { access_token: token, token_type: 'bearer', expires_in: 86400, expires_at: exp, refresh_token: 'sahte', user };
  await page.addInitScript(([k, v]) => { try { localStorage.setItem(k, v); localStorage.setItem('gyrh-remember', 'yes'); localStorage.setItem('gg-tur-gordu', '1'); localStorage.setItem('gyrh-install-x', String(Date.now())); } catch (e) {} }, ['sb-' + REF + '-auth-token', JSON.stringify(session)]);
  const profile = { id: uid, username: name, full_name: 'Deneme Kullanıcı', is_admin: admin, onboarded_at: '2026-01-01T00:00:00Z', created_at: '2026-01-01T00:00:00Z', points: 0, notify_push: false, notify_email: false, notify_system: true };
  const writes = [];
  await page.route(/supabase\.co\//, async (route) => {
    const req = route.request(), url = req.url(), m = req.method();
    const json = (body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    if (/\/auth\/v1\/user/.test(url)) return json(user);
    if (/\/auth\/v1\/logout/.test(url)) return route.fulfill({ status: 204, body: '' });
    if (/\/rest\/v1\/profiles/.test(url) && m === 'GET') return json(/limit=1|maybeSingle|id=eq/.test(url) || req.headers().accept === 'application/vnd.pgrst.object+json' ? profile : [profile]);
    if (/\/rest\/v1\/rpc\/(my_ban|touch_last_seen)/.test(url)) return json(null);
    if (/\/rest\/v1\/rpc\/user_tags/.test(url)) return json({ reports: 0, unlocked: [] });
    if (/\/storage\/v1\/object\//.test(url) && m !== 'GET') { writes.push(m + ' ' + url); return json({ Key: 'sahte' }); }
    if (m !== 'GET' && m !== 'HEAD' && !/\/rpc\/(vote_counts|leaderboard|public_profile|check_username|admin_observer_names|admin_stats)/.test(url)) {
      writes.push(m + ' ' + url.replace(/\?.*/, ''));
      return json(/reports/.test(url) ? [{ id: 'sahte-1' }] : {}, 201);
    }
    const h = Object.assign({}, req.headers()); h.authorization = 'Bearer ' + h.apikey;
    return route.continue({ headers: h });
  });
  return { writes, uid };
};
