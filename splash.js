// Açılış ekranı: uygulama 12 saniyede açılmazsa yeniden deneme seçeneği çıkar.
// (Satır içi betik yerine ayrı dosya: içerik güvenlik politikası satır içi betiklere izin vermez.)
(function () {
  // yazı tipleri sayfayı bekletmeden yüklenir (eski satır içi onload yerine)
  var fl = document.querySelectorAll('link[data-font]');
  for (var i = 0; i < fl.length; i++) fl[i].media = 'all';
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
