// Tarayıcı konsolunda (test sayfasında) çalıştırılır: tüm sayfaları gezer, taşma ve hata raporlar.
// Kullanım: javascript_tool ile bu dosyanın içeriğini çalıştır; sonuç { problems, errs } döner.
(async () => {
  const st = document.createElement('style'); st.textContent = '*,*::before,*::after{animation:none!important;transition:none!important}'; document.head.appendChild(st);
  window.__e = window.__e || []; window.addEventListener('error', (e) => __e.push(e.message));
  const w = (ms) => new Promise((r) => setTimeout(r, ms));
  const routes = ['#/ana', '#/proje', '#/harita', '#/liderler', '#/bildirimlerim', '#/gelen', '#/bildir', '#/ayarlar', '#/ayarlar/gorunum', '#/profil/testkisi', '#/yonetici'];
  const check = () => {
    const issues = [], W = document.documentElement.clientWidth;
    document.querySelectorAll('body *').forEach((e) => {
      if (['av-file', 'pe-add', 'imp-file'].includes(e.id)) return;
      if (!e.offsetParent && getComputedStyle(e).position !== 'fixed') return;
      if (e.closest('details:not([open])')) return;
      const cs = getComputedStyle(e), r = e.getBoundingClientRect();
      if (r.width > 0 && r.right > W + 2 && cs.position !== 'fixed' && !e.closest('.leaflet-container')) {
        let p = e.parentElement, sc = false;
        while (p && p !== document.body) { const o = getComputedStyle(p).overflowX; if (o === 'auto' || o === 'scroll') { sc = true; break; } p = p.parentElement; }
        if (!sc) issues.push((e.id || e.className || e.tagName).toString().slice(0, 30));
      }
    });
    return [...new Set(issues)].slice(0, 5);
  };
  const out = {};
  for (const r of routes) { location.hash = r; await w(800); const c = check(); if (c.length) out[r] = c; }
  for (const b of document.querySelectorAll('.admin-nav [data-tab]')) { b.click(); await w(500); const c = check(); if (c.length) out['admin:' + b.dataset.tab] = c; }
  window.__sweep = { problems: out, errs: __e.slice() };
})();
