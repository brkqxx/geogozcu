// Ortak Playwright başlatıcı (küresel @playwright/cli içindeki playwright modülü, Edge ile)
const path = require('path');
const G = path.join(process.env.APPDATA || '', 'npm/node_modules/@playwright/cli/node_modules/playwright');
const { chromium, devices } = require(G);
const SITE = process.env.GG_SITE || 'http://localhost:8000/';
async function open({ mobile = false, w = 1366, h = 800, geo = null, bypassCSP = false, dark = false, dsf = 1 } = {}) {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const opts = mobile
    ? Object.assign({}, devices['Pixel 5'], { serviceWorkers: 'block', locale: 'tr-TR' })
    : { viewport: { width: w, height: h }, deviceScaleFactor: dsf, serviceWorkers: 'block', locale: 'tr-TR' };
  if (geo) { opts.geolocation = geo; opts.permissions = ['geolocation']; }
  if (bypassCSP) opts.bypassCSP = true; // yalnız video kaydı: Playwright'ın imleç katmanı satır içi stil kullanır
  if (dark) opts.colorScheme = 'dark';
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 200) + (m.location() && m.location().url ? ' @ ' + m.location().url.slice(0, 110) : '')); });
  page.on('pageerror', (e) => errs.push('pageerror ' + e.message));
  page.on('requestfailed', (r) => { const u = r.url(); if (!/tile|arcgis|opentopo|nominatim/.test(u)) errs.push('requestfailed ' + u.slice(0, 120) + ' ' + (r.failure() || {}).errorText); });
  return { browser, ctx, page, errs, SITE };
}
module.exports = { open, devices, SITE };
