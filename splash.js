// Açılış ekranı: uygulama 12 saniyede açılmazsa yeniden deneme seçeneği çıkar. Sayfanın sonunda, uygulama betiklerinden önce yüklenir
// (ilk boyamayı geciktirmesin; yamalar, hafif mod ve data-css yine uygulama betiklerinden önce hazır olur).
// (Satır içi betik yerine ayrı dosya: içerik güvenlik politikası satır içi betiklere izin vermez.)
(function () {
  // --- Eski tarayıcı motorları için çok küçük yamalar (yalnız eksikse; büyük polyfill paketi yok) ---
  if (typeof globalThis === 'undefined') window.globalThis = window;
  if (!Array.prototype.flat) Object.defineProperty(Array.prototype, 'flat', { configurable: true, writable: true, value: function (d) {
    d = d === undefined ? 1 : Math.floor(d);
    return d < 1 ? Array.prototype.slice.call(this) : Array.prototype.reduce.call(this, function (a, v) { return a.concat(Array.isArray(v) ? v.flat(d - 1) : v); }, []);
  } });
  if (!Array.prototype.flatMap) Object.defineProperty(Array.prototype, 'flatMap', { configurable: true, writable: true, value: function (f, t) { return Array.prototype.map.call(this, f, t).flat(); } });
  if (!Object.fromEntries) Object.fromEntries = function (it) { var o = {}; Array.from(it).forEach(function (p) { o[p[0]] = p[1]; }); return o; };

  // --- Hafif mod: eski Android, düşük bellek, veri tasarrufu ve akıllı tahta benzeri cihazlarda ağır efektler kapanır ---
  // Adres çubuğunda ?hafif=1 (aç) / ?hafif=0 (kapat) seçimi hatırlanır; Ayarlar'dan da değiştirilebilir.
  var LITE_KEY = 'gg-lite';
  function liteAuto() {
    var n = navigator, ua = n.userAgent || '', c = n.connection || {};
    var chrome = Number((ua.match(/Chrome\/(\d+)/) || [])[1] || 0);
    var big = Math.max(screen.width || 0, screen.height || 0);
    return !!(c.saveData || /(^|-)2g$/.test(c.effectiveType || '') ||
      (n.deviceMemory && n.deviceMemory <= 2) || (n.hardwareConcurrency && n.hardwareConcurrency <= 2) ||
      (chrome && chrome < 80) ||
      (/Android/i.test(ua) && !/Mobile/i.test(ua) && (window.devicePixelRatio || 1) <= 1.5 && big >= 1280)); // Android tahta / TV
  }
  var qLite = (location.search.match(/[?&]hafif=([01])/) || [])[1], liteRef = null;
  try { if (qLite) localStorage.setItem(LITE_KEY, qLite); liteRef = localStorage.getItem(LITE_KEY); } catch (e) { liteRef = qLite || null; }
  if (liteRef === '1' || (liteRef !== '0' && liteAuto())) document.documentElement.classList.add('lite');
  window.GGLite = {
    on: function () { return document.documentElement.classList.contains('lite'); },
    pref: function () { try { return localStorage.getItem(LITE_KEY) || 'auto'; } catch (e) { return 'auto'; } },
    set: function (v) { // '1' | '0' | 'auto'
      try { if (v === 'auto') localStorage.removeItem(LITE_KEY); else localStorage.setItem(LITE_KEY, v); } catch (e) {}
      document.documentElement.classList.toggle('lite', v === '1' || (v === 'auto' && liteAuto()));
    },
    auto: liteAuto,
  };

  // Satır içi stil yok: HTML'deki biçimler style="…" yerine data-css="…" olarak yazılır ve burada CSSOM ile uygulanır.
  // Böylece içerik güvenlik politikası style-src'de 'unsafe-inline' istemez (enjekte edilen style= özniteliği çalışmaz).
  function fix(root) {
    if (!root || !root.querySelectorAll) return;
    if (root.hasAttribute && root.hasAttribute('data-css')) { root.style.cssText = root.getAttribute('data-css'); root.removeAttribute('data-css'); }
    var l = root.querySelectorAll('[data-css]');
    for (var i = 0; i < l.length; i++) { l[i].style.cssText = l[i].getAttribute('data-css'); l[i].removeAttribute('data-css'); }
  }
  ['innerHTML', 'outerHTML'].forEach(function (p) {
    var d = Object.getOwnPropertyDescriptor(Element.prototype, p);
    if (!d || !d.set) return;
    Object.defineProperty(Element.prototype, p, { configurable: true, enumerable: d.enumerable, get: d.get, set: function (v) {
      var parent = p === 'outerHTML' ? this.parentNode : this; d.set.call(this, v); fix(parent);
    } });
  });
  var iah = Element.prototype.insertAdjacentHTML;
  Element.prototype.insertAdjacentHTML = function (pos, html) { iah.call(this, pos, html); fix(/^(beforebegin|afterend)$/i.test(pos) ? this.parentNode : this); };
  new MutationObserver(function (ms) {
    for (var i = 0; i < ms.length; i++) for (var j = 0; j < ms[i].addedNodes.length; j++) fix(ms[i].addedNodes[j]);
  }).observe(document.documentElement, { childList: true, subtree: true });
  // betik sayfanın sonunda (uygulama betiklerinden hemen önce) çalışır: o ana kadar okunan gövde hemen biçimlenir
  if (document.body) fix(document.body);
  document.addEventListener('DOMContentLoaded', function () { fix(document.body); });
  // Sayfanın aşağısındaki videoların kapak görseli ilk açılışta inmesin: görünüme yaklaşınca yüklenir
  document.addEventListener('DOMContentLoaded', function () {
    var vs = document.querySelectorAll('video[data-poster]');
    var put = function (v) { if (v.dataset.poster) { v.poster = v.dataset.poster; v.removeAttribute('data-poster'); } };
    if (!('IntersectionObserver' in window)) { for (var i = 0; i < vs.length; i++) put(vs[i]); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { put(e.target); io.unobserve(e.target); } }); }, { rootMargin: '600px 0px' });
    for (var j = 0; j < vs.length; j++) io.observe(vs[j]);
  });
  var r = document.getElementById('splash-retry');
  if (r) r.addEventListener('click', function () { location.reload(); });
  setTimeout(function () {
    var s = document.getElementById('splash');
    if (s && !s.classList.contains('out')) {
      var f = document.getElementById('splash-fail'); if (f) f.hidden = false;
      var m = document.getElementById('splash-msg'); if (m) m.textContent = !window.L ? 'Harita kütüphanesi yüklenemedi.' : !window.supabase ? 'Sunucu bağlantısı kurulamadı.' : 'Açılış beklenenden uzun sürdü.';
    }
  }, 12000);
})();
