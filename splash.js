// Açılış ekranı: uygulama 12 saniyede açılmazsa yeniden deneme seçeneği çıkar.
// (Satır içi betik yerine ayrı dosya: içerik güvenlik politikası satır içi betiklere izin vermez.)
(function () {
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
  document.addEventListener('DOMContentLoaded', function () { fix(document.body); });
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
