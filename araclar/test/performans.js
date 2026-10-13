// Performans ölçümü (emülasyon — gerçek cihaz değildir):
//   "eski-android": 412×823 dokunmatik, CPU 6× yavaş, ağ "Slow 4G" (1,6 Mbit/s, 150 ms gecikme)
//   "akilli-tahta": 1920×1080 dokunmatik, CPU 6× yavaş, ağ 10 Mbit/s, 40 ms
// Ölçülenler: FCP, LCP, DOMContentLoaded, load, "harita hazır" (ilk nokta görünür), aktarılan bayt,
// 50 ms'den uzun görevlerin toplamı (TBT benzeri) ve harita kaydırma/yakınlaştırma sırasında kare süreleri.
// Kullanım: node araclar/test/performans.js [adres] [etiket]   (varsayılan http://localhost:8000/)
const { open } = require('./pw');
const SITE = process.argv[2] || require('./pw').SITE;
const TAG = process.argv[3] || '';
// GG_PROFIL=akilli-tahta → yalnız o profil; GG_HAFIF=1/0 → hafif modu zorla; GG_TEKRAR=3 → tekrar sayısı (medyan raporlanır)
const ONLY = process.env.GG_PROFIL, LITE = process.env.GG_HAFIF, REP = Number(process.env.GG_TEKRAR || 1);
const PROFILES = [
  { name: 'eski-android', mobile: true, w: 412, h: 823, cpu: 6, net: { latency: 150, down: 1.6e6 / 8, up: 750e3 / 8 } },
  { name: 'akilli-tahta', mobile: false, touch: true, w: 1920, h: 1080, cpu: 6, net: { latency: 40, down: 10e6 / 8, up: 5e6 / 8 } },
];

async function run(p) {
  const { browser, ctx, page } = await open({ mobile: p.mobile, w: p.w, h: p.h });
  if (p.mobile) await page.setViewportSize({ width: p.w, height: p.h });
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: p.net.latency, downloadThroughput: p.net.down, uploadThroughput: p.net.up });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: p.cpu });
  if (p.touch) await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 10 });
  let bytes = 0, jsBytes = 0; const types = {};
  cdp.on('Network.responseReceived', (e) => { types[e.requestId] = e.type; });
  cdp.on('Network.loadingFinished', (e) => { bytes += e.encodedDataLength; if (types[e.requestId] === 'Script') jsBytes += e.encodedDataLength; });
  if (LITE) await page.addInitScript((v) => { window.__ggLite = v; }, LITE);
  await page.addInitScript(() => {
    window.__lt = 0; window.__lcp = 0;
    try { new PerformanceObserver((l) => l.getEntries().forEach((e) => { window.__lt += Math.max(0, e.duration - 50); })).observe({ type: 'longtask', buffered: true }); } catch (e) {}
    try { new PerformanceObserver((l) => l.getEntries().forEach((e) => { window.__lcp = e.startTime; })).observe({ type: 'largest-contentful-paint', buffered: true }); } catch (e) {}
    try { if (window.__ggLite) localStorage.setItem('gg-lite', window.__ggLite); localStorage.setItem('gg-tur-gordu', '1'); localStorage.setItem('gyrh-install-x', String(Date.now())); } catch (e) {}
  });
  const out = { profil: p.name };
  // 1) ana sayfa ilk açılış
  const t0 = Date.now();
  await page.goto(SITE + '#/ana', { waitUntil: 'load', timeout: 120000 });
  out.ana_load_ms = Date.now() - t0;
  await page.waitForTimeout(1500);
  Object.assign(out, await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] || {};
    const fcp = (performance.getEntriesByName('first-contentful-paint')[0] || {}).startTime;
    return { ana_fcp_ms: Math.round(fcp || 0), ana_lcp_ms: Math.round(window.__lcp), ana_dcl_ms: Math.round(nav.domContentLoadedEventEnd || 0) };
  }));
  out.ana_kb = Math.round(bytes / 1024); out.ana_js_kb = Math.round(jsBytes / 1024);
  // 2) harita sayfası soğuk açılış (önbelleksiz yeni sayfa)
  bytes = 0; jsBytes = 0;
  const t1 = Date.now();
  await page.goto(SITE + '?x=' + Date.now() + '#/harita', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => document.querySelectorAll('#map .leaflet-marker-icon, #map path.leaflet-interactive').length > 2, null, { timeout: 120000, polling: 100 });
  out.harita_hazir_ms = Date.now() - t1;
  await page.waitForTimeout(2500);
  out.harita_kb = Math.round(bytes / 1024); out.harita_js_kb = Math.round(jsBytes / 1024);
  out.uzun_gorev_ms = Math.round(await page.evaluate(() => window.__lt));
  out.dom_dugum = await page.evaluate(() => document.getElementsByTagName('*').length);
  out.karo_sayisi = await page.evaluate(() => document.querySelectorAll('#map .leaflet-tile').length);
  // 3) kaydırma + yakınlaştırma sırasında kare süreleri (3 sn kaydır, sonra 3 yakınlaştır/uzaklaştır)
  const frames = await page.evaluate(() => new Promise((resolve) => {
    const map = window.GG && window.GG.get().map; if (!map) return resolve(null);
    const d = []; let last = performance.now(), t0 = last, step = 0;
    function f(now) {
      d.push(now - last); last = now;
      if (now - t0 < 3000) map.panBy([step++ % 120 < 60 ? 6 : -6, 3 * Math.sin(step / 10)], { animate: false });
      if (now - t0 < 6500) requestAnimationFrame(f); else resolve(d);
    }
    setTimeout(() => map.zoomIn(1), 3100); setTimeout(() => map.zoomOut(1), 4300); setTimeout(() => map.zoomIn(1), 5500);
    requestAnimationFrame(f);
  }));
  if (frames) {
    const s = frames.slice(1).sort((a, b) => a - b), n = s.length;
    out.kare_sayisi = n;
    out.ort_fps = Math.round(1000 / (frames.slice(1).reduce((a, b) => a + b, 0) / n));
    out.medyan_kare_ms = Math.round(s[Math.floor(n / 2)]);
    out.p95_kare_ms = Math.round(s[Math.floor(n * 0.95)]);
    out.en_uzun_kare_ms = Math.round(s[n - 1]);
    out.takilma_yuzde = Math.round(frames.filter((x) => x > 50).length / n * 100);
  }
  out.hafif_mod = await page.evaluate(() => document.documentElement.classList.contains('lite'));
  await browser.close();
  return out;
}

(async () => {
  const all = [];
  for (const p of PROFILES.filter((x) => !ONLY || x.name === ONLY)) {
    const runs = []; for (let i = 0; i < REP; i++) runs.push(await run(p));
    // her ölçüt için medyan
    const med = { profil: p.name, tekrar: REP };
    for (const k of Object.keys(runs[0])) if (k !== 'profil') { const v = runs.map((r) => r[k]); med[k] = typeof v[0] === 'number' ? v.sort((a, b) => a - b)[Math.floor(v.length / 2)] : v[0]; }
    all.push(med);
  }
  console.log(JSON.stringify({ site: SITE, etiket: TAG, tarih: new Date().toISOString(), sonuc: all }, null, 1));
})().catch((e) => { console.error(e); process.exit(1); });
