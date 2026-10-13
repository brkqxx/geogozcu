// Bildirim gönderme akışı (uçtan uca, sahte oturum — yazma istekleri yakalanır, veritabanına hiçbir şey gitmez):
// formu doldurur, gerçek bir JPEG ekler, gönderir; önizleme (.k.jpg) + özgün (.t.jpg) yüklemesini ve kayıttaki yolu denetler.
const path = require('path');
const fs = require('fs');
const { open, SITE } = require('./pw');
const sahteOturum = require('./sahte-oturum');

(async () => {
  const { browser, page, errs } = await open({ w: 1280, h: 900, geo: { latitude: 38.3196, longitude: 27.1569 } });
  const s = await sahteOturum(page);
  const bodies = [];
  page.on('request', (r) => { if (/rest\/v1\/reports/.test(r.url()) && r.method() === 'POST') bodies.push(r.postData()); });
  await page.goto(SITE + '#/bildir'); await page.waitForTimeout(3000);
  await page.locator('#cat-pick > *').first().click(); await page.waitForTimeout(500);
  const sub = page.locator('#sub-pick > *').first();
  if (await sub.count() && await sub.isVisible()) { await sub.click(); await page.waitForTimeout(600); }
  await page.locator('#btn-locate').click(); await page.waitForTimeout(1500);
  const jpg = fs.readFileSync(path.join(__dirname, '..', '..', 'media', 'hero-kapak.jpg'));
  await page.locator('#r-photo').setInputFiles({ name: 'deneme.jpg', mimeType: 'image/jpeg', buffer: jpg });
  await page.waitForTimeout(800);
  // görünen her zorunlu seçim grubunda ilk seçeneği işaretle
  await page.evaluate(() => {
    document.querySelectorAll('#form-rest fieldset').forEach((f) => {
      if (f.offsetParent === null) return;
      const r = f.querySelector('input[type=radio]'); if (r && !f.querySelector('input[type=radio]:checked')) { r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true })); }
    });
  });
  await page.fill('#r-name', 'Deneme Kullanıcı');
  await page.locator('#btn-send').click();
  await page.waitForTimeout(6000);
  const up = s.writes.filter((w) => /storage/.test(w));
  const ok = [];
  const chk = (n, c, i) => ok.push([n, !!c, i]);
  chk('önizleme yüklendi (.k.jpg)', up.some((w) => /\.k\.jpg/.test(w)), up.join(' | '));
  chk('özgün ".t.jpg" adıyla yüklendi', up.some((w) => /\.t\.jpg/.test(w)));
  chk('kayıt isteği gönderildi', bodies.length === 1, bodies.length);
  const body = bodies[0] ? JSON.parse(bodies[0]) : {};
  const row = Array.isArray(body) ? body[0] : body;
  chk('kayıttaki fotoğraf yolu .t.jpg', row && row.photo_paths && /\.t\.jpg$/.test(row.photo_paths[0]), row && row.photo_paths);
  chk('kayıtta önizleme yolu yok (yalnız özgün)', row && row.photo_paths && !row.photo_paths.some((p) => /\.k\.jpg$/.test(p)));
  chk('sayfa hatası yok', !errs.some((e) => /pageerror/.test(e)), errs.filter((e) => /pageerror/.test(e)).join(' | '));
  chk('başarı ekranı ya da mesaj', await page.evaluate(() => !document.getElementById('report-msg').textContent || /gönderildi|alındı|teşekkür/i.test(document.body.innerText)), await page.locator('#report-msg').textContent());
  let fail = 0;
  for (const [n, c, i] of ok) { if (!c) fail++; console.log((c ? 'GEÇTİ ' : 'KALDI ') + n + (i !== undefined && i !== true ? '  — ' + String(JSON.stringify(i)).slice(0, 160) : '')); }
  console.log(ok.length - fail + '/' + ok.length + ' geçti');
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
