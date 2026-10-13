// Yazı tipleri ve satır içi stil dönüşümü (data-css) denetimi: yazı tipleri yüklenir, data-css kalmaz, CSP ihlali olmaz.
const { open, SITE } = require('./pw');
(async () => {
  const { browser, page, errs } = await open({ w: 1280, h: 800 });
  const csp = []; page.on('console', (m) => { if (/Content Security Policy/i.test(m.text())) csp.push(m.text().slice(0, 120)); });
  await page.goto(SITE + '#/ana'); await page.waitForTimeout(3500);
  const r = await page.evaluate(async () => { await document.fonts.ready; return {
    poppins: document.fonts.check('300 40px Poppins'), instrument: document.fonts.check('16px "Instrument Sans"'), mono: document.fonts.check('500 14px "JetBrains Mono"'),
    h1: getComputedStyle(document.querySelector('h1')).fontFamily.split(',')[0], dataCss: document.querySelectorAll('[data-css]').length,
    lgDot: (document.querySelector('#legend [style]') || {}).getAttribute ? document.querySelector('#legend [style]').getAttribute('style') : null }; });
  await page.goto(SITE + '#/harita'); await page.waitForTimeout(3000);
  r.haritaDataCss = await page.evaluate(() => document.querySelectorAll('[data-css]').length);
  const ok = r.poppins && r.instrument && r.dataCss === 0 && r.haritaDataCss === 0 && !csp.length && !errs.some((e) => /pageerror/.test(e));
  console.log(JSON.stringify(Object.assign(r, { csp, hatalar: errs.filter((e) => /pageerror/.test(e)) })));
  console.log(ok ? 'GEÇTİ yazı tipi + data-css + CSP' : 'KALDI');
  await browser.close(); process.exit(ok ? 0 : 1);
})();
