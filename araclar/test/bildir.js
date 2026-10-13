// Bildir sayfası etkileşim denemesi: mobil dokunma (320/393 px) + masaüstü fare ve klavye.
// Sahte oturumla çalışır; hiçbir veri yazılmaz. Kullanım: node araclar/test/bildir.js   (yerel sunucu açık olmalı)
const { open } = require('./pw');
const sahteOturum = require('./sahte-oturum');
const OUT = process.env.GG_SHOTS || '';
const results = [];
const check = (name, ok, info) => { results.push({ name, ok: !!ok, info }); };

async function toForm(page, mobile) {
  const act = (loc) => (mobile ? loc.tap() : loc.click());
  await page.goto(require('./pw').SITE + '#/bildir'); await page.waitForTimeout(3000);
  await act(page.locator('#cat-pick > *').first()); await page.waitForTimeout(600);
  const sub = page.locator('#sub-pick > *').first();
  if (await sub.count() && await sub.isVisible()) { await act(sub); await page.waitForTimeout(700); }
  await page.evaluate(() => { const m = document.getElementById('loc-card'); window.scrollTo(0, m.getBoundingClientRect().top + scrollY - 80); });
  await page.waitForTimeout(700);
}

(async () => {
  const runs = [
    { tag: 'mobil-320', mobile: true, w: 320, h: 640 },
    { tag: 'mobil-393', mobile: true, w: 393, h: 851 },
    { tag: 'masaustu', mobile: false, w: 1366, h: 800 },
  ];
  for (const r of runs) {
    const { browser, page, errs } = await open({ mobile: r.mobile, w: r.w, h: r.h, geo: { latitude: 38.3196, longitude: 27.1569 } });
    if (r.mobile) await page.setViewportSize({ width: r.w, height: r.h });
    const s = await sahteOturum(page);
    await toForm(page, r.mobile);
    const box = await page.locator('#pick-map').boundingBox();
    check(r.tag + ': harita görünür', box && box.width > 200 && box.height > 200, box && [box.width, box.height].map(Math.round).join('x'));
    // haritanın kontrollerle kaplı oranı
    const cov = await page.evaluate(() => {
      const m = document.getElementById('pick-map').getBoundingClientRect(); let c = 0, t = 0;
      for (let x = m.left + 4; x < m.right; x += 8) for (let y = m.top + 4; y < m.bottom; y += 8) { t++; const e = document.elementFromPoint(x, y); if (e && e.closest('.leaflet-control')) c++; }
      return Math.round(c / t * 100);
    });
    check(r.tag + ': kontroller haritanın %25’inden azını kaplar', cov < 25, '%' + cov);
    // merkeze dokun / tıkla → nokta seçilir
    const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
    const top = await page.evaluate(([x, y]) => { const e = document.elementFromPoint(x, y); return e && !e.closest('.leaflet-control'); }, [cx, cy]);
    check(r.tag + ': harita ortasında kontrol yok', top);
    if (r.mobile) await page.touchscreen.tap(cx, cy); else await page.mouse.click(cx, cy);
    await page.waitForTimeout(800);
    check(r.tag + ': dokunma/tıklama noktayı seçer', await page.evaluate(() => document.getElementById('pick-map').classList.contains('has-pick')),
      await page.locator('#pick-info').textContent());
    // odak düğmeleri: erişilebilir ad + çalışıyor
    const fb = page.locator('#pick-map .focus-btn [data-f=i]');
    check(r.tag + ': odak düğmesinin erişilebilir adı var', await fb.getAttribute('aria-label'));
    const z0 = await page.evaluate(() => document.querySelector('#pick-map') && document.querySelector('#pick-map .leaflet-control-zoom-out').className);
    try { if (r.mobile) await fb.tap({ timeout: 3000 }); else await fb.click({ timeout: 3000 }); await page.waitForTimeout(1200); check(r.tag + ': İzmir düğmesi tıklanır', true); } catch (e) { check(r.tag + ': İzmir düğmesi tıklanır', false, e.message.split('\n')[0]); }
    // konum düğmesi (izin verilmiş)
    const loc = page.locator('#btn-locate');
    if (r.mobile) await loc.tap(); else await loc.click();
    await page.waitForTimeout(2000);
    check(r.tag + ': konum düğmesi noktayı seçer', /sürükleyerek/.test(await page.locator('#pick-info').textContent()), await page.locator('#pick-info').textContent());
    if (!r.mobile) {
      // klavye: haritaya odaklan, Enter → orta nokta seçilir
      await page.evaluate(() => { document.getElementById('pick-map').classList.remove('has-pick'); });
      await page.locator('#pick-map').focus(); await page.keyboard.press('ArrowRight'); await page.waitForTimeout(400); await page.keyboard.press('Enter'); await page.waitForTimeout(600);
      check(r.tag + ': klavye Enter ile seçim', await page.evaluate(() => document.getElementById('pick-map').classList.contains('has-pick')));
    }
    // seçenek hapı ve gönder
    const pill = page.locator('#form-rest fieldset:not([hidden]) .pill').first();
    try { if (r.mobile) await pill.tap({ timeout: 3000 }); else await pill.click({ timeout: 3000 }); check(r.tag + ': seçenek hapı', true); } catch (e) { check(r.tag + ': seçenek hapı', false, e.message.split('\n')[0]); }
    const send = page.locator('#btn-send'); await send.scrollIntoViewIfNeeded();
    if (r.mobile) await send.tap(); else await send.click();
    await page.waitForTimeout(900);
    check(r.tag + ': eksik formda açık hata mesajı', (await page.locator('#report-msg').textContent()).length > 5, await page.locator('#report-msg').textContent());
    check(r.tag + ': hiçbir veri yazılmadı', s.writes.length === 0, s.writes.join(' '));
    if (OUT) await page.screenshot({ path: OUT + '/bildir-' + r.tag + '.png' });
    check(r.tag + ': konsol hatası yok', !errs.filter((e) => !/401|notification/.test(e)).length, errs.join(' | '));
    await browser.close();
  }
  // konum izni reddedildi → anlaşılır mesaj
  {
    const { browser, page } = await open({ mobile: true });
    await sahteOturum(page);
    await page.addInitScript(() => { navigator.geolocation.getCurrentPosition = (ok, fail) => setTimeout(() => fail({ code: 1, message: 'denied' }), 50); });
    await toForm(page, true);
    await page.locator('#btn-locate').tap(); await page.waitForTimeout(800);
    const t = await page.locator('#pick-info').textContent();
    check('izin reddi: anlaşılır mesaj', /izni verilmedi/.test(t), t);
    check('izin reddi: düğme tekrar kullanılabilir', !(await page.locator('#btn-locate').getAttribute('aria-busy')));
    await browser.close();
  }
  let fail = 0;
  for (const r of results) { if (!r.ok) fail++; console.log((r.ok ? 'GEÇTİ ' : 'KALDI ') + r.name + (r.info !== undefined && r.info !== true ? '  — ' + String(r.info).slice(0, 140) : '')); }
  console.log(results.length - fail + '/' + results.length + ' geçti');
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
