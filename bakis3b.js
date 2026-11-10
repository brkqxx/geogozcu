/*! GeoGözcü · 3B bakış · EGEV 100. Yıl Anadolu Lisesi TÜBİTAK projesi · geogozcu.pages.dev */
// Bir bildirimin çevresini üç boyutlu gösterir: uydu görüntüsü arazinin üstüne giydirilir, binalar yükseltilir.
// - Hiçbir API anahtarı gerekmez: uydu Esri, yükseklik Mapzen/AWS açık verisi, binalar OpenStreetMap (OpenFreeMap).
// - Kütüphane (MapLibre GL, vendor/) yalnız "3B bak" düğmesine basılınca indirilir; sayfanın açılışını yavaşlatmaz.
// - Gezinti bildirimin çevresiyle sınırlıdır (RADIUS metre); bütün haritada dolaşılmaz.
// - Bilgisayar: W A S D / ok tuşları gezer, Q E döndürür, R F eğer, Shift hızlandırır, Esc kapatır.
// - Telefon: tek parmak gezer, iki parmak döndürür ve eğer, ekrandaki düğmeler de aynı işi yapar.
(function () {
  'use strict';
  const RADIUS = 350;           // metre: bildirimden en fazla bu kadar uzaklaşılır
  const ZOOM = { min: 15.6, start: 17.4, max: 19.6 };
  const PITCH = { min: 20, start: 62, max: 78 };
  const LIB = 'vendor/maplibre-gl-csp.js', WORKER = 'vendor/maplibre-gl-csp-worker.js', CSS = 'vendor/maplibre-gl.css';

  let libP = null, map = null, home = null, box = null, raf = 0, last = 0, opener = null, note = null;
  const keys = new Set();

  function loadLib() {
    if (libP) return libP;
    libP = new Promise((resolve, reject) => {
      const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = CSS; document.head.appendChild(css);
      const s = document.createElement('script'); s.src = LIB;
      s.onload = () => { window.maplibregl.setWorkerUrl(new URL(WORKER, document.baseURI).href); resolve(); };
      s.onerror = () => { libP = null; reject(new Error('3B kütüphanesi indirilemedi')); };
      document.head.appendChild(s);
    });
    return libP;
  }

  function style() {
    return {
      version: 8,
      sources: {
        uydu: { type: 'raster', tileSize: 256, maxzoom: 19, attribution: 'Görüntü: Esri',
          tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'] },
        yukseklik: { type: 'raster-dem', tileSize: 256, maxzoom: 14, encoding: 'terrarium', attribution: 'Yükseklik: Mapzen (AWS açık veri)',
          tiles: ['https://elevation-tiles-prod.s3.amazonaws.com/terrarium/{z}/{x}/{y}.png'] },
        osm: { type: 'vector', url: 'https://tiles.openfreemap.org/planet', attribution: 'Binalar: © OpenStreetMap' },
      },
      layers: [
        { id: 'zemin', type: 'background', paint: { 'background-color': '#0B120E' } },
        { id: 'uydu', type: 'raster', source: 'uydu' },
        { id: 'bina', type: 'fill-extrusion', source: 'osm', 'source-layer': 'building', minzoom: 14,
          paint: {
            'fill-extrusion-color': ['interpolate', ['linear'], ['coalesce', ['get', 'render_height'], 6], 0, '#EDE6D8', 40, '#C9D3DA'],
            'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 6],
            'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
            'fill-extrusion-opacity': 0.9,
          } },
      ],
      terrain: { source: 'yukseklik', exaggeration: 1.15 },
      sky: { 'sky-color': '#8DBEF2', 'horizon-color': '#E4EEF6', 'fog-color': '#E4EEF6', 'sky-horizon-blend': 0.6, 'horizon-fog-blend': 0.7, 'fog-ground-blend': 0.25 },
    };
  }

  function build() {
    box = document.createElement('div');
    box.className = 'b3'; box.id = 'b3'; box.hidden = true;
    box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', '3B bakış');
    const ico = (d) => '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + d + '"/></svg>';
    box.innerHTML =
      '<div class="b3-map" id="b3-map"></div>' +
      '<div class="b3-top"><div class="b3-title"><b></b><span></span></div>' +
      '<button type="button" class="b3-x" data-b3="close" aria-label="3B bakışı kapat">' + ico('M6 6l12 12M18 6 6 18') + '</button></div>' +
      '<p class="b3-note" hidden></p>' +
      '<div class="b3-pad" role="group" aria-label="Bakış denetimleri">' +
        '<button type="button" data-b3="left" aria-label="Sola döndür">' + ico('M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-2') + '</button>' +
        '<button type="button" data-b3="tilt" aria-label="Eğimi değiştir">' + ico('M3 17l9-10 9 10M7 21h10') + '</button>' +
        '<button type="button" data-b3="home" aria-label="Bildirime dön">' + ico('M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12zM12 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z') + '</button>' +
        '<button type="button" data-b3="right" aria-label="Sağa döndür">' + ico('M15 14l5-5-5-5M20 9H10a6 6 0 0 0 0 12h2') + '</button>' +
      '</div>' +
      '<p class="b3-hint"></p>';
    document.body.appendChild(box);
    note = box.querySelector('.b3-note');
    box.addEventListener('click', (e) => {
      const b = e.target.closest('[data-b3]'); if (!b || !map) return;
      const k = b.dataset.b3;
      if (k === 'close') close();
      else if (k === 'left' || k === 'right') map.easeTo({ bearing: map.getBearing() + (k === 'left' ? -45 : 45), duration: 500 });
      else if (k === 'tilt') map.easeTo({ pitch: map.getPitch() > 50 ? 30 : PITCH.start, duration: 500 });
      else if (k === 'home') map.easeTo({ center: [home.lng, home.lat], zoom: ZOOM.start, pitch: PITCH.start, duration: 700 });
    });
  }

  const metres = (a, b) => {
    const R = 6371000, r = Math.PI / 180, dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  };
  // gezinti bildirimin çevresinde kalır
  let leashing = false; // setCenter de "move" olayı üretir; kendi kendini çağırmasın
  function leash() {
    if (leashing || !map) return;
    const c = map.getCenter(), d = metres(home, c);
    if (d <= RADIUS) return;
    const k = (RADIUS * 0.98) / d;
    leashing = true;
    try { map.setCenter([home.lng + (c.lng - home.lng) * k, home.lat + (c.lat - home.lat) * k]); } finally { leashing = false; }
  }

  // klavye: tuş basılıyken her karede küçük adım (akıcı, yön tuşları birlikte çalışır)
  const KEYMAP = { w: 'f', arrowup: 'f', s: 'b', arrowdown: 'b', a: 'l', arrowleft: 'l', d: 'r', arrowright: 'r', q: 'tl', e: 'tr', r: 'pu', f: 'pd' };
  function tick(t) {
    raf = 0;
    if (!map || !keys.size) return;
    const dt = Math.min(48, t - (last || t)); last = t;
    const fast = keys.has('shift') ? 2.2 : 1, step = 0.42 * dt * fast;
    let dx = 0, dy = 0, rot = 0, pit = 0;
    keys.forEach((k) => { if (k === 'f') dy -= 1; else if (k === 'b') dy += 1; else if (k === 'l') dx -= 1; else if (k === 'r') dx += 1; else if (k === 'tl') rot -= 1; else if (k === 'tr') rot += 1; else if (k === 'pu') pit += 1; else if (k === 'pd') pit -= 1; });
    if (dx || dy) map.panBy([dx * step, dy * step], { animate: false });
    if (rot) map.setBearing(map.getBearing() + rot * 0.085 * dt);
    if (pit) map.setPitch(Math.max(PITCH.min, Math.min(PITCH.max, map.getPitch() + pit * 0.05 * dt)));
    raf = requestAnimationFrame(tick);
  }
  function onKey(e) {
    if (!map || box.hidden) return;
    const down = e.type === 'keydown', k = (e.key || '').toLowerCase();
    // Esc yalnız 3B bakışı kapatır (altındaki bildirim ayrıntısı açık kalsın)
    if (down && k === 'escape') { e.preventDefault(); e.stopImmediatePropagation(); close(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const m = k === 'shift' ? 'shift' : KEYMAP[k];
    if (!m) return;
    if (m !== 'shift') e.preventDefault();
    if (down) { keys.add(m); if (!raf) { last = 0; raf = requestAnimationFrame(tick); } } else keys.delete(m);
  }

  /**
   * @param {{lat:number,lng:number,title?:string,place?:string,color?:string}} r  bildirimin konumu ve başlığı
   * @param {{calm?:boolean, toast?:(m:string)=>void}} [opt]
   */
  async function open(r, opt) {
    opt = opt || {};
    const say = opt.toast || (() => {});
    if (!r || !isFinite(r.lat) || !isFinite(r.lng)) return;
    if (!box) build();
    opener = document.activeElement;
    home = { lat: +r.lat, lng: +r.lng };
    box.querySelector('.b3-title b').textContent = r.title || 'Bildirim';
    box.querySelector('.b3-title span').textContent = r.place || '';
    box.querySelector('.b3-hint').textContent = matchMedia('(pointer:fine)').matches
      ? 'W A S D: gez · Q E: döndür · R F: eğ · fare tekeri: yaklaş · Esc: kapat'
      : 'Tek parmak: gez · iki parmak: döndür ve eğ';
    note.hidden = true;
    box.hidden = false; box.classList.add('loading');
    document.documentElement.classList.add('b3-open');
    try {
      await loadLib();
      if (box.hidden) return; // indirirken kapatıldı
      const gl = window.maplibregl;
      map = new gl.Map({
        container: 'b3-map', style: style(), center: [home.lng, home.lat],
        zoom: opt.calm ? ZOOM.start : ZOOM.start - 1.1, pitch: opt.calm ? PITCH.start : 40, bearing: opt.calm ? -20 : 0,
        minZoom: ZOOM.min, maxZoom: ZOOM.max, maxPitch: PITCH.max, keyboard: false, attributionControl: { compact: true },
      });
      const pin = document.createElement('div'); pin.className = 'b3-pin';
      if (r.color) pin.style.setProperty('--c', r.color);
      new gl.Marker({ element: pin, anchor: 'bottom' }).setLngLat([home.lng, home.lat]).addTo(map);
      map.on('move', leash);
      map.once('load', () => {
        box.classList.remove('loading');
        const at = box.querySelector('.maplibregl-ctrl-attrib'); // kaynak bilgisi kapalı başlar (ⓘ ile açılır), ipucunun üstünü örtmesin
        if (at) { at.classList.remove('maplibregl-compact-show'); at.removeAttribute('open'); }
        if (!opt.calm) map.easeTo({ zoom: ZOOM.start, pitch: PITCH.start, bearing: -20, duration: 1800 });
      });
      // çevrede bina verisi yoksa söyle (arazi ve uydu yine görünür)
      map.once('idle', () => {
        if (!map) return;
        let n = 0; try { n = map.queryRenderedFeatures({ layers: ['bina'] }).length; } catch (_) { n = 1; }
        if (!n) { note.textContent = 'Bu noktanın çevresinde 3B bina verisi yok. Arazi ve uydu görüntüsü gösteriliyor.'; note.hidden = false; }
      });
      box.querySelector('.b3-x').focus({ preventScroll: true });
    } catch (err) {
      close();
      say('3B bakış bu cihazda açılamadı. İnternet bağlantını ya da tarayıcının grafik desteğini kontrol et.');
    }
  }

  function close() {
    if (!box || box.hidden) return;
    keys.clear(); if (raf) { cancelAnimationFrame(raf); raf = 0; }
    if (map) { try { map.remove(); } catch (_) { /* yok say */ } map = null; }
    box.hidden = true; box.classList.remove('loading');
    document.documentElement.classList.remove('b3-open');
    if (opener && opener.isConnected && opener.focus) opener.focus({ preventScroll: true });
    opener = null;
  }

  document.addEventListener('keydown', onKey);
  document.addEventListener('keyup', onKey);
  window.addEventListener('blur', () => keys.clear());
  window.addEventListener('hashchange', close);

  window.GG3B = { open, close, isOpen: () => !!box && !box.hidden, map: () => map };
})();
