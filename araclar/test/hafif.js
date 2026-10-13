// Hafif mod denemesi: adres parametresi, hatırlama, otomatik algılama (düşük bellek, eski Chrome kimliği — emülasyon) ve Ayarlar denetimi.
const { open, SITE } = require('./pw');
const sahteOturum = require('./sahte-oturum');
const results = [];
const check = (n, c, i) => results.push([n, !!c, i]);
const lite = (page) => page.evaluate(() => document.documentElement.classList.contains('lite'));

(async () => {
  {
    const { browser, page } = await open({ w: 1280, h: 800 });
    await page.goto(SITE + '?hafif=1#/harita'); await page.waitForTimeout(2500);
    check('?hafif=1 açar', await lite(page));
    check('hafif modda cam bulanıklığı yok', await page.evaluate(() => getComputedStyle(document.querySelector('.gg-tools') || document.body).backdropFilter === 'none'));
    await page.goto(SITE + '#/harita'); await page.waitForTimeout(2000);
    check('seçim hatırlanır (parametresiz açılış)', await lite(page));
    await page.goto(SITE + '?hafif=0#/harita'); await page.waitForTimeout(2000);
    check('?hafif=0 kapatır', !(await lite(page)));
    await browser.close();
  }
  {
    const { browser, page } = await open({ w: 1280, h: 800 });
    await page.addInitScript(() => { Object.defineProperty(navigator, 'deviceMemory', { get: () => 1 }); });
    await page.goto(SITE + '#/harita'); await page.waitForTimeout(2000);
    check('otomatik: 1 GB bellek → hafif', await lite(page));
    await browser.close();
  }
  {
    const { browser, ctx, page } = await open({ w: 1280, h: 800 });
    await ctx.setExtraHTTPHeaders({});
    await page.addInitScript(() => { Object.defineProperty(navigator, 'userAgent', { get: () => 'Mozilla/5.0 (Linux; Android 8.1.0; Tahta) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.101 Safari/537.36' }); });
    await page.goto(SITE + '#/ana'); await page.waitForTimeout(2000);
    check('otomatik: eski Chrome 75 kimliği → hafif', await lite(page));
    await browser.close();
  }
  {
    const { browser, page } = await open({ w: 1280, h: 800 });
    await sahteOturum(page);
    await page.goto(SITE + '#/ayarlar/gorunum'); await page.waitForTimeout(3000);
    const chip = (v) => page.locator('#set-lite [data-lite="' + v + '"]');
    check('Ayarlar: varsayılan "Otomatik" seçili', (await chip('auto').getAttribute('aria-checked')) === 'true');
    await chip('1').click(); await page.waitForTimeout(400);
    check('Ayarlar: "Açık" → hafif mod', await lite(page));
    check('Ayarlar: durum metni', /hafif mod açık/.test(await page.locator('#set-lite-now').textContent()));
    await chip('0').click(); await page.waitForTimeout(400);
    check('Ayarlar: "Kapalı" → tam görünüm', !(await lite(page)));
    await page.reload(); await page.waitForTimeout(3000);
    check('Ayarlar: seçim yenilemeden sonra da geçerli', !(await lite(page)) && (await chip('0').getAttribute('aria-checked')) === 'true');
    await browser.close();
  }
  let fail = 0;
  for (const [n, c, i] of results) { if (!c) fail++; console.log((c ? 'GEÇTİ ' : 'KALDI ') + n + (i !== undefined && !c ? '  — ' + i : '')); }
  console.log(results.length - fail + '/' + results.length + ' geçti');
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
