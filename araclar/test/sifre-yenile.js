// Şifre yenileme akışı denemesi (Supabase Auth istekleri yakalanır; gerçek e-posta / hesap kullanılmaz).
// Senaryolar: süresi dolmuş bağlantı, doğrudan açılış, geçerli bağlantı, doğrulama hataları, yenileme (F5),
// başarılı kayıt (diğer oturumlar kapanır), kayıtta oturum süresi dolmuş.
const { open, SITE } = require('./pw');

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
const uid = '00000000-0000-4000-8000-0000000000aa';
const user = { id: uid, aud: 'authenticated', role: 'authenticated', email: 'deneme@ornek.test', email_confirmed_at: '2026-01-01T00:00:00Z', app_metadata: { provider: 'email' }, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' };
const exp = () => Math.floor(Date.now() / 1000) + 3600;
const token = () => b64({ alg: 'HS256', typ: 'JWT' }) + '.' + b64({ sub: uid, role: 'authenticated', aud: 'authenticated', exp: exp(), email: user.email, amr: [{ method: 'recovery', timestamp: Math.floor(Date.now() / 1000) }] }) + '.sahte';
const results = [];
const check = (n, c, i) => results.push([n, !!c, i]);

// Auth isteklerini yakala: /user (GET/PUT), /logout, /recover. Diğer okumalar anonim anahtarla devam eder.
async function auth(page, { putStatus = 200 } = {}) {
  const log = [];
  await page.route(/supabase\.co\//, async (route) => {
    const r = route.request(), u = r.url(), m = r.method();
    const json = (b, st = 200) => route.fulfill({ status: st, contentType: 'application/json', body: JSON.stringify(b) });
    if (/\/auth\/v1\/user/.test(u) && m === 'GET') return json(user);
    if (/\/auth\/v1\/user/.test(u) && m === 'PUT') {
      const body = JSON.parse(r.postData() || '{}'); log.push('PUT user parola:' + (body.password ? 'var' : 'yok'));
      return putStatus === 200 ? json(user) : json({ code: 'session_expired', error_code: 'session_expired', msg: 'Session expired' }, putStatus);
    }
    if (/\/auth\/v1\/logout/.test(u)) { log.push('logout ' + (new URL(u).searchParams.get('scope') || 'global')); return route.fulfill({ status: 204, body: '' }); }
    if (/\/auth\/v1\/recover/.test(u)) { log.push('recover redirect_to=' + new URL(u).searchParams.get('redirect_to')); return json({}); }
    if (/\/rest\/v1\/(activity_log|notification)/.test(u)) return json(m === 'GET' ? [] : {}, m === 'GET' ? 200 : 201);
    if (/\/rest\/v1\/profiles/.test(u)) return json(null);
    if (/\/rest\/v1\/rpc\/(my_ban|touch_last_seen|user_tags)/.test(u)) return json(null);
    if (m !== 'GET' && !/\/rpc\/(vote_counts|leaderboard|public_profile|check_username)/.test(u)) return json({}, 201);
    const h = Object.assign({}, r.headers()); h.authorization = 'Bearer ' + h.apikey;
    return route.continue({ headers: h });
  });
  return log;
}
const vis = (page, id) => page.locator('#' + id).isVisible();
const recoveryUrl = () => SITE + '?sifre=1#access_token=' + token() + '&expires_at=' + exp() + '&expires_in=3600&refresh_token=sahte-yenileme&token_type=bearer&type=recovery';

