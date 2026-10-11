// @ts-check
/**
 * GeoGözcü · harita çekirdeği ve coğrafi araçlar
 * ------------------------------------------------
 *  - GG: haritaya uygulamanın her yerinden erişilen küçük durum deposu (Zustand mantığı: get / set / subscribe)
 *  - Altlık katmanları ve katman seçici (uydu, sokak, topoğrafik, karanlık, sade) — yumuşak geçişli
 *  - Araç çubuğu: yer arama (otomatik tamamlama), konumum, mesafe ölçme, alan hesaplama, koordinat alma
 *
 * Derleme adımı yoktur; tipler JSDoc ile yazılır ve editör (VS Code) `@ts-check` ile denetler.
 * Leaflet 1.9 genel `L` nesnesi olarak gelir.
 */
(function () {
  'use strict';
  /** @type {any} */ const L = /** @type {any} */ (window).L;

  /* ============================== TİPLER ============================== */
  /**
   * @typedef {'sat'|'streets'|'topo'|'dark'|'plain'} BasemapKey
   * @typedef {'none'|'measure'|'area'|'coords'} ToolKey
   * @typedef {{ lat: number, lng: number }} LatLng
   * @typedef {{
   *   map: any,                 // ana Leaflet haritası (L.Map)
   *   basemap: BasemapKey,
   *   tool: ToolKey,
   *   pendingPoint: LatLng|null // "Bu noktayı bildir" ile forma taşınan konum
   * }} GGState
   * @typedef {{ label: string, sub?: string, lat: number, lng: number, zoom?: number, kind: 'report'|'place' }} SearchHit
   * @typedef {{
   *   toast?: (msg: string) => void,
   *   searchLocal?: (q: string) => SearchHit[],
   *   onBasemap?: (key: BasemapKey) => void,
   *   onReportHere?: (p: LatLng) => void,
   *   onNearby?: () => void,    // "Yakınımdakiler" düğmesi
   *   inArea?: (lat: number, lng: number) => boolean, // arama sonuçlarını bu alanla sınırla
   *   bounds?: any              // aramanın sınırlanacağı alan (L.LatLngBounds)
   * }} GGHooks
   */

  /* ============================== DURUM DEPOSU ============================== */
  const GG = (() => {
    /** @type {GGState} */
    let state = { map: null, basemap: 'sat', tool: 'none', pendingPoint: null };
    /** @type {Set<(s: GGState, prev: GGState) => void>} */
    const subs = new Set();
    /** @type {GGHooks} */
    let hooks = {};
    return {
      get: () => state,
      /** @param {Partial<GGState>} patch */
      set(patch) { const prev = state; state = Object.assign({}, state, patch); subs.forEach((f) => f(state, prev)); },
      /** @param {(s: GGState, prev: GGState) => void} fn */
      subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
      /** @param {GGHooks} h */
      configure(h) { hooks = Object.assign({}, hooks, h); },
      hooks: () => hooks,
      /** Haritayı bir noktaya yumuşakça götür. @param {number} lat @param {number} lng @param {number} [zoom] */
      flyTo(lat, lng, zoom) {
        const m = state.map; if (!m) return;
        m.flyTo([lat, lng], zoom || Math.max(m.getZoom(), 16), { duration: reduceMotion() ? 0 : 0.9, easeLinearity: 0.2 });
      },
      /** @param {any} bounds */
      flyToBounds(bounds) { const m = state.map; if (m) m.flyToBounds(bounds, { padding: [40, 40], duration: reduceMotion() ? 0 : 0.9 }); },
      zoomIn() { state.map && state.map.zoomIn(); },
      zoomOut() { state.map && state.map.zoomOut(); },
    };
  })();
  /** @type {any} */ (window).GG = GG;

  const reduceMotion = () => document.documentElement.dataset.motion === 'calm' || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = () => document.documentElement.dataset.ui === 'mobile';
  const toast = (/** @type {string} */ m) => (GG.hooks().toast || console.info)(m);
  /** @param {string} s */
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c));

  /* ============================== ALTLIKLAR ============================== */
  // Not: CARTO karoları 2026'da API anahtarı istemeye başladı ("API KEY REQUIRED" resmi döner); kullanılmıyor.
  const ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services/';
  const OSM = '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> katkıcıları';
  const ESRI_CANVAS = 'Harita: Esri, HERE, Garmin, ' + OSM;
  /** Esri gri tuval + yer adları (16'dan sonrası büyütülerek gösterilir) @param {string} base @param {string} ref */
  const esriCanvas = (base, ref) => L.layerGroup([
    L.tileLayer(ESRI + 'Canvas/' + base + '/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, maxNativeZoom: 16, attribution: ESRI_CANVAS }),
    L.tileLayer(ESRI + 'Canvas/' + ref + '/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, maxNativeZoom: 16 }),
  ]);
  // Önizleme karosu: Gaziemir, yakınlaştırma 12
  const PZ = { z: 12, x: 2356, y: 1575 };

  /** @type {Record<BasemapKey, { name: string, note: string, thumb: string, make: () => any }>} */
  const BASEMAPS = {
    sat: {
      name: 'Uydu', note: 'Gerçek görüntü',
      thumb: ESRI + `World_Imagery/MapServer/tile/${PZ.z}/${PZ.y}/${PZ.x}`,
      make: () => L.layerGroup([
        L.tileLayer(ESRI + 'World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: 'Görüntü: Esri, Vantor (Maxar), Earthstar Geographics' }),
        L.tileLayer(ESRI + 'Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19 }),
      ]),
    },
    streets: {
      name: 'Sokak', note: 'Yollar ve yer adları',
      thumb: `https://tile.openstreetmap.org/${PZ.z}/${PZ.x}/${PZ.y}.png`,
      make: () => L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: OSM }),
    },
    topo: {
      name: 'Topoğrafik', note: 'Eğim ve yükseklik',
      thumb: `https://a.tile.opentopomap.org/${PZ.z}/${PZ.x}/${PZ.y}.png`,
      make: () => L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { subdomains: 'abc', maxZoom: 17, maxNativeZoom: 17, attribution: OSM + ', SRTM | © OpenTopoMap (CC-BY-SA)' }),
    },
    dark: {
      name: 'Gece', note: 'Karanlık tema',
      thumb: ESRI + `Canvas/World_Dark_Gray_Base/MapServer/tile/${PZ.z}/${PZ.y}/${PZ.x}`,
      make: () => esriCanvas('World_Dark_Gray_Base', 'World_Dark_Gray_Reference'),
    },
    plain: {
      name: 'Sade', note: 'Pinler öne çıkar',
      thumb: ESRI + `Canvas/World_Light_Gray_Base/MapServer/tile/${PZ.z}/${PZ.y}/${PZ.x}`,
      make: () => esriCanvas('World_Light_Gray_Base', 'World_Light_Gray_Reference'),
    },
  };

  /** Bir katmanın (ya da katman grubunun) saydamlığını ayarla. @param {any} layer @param {number} o */
  function setLayerOpacity(layer, o) {
    if (layer.setOpacity) layer.setOpacity(o);
    else if (layer.eachLayer) layer.eachLayer((/** @type {any} */ l) => l.setOpacity && l.setOpacity(o));
  }

  /**
   * Haritaya altlıkları ve katman seçiciyi ekler. Geçişte yeni katman yavaşça belirir, eskisi sonra kalkar.
   * @param {any} map @param {BasemapKey} initial @param {{ compact?: boolean }} [opts]
   * @returns {{ layers: Record<BasemapKey, any>, set: (k: BasemapKey) => void, current: () => BasemapKey }}
   */
  function addBasemaps(map, initial, opts) {
    /** @type {Record<string, any>} */ const layers = {};
    /** @type {BasemapKey} */ let cur = BASEMAPS[initial] ? initial : 'sat';
    /** @type {null | (() => void)} */ let fading = null;
    const get = (/** @type {BasemapKey} */ k) => (layers[k] = layers[k] || BASEMAPS[k].make());
    get(cur).addTo(map);
    map.getContainer().dataset.basemap = cur;

    /** @param {BasemapKey} k */
    function set(k) {
      if (!BASEMAPS[k] || k === cur) return;
      const prev = layers[cur], next = get(k);
      cur = k;
      map.getContainer().dataset.basemap = k;
      // önceki geçiş yarım kaldıysa onu hemen bitir (art arda hızlı seçimlerde katmanlar üst üste kalmasın)
      if (fading) fading();
      Object.keys(layers).forEach((k) => { if (k !== cur && layers[k] !== prev && map.hasLayer(layers[k])) map.removeLayer(layers[k]); });
      if (reduceMotion() || document.hidden) { map.removeLayer(prev); next.addTo(map); setLayerOpacity(next, 1); }
      else {
        setLayerOpacity(next, 0); next.addTo(map);
        const t0 = performance.now();
        let done = false;
        const finish = () => { if (done) return; done = true; fading = null; setLayerOpacity(next, 1); if (layers[cur] !== prev) map.removeLayer(prev); setLayerOpacity(prev, 1); };
        fading = finish;
        const step = (/** @type {number} */ t) => {
          if (done) return;
          const q = Math.min(1, (t - t0) / 380);
          setLayerOpacity(next, q);
          if (q < 1) requestAnimationFrame(step); else finish();
        };
        requestAnimationFrame(step);
        setTimeout(finish, 700); // kare döngüsü durmuşsa (arka plan sekmesi) yine de tamamla
      }
      map.fire('baselayerchange', { layer: next, name: k });
      sync();
      if (map === GG.get().map) { GG.set({ basemap: k }); const cb = GG.hooks().onBasemap; if (cb) cb(k); }
    }

    // Katman seçici: tek düğme; açınca önizlemeli kartlar
    const Ctl = L.Control.extend({
      options: { position: 'topright' },
      onAdd() {
        const box = L.DomUtil.create('div', 'gg-layers' + (opts && opts.compact ? ' compact' : ''));
        L.DomEvent.disableClickPropagation(box); L.DomEvent.disableScrollPropagation(box);
        box.innerHTML = '<button type="button" class="gg-layers-btn" aria-expanded="false" aria-label="Harita katmanını değiştir"><img alt=""><span></span></button>' +
          '<div class="gg-layers-panel" role="radiogroup" aria-label="Harita katmanı" hidden>' +
          Object.entries(BASEMAPS).map(([k, b]) =>
            '<button type="button" role="radio" data-bm="' + k + '"><img alt="" loading="lazy" src="' + b.thumb + '"><b>' + b.name + '</b><small>' + b.note + '</small></button>').join('') +
          '</div>';
        const btn = box.querySelector('.gg-layers-btn'), panel = /** @type {HTMLElement} */ (box.querySelector('.gg-layers-panel'));
        const open = (/** @type {boolean} */ on) => { panel.hidden = !on; btn.setAttribute('aria-expanded', String(on)); box.classList.toggle('open', on); };
        btn.addEventListener('click', () => open(panel.hidden));
        panel.addEventListener('click', (e) => {
          const b = /** @type {HTMLElement} */ (e.target).closest('[data-bm]'); if (!b) return;
          set(/** @type {BasemapKey} */ (b.getAttribute('data-bm'))); setTimeout(() => open(false), 160);
        });
        document.addEventListener('click', (e) => { if (!box.contains(/** @type {Node} */ (e.target))) open(false); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') open(false); });
        return box;
      },
    });
    const ctl = new Ctl().addTo(map);
    function sync() {
      const box = ctl.getContainer(), b = BASEMAPS[cur];
      box.querySelector('.gg-layers-btn img').src = b.thumb;
      box.querySelector('.gg-layers-btn span').textContent = b.name;
      box.querySelectorAll('[data-bm]').forEach((/** @type {Element} */ el) => {
        const on = el.getAttribute('data-bm') === cur;
        el.classList.toggle('on', on); el.setAttribute('aria-checked', String(on));
      });
    }
    sync();
    return { layers: /** @type {any} */ (layers), set, current: () => cur };
  }

  /* ============================== ÖLÇÜ HESAPLARI ============================== */
  const R_EARTH = 6378137;
  const rad = (/** @type {number} */ d) => d * Math.PI / 180;
  /** Küresel yüzeyde çokgen alanı (m²). @param {LatLng[]} pts */
  function ringArea(pts) {
    if (pts.length < 3) return 0;
    let a = 0;
    for (let i = 0; i < pts.length; i++) {
      const p1 = pts[i], p2 = pts[(i + 1) % pts.length];
      a += rad(p2.lng - p1.lng) * (2 + Math.sin(rad(p1.lat)) + Math.sin(rad(p2.lat)));
    }
    return Math.abs(a * R_EARTH * R_EARTH / 2);
  }
  /** @param {any} map @param {LatLng[]} pts */
  const pathLength = (map, pts) => pts.reduce((s, p, i) => i ? s + map.distance(pts[i - 1], p) : 0, 0);
  /** @param {number} m */
  const fmtDist = (m) => m < 1000 ? Math.round(m) + ' m' : (m / 1000).toLocaleString('tr-TR', { maximumFractionDigits: 2 }) + ' km';
  /** @param {number} a */
  const fmtArea = (a) => a < 10000 ? Math.round(a).toLocaleString('tr-TR') + ' m²'
    : a < 1e6 ? (a / 10000).toLocaleString('tr-TR', { maximumFractionDigits: 2 }) + ' hektar'
    : (a / 1e6).toLocaleString('tr-TR', { maximumFractionDigits: 2 }) + ' km²';
  /** Derece-dakika-saniye. @param {number} v @param {'lat'|'lng'} ax */
  function dms(v, ax) {
    const h = ax === 'lat' ? (v >= 0 ? 'K' : 'G') : (v >= 0 ? 'D' : 'B');
    const a = Math.abs(v), d = Math.floor(a), m = Math.floor((a - d) * 60), s = ((a - d - m / 60) * 3600).toFixed(1);
    return d + '° ' + m + '′ ' + s + '″ ' + h;
  }

  /* ============================== ARAÇ ÇUBUĞU ============================== */
  const ICONS = {
    search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    locate: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>',
    measure: '<svg viewBox="0 0 24 24"><path d="M3 17 17 3l4 4L7 21z"/><path d="m7 13 2 2M10 10l2 2M13 7l2 2"/></svg>',
    area: '<svg viewBox="0 0 24 24"><path d="M4 7 12 3l8 5-2 11H6z"/><circle cx="4" cy="7" r="1.6"/><circle cx="12" cy="3" r="1.6"/><circle cx="20" cy="8" r="1.6"/><circle cx="18" cy="19" r="1.6"/><circle cx="6" cy="19" r="1.6"/></svg>',
    coords: '<svg viewBox="0 0 24 24"><path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><path d="M9 9h6M12 6v6"/></svg>',
    nearby: '<svg viewBox="0 0 24 24"><path d="M12 21s-6-5.4-6-10a6 6 0 0 1 12 0c0 4.6-6 10-6 10z"/><circle cx="12" cy="11" r="2"/><path d="M3 21h18" stroke-dasharray="2 3"/></svg>',
    more: '<svg viewBox="0 0 24 24"><path d="M3.5 15.5 15.5 3.5l5 5-12 12z"/><path d="M7.5 11.5 9.5 13.5M10.5 8.5l1.5 1.5M13.5 5.5l2 2"/></svg>',
  };

  /**
   * Ana haritaya araç çubuğunu ekler.
   * @param {any} map
   */
  function addToolbar(map) {
    GG.set({ map });
    const root = map.getContainer();

    const bar = L.DomUtil.create('div', 'gg-tools', root);
    L.DomEvent.disableClickPropagation(bar); L.DomEvent.disableScrollPropagation(bar);
    /** @type {[string, string, string][]} */
    // Sütunda yalnız Ara, Konum ve "Araçlar"; ölçüm araçları "Araçlar"ın yanındaki hap grubunda:
    // masaüstünde fare gelince sola doğru büyüyerek açılır (tıklama / klavye odağıyla da), telefonda açıklamalı menü açılır.
    /** @type {(it: [string, string, string]) => string} */
    const btn = ([k, title, short]) => '<button type="button" data-tool="' + k + '" title="' + title + '" aria-label="' + title + '">' + /** @type {any} */ (ICONS)[k] + '<span>' + short + '</span></button>';
    /** @type {[string, string, string][]} */
    const flyItems = [['nearby', 'Yakınımdaki sorunlar', 'Yakınımdakiler'], ['measure', 'Mesafe ölç', 'Mesafe'], ['area', 'Alan hesapla', 'Alan'], ['coords', 'Koordinat al', 'Koordinat']];
    bar.innerHTML = btn(['search', 'Yer ara', 'Ara']) + btn(['locate', 'Konumuma git', 'Konum']) +
      '<div class="gg-group">' + btn(['more', 'Ölçüm ve diğer araçlar', 'Araçlar']).replace('<button ', '<button aria-expanded="false" aria-haspopup="true" ') +
      '<div class="gg-fly" role="group" aria-label="Ölçüm ve diğer araçlar">' + flyItems.map(btn).join('') + '</div></div>';
    const group = /** @type {HTMLElement} */ (bar.querySelector('.gg-group'));
    const openGroup = (/** @type {boolean} */ on) => { group.classList.toggle('open', on); bar.querySelector('[data-tool=more]').setAttribute('aria-expanded', String(on)); };
    group.addEventListener('mouseleave', () => { if (group.classList.contains('open')) openGroup(false); });
    group.addEventListener('keydown', (e) => { if (e.key === 'Escape') { openGroup(false); /** @type {HTMLElement} */ (bar.querySelector('[data-tool=more]')).focus(); } });

    // Telefonda az kullanılan araçlar tek bir "Araçlar" menüsünde, açıklamalarıyla
    const more = L.DomUtil.create('div', 'gg-more', root); more.hidden = true;
    L.DomEvent.disableClickPropagation(more); L.DomEvent.disableScrollPropagation(more);
    more.setAttribute('role', 'menu');
    more.innerHTML = [['nearby', 'Yakınımdaki sorunlar', 'Konumuna en yakın bildirimleri sırala'], ['measure', 'Mesafe ölç', 'Noktalara dokunarak uzunluğu bul'],
      ['area', 'Alan hesapla', 'Köşelere dokunarak alanı bul'], ['coords', 'Koordinat al', 'Bir noktanın enlem ve boylamı']]
      .map(([k, t, d]) => '<button type="button" role="menuitem" data-tool="' + k + '">' + /** @type {any} */ (ICONS)[k] + '<span><b>' + t + '</b><small>' + d + '</small></span></button>').join('');
    const openMore = (/** @type {boolean} */ on) => { more.hidden = !on; bar.querySelector('[data-tool=more]').setAttribute('aria-expanded', String(on)); bar.classList.toggle('more-open', on); };
    document.addEventListener('click', (e) => { if (!more.hidden && !more.contains(/** @type {Node} */ (e.target)) && !bar.contains(/** @type {Node} */ (e.target))) openMore(false); });

    // ölçüm sırasında görünen işlem şeridi
    const hud = L.DomUtil.create('div', 'gg-hud', root); hud.hidden = true;
    L.DomEvent.disableClickPropagation(hud);
    hud.innerHTML = '<div class="gg-hud-val"><small></small><b>—</b></div><div class="gg-hud-act">' +
      '<button type="button" data-hud="undo">Geri al</button><button type="button" data-hud="done" class="primary">Bitir</button><button type="button" data-hud="close" aria-label="Aracı kapat">Kapat</button></div>';

    // arama kutusu
    const sbox = L.DomUtil.create('div', 'gg-search', root); sbox.hidden = true;
    L.DomEvent.disableClickPropagation(sbox); L.DomEvent.disableScrollPropagation(sbox);
    sbox.innerHTML = '<div class="gg-search-row"><input type="search" role="combobox" aria-expanded="false" aria-controls="gg-search-list" aria-autocomplete="list" placeholder="Mahalle, sokak ya da yer adı ara" autocomplete="off" spellcheck="false">' +
      '<button type="button" class="gg-search-x" aria-label="Aramayı kapat">✕</button></div><ul id="gg-search-list" role="listbox" class="gg-search-list"></ul>';

    /* ---------- arama (otomatik tamamlama) ---------- */
    const input = /** @type {HTMLInputElement} */ (sbox.querySelector('input'));
    const listEl = /** @type {HTMLElement} */ (sbox.querySelector('ul'));
    /** @type {SearchHit[]} */ let hits = []; let active = -1;
    /** @type {Record<string, SearchHit[]>} */ const cache = {};
    /** @type {any} */ let timer = null; /** @type {AbortController|null} */ let ctrl = null;
    let lastReq = 0;

    function openSearch(/** @type {boolean} */ on) {
      sbox.hidden = !on; bar.classList.toggle('searching', on);
      bar.querySelector('[data-tool=search]').classList.toggle('on', on);
      if (on) { setTimeout(() => input.focus(), 30); } else { input.value = ''; render([]); }
    }
    function render(/** @type {SearchHit[]} */ list) {
      hits = list; active = list.length ? 0 : -1;
      input.setAttribute('aria-expanded', String(list.length > 0));
      listEl.innerHTML = list.map((h, i) => '<li role="option" id="gg-opt-' + i + '" data-i="' + i + '"' + (i === 0 ? ' class="on" aria-selected="true"' : '') + '>' +
        '<i class="k-' + h.kind + '" aria-hidden="true"></i><span><b>' + esc(h.label) + '</b>' + (h.sub ? '<small>' + esc(h.sub) + '</small>' : '') + '</span></li>').join('') ||
        (input.value.trim().length >= 3 ? '<li class="empty">Sonuç yok. Farklı bir yazım dene.</li>' : '');
    }
    function highlight(/** @type {number} */ i) {
      active = i;
      listEl.querySelectorAll('[data-i]').forEach((li) => { const on = Number(li.getAttribute('data-i')) === i; li.classList.toggle('on', on); li.setAttribute('aria-selected', String(on)); });
      input.setAttribute('aria-activedescendant', i >= 0 ? 'gg-opt-' + i : '');
    }
    /** @type {any} */ let hitMarker = null;
    function choose(/** @type {SearchHit} */ h) {
      openSearch(false);
      GG.flyTo(h.lat, h.lng, h.zoom || 16);
      if (hitMarker) map.removeLayer(hitMarker);
      hitMarker = L.marker([h.lat, h.lng], { icon: L.divIcon({ className: 'gg-hit', html: '<i></i>', iconSize: [22, 22] }), interactive: false }).addTo(map);
      setTimeout(() => { if (hitMarker) { map.removeLayer(hitMarker); hitMarker = null; } }, 6000);
    }
    async function remote(/** @type {string} */ q) {
      if (cache[q]) return cache[q];
      // Nominatim kullanım kuralı: saniyede en fazla 1 istek
      const wait = Math.max(0, 1000 - (Date.now() - lastReq)); if (wait) await new Promise((r) => setTimeout(r, wait));
      lastReq = Date.now();
      if (ctrl) ctrl.abort(); ctrl = new AbortController();
      const b = GG.hooks().bounds;
      const vb = b ? [b.getWest(), b.getNorth(), b.getEast(), b.getSouth()].join(',') : '26.2,39.4,28.5,37.8';
      const url = 'https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&countrycodes=tr&bounded=1&accept-language=tr&viewbox=' + vb + '&q=' + encodeURIComponent(q);
      const res = await fetch(url, { signal: ctrl.signal });
      const data = await res.json();
      /** @type {SearchHit[]} */
      const out = (data || []).map((/** @type {any} */ d) => {
        const a = d.address || {};
        const label = d.name || (d.display_name || '').split(',')[0];
        const sub = [a.suburb || a.neighbourhood || a.quarter, a.town || a.city_district || a.county, a.province || a.state].filter(Boolean).filter((v, i, arr) => arr.indexOf(v) === i).join(', ');
        return { label, sub, lat: Number(d.lat), lng: Number(d.lon), zoom: d.addresstype === 'road' ? 17 : 15, kind: 'place' };
      }).filter((/** @type {SearchHit} */ h) => !GG.hooks().inArea || /** @type {any} */ (GG.hooks().inArea)(h.lat, h.lng));
      cache[q] = out; return out;
    }
    input.addEventListener('input', () => {
      clearTimeout(timer);
      const q = input.value.trim();
      const local = q.length >= 2 && GG.hooks().searchLocal ? /** @type {any} */ (GG.hooks().searchLocal)(q).slice(0, 4) : [];
      render(local);
      if (q.length < 3) return;
      timer = setTimeout(async () => {
        listEl.classList.add('loading');
        try { const r = await remote(q); if (input.value.trim() === q) render(local.concat(r)); }
        catch (e) { if (/** @type {any} */ (e).name !== 'AbortError') toast('Yer araması şu an yapılamıyor. İnternet bağlantını kontrol et.'); }
        finally { listEl.classList.remove('loading'); }
      }, 350);
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); highlight(Math.min(hits.length - 1, active + 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); highlight(Math.max(0, active - 1)); }
      else if (e.key === 'Enter') { e.preventDefault(); if (hits[active]) choose(hits[active]); }
      else if (e.key === 'Escape') openSearch(false);
    });
    listEl.addEventListener('click', (e) => { const li = /** @type {HTMLElement} */ (e.target).closest('[data-i]'); if (li) choose(hits[Number(li.getAttribute('data-i'))]); });
    sbox.querySelector('.gg-search-x').addEventListener('click', () => openSearch(false));

    /* ---------- konumum ---------- */
    /** @type {any} */ let meDot = null, meCircle = null;
    /** @param {(p: LatLng, acc: number) => void} [onFound] bulununca haritayı oynatmak yerine bunu çağır */
    function locate(onFound) {
      const btn = bar.querySelector('[data-tool=locate]'); btn.classList.add('busy');
      map.once('locationfound', (/** @type {any} */ e) => {
        btn.classList.remove('busy');
        if (meDot) { map.removeLayer(meDot); map.removeLayer(meCircle); }
        meCircle = L.circle(e.latlng, { radius: e.accuracy, className: 'gg-me-acc', interactive: false }).addTo(map);
        meDot = L.marker(e.latlng, { icon: L.divIcon({ className: 'gg-me', html: '<i></i>', iconSize: [20, 20] }), keyboard: false, interactive: false }).addTo(map);
        if (onFound) onFound(e.latlng, e.accuracy); else GG.flyTo(e.latlng.lat, e.latlng.lng, 17);
        if (e.accuracy > 80) toast('Konum yaklaşık ' + Math.round(e.accuracy) + ' m hassasiyetle bulundu.');
      });
      map.once('locationerror', (/** @type {any} */ e) => {
        btn.classList.remove('busy');
        toast(e.code === 1 ? 'Konum izni verilmedi. Tarayıcı ayarlarından bu siteye konum izni ver.' : 'Konum bulunamadı. Açık bir alanda tekrar dene.');
        bar.querySelector('[data-tool=nearby]').classList.remove('busy');
      });
      map.locate({ setView: false, enableHighAccuracy: true, timeout: 12000, maximumAge: 10000 });
    }

    /* ---------- ölçme / alan / koordinat ---------- */
    /** @type {LatLng[]} */ let pts = [];
    const drawn = L.featureGroup().addTo(map);
    /** @type {any} */ let shape = null, rubber = null;
    const hudVal = /** @type {HTMLElement} */ (hud.querySelector('b')), hudLbl = /** @type {HTMLElement} */ (hud.querySelector('small'));

    function setTool(/** @type {ToolKey} */ t) {
      const prev = GG.get().tool;
      if (prev === t) t = 'none';
      clearDrawing();
      GG.set({ tool: t });
      bar.querySelectorAll('[data-tool]').forEach((b) => b.classList.toggle('on', b.getAttribute('data-tool') === t || (b.getAttribute('data-tool') === 'more' && ['measure', 'area', 'coords'].includes(t))));
      more.querySelectorAll('[data-tool]').forEach((b) => b.classList.toggle('on', b.getAttribute('data-tool') === t));
      root.classList.toggle('gg-drawing', t === 'measure' || t === 'area');
      root.classList.toggle('gg-picking', t === 'coords');
      if (t === 'measure' || t === 'area') { map.doubleClickZoom.disable(); showHud(); }
      else { map.doubleClickZoom.enable(); hud.hidden = true; }
      if (t === 'coords') toast('Koordinatını görmek istediğin noktaya dokun.');
      if (t === 'measure') toast('Haritaya dokunarak noktaları sırayla işaretle.');
      if (t === 'area') toast('Alanın köşelerine sırayla dokun. En az 3 nokta.');
    }
    function clearDrawing() {
      pts = []; drawn.clearLayers(); shape = null; rubber = null; updateHud();
    }
    function showHud() { hud.hidden = false; updateHud(); }
    /** @param {LatLng} [hover] fare imlecinin şu anki konumu (önizleme için) */
    function updateHud(hover) {
      const t = GG.get().tool;
      const all = hover ? pts.concat([hover]) : pts;
      if (t === 'measure') { hudLbl.textContent = 'Toplam mesafe'; hudVal.textContent = all.length > 1 ? fmtDist(pathLength(map, all)) : 'İlk noktaya dokun'; }
      else if (t === 'area') {
        hudLbl.textContent = 'Alan';
        hudVal.textContent = all.length > 2 ? fmtArea(ringArea(all)) + ' · çevre ' + fmtDist(pathLength(map, all.concat([all[0]]))) : (3 - all.length) + ' nokta daha';
      }
      /** @type {HTMLButtonElement} */ (hud.querySelector('[data-hud=undo]')).disabled = !pts.length;
    }
    function redraw() {
      drawn.clearLayers();
      const t = GG.get().tool;
      if (t === 'measure' && pts.length > 1) shape = L.polyline(pts, { className: 'gg-line', interactive: false }).addTo(drawn);
      if (t === 'area' && pts.length > 1) shape = (pts.length > 2 ? L.polygon(pts, { className: 'gg-area', interactive: false }) : L.polyline(pts, { className: 'gg-line', interactive: false })).addTo(drawn);
      pts.forEach((p, i) => {
        const v = L.circleMarker(p, { radius: 5, className: 'gg-vertex', interactive: false }).addTo(drawn);
        if (t === 'measure' && i > 0) v.bindTooltip(fmtDist(pathLength(map, pts.slice(0, i + 1))), { permanent: true, direction: 'right', className: 'gg-label', offset: [8, 0] });
      });
      if (t === 'area' && pts.length > 2) L.marker(L.polygon(pts).getBounds().getCenter(), { interactive: false, icon: L.divIcon({ className: 'gg-area-lbl', html: '<span>' + fmtArea(ringArea(pts)) + '</span>', iconSize: [0, 0] }) }).addTo(drawn);
      updateHud();
    }
    map.on('click', (/** @type {any} */ e) => {
      const t = GG.get().tool;
      if (t === 'measure' || t === 'area') { pts.push(e.latlng); redraw(); }
      else if (t === 'coords') showCoords(e.latlng);
    });
    map.on('mousemove', (/** @type {any} */ e) => {
      const t = GG.get().tool;
      if ((t !== 'measure' && t !== 'area') || !pts.length || isMobile()) return;
      const chain = t === 'area' && pts.length > 1 ? [pts[pts.length - 1], e.latlng, pts[0]] : [pts[pts.length - 1], e.latlng];
      if (rubber) rubber.setLatLngs(chain); else rubber = L.polyline(chain, { className: 'gg-rubber', interactive: false }).addTo(map);
      updateHud(e.latlng);
    });
    map.on('dblclick', () => { if (GG.get().tool === 'measure' || GG.get().tool === 'area') finish(); });
    function finish() {
      if (rubber) { map.removeLayer(rubber); rubber = null; }
      const t = GG.get().tool;
      if ((t === 'measure' && pts.length < 2) || (t === 'area' && pts.length < 3)) { toast(t === 'area' ? 'Alan için en az 3 nokta gerekli.' : 'Mesafe için en az 2 nokta gerekli.'); return; }
      const msg = t === 'measure' ? 'Mesafe: ' + fmtDist(pathLength(map, pts)) : 'Alan: ' + fmtArea(ringArea(pts));
      toast(msg);
      // sonuç haritada kalır; yeni ölçüm için aynı araca tekrar basılabilir
      const keep = drawn.getLayers(); GG.set({ tool: 'none' });
      bar.querySelectorAll('[data-tool]').forEach((b) => b.classList.remove('on'));
      root.classList.remove('gg-drawing'); map.doubleClickZoom.enable();
      hudLbl.textContent = t === 'measure' ? 'Ölçülen mesafe' : 'Hesaplanan alan';
      hudVal.textContent = msg.split(': ')[1];
      hud.classList.add('done');
      pts = []; void keep;
    }
    hud.addEventListener('click', (e) => {
      const b = /** @type {HTMLElement} */ (e.target).closest('[data-hud]'); if (!b) return;
      const a = b.getAttribute('data-hud');
      if (a === 'undo') { pts.pop(); if (rubber) { map.removeLayer(rubber); rubber = null; } redraw(); }
      else if (a === 'done') finish();
      else { clearDrawing(); hud.classList.remove('done'); setTool('none'); hud.hidden = true; }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && GG.get().tool !== 'none' && !(/** @type {HTMLElement} */ (e.target).closest('input,textarea'))) { clearDrawing(); setTool('none'); }
      if (e.key === 'Enter' && (GG.get().tool === 'measure' || GG.get().tool === 'area')) finish();
    });

    function showCoords(/** @type {LatLng} */ p) {
      const dec = p.lat.toFixed(6) + ', ' + p.lng.toFixed(6);
      const html = '<div class="gg-coord"><small>Seçilen nokta</small><b>' + dec + '</b><span>' + dms(p.lat, 'lat') + '<br>' + dms(p.lng, 'lng') + '</span>' +
        '<div class="gg-coord-act"><button type="button" data-c="copy">Kopyala</button>' + (GG.hooks().onReportHere ? '<button type="button" data-c="report" class="primary">Bu noktayı bildir</button>' : '') + '</div></div>';
      const pop = L.popup({ className: 'gg-popup', closeButton: true, autoPanPadding: [30, 80] }).setLatLng(p).setContent(html).openOn(map);
      const el = pop.getElement();
      el.querySelector('[data-c=copy]').addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(dec); toast('Koordinat kopyalandı: ' + dec); } catch (_) { toast(dec); }
      });
      const rep = el.querySelector('[data-c=report]');
      if (rep) rep.addEventListener('click', () => { GG.set({ pendingPoint: { lat: p.lat, lng: p.lng } }); setTool('none'); /** @type {any} */ (GG.hooks().onReportHere)(p); });
    }

    const onTool = (/** @type {Event} */ e) => {
      const b = /** @type {HTMLElement} */ (e.target).closest('[data-tool]'); if (!b) return;
      const t = b.getAttribute('data-tool');
      if (t === 'more') {
        if (document.documentElement.dataset.ui === 'mobile') openMore(more.hidden); else openGroup(!group.classList.contains('open'));
        return;
      }
      openMore(false);
      // bir araç seçilince hap grubu küçülerek kapanır
      if (group.contains(b)) { openGroup(false); b.blur(); }
      if (t === 'search') { openSearch(sbox.hidden); return; }
      if (t === 'locate') { locate(); return; }
      if (t === 'nearby') { const cb = GG.hooks().onNearby; if (cb) cb(); return; }
      openSearch(false); hud.classList.remove('done');
      setTool(/** @type {ToolKey} */ (t));
    };
    bar.addEventListener('click', onTool);
    more.addEventListener('click', onTool);
    const api = { setTool, openSearch, locate, bar };
    /** @type {any} */ (window).GGMap.tools = api;
    return api;
  }

  /** @type {any} */ (window).GGMap = { addBasemaps, addToolbar, BASEMAPS, ringArea, fmtDist, fmtArea };
})();
