async (page) => {
  const SITE = "http://localhost:8000/test-live.html", T = [0,7140,14200,23200,32200,39260,45360,52360,57360,63360], D = [7140,7060,9000,9000,7060,6100,7000,5000,6000,6000], END = 69360;
  const sleep = (ms) => page.waitForTimeout(ms);
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'no-preference' });
  // kurulum önerisi ve tur daveti kayıtta görünmesin; harita karolarını önceden ısıt
  await page.goto(SITE + '#/ana');
  await page.evaluate(() => { try { localStorage.setItem('gyrh-install-x', String(Date.now())); localStorage.setItem('gg-tur-gordu', '1'); } catch (e) {} });
  await page.goto(SITE + '#/harita'); await sleep(3500);
  await page.locator('.focus-btn [data-f=g]').click(); await sleep(2500);
  if (await page.locator('.leaflet-marker-icon.cluster').count()) { await page.locator('.leaflet-marker-icon.cluster').first().click(); await sleep(3500); }
  for (const r of ['proje', 'liderler', 'giris']) { await page.goto(SITE + '#/' + r); await sleep(1400); }
  await page.goto('about:blank');
  await page.screencast.start({ path: "C:/Users/uberk/Downloads/files/araclar/video/tanitim.webm", size: { width: 1920, height: 1080 } });
  await page.screencast.showActions({ cursor: 'pointer', duration: 420, style: { title: 'display: none' } });
  const t0 = Date.now();
  const at = (ms) => sleep(Math.max(0, ms - (Date.now() - t0)));
  const log = [];
  const mark = (n) => log.push(n + ' ' + ((Date.now() - t0) / 1000).toFixed(2));
  const glide = (x, y, steps = 30) => page.mouse.move(x, y, { steps });
  const scrollTo = (y) => page.evaluate((v) => window.scrollTo({ top: v, behavior: 'smooth' }), y);
  const nav = (txt) => page.locator('.top .nav a', { hasText: txt }).first();
  // 1 · ana sayfa: film arka planı, başlık satır satır açılır
  mark('giris'); await page.goto(SITE + '#/ana'); await page.mouse.move(1400, 300);
  await sleep(1500); await glide(700, 560, 60); await sleep(900); await glide(330, 830, 50);
  // 2 · canlı durum göstergesi
  await at(T[1]); mark('gosterge');
  await page.evaluate(() => { const s = document.querySelector('.home-live'); if (s) window.scrollTo({ top: s.getBoundingClientRect().top + scrollY - 90, behavior: 'smooth' }); });
  await sleep(1200);
  const dial = page.locator('#hm-dial'); const db = await dial.boundingBox(); if (db) await glide(db.x + db.width / 2, db.y + db.height * 0.45, 50);
  // 3 · harita: odak, kümeler
  await at(T[2] - 400); mark('harita');
  await nav('Harita').click(); await sleep(1600);
  await page.locator('.focus-btn [data-f=g]').click(); await sleep(1800);
  const cls = page.locator('.leaflet-marker-icon.cluster');
  for (let i = 0; i < Math.min(await cls.count(), 3); i++) { await cls.nth(i).hover(); await sleep(650); }
  // 4 · risk türleri anahtarı + ölçüm araçları (canlı mesafe ölçümü)
  await at(T[3]); mark('araclar');
  await page.evaluate(() => { const l = document.getElementById('legend'); if (!l.classList.contains('closed')) document.getElementById('legend-toggle').click(); });
  await page.locator('#legend-toggle').click(); await sleep(1400);
  await page.locator('#legend-toggle').click(); await sleep(300);
  await page.locator('.gg-tools [data-tool=more]').hover(); await sleep(650);
  await page.locator('.gg-fly [data-tool=measure]').click(); await sleep(600);
  await page.mouse.click(380, 760); await sleep(450);
  await page.mouse.click(640, 880); await sleep(450);
  await page.mouse.click(900, 720); await sleep(500);
  mark('olcum:' + await page.evaluate(() => document.querySelector('.gg-hud-val b').textContent));
  await at(T[3] + D[3] - 900);
  await page.locator('.gg-hud [data-hud=close]').click().catch(() => {});
  // 5 · gözlem ayrıntısı: puan ve oylama
  await at(T[4]); mark('gozlem');
  const pins = page.locator('.leaflet-marker-icon.pin'); let opened = false;
  for (let i = 0; i < Math.min(await pins.count(), 14) && !opened; i++) {
    const pb = await pins.nth(i).boundingBox();
    if (pb && pb.x > 380 && pb.x < 1450 && pb.y > 200 && pb.y < 900) { await pins.nth(i).click(); opened = true; }
  }
  if (!opened) mark('pin-bulunamadi'); else { await sleep(900); mark('popup:' + !!(await page.locator('.leaflet-popup-content').count())); }
  // 6 · liste ve filtreler
  await at(T[5]); mark('liste');
  await page.locator('.leaflet-popup-close-button').click().catch(() => {});
  const chip = page.locator('.panel button', { hasText: 'Yangın riski' }).first();
  if (await chip.count()) { await chip.click(); await sleep(1600); await page.locator('.panel button', { hasText: 'Tümü' }).first().click(); }
  // 7 · giriş / kayıt ekranı (film + giriş animasyonu)
  await at(T[6] - 300); mark('katil');
  await nav('Giriş yap').click(); await sleep(2200);
  const tab = page.locator('#tab-login'); if (await tab.count()) { await tab.hover(); await sleep(900); }
  // 8 · liderlik tablosu
  await at(T[7] - 300); mark('liderler');
  await nav('Liderler').click();
  // 9 · proje sayfası
  await at(T[8] - 300); mark('proje');
  await nav('Proje').click(); await sleep(900);
  await page.evaluate(() => { const el = document.getElementById('pj-results'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  await sleep(1300); await glide(900, 600, 40);
  // 10 · kapanış: ana sayfa + proje kimliği kartı
  await at(T[9] - 200); mark('kapanis');
  await page.goto(SITE + '#/ana'); await page.mouse.move(960, 700);
  await sleep(1000);
  await page.screencast.hideActions();
  await page.screencast.showOverlay('<div style="position:absolute;inset:0;display:grid;place-items:center;background:rgba(3,8,11,.9);color:#F5FAF6;font-family:Poppins,Helvetica Neue,Arial,sans-serif;animation:gg .8s ease-out both"><style>@keyframes gg{from{opacity:0}to{opacity:1}}</style><div style="text-align:center"><div style="width:72px;height:72px;margin:0 auto 26px;border-radius:50%;background:#030909;border:1px solid rgba(136,222,204,.35);display:grid;place-items:center;color:#7CC6B5"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c1 3 4 5 4 9a4 4 0 0 1-8 0c0-2 1-3 2-4 0 2 1 2 1 2 0-3 0-5 1-7z"/></svg></div><div style="font-weight:300;font-size:120px;letter-spacing:-4px;line-height:1">GeoGözcü</div><div style="font-size:28px;color:#ECF1EF;opacity:.82;margin-top:16px;font-weight:300">yangını, çıkmadan önce görmek için</div><div style="font:600 17px Instrument Sans,Arial,sans-serif;letter-spacing:.2em;text-transform:uppercase;color:#88DECC;margin-top:38px">EGEV 100. Yıl Lisesi · TÜBİTAK</div><div style="font:500 20px Instrument Sans,Arial,sans-serif;margin-top:12px;color:rgba(236,241,239,.62)">geogozcu.pages.dev</div></div></div>');
  await at(END + 300); mark('son');
  await page.screencast.stop();
  return log.join('\n');
}