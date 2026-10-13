// Tüm sayfaların denetimi: her yol doğrudan açılır (yenileme dahil), telefon ve masaüstünde, ziyaretçi ve giriş yapmış kullanıcıyla.
// Toplananlar: konsol/sayfa hataları, başarısız istekler, yatay taşma, düzen kayması (CLS), adı olmayan denetimler,
// alt metni olmayan görseller ve üstü başka öğeyle kapanmış görünür düğmeler. Hiçbir veri yazılmaz (sahte oturum).
// Kullanım: node araclar/test/denetim.js   (yerel sunucu açık olmalı)
const { open, SITE } = require('./pw');
const sahteOturum = require('./sahte-oturum');

const ROUTES = { ziyaretci: ['ana', 'harita', 'proje', 'liderler', 'giris', 'sifre-yenile', 'profil/olmayan-kisi', 'yok-boyle-sayfa'],
  kullanici: ['harita', 'bildir', 'bildirimlerim', 'gelen', 'ayarlar', 'ayarlar/gorunum', 'ayarlar/guvenlik', 'liderler', 'proje', 'sifre-yenile'] };

async function audit(page) {
  return page.evaluate(() => {
    const out = { tasma: [], adsiz: [], altsiz: [], kapali: [] };
    const W = document.documentElement.clientWidth, H = innerHeight;
    const name = (e) => (e.getAttribute('aria-label') || e.getAttribute('title') || e.textContent || e.getAttribute('alt') || e.value || '').trim()
      || (e.id && document.querySelector('label[for="' + e.id + '"]') ? 'label' : '') || (e.closest('label') ? 'label' : '')
      || (e.getAttribute('aria-labelledby') ? 'labelledby' : '') || (e.querySelector('img[alt]:not([alt=""]),svg title') ? 'img' : '');
    const visible = (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > 0.05 && !e.closest('[hidden],details:not([open])'); };
    const tag = (e) => (e.id ? '#' + e.id : e.tagName.toLowerCase() + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.') : '')).slice(0, 48);
    document.querySelectorAll('body *').forEach((e) => {
      if (!visible(e)) return;
      const r = e.getBoundingClientRect(), cs = getComputedStyle(e);
      if (r.right > W + 2 && cs.position !== 'fixed' && !e.closest('.leaflet-container,.mq,.mq-track,[data-scroll-x]')) {
        // sabit (fixed) bir kabın içindeki öğe sayfayı yatay kaydıramaz (ör. üstteki yükleme çubuğunun kayan parçası)
        let p = e.parentElement, sc = false;
        while (p && p !== document.body) { const pc = getComputedStyle(p), o = pc.overflowX; if (pc.position === 'fixed' || o === 'auto' || o === 'scroll' || o === 'hidden' || o === 'clip') { sc = true; break; } p = p.parentElement; }
        if (!sc) out.tasma.push(tag(e));
      }
    });
    document.querySelectorAll('button, a[href], input:not([type=hidden]), select, textarea, [role=button]').forEach((e) => {
      if (!visible(e) || e.closest('.leaflet-tile-pane')) return;
      if (!name(e)) out.adsiz.push(tag(e));
    });
    document.querySelectorAll('img').forEach((e) => { if (visible(e) && !e.hasAttribute('alt') && !e.closest('.leaflet-tile-pane')) out.altsiz.push((e.getAttribute('src') || '').slice(-40)); });
    // görünür ve ekranda olan düğmelerin ortası başka bir öğenin altında mı?
    document.querySelectorAll('button, a.btn, [role=button]').forEach((e) => {
      if (!visible(e)) return;
      const r = e.getBoundingClientRect(); const x = r.left + r.width / 2, y = r.top + r.height / 2;
      if (x < 0 || y < 0 || x > W || y > H) return;
      const top = document.elementFromPoint(x, y);
      // ekranın kenarında sabit alt menü / üst çubuğun altında kalan öğe kaydırınca erişilir; sayılmaz
      if (top && top.closest('#tabbar, .top, .tabbar')) return;
      if (top && top !== e && !e.contains(top) && !top.contains(e)) {
        const pe = getComputedStyle(top).pointerEvents;
        if (pe !== 'none') out.kapali.push(tag(e) + ' ← ' + tag(top));
      }
    });
    out.cls = +(window.__cls || 0).toFixed(3);
    for (const k of ['tasma', 'adsiz', 'altsiz', 'kapali']) out[k] = [...new Set(out[k])].slice(0, 6);
    return out;
  });
}

(async () => {
  const report = [];
  for (const prof of [{ ad: 'telefon', mobile: true }, { ad: 'masaustu', mobile: false, w: 1366, h: 800 }]) {
    for (const role of ['ziyaretci', 'kullanici']) {
      const { browser, page, errs } = await open({ mobile: prof.mobile, w: prof.w, h: prof.h });
      if (role === 'kullanici') await sahteOturum(page);
      await page.addInitScript(() => {
        window.__cls = 0;
        try { new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (!e.hadRecentInput) window.__cls += e.value; })).observe({ type: 'layout-shift', buffered: true }); } catch (e) {}
        try { localStorage.setItem('gg-tur-gordu', '1'); localStorage.setItem('gyrh-install-x', String(Date.now() + 864e5)); } catch (e) {}
      });
      for (const r of ROUTES[role]) {
        errs.length = 0;
        await page.goto(SITE + '?d=' + Date.now() + '#/' + r); await page.waitForTimeout(3200);
        await page.reload(); await page.waitForTimeout(3200); // yenileme sonrası da aynı sayfa açılmalı
        const hash = await page.evaluate(() => location.hash);
        const a = await audit(page);
        // sahte oturumda bildirim kutusu 401 alır (beklenen); Chrome gövdesiz HEAD sayım isteğini yanıttan sonra "aborted" sayar (yanıt 200, kullanıcıya hata yok)
        const e = errs.filter((x) => !/status of 401|notification/.test(x) && !/select=id&status=eq.approved net::ERR_ABORTED/.test(x));
        report.push({ profil: prof.ad, rol: role, yol: r, adres: hash, hata: e, ...a });
      }
      await browser.close();
    }
  }
  let issues = 0;
  for (const r of report) {
    const p = [];
    if (r.hata.length) p.push('HATA: ' + r.hata.join(' | ').slice(0, 300));
    if (r.tasma.length) p.push('taşma: ' + r.tasma.join(', '));
    if (r.adsiz.length) p.push('adsız: ' + r.adsiz.join(', '));
    if (r.altsiz.length) p.push('alt yok: ' + r.altsiz.join(', '));
    if (r.kapali.length) p.push('kapalı: ' + r.kapali.join(', '));
    if (r.cls > 0.1) p.push('CLS ' + r.cls);
    issues += p.length;
    console.log(`${r.profil.padEnd(9)} ${r.rol.padEnd(10)} #/${r.yol.padEnd(20)} → ${r.adres.padEnd(22)} CLS ${String(r.cls).padEnd(5)} ${p.length ? '\n    ' + p.join('\n    ') : 'temiz'}`);
  }
  console.log('\nsorun sayısı:', issues);
})().catch((e) => { console.error(e); process.exit(2); });
