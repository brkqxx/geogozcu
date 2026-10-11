async (page) => {
  const SITE = "http://localhost:8000/test-live.html", T = [0,14180,28040,38460,47120], D = [14180,13860,10420,8660,7460], END = 54580, SW = 42232;
  const sleep = (ms) => page.waitForTimeout(ms);
  await page.setViewportSize({ width: 1920, height: 1080 });
  // kurulum önerisi kayıtta görünmesin; harita karolarını önceden ısıt
  await page.goto(SITE + '#/ana');
  await page.evaluate(() => { try { localStorage.setItem('gyrh-install-x', String(Date.now())); localStorage.setItem('gg-tur-gordu', '1'); } catch (e) {} });
  await page.goto(SITE + '#/harita'); await sleep(3500);
  // kayıttaki yakınlaşmanın uydu karolarını önceden önbelleğe al
  await page.locator('.focus-btn [data-f=g]').click(); await sleep(2500);
  if (await page.locator('.leaflet-marker-icon.cluster').count()) { await page.locator('.leaflet-marker-icon.cluster').first().click(); await sleep(4000); }
  await page.goto(SITE + '#/proje'); await sleep(1500);
  await page.goto(SITE + '#/liderler'); await sleep(1500);
  await page.goto('about:blank');
  await page.screencast.start({ path: "C:/Users/uberk/Downloads/files/araclar/video/tanitim.webm", size: { width: 1920, height: 1080 } });
  // gerçek kullanım hissi: görünür imleç (başlık balonu yok)
  await page.screencast.showActions({ cursor: 'pointer', duration: 450, style: { title: 'display: none' } });
  const t0 = Date.now();
  const at = (ms) => sleep(Math.max(0, ms - (Date.now() - t0)));
  const log = [];
  const mark = (n) => log.push(n + ' ' + ((Date.now() - t0) / 1000).toFixed(2));
  const glide = (x, y, steps = 30) => page.mouse.move(x, y, { steps });
  // kaydırma tarayıcının yumuşak kaydırmasıyla (imleç gösterimi fare tekerleği adımlarını yavaşlattığı için)
  const scrollTo = (y) => page.evaluate((v) => window.scrollTo({ top: v, behavior: 'smooth' }), y);
  // 2 · ana sayfa: başlık satır satır açılır, kayan şerit ve rehber, sonra haritayı aç
  mark('site'); await page.goto(SITE + '#/ana'); await page.mouse.move(1500, 300);
  await sleep(1600); await glide(1180, 420, 50);
  await scrollTo(840); await sleep(2900); await scrollTo(0); await sleep(1100);
  const cta = page.locator('#view-home a.btn[href="#/harita"]').first();
  await at(T[0] + D[0] - 2600); await cta.click();
  // 3 · harita: Gaziemir odağı, kümeye yakınlaş
  await at(T[1]); mark('harita');
  await page.locator('.focus-btn [data-f=g]').click();
  await sleep(1800);
  const cls = page.locator('.leaflet-marker-icon.cluster');
  for (let i = 0; i < Math.min(await cls.count(), 3); i++) { await cls.nth(i).hover(); await sleep(700); }
  await at(T[1] + D[1] - 2200);
  const cl = cls.first();
  if (await cl.count()) await cl.click();
  // 4 · gözlem ayrıntısı: risk puanı ve "düzeldi mi?" oylaması
  await at(T[2]); mark('puan');
  const pins = page.locator('.leaflet-marker-icon.pin');
  let opened = false;
  for (let i = 0; i < Math.min(await pins.count(), 12) && !opened; i++) {
    const pb = await pins.nth(i).boundingBox();
    if (pb && pb.x > 380 && pb.x < 1500 && pb.y > 160 && pb.y < 900) { await pins.nth(i).click(); opened = true; }
  }
  if (!opened) mark('pin-bulunamadi');
  // 5 · veriler: proje sayfasındaki grafikler, ardından liderlik tablosu
  await at(T[3]); mark('veri');
  await page.goto(SITE + '#/proje'); await sleep(600);
  await page.evaluate(() => { const el = document.getElementById('pj-results'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  await glide(900, 600, 40);
  await at(SW);
  await page.goto(SITE + '#/liderler'); await page.mouse.move(960, 500);
  // 6 · kapanış: ana sayfa + proje kimliği kartı
  await at(T[4]); mark('kapanis');
  await page.goto(SITE + '#/ana'); await page.mouse.move(960, 700);
  await sleep(900);
  await page.screencast.hideActions();
  await page.screencast.showOverlay('<div style="position:absolute;inset:0;display:grid;place-items:center;background:rgba(8,14,11,.86);font-family:Bricolage Grotesque,Instrument Sans,sans-serif;color:#EAF2EC;animation:gg .8s ease-out both"><style>@keyframes gg{from{opacity:0}to{opacity:1}}</style><div style="text-align:center"><div style="font:500 18px JetBrains Mono,monospace;letter-spacing:.18em;color:#F5A524">EGEV 100. YIL LİSESİ · TÜBİTAK</div><div style="font-weight:800;font-size:120px;letter-spacing:-3px;margin:14px 0 6px">GeoGözcü</div><div style="font-size:30px;color:#C9D8CF">Gaziemir’in dijital yangın gözcüsü</div><div style="font:500 22px JetBrains Mono,monospace;margin-top:34px;color:#A9BDB1">geogozcu.pages.dev</div></div></div>');
  await at(END + 300); mark('son');
  await page.screencast.stop();
  return log.join('\n');
}