(async () => {
  // A) süresi dolmuş bağlantı (Supabase'in gerçek hata biçimi) + yeni bağlantı isteme
  {
    const { browser, page, errs } = await open({ w: 1280, h: 860 });
    const log = await auth(page);
    await page.goto(SITE + '?sifre=1#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired&sb=');
    await page.waitForTimeout(3500);
    check('A süresi dolmuş: şifre yenileme sayfası açıldı', await page.evaluate(() => location.hash) === '#/sifre-yenile', await page.evaluate(() => location.href));
    check('A süresi dolmuş: açık mesaj', /süresi dolmuş/.test(await page.locator('#rs-invalid-text').textContent()));
    check('A adres temizlendi (hata/sifre parametresi yok)', !/error_code|sifre=1/.test(await page.evaluate(() => location.href)));
    await page.fill('#rs-mail', 'yanlis'); await page.locator('#form-reset-again button[type=submit]').click(); await page.waitForTimeout(300);
    check('A geçersiz e-posta uyarısı', /Geçerli/.test(await page.locator('#reset-again-msg').textContent()));
    await page.fill('#rs-mail', 'deneme@ornek.test'); await page.locator('#form-reset-again button[type=submit]').click(); await page.waitForTimeout(1500);
    check('A yeni bağlantı istendi (dönüş adresi ?sifre=1)', log.some((l) => /recover redirect_to=.*\?sifre=1/.test(l)), log.join(' | '));
    check('A gönderildi mesajı', /gönderildi/.test(await page.locator('#reset-again-msg').textContent()));
    check('A sayfa hatası yok', !errs.some((e) => /pageerror/.test(e)), errs.join(' | '));
    await browser.close();
  }
  // B) doğrudan açılış, oturum yok
  {
    const { browser, page } = await open({ w: 390, h: 844, mobile: true });
    await auth(page);
    await page.goto(SITE + '#/sifre-yenile'); await page.waitForTimeout(3500);
    check('B doğrudan açılış: form gizli, açıklama görünür', !(await vis(page, 'form-reset')) && (await vis(page, 'rs-invalid')));
    await page.reload(); await page.waitForTimeout(3000);
    check('B yenileyince de aynı sayfa', await page.evaluate(() => location.hash) === '#/sifre-yenile' && (await vis(page, 'rs-invalid')));
    await browser.close();
  }
  // C) geçerli bağlantı → doğrulama hataları → F5 → başarılı kayıt
  {
    const { browser, page, errs } = await open({ w: 390, h: 844, mobile: true });
    const log = await auth(page);
    await page.goto(recoveryUrl()); await page.waitForTimeout(4500);
    check('C geçerli bağlantı: form görünür', await vis(page, 'form-reset'), await page.evaluate(() => location.href));
    check('C iki alan var (yeni + tekrar)', (await vis(page, 'rs-pass')) && (await vis(page, 'rs-pass2')));
    check('C jeton adres çubuğunda kalmadı', !/access_token/.test(await page.evaluate(() => location.href)));
    check('C e-posta maskeli', /d•••@ornek\.test/.test(await page.locator('#rs-who').textContent()), await page.locator('#rs-who').textContent());
    const save = page.locator('#rs-save');
    await page.fill('#rs-pass', 'kisa'); await save.tap(); await page.waitForTimeout(200);
    check('C kısa şifre uyarısı', /en az 8/.test(await page.locator('#reset-msg').textContent()));
    await page.fill('#rs-pass', 'Gozcu2026dag'); await page.fill('#rs-pass2', 'Gozcu2026dah'); await save.tap(); await page.waitForTimeout(200);
    check('C eşleşmeyen şifre uyarısı', /aynı değil/.test(await page.locator('#reset-msg').textContent()));
    check('C hatalı denemede istek gitmedi', !log.some((l) => /PUT/.test(l)));
    await page.reload(); await page.waitForTimeout(4000);
    check('C F5 sonrası form hâlâ açık', await vis(page, 'form-reset'));
    await page.fill('#rs-pass', 'Gozcu2026dag'); await page.fill('#rs-pass2', 'Gozcu2026dag'); await page.locator('#rs-save').tap(); await page.waitForTimeout(2500);
    check('C başarı ekranı', await vis(page, 'rs-done'));
    check('C şifre isteği gönderildi', log.some((l) => /PUT user parola:var/.test(l)), log.join(' | '));
    check('C diğer oturumlar kapatıldı (scope=others)', log.some((l) => /logout others/.test(l)));
    check('C alanlar temizlendi', (await page.inputValue('#rs-pass')) === '' && (await page.inputValue('#rs-pass2')) === '');
    const leaked = await page.evaluate(() => JSON.stringify(Object.assign({}, sessionStorage)).includes('Gozcu2026dag') || JSON.stringify(Object.assign({}, localStorage)).includes('Gozcu2026dag'));
    check('C şifre tarayıcı belleğine yazılmadı', !leaked);
    check('C işaret temizlendi', await page.evaluate(() => !sessionStorage.getItem('gg-sifre-yenile')));
    await page.locator('#rs-done a.btn').tap(); await page.waitForTimeout(1500);
    check('C "Haritaya git" çalışır', await page.evaluate(() => location.hash) === '#/harita');
    check('C sayfa hatası yok', !errs.some((e) => /pageerror/.test(e)), errs.filter((e) => /pageerror/.test(e)).join(' | '));
    await browser.close();
  }
  // D) kaydederken oturum süresi dolmuş
  {
    const { browser, page } = await open({ w: 1280, h: 860 });
    await auth(page, { putStatus: 401 });
    await page.goto(recoveryUrl()); await page.waitForTimeout(4500);
    await page.fill('#rs-pass', 'Gozcu2026dag'); await page.fill('#rs-pass2', 'Gozcu2026dag'); await page.locator('#rs-save').click(); await page.waitForTimeout(2000);
    check('D süresi dolmuş oturum: yeni bağlantı isteme ekranı', await vis(page, 'rs-invalid'), await page.locator('#rs-invalid-text').textContent());
    check('D düğme tekrar kullanılabilir', !(await page.locator('#rs-save').isDisabled()));
    await browser.close();
  }
  let fail = 0;
  for (const [n, c, i] of results) { if (!c) fail++; console.log((c ? 'GEÇTİ ' : 'KALDI ') + n + (i !== undefined && i !== true && !c ? '  — ' + String(i).slice(0, 200) : '')); }
  console.log(results.length - fail + '/' + results.length + ' geçti');
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
