// Lighthouse JSON raporlarından kısa özet: node araclar/test/lh-ozet.js rapor1.json [rapor2.json ...]
const fs = require('fs');
for (const f of process.argv.slice(2)) {
  const r = JSON.parse(fs.readFileSync(f, 'utf8')), a = r.audits;
  const v = (k) => a[k] && a[k].numericValue != null ? Math.round(a[k].numericValue) : '-';
  const bt = (a['resource-summary'] && a['resource-summary'].details.items) || [];
  const kb = (t) => { const i = bt.find((x) => x.resourceType === t); return i ? Math.round(i.transferSize / 1024) : '-'; };
  console.log(f.replace(/.*[\/]/, ''), JSON.stringify({ puan: Math.round(r.categories.performance.score * 100), FCP: v('first-contentful-paint'), LCP: v('largest-contentful-paint'),
    TBT: v('total-blocking-time'), CLS: a['cumulative-layout-shift'].numericValue.toFixed(3), SI: v('speed-index'), TTI: v('interactive'),
    toplamKB: kb('total'), jsKB: kb('script'), cssKB: kb('stylesheet'), fontKB: kb('font'), gorselKB: kb('image'), medyaKB: kb('media'),
    bootupMs: v('bootup-time'), anaIs: v('mainthread-work-breakdown') }));
}
