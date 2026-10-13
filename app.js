(function () {
  'use strict';

  /* =================== TANIMLAR =================== */
  const CATS = {
    fire:  { label: 'Orman yangını riski taşıyan alanlar',      short: 'Yangın riski',  color: '#B42318', ico: '🔥', featured: true,
             desc: 'Kuru ot birikimi, orman-yerleşim teması, kontrolsüz yakım izi, yangın altyapısı eksikliği' },
    urgent:{ label: 'Acil altyapı arızası',                     short: 'Acil arıza',    color: '#E11D48', ico: '🚨', urgent: true,
             desc: 'Patlak su borusu, taşan kanalizasyon, kopmuş kablo' },
    flood: { label: 'Sel, taşkın ve erozyon riski taşıyan alanlar', short: 'Sel riski', color: '#1D4ED8', ico: '🌊',
             desc: 'Dere yatağı, menfez tıkanıklığı, yamaç erozyonu' },
    waste: { label: 'Atık ve kirlilik riski taşıyan alanlar',   short: 'Atık riski',    color: '#7C5A00', ico: '🗑️',
             desc: 'Moloz dökümü, cam-plastik birikimi, kimyasal ambalaj' },
    infra: { label: 'Altyapı kaynaklı risk taşıyan noktalar',   short: 'Altyapı riski', color: '#6D28D9', ico: '⚡',
             desc: 'Elektrik hatları, tahliye yolu engelleri' },
    road:  { label: 'Yol çukuru ve hasarlı yol noktaları',      short: 'Yol hasarı',    color: '#0F766E', ico: '🚧',
             desc: 'Çukur, açık rögar, asfalt çökmesi, kaldırım' },
  };

  const SUBS = {
    fire: {
      dry_fuel:  ['Kuru ot ve yanıcı bitki atığı yoğunluğu', 'Yerleşime sıfır noktada biriken kuru ot, budama atığı, çalı.'],
      interface: ['Orman-yerleşim arayüz ihlali', 'Binanın orman dokusuyla doğrudan teması, tampon kuşağın olmaması.'],
      burning:   ['Kontrolsüz veya tarımsal atık yakımı', 'Zeytinlik ve tarım alanlarında anız, budama atığı yakma izi.'],
      fire_infra:['Yangın altyapısı eksikliği', 'Hidrant, su ikmal noktası veya uyarı levhasının bulunmaması.'],
    },
    waste: {
      rubble:  ['Yasa dışı hafriyat ve moloz dökümü', 'Orman kenarına veya boş araziye dökülen inşaat ve evsel atık.'],
      glass:   ['Plastik, cam ve tehlikeli atık birikimi', 'Patika kenarında cam şişe (mercek etkisi) ve plastik birikmesi.'],
      agchem:  ['Tarımsal kimyasal ambalaj atığı', 'Tarım ilacı ve gübre kutularının doğaya bırakılması.'],
    },
    flood: {
      channel: ['Dere yatağı daralması veya yapılaşma', 'Kuru dere ya da akarsu yatağına yapılan müdahale, dolgu, yapı.'],
      culvert: ['Menfez ve altyapı tıkanıklığı', 'Şiddetli yağışta suyu tahliye edemeyecek menfez veya köprü altı.'],
      erosion: ['Yüzey akışı ve erozyon hassasiyeti', 'Bitki örtüsü zayıflamış yamaçta toprak kayması riski.'],
    },
    infra: {
      power:  ['Kontrolsüz veya sarkmış elektrik hattı', 'Orman dokusu içinden geçen, kıvılcım üretebilecek enerji nakil hattı.'],
      escape: ['Tahliye yolu engelleri', 'Afet anında kaçışı kapatacak dar sokak, çıkmaz yol veya hatalı parklanma.'],
    },
    urgent: {
      water_pipe: ['Patlak su borusu veya su kaçağı', 'Yoldan, kaldırımdan ya da bir kapaktan su fışkırıyor veya akıyor.'],
      sewer:      ['Taşan kanalizasyon veya rögar', 'Kanalizasyon suyu yola ya da bahçelere taşıyor.'],
      power_line: ['Kopmuş kablo veya devrilmiş direk', 'Yere düşmüş, sarkan ya da kıvılcım çıkaran elektrik hattı. Yaklaşma, 186’yı ara.'],
      gas:        ['Gaz kokusu', 'Önce 187’yi ara ve bölgeden uzaklaş; bildirimi güvenli bir yerden yap.'],
    },
    road: {
      pothole:  ['Yol çukuru', 'Asfaltta araçlar ve yayalar için tehlike oluşturan çukur.'],
      manhole:  ['Açık, kırık veya çökmüş rögar kapağı', 'Yerinden oynamış, kırık ya da hiç olmayan kapak veya ızgara.'],
      collapse: ['Asfalt çökmesi veya derin çatlak', 'Zeminde oturma, yarılma, tümsekleşme.'],
      sidewalk: ['Kaldırım ve yaya yolu hasarı', 'Kırık parke, yüksek basamak, kullanılamayan engelli rampası.'],
    },
  };

  // Ek gözlem kutuları — işaretlenen madde kendi ana başlığını bildirime ekler
  const CHECKS = {
    fire:  { c_dry: 'Kurumuş ot ve çalı birikintisi', c_roof: 'Tutuşabilir çatı malzemeleri',
             c_plants: 'Binalara çok yakın yanıcı bitkiler', c_fuel: 'Yakıt veya tüp depolama alanı',
             c_burn: 'Açıkta yakma izi', c_nohydrant: 'Görünür hidrant veya su kaynağı yok' },
    waste: { c_dump: 'Açıkta bırakılmış çöp yığını', c_rubble: 'İnşaat molozu / hafriyat',
             c_glass: 'Cam şişe ve plastik birikintisi', c_chem: 'Boş ilaç veya kimyasal ambalajı' },
    flood: { c_channel: 'Daraltılmış veya doldurulmuş dere yatağı', c_culvert: 'Tıkalı menfez veya ızgara',
             c_pool: 'Su biriken çukur alan', c_erosion: 'Toprak kayması veya erozyon izi' },
    infra: { c_power: 'Ağaçlara değen veya sarkmış elektrik hattı', c_alley: 'Dar veya çıkmaz sokak',
             c_park: 'Yolu kapatan hatalı parklanma', c_sign: 'Uyarı veya yönlendirme levhası yok' },
    urgent:{ c_spread: 'Su yola veya kaldırıma yayılıyor', c_sink: 'Zeminde çökme veya oyuk oluştu',
             c_trafficblock: 'Trafiği veya yaya geçişini engelliyor', c_entrance: 'Bina girişini etkiliyor',
             c_spark: 'Kıvılcım veya elektrik tehlikesi var' },
    road:  { c_pothole: 'Yolda çukur', c_openlid: 'Açık veya kırık rögar kapağı',
             c_puddle: 'Çukurda su birikiyor, derinliği görünmüyor', c_dark: 'Gece aydınlatması yetersiz',
             c_nobarrier: 'Uyarı işareti veya bariyer yok', c_school: 'Okul, hastane veya durak yakınında' },
  };

  const DISTRICTS = ['Aliağa','Balçova','Bayındır','Bayraklı','Bergama','Beydağ','Bornova','Buca','Çeşme','Çiğli',
    'Dikili','Foça','Gaziemir','Güzelbahçe','Karabağlar','Karaburun','Karşıyaka','Kemalpaşa','Kınık','Kiraz',
    'Konak','Menderes','Menemen','Narlıdere','Ödemiş','Seferihisar','Selçuk','Tire','Torbalı','Urla'];

  // İzmir ili ve Gaziemir ilçesinin gerçek sınırları sinirlar.js'den gelir (OpenStreetMap)
  const SIN = window.SINIRLAR || null;
  const IZMIR = { south: 37.63, west: 26.17, north: 39.45, east: 28.45 };
  const pointInRing = (lat, lng, ring) => {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [yi, xi] = ring[i], [yj, xj] = ring[j];
      if ((yi > lat) !== (yj > lat) && lng < (xj - xi) * (lat - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  };
  // Sınır sadeleştirildiği için kıyıdaki noktalar dışarıda kalmasın: sınıra ~1.5 km yakınsa da kabul et
  const nearRing = (lat, lng, ring, tol) => ring.some((a, i) => {
    const b = ring[(i + 1) % ring.length];
    const dx = b[1] - a[1], dy = b[0] - a[0], len = dx * dx + dy * dy || 1e-12;
    const t = Math.max(0, Math.min(1, ((lng - a[1]) * dx + (lat - a[0]) * dy) / len));
    const px = a[1] + t * dx - lng, py = a[0] + t * dy - lat;
    return px * px + py * py < tol * tol;
  });
  const inIzmir = (lat, lng) => {
    if (!(lat >= IZMIR.south && lat <= IZMIR.north && lng >= IZMIR.west && lng <= IZMIR.east)) return false;
    if (!SIN) return true;
    return SIN.izmir.some((r) => pointInRing(lat, lng, r) || nearRing(lat, lng, r, 0.015));
  };

  const VEG = { low: 'Düşük', mid: 'Orta', high: 'Yüksek' };
  const DIST = { '0-50': '0-50 m', '50-200': '50-200 m', '200-500': '200-500 m', '500+': '500 m+' };
  const SLOPE = { flat: 'Düz', mid: 'Hafif eğimli', steep: 'Dik yamaç' };
  const WATER = { yes: 'Su kaynağı var', no: 'Su kaynağı yok', unknown: 'Su kaynağı bilinmiyor' };
  const DRAIN = { good: 'Gider açık', mid: 'Gider kısmen tıkalı', bad: 'Gider tamamen tıkalı' };
  const WTYPE = { household: 'Evsel çöp', rubble: 'Hafriyat / moloz', glass: 'Cam ve plastik', chemical: 'Kimyasal ambalaj' };
  const WAMOUNT = { small: 'Birkaç poşet', mid: 'Araba dolusu', large: 'Kamyon dolusu' };
  const RSIZE = { small: 'Küçük çukur (<30 cm)', mid: 'Orta çukur (30-60 cm)', large: 'Büyük çukur (60 cm+)' };
  const RDEPTH = { shallow: 'Sığ (<5 cm)', mid: 'Orta derin (5-10 cm)', deep: 'Derin (10 cm+)' };
  const RPOS = { lane: 'Araç şeridinde', edge: 'Yol kenarında', crossing: 'Yaya geçidinde', sidewalk: 'Kaldırımda' };
  const RTRAFFIC = { low: 'Az trafik', mid: 'Orta trafik', high: 'Yoğun trafik' };
  const UFLOW = { leak: 'Sızıntı', flow: 'Akıyor', burst: 'Fışkırıyor' };
  const USINCE = { now: 'Az önce fark edildi', hours: 'Birkaç saattir', days: 'Günlerdir' };
  const isUrgentOpen = (r) => r.category === 'urgent' && !r.resolved_at;
  const STATUS = { pending: 'İncelemede', approved: 'Yayında', rejected: 'Kaldırıldı' };
  const GAZIEMIR = [38.3216, 27.1306];
  const BUCKET = 'report-photos';
  const MAX_PHOTOS = 3;

  const DIST_LABEL = {
    fire:  ['Ormanın başladığı yere uzaklık', 'Yanıcı madde ormana ne kadar yakınsa risk o kadar yüksektir.'],
    waste: ['Ormanın başladığı yere uzaklık', 'Orman kenarına yakın atık, yangın başlangıcı için hazır yakıttır.'],
    flood: ['Dere yatağına veya menfeze uzaklık', 'Yatağa yakın yapılaşma taşkında ilk zarar gören yerdir.'],
    infra: ['Ormanın başladığı yere uzaklık', 'Orman içinden geçen hat veya dar yol daha kritiktir.'],
  };
  const SLOPE_HELP = {
    fire:  'Yangın yokuş yukarı daha hızlı ilerler, bu yüzden eğim riski artırır.',
    flood: 'Düz ve çukur alanlarda su birikir, dik yamaçta ise toprak kayması olur.',
  };

  /* =================== YARDIMCILAR =================== */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtDate = (d) => new Date(d).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' });
  const show = (el, on = true) => { if (el) el.hidden = !on; };
  const radio = (n) => { const el = $('input[name=' + n + ']:checked'); return el ? el.value : null; };
  const catOf = (r) => CATS[r.category] ? r.category : 'fire';
  const subLabel = (r) => (SUBS[catOf(r)] && SUBS[catOf(r)][r.subcategory]) ? SUBS[catOf(r)][r.subcategory][0] : CATS[catOf(r)].label;
  const checkLabel = (k) => { for (const c in CHECKS) if (CHECKS[c][k]) return CHECKS[c][k]; return k; };
  const placeOf = (r) => [r.district, r.neighborhood].filter(Boolean).join(' / ') || '—';
  const level = (n) => (n >= 67 ? 'high' : n >= 34 ? 'mid' : 'low');
  const levelText = { high: 'Yüksek', mid: 'Orta', low: 'Düşük' };

  let toastTimer;
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.hidden = false;
    t.classList.remove('in'); void t.offsetWidth; t.classList.add('in');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 4000);
  }

  /* =================== TERCİHLER =================== */
  const PREF_KEY = 'gyrh-prefs';
  const prefs = Object.assign({ motion: 'on', sound: 'on', basemap: 'sat' },
    (() => { try { return JSON.parse(localStorage.getItem(PREF_KEY) || '{}'); } catch (_) { return {}; } })());
  function savePrefs() {
    try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch (_) { /* gizli sekme */ }
    document.documentElement.dataset.motion = prefs.motion;
  }

  /* =================== CİHAZ ALGILAMA =================== */
  // Telefon / tablet / bilgisayar, işletim sistemi ve tarayıcıyı anlar; arayüz buna göre değişir
  const DEVICE = (() => {
    const ua = navigator.userAgent || '', plat = navigator.platform || '';
    const iPadOS = plat === 'MacIntel' && navigator.maxTouchPoints > 1;
    const os = /iPhone|iPod/.test(ua) ? 'ios' : (/iPad/.test(ua) || iPadOS) ? 'ipados' : /Android/i.test(ua) ? 'android'
      : /Windows/i.test(ua) ? 'windows' : /Mac/i.test(ua) ? 'mac' : /Linux/i.test(ua) ? 'linux' : 'diger';
    const browser = /SamsungBrowser/i.test(ua) ? 'samsung' : /EdgA?\//i.test(ua) ? 'edge' : /OPR\/|Opera/i.test(ua) ? 'opera'
      : /FxiOS|Firefox/i.test(ua) ? 'firefox' : /CriOS/i.test(ua) ? 'chrome-ios'
      : (navigator.brave ? 'brave' : /Chrome|Chromium/i.test(ua) ? 'chrome' : /Safari/i.test(ua) ? 'safari' : 'diger');
    const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
    const touch = window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
    const OSN = { ios: 'iPhone', ipados: 'iPad', android: 'Android', windows: 'Windows', mac: 'Mac', linux: 'Linux', diger: 'Bilinmeyen cihaz' };
    const BRN = { samsung: 'Samsung Internet', edge: 'Edge', opera: 'Opera', firefox: 'Firefox', 'chrome-ios': 'Chrome',
      brave: 'Brave', chrome: 'Chrome', safari: 'Safari', diger: 'tarayıcı' };
    return { os, browser, standalone, touch, label: OSN[os] + ' · ' + BRN[browser] + (standalone ? ' (uygulama)' : '') };
  })();
  // Dar ekran veya dokunmatik telefon → telefon arayüzü
  const isMobileUI = () => window.innerWidth < 760 || (DEVICE.touch && window.innerWidth < 1000 && /ios|android/.test(DEVICE.os));
  function applyDevice() {
    const d = document.documentElement.dataset;
    d.os = DEVICE.os; d.browser = DEVICE.browser;
    d.standalone = DEVICE.standalone ? 'yes' : 'no';
    d.ui = isMobileUI() ? 'mobile' : 'desktop';
  }
  applyDevice();

  /* =================== YÜKLEME GÖSTERGELERİ =================== */
  let busyCount = 0;
  function busy(on) {
    busyCount = Math.max(0, busyCount + (on ? 1 : -1));
    document.getElementById('topbar').classList.toggle('on', busyCount > 0);
  }
  async function withBusy(p) { busy(true); try { return await p; } finally { busy(false); } }

  let splashDone = false;
  function hideSplash() {
    if (splashDone) return; splashDone = true;
    const s = document.getElementById('splash');
    s.classList.add('out');
    setTimeout(() => s.remove(), 700);
  }
  const splashMsg = (t) => { const m = document.getElementById('splash-msg'); if (m) m.textContent = t; };

  /* =================== EFEKTLER =================== */
  const lite = () => !!(window.GGLite && GGLite.on());
  const calm = () => prefs.motion === 'off' || lite() || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Başlıkları kelime kelime yavaşça aç
  function splitWords(root = document) {
    $$('[data-split]', root).forEach((el) => {
      if (el.dataset.splitDone) return;
      el.dataset.splitDone = '1';
      const words = el.textContent.trim().split(/\s+/);
      el.setAttribute('aria-label', el.textContent.trim());
      el.innerHTML = words.map((w, i) => '<span class="w" aria-hidden="true" data-css="--wi:' + i + '">' + esc(w) + '</span>').join(' ');
    });
  }
  // Görünür alana giren .reveal öğeleri sırayla belirsin
  let revealObs = null;
  function watchReveal(root = document) {
    const items = $$('.reveal:not(.in)', root);
    if (!('IntersectionObserver' in window) || calm()) { items.forEach((el) => el.classList.add('in')); return; }
    if (!revealObs) {
      revealObs = new IntersectionObserver((ents) => ents.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in'); revealObs.unobserve(e.target); }
      }), { threshold: 0.12 });
    }
    items.forEach((el, i) => { el.style.setProperty('--ri', i % 6); revealObs.observe(el); });
  }
  // Görünüme her girişte başlık animasyonunu yeniden oynat
  function replayView(view) {
    if (!view) return;
    $$('[data-split]', view).forEach((el) => { el.classList.remove('play'); void el.offsetWidth; el.classList.add('play'); });
    watchReveal(view);
  }

  // Kısa "ding" sesi (dosya gerektirmez)
  function ding() {
    if (prefs.sound !== 'on') return;
    try {
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      [880, 1320].forEach((f, i) => {
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, ac.currentTime + i * 0.12);
        g.gain.exponentialRampToValueAtTime(0.18, ac.currentTime + i * 0.12 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + i * 0.12 + 0.35);
        o.connect(g).connect(ac.destination); o.start(ac.currentTime + i * 0.12); o.stop(ac.currentTime + i * 0.12 + 0.4);
      });
      setTimeout(() => ac.close(), 1000);
    } catch (_) { /* ses desteklenmiyor */ }
  }

  // Sayıyı eski değerinden yenisine doğru sayarak getirir
  function countTo(el, to, ms = 600) {
    if (!el) return;
    const from = Number(el.dataset.n || 0);
    el.dataset.n = to;
    if (calm() || from === to || document.hidden) { el.textContent = to; return; }
    const t0 = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(from + (to - from) * e);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  // Başarılı gönderimde kısa bir konfeti yağmuru
  function confetti() {
    if (calm()) return;
    const c = document.createElement('canvas');
    c.className = 'confetti';
    document.body.appendChild(c);
    const ctx = c.getContext('2d'), dpr = window.devicePixelRatio || 1;
    c.width = innerWidth * dpr; c.height = innerHeight * dpr; ctx.scale(dpr, dpr);
    const colors = Object.values(CATS).map((x) => x.color).concat(['#FFD166', '#ffffff']);
    const bits = Array.from({ length: 140 }, () => ({
      x: innerWidth / 2 + (Math.random() - 0.5) * 120, y: innerHeight * 0.55,
      vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 16 - 6,
      r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.4,
      w: 6 + Math.random() * 6, h: 4 + Math.random() * 4, c: colors[(Math.random() * colors.length) | 0],
    }));
    const t0 = performance.now();
    (function frame(t) {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      bits.forEach((b) => {
        b.vy += 0.45; b.vx *= 0.99; b.x += b.vx; b.y += b.vy; b.r += b.vr;
        ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.r); ctx.fillStyle = b.c;
        ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h); ctx.restore();
      });
      if (t - t0 < 2600) requestAnimationFrame(frame); else c.remove();
    })(t0);
  }

  // Butonlara dokununca dalga efekti
  function ripple(e) {
    const b = e.target.closest('.btn, .chip, .cat');
    if (!b || calm()) return;
    const r = b.getBoundingClientRect(), s = Math.max(r.width, r.height);
    const i = document.createElement('i');
    i.className = 'ripple';
    i.style.cssText = 'width:' + s + 'px;height:' + s + 'px;left:' + (e.clientX - r.left - s / 2) + 'px;top:' + (e.clientY - r.top - s / 2) + 'px';
    b.appendChild(i);
    setTimeout(() => i.remove(), 600);
  }
  function setMsg(id, text, kind) {
    const el = $(id); if (!el) return;
    if (!text) { el.hidden = true; return; }
    el.textContent = text; el.className = 'msg' + (kind ? ' ' + kind : ''); el.hidden = false;
  }

  /* =================== TEMA =================== */
  const THEME_KEY = 'gyrh-theme';
  const hex2rgb = (h) => { const n = parseInt(h.replace('#', ''), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const shade = (h, p) => '#' + hex2rgb(h).map((v) => {
    const x = Math.round(p < 0 ? v * (1 + p) : v + (255 - v) * p);
    return Math.max(0, Math.min(255, x)).toString(16).padStart(2, '0');
  }).join('');
  const contrastInk = (h) => {
    const [r, g, b] = hex2rgb(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) > 0.4 ? '#14201B' : '#ffffff';
  };
  const theme = Object.assign({ mode: 'auto', accent: 'forest', custom: '#1F4D3A', contrast: 'off' },
    JSON.parse(localStorage.getItem(THEME_KEY) || '{}'));

  function applyTheme() {
    const root = document.documentElement;
    const dark = theme.mode === 'dark' ||
      (theme.mode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    root.dataset.mode = dark ? 'dark' : 'light';
    if (theme.accent === 'custom' && theme.custom) {
      root.dataset.accent = 'custom';
      root.style.setProperty('--accent', theme.custom);
      root.style.setProperty('--accent-d', shade(theme.custom, -0.18));
      root.style.setProperty('--accent-ink', contrastInk(theme.custom));
    } else {
      root.dataset.accent = theme.accent;
      root.style.removeProperty('--accent');
      root.style.removeProperty('--accent-d');
      root.style.removeProperty('--accent-ink');
    }
    root.dataset.contrast = theme.contrast;
    $$('#mode-chips .chip').forEach((b) => b.classList.toggle('on', b.dataset.mode === theme.mode));
    $$('#accent-swatches .sw[data-accent]').forEach((b) => b.classList.toggle('on', b.dataset.accent === theme.accent));
    $('#sw-custom').classList.toggle('on', theme.accent === 'custom');
    $('#accent-custom').value = theme.custom;
    $('#chk-contrast').checked = theme.contrast === 'on';
    localStorage.setItem(THEME_KEY, JSON.stringify(theme));
  }

  /* =================== SUPABASE =================== */
  const cfg = window.CONFIG || {};
  const configured = !!cfg.SUPABASE_URL && !/YOUR_/.test(cfg.SUPABASE_URL) && !!cfg.SUPABASE_ANON_KEY && !/YOUR_/.test(cfg.SUPABASE_ANON_KEY);
  // "Beni hatırla": açıksa oturum kalıcı (localStorage), kapalıysa tarayıcı kapanınca biter (sessionStorage)
  const REMEMBER_KEY = 'gyrh-remember';
  const safe = (fn, fb) => { try { return fn(); } catch (_) { return fb; } };
  // Varsayılan: hatırlama KAPALI (okul / ortak bilgisayarlarda oturum açık kalmasın). Açıkken bile en çok 30 gün sürer.
  const REMEMBER_AT = 'gyrh-remember-at', REMEMBER_MAX = 30 * 24 * 3600e3;
  const remembering = () => safe(() => localStorage.getItem(REMEMBER_KEY) === 'yes', false);
  safe(() => {
    const at = Number(localStorage.getItem(REMEMBER_AT) || 0);
    if (remembering() && !at) localStorage.setItem(REMEMBER_AT, String(Date.now()));
    if (remembering() && at && Date.now() - at > REMEMBER_MAX) {
      Object.keys(localStorage).filter((k) => /^sb-.*-auth-token/.test(k)).forEach((k) => localStorage.removeItem(k));
      localStorage.removeItem(REMEMBER_AT);
    }
  });
  const authStorage = {
    getItem: (k) => safe(() => sessionStorage.getItem(k) ?? localStorage.getItem(k), null),
    setItem: (k, v) => safe(() => {
      if (remembering()) { localStorage.setItem(k, v); sessionStorage.removeItem(k); }
      else { sessionStorage.setItem(k, v); localStorage.removeItem(k); }
    }),
    removeItem: (k) => safe(() => { localStorage.removeItem(k); sessionStorage.removeItem(k); }),
  };
  // Her cihaza kalıcı rastgele bir kimlik: yasaklama ve "oturum açtığım cihazlar" listesi için
  const DEVICE_ID = safe(() => {
    let d = localStorage.getItem('gyrh-device');
    if (!d) {
      d = window.crypto && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
      localStorage.setItem('gyrh-device', d);
    }
    return d;
  }, 'gizli-sekme');
  // Şifre sıfırlama bağlantısından mı geldik? (Supabase adresi temizlemeden önce bakılır)
  const RECOVERY_LINK = /type=recovery/.test(location.hash);
  // Şifre sıfırlama e-postası ?sifre=1 adresine döner: başarılı ya da hatalı her durumda doğru sayfa açılır
  const RESET_LINK = /[?&]sifre=1/.test(location.search);
  // Sayfa yenilense de "şifre yenileme" ekranı kaybolmasın diye sekmeye özel işaret (jeton saklanmaz; 1 saat geçerli)
  const RESET_KEY = 'gg-sifre-yenile', RESET_TTL = 60 * 60e3;
  const resetMark = (on) => { try { if (on) sessionStorage.setItem(RESET_KEY, String(Date.now())); else sessionStorage.removeItem(RESET_KEY); } catch (_) { /* gizli sekme */ } };
  const resetActive = () => { try { const t = Number(sessionStorage.getItem(RESET_KEY) || 0); return t > 0 && Date.now() - t < RESET_TTL; } catch (_) { return false; } };
  if (RECOVERY_LINK) resetMark(true);
  // E-posta bağlantısıyla (giriş, sıfırlama ya da hata) mı açıldı? O zaman yeni sürüm için sayfa kendiliğinden yenilenmez,
  // yoksa adresteki bilgi kaybolur ve "yeni şifre" ekranı / hata mesajı görünmez.
  const AUTH_LINK = /access_token=|error_code=|error_description=|type=recovery/.test(location.hash);
  const sb = configured ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
    auth: { storage: authStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    global: { headers: { 'x-device-id': DEVICE_ID } },
  }) : null;
  // Gözlemcinin gerçek adı herkese gönderilmez (sunucuda sütun yetkisi); yerine "B---r U---l" gelir.
  // Yöneticiler gerçek adı ayrı bir yetkili çağrıyla (admin_observer_names) alır.
  const REPORT_COLS = 'id,user_id,username,observer_masked,observed_at,lat,lng,address,photo_path,vegetation,risks,access_score,notes,status,' +
    'created_at,photo_paths,category,subcategory,categories,neighborhood,edge_distance,slope,water_source,structures,flood_drain,waste_type,' +
    'waste_amount,risk_score,admin_note,reviewed_at,district,flag_reason,road_size,road_depth,road_position,road_traffic,urgent_flow,' +
    'urgent_since,resolved_at,resolved_by,fix_flagged_at,source';
  let realNames = {}; // yönetici için id → gerçek ad
  const observerOf = (r) => realNames[r.id] || r.observer_masked || r.observer_name || '—';
  async function loadRealNames() {
    if (!sb || !profile || !profile.is_admin) { realNames = {}; return; }
    const { data } = await sb.rpc('admin_observer_names');
    realNames = {}; (data || []).forEach((x) => { realNames[x.id] = x.observer_name; });
  }
  const photoUrl = (path) => sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  // Küçük önizleme: yeni yüklenen "….t.jpg" fotoğrafın ~360 px'lik önizlemesi aynı adla "….k.jpg" olarak durur.
  // Eski fotoğraflarda önizleme yoktur; özgün dosya kullanılır (boşa istek ya da hata oluşmaz).
  const thumbOf = (path) => (/\.t\.jpg$/.test(path) ? path.replace(/\.t\.jpg$/, '.k.jpg') : path);
  const thumbUrl = (path) => photoUrl(thumbOf(path));
  const withThumbs = (paths) => paths.reduce((a, p) => a.concat(thumbOf(p) !== p ? [p, thumbOf(p)] : [p]), []);
  const photosOf = (r) => (r.photo_paths && r.photo_paths.length ? r.photo_paths : (r.photo_path ? [r.photo_path] : []));

  let session = null, profile = null, approved = [];
  let adminReports = [], adminUsers = [];
  const filt = { cat: 'all', sub: 'all', hood: 'all', level: 'all', q: '', days: 0, open: false, view: false, near: null };
  const admin = { tab: 'overview', cat: 'all', sort: 'new', q: '', uq: '', uf: 'all' };


  /* =================== İÇERİK DENETİMİ =================== */
  // Küfür/hakaret denetimi sadece sunucuda yapılır (liste kaynak kodda görünmesin).
  // Burada yalnızca anlamsız/deneme yazısı gibi zararsız kontroller var.
  const DEMO = ['deneme','test','asdasd','asdf','qwerty','sdfsdf','aaaa','1234','abcabc','falan','filan','hhhh','xxxx'];

  // Türkçe harfleri sadeleştirip boşlukları atarak yazım oyunlarını yakala
  function norm(t) {
    return String(t || '').toLowerCase()
      .replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/[0@]/g, 'o').replace(/[1!|]/g, 'i').replace(/3/g, 'e').replace(/4/g, 'a').replace(/5/g, 's').replace(/7/g, 't')
      .replace(/[^a-z\s]/g, ' ');
  }

  // Anlamsız yazı: aynı harfin tekrarı, sesli harfsiz uzun dizi, klavye ezmesi
  function looksLikeGibberish(text) {
    const t = norm(text).replace(/\s+/g, ' ').trim();
    if (!t) return false;
    if (/(.)\1{4,}/.test(t)) return true;
    if (DEMO.some((d) => t.includes(d))) return true;
    const longest = t.split(' ').sort((a, b) => b.length - a.length)[0] || '';
    if (longest.length >= 6 && !/[aeiou]/.test(longest)) return true;
    const letters = t.replace(/\s/g, '');
    if (letters.length >= 8) {
      const uniq = new Set(letters).size;
      if (uniq <= 3) return true;
    }
    return false;
  }

  // Bildirimi inceler. Sadece gerçekten şüpheli içerik (küfür, anlamsız/deneme yazısı) yönetici onayına düşer.
  // Hafif eksikler bildirimi durdurmaz; yöneticiye not olarak görünür.
  function reviewReport(d, texts) {
    if (looksLikeGibberish(texts.name)) return { reason: 'Gözlemci adı anlamsız veya deneme gibi görünüyor', severe: true };
    if (texts.notes && texts.notes.length > 6 && looksLikeGibberish(texts.notes)) return { reason: 'Notlar anlamsız veya deneme gibi görünüyor', severe: true };
    const obs = new Date(texts.observedAt);
    if (Date.now() - obs > 365 * 864e5) return { reason: 'Gözlem tarihi bir yıldan eski', severe: false };
    if (!/\s/.test(texts.name.trim())) return { reason: 'Ad ve soyad birlikte yazılmamış', severe: false };
    if (d.checks.length === 0 && !(texts.notes || '').trim() && !['road', 'urgent'].includes(d.cat))
      return { reason: 'Hiçbir ek unsur işaretlenmemiş ve not yazılmamış', severe: false };
    return null;
  }

  /* =================== RİSK PUANI =================== */
  function scoreOf(d) {
    const nChecks = (d.checks || []).length;
    let s = 0, parts = [];
    const acc = Number(d.acc || 3);
    const accPts = (5 - acc) * 4;                         // 0-16
    const structPts = { '0': 0, '1-5': 5, '6-20': 10, '20+': 15 }[d.struct] || 0;
    const distPts = { '0-50': 25, '50-200': 16, '200-500': 8, '500+': 0 }[d.dist] || 0;

    if (d.cat === 'fire') {
      s += { low: 0, mid: 14, high: 28 }[d.veg] || 0;
      s += distPts;
      s += { flat: 0, mid: 7, steep: 14 }[d.slope] || 0;
      s += { no: 12, unknown: 6, yes: 0 }[d.water] || 0;
      s += accPts + structPts + Math.min(nChecks * 3, 12);
      parts = ['bitki örtüsü', 'orman yakınlığı', 'eğim', 'su kaynağı', 'erişim'];
    } else if (d.cat === 'flood') {
      s += { good: 0, mid: 15, bad: 30 }[d.drain] || 0;
      s += distPts;
      s += { flat: 14, mid: 8, steep: 12 }[d.slope] || 0;
      s += accPts + structPts + Math.min(nChecks * 4, 16);
      parts = ['menfez durumu', 'yatağa yakınlık', 'eğim', 'yapı yoğunluğu'];
    } else if (d.cat === 'waste') {
      s += { small: 8, mid: 20, large: 32 }[d.wamount] || 0;
      s += { household: 8, glass: 18, rubble: 14, chemical: 24 }[d.wtype] || 0;
      s += distPts;
      s += accPts + Math.min(nChecks * 4, 16);
      parts = ['atık miktarı', 'atık türü', 'orman yakınlığı', 'erişim'];
    } else if (d.cat === 'urgent') {
      s += { leak: 25, flow: 45, burst: 65 }[d.uflow] || 0;
      s += { now: 10, hours: 15, days: 22 }[d.usince] || 0;
      s += (d.sub === 'gas' || d.sub === 'power_line' ? 20 : 0) + Math.min(nChecks * 4, 16);
      parts = ['şiddet', 'süre', 'tehlike türü'];
    } else if (d.cat === 'road') {
      s += { small: 8, mid: 18, large: 28 }[d.rsize] || 0;
      s += { shallow: 4, mid: 12, deep: 22 }[d.rdepth] || 0;
      s += { lane: 16, crossing: 18, edge: 8, sidewalk: 12 }[d.rpos] || 0;
      s += { low: 2, mid: 8, high: 14 }[d.rtraffic] || 0;
      s += (d.sub === 'manhole' ? 10 : 0) + Math.min(nChecks * 4, 16);
      parts = ['çukur boyutu', 'derinlik', 'konum', 'trafik'];
    } else {
      s += distPts + accPts + structPts + Math.min(nChecks * 6, 24);
      s += d.sub === 'power' ? 22 : 16;
      parts = ['alt başlık', 'orman yakınlığı', 'erişim', 'yapı yoğunluğu'];
    }
    return { score: Math.max(0, Math.min(100, Math.round(s))), parts };
  }

  function formData() {
    return {
      cat: formCat, sub: radio2('sub'), veg: radio('veg'), dist: radio('dist'), slope: radio('slope'),
      water: radio('water'), struct: radio('struct'), drain: radio('drain'), wtype: radio('wtype'),
      wamount: radio('wamount'), acc: radio('acc'),
      rsize: radio('rsize'), rdepth: radio('rdepth'), rpos: radio('rpos'), rtraffic: radio('rtraffic'),
      uflow: radio('uflow'), usince: radio('usince'), checks: $$('#risk-checks input:checked').map((i) => i.value),
    };
  }
  const radio2 = (n) => { const el = $('input[name=' + n + ']:checked'); return el ? el.value : null; };

  function derivedCats(d) {
    const set = new Set([d.cat]);
    (d.checks || []).forEach((k) => { for (const c in CHECKS) if (CHECKS[c][k]) set.add(c); });
    return Array.from(set);
  }

  function updateScore() {
    if (!formCat) return;
    const d = formData();
    const { score } = scoreOf(d);
    const lv = level(score);
    countTo($('#score-val'), score);
    $('#score-card').dataset.level = lv;
    $('#score-text').textContent = levelText[lv] + ' risk · ' + CATS[formCat].short;
    const bar = $('#score-bar');
    bar.style.width = score + '%';
    bar.style.background = lv === 'high' ? 'var(--hi)' : lv === 'mid' ? 'var(--mid)' : 'var(--lo)';
    const cats = derivedCats(d);
    $('#cat-out').textContent = cats.length > 1
      ? 'Bu bildirim şu başlıklara eklenecek: ' + cats.map((c) => CATS[c].short).join(', ')
      : '';
  }

  /* =================== HARİTA =================== */
  // Haritada gerçek kare hızı bir kez ölçülür: ayar "otomatik"ken boşta bile kareler çok yavaşsa (medyan > 45 ms ≈ 22 fps altı)
  // bu oturum için hafif mod açılır. Kalıcı seçim Ayarlar'dadır.
  let fpsProbed = false;
  function probeFps() {
    if (fpsProbed || !window.GGLite || GGLite.pref() !== 'auto' || lite() || calm()) return;
    fpsProbed = true;
    setTimeout(() => {
      if (document.hidden) { fpsProbed = false; return; }
      const d = []; let last = 0;
      const step = (t) => {
        if (last) d.push(t - last);
        last = t;
        if (d.length < 45) return requestAnimationFrame(step);
        const med = d.slice().sort((a, b) => a - b)[Math.floor(d.length / 2)];
        if (med > 45 && !document.hidden) {
          document.documentElement.classList.add('lite');
          toast('Cihaz yavaş çalışıyor; akıcı olsun diye hafif mod açıldı. Ayarlar → Görünüm’den değiştirebilirsin.');
        }
      };
      requestAnimationFrame(step);
    }, 3000);
  }
  function makeMap(el) {
    L.TileLayer.mergeOptions({ updateWhenZooming: false, keepBuffer: lite() ? 1 : 2 });
    const bounds = SIN ? L.latLngBounds(SIN.izmir.flat()) : L.latLngBounds([IZMIR.south, IZMIR.west], [IZMIR.north, IZMIR.east]);
    const map = L.map(el, {
      center: GAZIEMIR, zoom: 13, minZoom: 9, maxZoom: 19,
      maxBounds: bounds.pad(0.05), maxBoundsViscosity: 0.9,
      // yumuşak yakınlaştırma: fare tekerinde yarım adımlar, dokunmatikte ataletli kaydırma
      zoomSnap: 0.25, zoomDelta: 0.5, wheelPxPerZoomLevel: 110, wheelDebounceTime: 30,
      inertiaDeceleration: 2600, zoomControl: el !== 'map' || document.documentElement.dataset.ui !== 'mobile',
      // hafif modda karo solma ve işaretçi yakınlaştırma animasyonları kapalı (düşük güçlü GPU'da takılmayı azaltır)
      fadeAnimation: !lite(), markerZoomAnimation: !lite(),
    });
    // Altlıklar ve katman seçici harita-araclari.js'de (uydu, sokak, topoğrafik, gece, sade)
    const bm = window.GGMap.addBasemaps(map, prefs.basemap, { compact: el !== 'map' });
    map._bm = bm;
    addImageryDate(map, () => bm.current() === 'sat');
    L.control.scale({ imperial: false }).addTo(map);
    addFocusMask(map);

    // Sol üstte hızlı odak düğmeleri: Gaziemir ve tüm İzmir
    const Focus = L.Control.extend({
      options: { position: 'topleft' },
      onAdd: function () {
        const d = L.DomUtil.create('div', 'leaflet-bar focus-btn');
        L.DomEvent.disableClickPropagation(d);
        d.innerHTML = '<a href="#" role="button" data-f="g" title="Gaziemir\'e odaklan" aria-label="Gaziemir\'e odaklan"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="2.5"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3"/></svg><span>Gaziemir</span></a>' +
          '<a href="#" role="button" data-f="i" title="Tüm İzmir\'i göster" aria-label="Tüm İzmir\'i göster"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg><span>İzmir</span></a>';
        L.DomEvent.on(d, 'click', (e) => {
          L.DomEvent.stop(e);
          const f = e.target.closest('[data-f]'); if (!f) return;
          // telefonda alttaki liste paneli haritanın altını kapatır; alanın tamamı görünsün
          const mob = document.documentElement.dataset.ui === 'mobile' && el === 'map';
          map.flyToBounds(f.dataset.f === 'g' ? gaziemirBounds() : bounds,
            { paddingTopLeft: [20, mob ? 110 : 30], paddingBottomRight: [20, mob ? 170 : 30], duration: 0.9 });
        });
        return d;
      },
    });
    map.addControl(new Focus());
    return map;
  }
  // Sınır dosyası yüklenemezse kullanılacak kaba Gaziemir çizgisi
  const GAZIEMIR_AREA = SIN ? SIN.gaziemir[0] : [
    [38.350, 27.075], [38.350, 27.205], [38.292, 27.235],
    [38.248, 27.205], [38.244, 27.108], [38.295, 27.062],
  ];
  const gaziemirBounds = () => L.latLngBounds(SIN ? SIN.gaziemir.flat() : GAZIEMIR_AREA);
  const WORLD_RING = [[-85, -180], [-85, 180], [85, 180], [85, -180]];

  // İzmir dışı koyulaşır; İzmir sınırı ince çizgi, Gaziemir parlayan kesikli çizgiyle vurgulanır
  function addFocusMask(map) {
    const izRings = SIN ? SIN.izmir : [[[IZMIR.south, IZMIR.west], [IZMIR.south, IZMIR.east], [IZMIR.north, IZMIR.east], [IZMIR.north, IZMIR.west]]];
    L.polygon([WORLD_RING].concat(izRings), {
      stroke: false, fillColor: '#06100C', fillOpacity: 0.62, interactive: false, className: 'focus-mask',
    }).addTo(map);
    L.polygon(izRings, {
      fill: false, color: '#7DD3FC', weight: 2, opacity: 0.9, interactive: false, className: 'izmir-line',
    }).addTo(map);
    const gzRings = SIN ? SIN.gaziemir : [GAZIEMIR_AREA];
    L.polygon(gzRings, {
      color: '#FFD166', weight: 6, opacity: 0.25, fill: false, interactive: false, className: 'gz-glow',
    }).addTo(map);
    L.polygon(gzRings, {
      color: '#FFD166', weight: 2.5, dashArray: '8 6', fillColor: '#FFD166', fillOpacity: 0.06, interactive: false, className: 'gz-line',
    }).addTo(map).bindTooltip('Gaziemir odak alanı', { sticky: true });
    // "GAZİEMİR" etiketi: uzaktan bakınca görünür, yakınlaşınca pinlerin üstünü kapatmasın diye gizlenir
    const gb = L.latLngBounds(gzRings.flat());
    const lbl = L.marker([gb.getNorth(), gb.getCenter().lng], { // sınırın üst kenarında, pinlerin üstünde değil
      icon: L.divIcon({ className: 'map-label', html: '<span>Gaziemir</span>', iconSize: [0, 0] }), interactive: false, keyboard: false,
    });
    const syncLbl = () => { if (map.getZoom() <= 13) lbl.addTo(map); else lbl.remove(); };
    map.on('zoomend', syncLbl); syncLbl();
  }

  // Acil durum pini: kırmızı-mavi çakar gibi yanıp söner
  const urgentIcon = () => L.divIcon({
    className: 'pin-urgent', html: '<b class="wave"></b><b class="wave w2"></b><span>!</span>',
    iconSize: [40, 40], iconAnchor: [20, 20], popupAnchor: [0, -18],
  });
  const markerById = {};
  const pinIcon = (color, score, delay, still) => L.divIcon({
    className: 'pin' + ((score || 0) >= 67 ? ' hot' : '') + (still ? ' still' : ''),
    html: '<b class="ring" data-css="--c:' + color + '"></b><span data-css="--c:' + color + ';--d:' + (delay || 0) + 'ms;opacity:' +
      (0.55 + Math.min(score || 0, 100) / 100 * 0.45) + '"></span>',
    iconSize: [34, 40], iconAnchor: [17, 38], popupAnchor: [0, -34],
  });

  let mainMap, markerLayer, pickMap, pickMarker, picked = null;

  function shotsHtml(r, cls) {
    const ps = photosOf(r);
    if (!ps.length) return '';
    return '<div class="shots">' + ps.map((p) =>
      '<img loading="lazy" decoding="async" alt="Bildirim fotoğrafı" data-full="' + esc(photoUrl(p)) + '" src="' + esc(thumbUrl(p)) + '">').join('') + '</div>';
  }

  function detailLines(r) {
    const L1 = [];
    if (r.vegetation) L1.push('Bitki örtüsü: ' + VEG[r.vegetation]);
    if (r.edge_distance) L1.push('Uzaklık: ' + DIST[r.edge_distance]);
    if (r.slope) L1.push(SLOPE[r.slope]);
    if (r.water_source) L1.push(WATER[r.water_source]);
    if (r.flood_drain) L1.push(DRAIN[r.flood_drain]);
    if (r.waste_type) L1.push(WTYPE[r.waste_type]);
    if (r.waste_amount) L1.push(WAMOUNT[r.waste_amount]);
    if (r.road_size) L1.push(RSIZE[r.road_size]);
    if (r.road_depth) L1.push(RDEPTH[r.road_depth]);
    if (r.road_position) L1.push(RPOS[r.road_position]);
    if (r.road_traffic) L1.push(RTRAFFIC[r.road_traffic]);
    if (r.urgent_flow) L1.push(UFLOW[r.urgent_flow]);
    if (r.urgent_since) L1.push(USINCE[r.urgent_since]);
    if (r.structures) L1.push('Yapı: ' + r.structures);
    if (r.access_score) L1.push('Erişim: ' + r.access_score + '/5');
    if (r.resolved_at) L1.push('✅ Çözüldü (' + fmtDate(r.resolved_at) + ')');
    return L1.join(' · ');
  }

  function catBadge(r) {
    const c = catOf(r);
    return '<span class="badge" data-css="--c:' + CATS[c].color + '"><span class="dot"></span>' + esc(CATS[c].short) + '</span>';
  }
  function scoreTag(r) {
    const n = r.risk_score == null ? 0 : r.risk_score;
    return '<span class="tag ' + level(n) + '">Risk ' + n + '</span>';
  }

  // Gözlemcinin yanındaki @kullanıcı kısmı. İçe aktarılan eski saha verilerinde kullanıcı yoktur.
  function whoSuffix(r) {
    if (r.source === 'import') return ' · <span class="imp-badge">Yönetici tarafından eklendi</span>';
    if (realNames[r.id]) return ' <span class="muted">(@' + esc(r.username || '?') + ' · yalnızca yöneticiler görür)</span>';
    return r.username ? ' · <a href="#/profil/' + encodeURIComponent(r.username) + '">@' + esc(r.username) + '</a>' : '';
  }
  function popupHtml(r) {
    return '<div class="pop">' + shotsHtml(r) + '<div class="body">' +
      '<div class="tags">' + catBadge(r) + scoreTag(r) + '</div>' +
      '<h3>' + esc(subLabel(r)) + '</h3>' +
      '<p class="muted small">' + esc(fmtDate(r.observed_at)) + ' · ' + esc(placeOf(r)) + '</p>' +
      '<p class="small">' + esc(detailLines(r)) + '</p>' +
      (r.notes ? '<p class="small muted">' + esc(r.notes) + '</p>' : '') +
      '<p class="pop-who small">👤 ' + esc(observerOf(r)) + whoSuffix(r) + '</p>' +
      '<p class="pop-date small muted">📅 Haritaya eklendi: ' + esc(fmtDate(r.created_at)) + ' <b>(' + esc(timeAgo(r.created_at)) + ')</b></p>' +
      voteHtml(r) +
      (profile && profile.is_admin ? '<button type="button" class="linkish small pop-admin" data-photos="' + esc(r.id) + '">Fotoğrafları düzenle (yönetici)</button>' : '') +
      '</div></div>';
  }

  /* =================== "SORUN ÇÖZÜLDÜ MÜ?" OYLAMASI =================== */
  let votes = {}; // report_id → { fixed, still, my_vote }
  async function loadVotes() {
    if (!sb) return;
    const { data } = await sb.rpc('vote_counts');
    votes = {}; (data || []).forEach((v) => { votes[v.report_id] = v; });
  }
  function voteHtml(r) {
    if (r.resolved_at) return '<p class="vote-done small">✅ Bu sorun ' + esc(timeAgo(r.resolved_at)) + ' çözüldü olarak işaretlendi.</p>';
    const v = votes[r.id] || { fixed: 0, still: 0, my_vote: null };
    const total = v.fixed + v.still, mine = session && r.user_id === session.user.id;
    const pct = total ? Math.round(v.fixed / total * 100) : 0;
    return '<div class="vote" data-rid="' + esc(r.id) + '">' +
      '<b class="vote-q">Sorun çözüldü mü?</b>' +
      (mine ? '<span class="small muted">Kendi bildirimine oy veremezsin.</span>' : '') +
      '<div class="vote-btns">' +
        '<button type="button" class="vb yes' + (v.my_vote === 1 ? ' on' : '') + '" data-vote="1"' + (mine ? ' disabled' : '') + '>👍 Evet, düzelmiş <b>' + v.fixed + '</b></button>' +
        '<button type="button" class="vb no' + (v.my_vote === -1 ? ' on' : '') + '" data-vote="-1"' + (mine ? ' disabled' : '') + '>👎 Hayır, hâlâ var <b>' + v.still + '</b></button>' +
      '</div>' +
      (total ? '<i class="vote-bar" title="%' + pct + ' düzelmiş diyor"><i data-css="width:' + pct + '%"></i></i>' : '<span class="small muted">Henüz oy yok. Oradan geçtiysen durumu bildir.</span>') +
      (r.fix_flagged_at ? '<span class="small vote-flag">🔧 Çoğunluk düzelmiş diyor, yönetici inceliyor.</span>' : '') +
      '</div>';
  }
  async function onVote(btn) {
    const box = btn.closest('[data-rid]'), rid = box.dataset.rid, val = Number(btn.dataset.vote);
    if (!session) { toast('Oy vermek için giriş yap.'); nextHash = '#/harita'; location.hash = '#/giris'; return; }
    if (banned) return toast('⛔ Hesabın kısıtlı olduğu için oy veremezsin.');
    const cur = (votes[rid] || {}).my_vote;
    btn.disabled = true;
    // aynı düğmeye tekrar basınca oy geri alınır
    const res = cur === val
      ? await sb.from('report_votes').delete().eq('report_id', rid).eq('user_id', session.user.id)
      : await sb.from('report_votes').upsert({ report_id: rid, user_id: session.user.id, vote: val }, { onConflict: 'report_id,user_id' });
    btn.disabled = false;
    if (res.error) return toast('Oy kaydedilemedi: ' + res.error.message);
    await loadVotes();
    // yönetici uyarısı (fix_flagged_at) değişmiş olabilir
    const { data: fresh } = await sb.from('reports').select('fix_flagged_at').eq('id', rid).maybeSingle();
    const r = approved.find((x) => x.id === rid); if (r && fresh) r.fix_flagged_at = fresh.fix_flagged_at;
    if (r && markerById[rid]) markerById[rid].setPopupContent(popupHtml(r));
    if (r && openRid === rid) { const y = $('#rv-body').scrollTop; $('#rv-body').innerHTML = reportViewHtml(r); $('#rv-body').scrollTop = y; }
    if (cur !== val) qSet('vote');
    toast(cur === val ? 'Oyun geri alındı.' : val === 1 ? '👍 Teşekkürler! “Düzelmiş” oyun kaydedildi.' : '👎 Teşekkürler! “Hâlâ var” oyun kaydedildi.');
  }

  // BBOX_LIMIT'ten az bildirim varken hepsi bir kerede gelir (filtreler anında çalışır).
  // Daha fazlası olursa yalnızca ekranda görünen alan (biraz genişletilmiş) sunucudan istenir,
  // harita kaydıkça yeni alanlar 400 ms bekleyerek (debounce) eklenir.
  const BBOX_LIMIT = 1500;
  let bboxMode = false, bboxTimer = null;
  const bboxCache = new Map();
  async function loadApproved() {
    if (!sb) return;
    const { count } = await sb.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'approved');
    bboxMode = (count || 0) > BBOX_LIMIT;
    let data, error;
    if (bboxMode && mainMap) {
      const b = mainMap.getBounds().pad(0.25);
      ({ data, error } = await withBusy(sb.from('reports').select(REPORT_COLS).eq('status', 'approved')
        .gte('lat', b.getSouth()).lte('lat', b.getNorth()).gte('lng', b.getWest()).lte('lng', b.getEast())
        .order('created_at', { ascending: false }).limit(3000)));
      (data || []).forEach((r) => bboxCache.set(r.id, r));
      data = Array.from(bboxCache.values());
    } else {
      ({ data, error } = await withBusy(sb.from('reports').select(REPORT_COLS).eq('status', 'approved').order('created_at', { ascending: false })));
    }
    if (error) { toast('Bildirimler yüklenemedi: ' + error.message); return; }
    approved = data;
    await Promise.all([loadVotes(), profile && profile.is_admin ? loadRealNames() : null]);
    fillHoodFilter();
    renderMap();
    renderUrgent();
    renderAboutStats();
  }

  // Karşılama sayfasındaki canlı sayılar
  // Uydu görünümündeyken ekranın ortasındaki görüntünün çekim tarihini göster (Esri'nin açık bilgi servisi)
  const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const imgDateCache = {};
  function addImageryDate(map, isSat) {
    const Ctl = L.Control.extend({
      // telefonda alttaki liste paneli sol alt köşeyi kapatır; etiket sol üstte, odak düğmelerinin altında durur
      options: { position: 'bottomleft' }, // telefonda da sol alt (liste paneli artık haritanın altını kapatmıyor)
      onAdd: function () { const d = L.DomUtil.create('div', 'img-date'); d.hidden = true; return d; },
    });
    const ctl = new Ctl().addTo(map), box = ctl.getContainer();
    let t = null, seq = 0;
    const update = () => {
      clearTimeout(t);
      t = setTimeout(async () => {
        if (!map._loaded || !document.body.contains(map.getContainer())) return; // harita kaldırıldıysa (ör. önizleme yenilendi)
        if (!isSat() || map.getZoom() < 10) { box.hidden = true; return; }
        const c = map.getCenter(), key = c.lat.toFixed(3) + ',' + c.lng.toFixed(3);
        const my = ++seq;
        let info = imgDateCache[key];
        if (!info) {
          try {
            const b = map.getBounds(), sz = map.getSize();
            const q = 'https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/identify?f=json&geometryType=esriGeometryPoint&sr=4326&layers=top&tolerance=1&returnGeometry=false' +
              '&geometry=' + c.lng + ',' + c.lat + '&mapExtent=' + [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()].join(',') + '&imageDisplay=' + sz.x + ',' + sz.y + ',96';
            const res = await (await fetch(q)).json();
            const a = ((res.results || []).find((r) => r.attributes && /^\d{8}$/.test(r.attributes['DATE (YYYYMMDD)'])) || {}).attributes;
            info = a ? { y: a['DATE (YYYYMMDD)'].slice(0, 4), m: Number(a['DATE (YYYYMMDD)'].slice(4, 6)), d: Number(a['DATE (YYYYMMDD)'].slice(6)), res: Number(a['RESOLUTION (M)']) } : null;
            imgDateCache[key] = info;
          } catch (_) { info = null; }
        }
        if (my !== seq) return;
        if (!info) { box.hidden = true; return; }
        box.innerHTML = document.documentElement.dataset.ui === 'mobile'
          ? 'Uydu · <b>' + AYLAR[info.m - 1] + ' ' + info.y + '</b>'
          : '🛰️ Uydu görüntüsü: <b>' + info.d + ' ' + AYLAR[info.m - 1] + ' ' + info.y + '</b>' + (info.res ? ' · ' + Math.round(info.res * 100) + ' cm' : '');
        box.title = 'Uydu görüntüsü ' + info.d + ' ' + AYLAR[info.m - 1] + ' ' + info.y + (info.res ? ', ' + Math.round(info.res * 100) + ' cm çözünürlük' : '');
        box.hidden = false;
      }, 500);
    };
    map.on('moveend zoomend baselayerchange', update);
    update();
  }

  /* =================== PROJE SAYFASI (TÜBİTAK) =================== */
  // Basit, erişilebilir grafikler: çubuk uzunluğu = değer, ad ve sayı her zaman yazılı, üzerine gelince ayrıntı.
  function barChart(el, rows, opts) {
    opts = opts || {};
    const max = Math.max(1, ...rows.map((r) => r.value));
    const body = $('.chart-body', el);
    if (!rows.length || rows.every((r) => !r.value)) { body.innerHTML = '<p class="muted small">Henüz veri yok.</p>'; return; }
    body.innerHTML = '<div class="hbars">' + rows.map((r) =>
      '<div class="hbar" data-tip="' + esc(r.label + ': ' + r.value + ' bildirim' + (r.extra ? ' · ' + r.extra : '')) + '">' +
        '<span class="hbar-l">' + esc(r.label) + '</span>' +
        '<span class="hbar-t"><i class="' + (r.cls || '') + '" data-css="width:' + (r.value / max * 100) + '%"></i></span>' +
        '<b class="hbar-v">' + r.value + '</b></div>').join('') + '</div>' + tableOf(rows, opts.col || 'Bildirim');
  }
  // Sütun grafiği. labels: değerleri sütunların üstüne yaz (az sütunda); yoksa en yüksek değer altta not olarak
  function columnChart(el, rows, opts) {
    opts = opts || {};
    const max = Math.max(1, ...rows.map((r) => r.value));
    const peak = rows.reduce((a, r) => (r.value > a.value ? r : a), rows[0] || { value: 0 });
    const body = $('.chart-body', el);
    body.innerHTML = '<div class="vcols' + (opts.labels ? ' labeled' : '') + '" data-css="--n:' + rows.length + '">' + rows.map((r) =>
      '<div class="vcol" data-tip="' + esc(r.label + ': ' + r.value) + '"><i class="' + (r.cls || '') + '" data-css="height:' + (r.value ? Math.max(4, r.value / max * 100) : 0) + '%">' +
      (opts.labels && r.value ? '<b>' + r.value + '</b>' : '') + '</i>' +
      (r.tick ? '<small>' + esc(r.tick) + '</small>' : '') + '</div>').join('') + '</div>' +
      (!opts.labels && peak.value ? '<p class="chart-note">En yoğun gün: ' + esc(peak.label) + ', ' + peak.value + ' bildirim</p>' : '') +
      tableOf(rows, opts.col || 'Bildirim');
  }
  const tableOf = (rows, col) => '<details class="chart-table"><summary>Tablo olarak göster</summary><table><thead><tr><th scope="col">Değer</th><th scope="col" class="num">' + esc(col) + '</th></tr></thead><tbody>' +
    rows.map((r) => '<tr><td>' + esc(r.label) + '</td><td class="num">' + r.value + '</td></tr>').join('') + '</tbody></table></details>';
  function renderProject() {
    if (!$('#view-project')) return;
    $('#pj-school').textContent = [cfg.SCHOOL, cfg.YEAR && 'TÜBİTAK Araştırma Projesi ' + cfg.YEAR].filter(Boolean).join(' · ');
    if (cfg.PROJECT_TITLE) $('#pj-title').textContent = cfg.PROJECT_TITLE;
    const team = (cfg.TEAM || []).filter(Boolean);
    $('#pj-team').textContent = (team.length ? 'Proje ekibi: ' + team.join(', ') + '. ' : '') + (cfg.ADVISOR || '');
    show($('#pj-team'), !!(team.length || cfg.ADVISOR));
    const R = approved;
    const fire = R.filter((r) => catOf(r) === 'fire');
    const median = (a) => { if (!a.length) return 0; const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
    $('#pj-summary').textContent = R.length
      ? 'Haritada ' + R.length + ' bildirim var; bunların ' + fire.length + ' tanesi orman yangını riski. Yangın riski bildirimlerinin ortanca puanı ' + median(fire.map((r) => r.risk_score || 0)) +
        ', yüksek riskli (67+) olanların sayısı ' + fire.filter((r) => (r.risk_score || 0) >= 67).length + '. ' + new Set(R.map((r) => r.neighborhood).filter(Boolean)).size + ' farklı mahalleden veri toplandı.'
      : 'Henüz yayında bildirim yok.';
    // risk dağılımı: 10'luk aralıklar, renk + yazılı seviye
    const bins = Array.from({ length: 10 }, (_, i) => ({ label: (i * 10) + '-' + (i * 10 + 9 + (i === 9 ? 1 : 0)) + ' puan', value: 0, cls: 'lv-' + level(i * 10 + 5), tick: i % 2 === 0 ? String(i * 10) : '' }));
    R.forEach((r) => { bins[Math.min(9, Math.floor((r.risk_score || 0) / 10))].value++; });
    columnChart($('#ch-risk'), bins, { labels: true });
    $('#ch-risk .chart-body').insertAdjacentHTML('beforeend', '<p class="chart-key"><span class="k lv-low">Düşük 0-33</span><span class="k lv-mid">Orta 34-66</span><span class="k lv-high">Yüksek 67-100</span></p>');
    barChart($('#ch-cat'), Object.entries(CATS).map(([k, c]) => {
      const list = R.filter((r) => catOf(r) === k);
      return { label: c.short, value: list.length, extra: list.length ? 'ortalama risk ' + Math.round(list.reduce((a, r) => a + (r.risk_score || 0), 0) / list.length) : '' };
    }).sort((a, b) => b.value - a.value));
    const hoods = {};
    R.forEach((r) => { const k = r.neighborhood || r.district || 'Bilinmiyor'; hoods[k] = (hoods[k] || 0) + 1; });
    barChart($('#ch-hood'), Object.entries(hoods).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => ({ label: k, value: v })));
    const days = Array.from({ length: 30 }, (_, i) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (29 - i)); return d; });
    columnChart($('#ch-time'), days.map((d, i) => ({
      label: d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }),
      value: R.filter((r) => { const c = new Date(r.created_at); return c >= d && c < new Date(d.getTime() + 864e5); }).length,
      tick: i % 7 === 0 || i === 29 ? d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) : '',
    })));
  }
  // Açık veri: gözlemci bilgisi içermez
  function openDataRows() {
    return approved.map((r) => ({
      tarih: r.created_at, kategori: (CATS[catOf(r)] || {}).short || r.category, alt_baslik: subLabel(r), risk_puani: r.risk_score || 0,
      ilce: r.district || '', mahalle: r.neighborhood || '', enlem: Number(Number(r.lat).toFixed(5)), boylam: Number(Number(r.lng).toFixed(5)),
      cozulme_tarihi: r.resolved_at || '', duzelmis_oyu: (votes[r.id] || {}).fixed || 0, hala_var_oyu: (votes[r.id] || {}).still || 0,
    }));
  }
  function download(name, text, type) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  function exportOpenCsv() {
    const rows = openDataRows(); if (!rows.length) return toast('İndirilecek bildirim yok.');
    const cols = Object.keys(rows[0]);
    const q = (v) => { const t = String(v == null ? '' : v); return /[";\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t; };
    download('geogozcu-veri-' + new Date().toISOString().slice(0, 10) + '.csv', '\ufeff' + [cols.join(';')].concat(rows.map((r) => cols.map((c) => q(r[c])).join(';'))).join('\n'), 'text/csv;charset=utf-8');
  }
  function exportGeoJson() {
    const rows = openDataRows(); if (!rows.length) return toast('İndirilecek bildirim yok.');
    const fc = { type: 'FeatureCollection', features: rows.map((r) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [r.boylam, r.enlem] }, properties: r })) };
    download('geogozcu-veri-' + new Date().toISOString().slice(0, 10) + '.geojson', JSON.stringify(fc, null, 1), 'application/geo+json');
  }

  // Ana sayfa göstergesi: açık orman yangını riski bildirimlerinin ortanca puanı
  function renderHomeStats() {
    if (!$('#hm-needle')) return;
    const open = approved.filter((r) => !r.resolved_at);
    const fire = open.filter((r) => catOf(r) === 'fire').map((r) => r.risk_score || 0).sort((a, b) => a - b);
    const med = fire.length ? fire[Math.floor(fire.length / 2)] : 0;
    const hoods = new Set(open.map((r) => r.neighborhood).filter(Boolean)).size;
    const people = new Set(open.map((r) => (r.source === 'import' ? 'g:' + r.observer_name : r.user_id)).filter(Boolean)).size;
    window.GGPoints = open.filter((r) => Number.isFinite(r.lat)).map((r) => [r.lat, r.lng, r.risk_score || 0]);
    document.dispatchEvent(new CustomEvent('gg:points', { detail: window.GGPoints }));
    $('#hm-needle').style.transform = 'rotate(' + (-90 + Math.min(100, med) * 1.8) + 'deg)';
    $('#hm-dial').dataset.level = fire.length ? level(med) : 'none';
    $('#hm-score').textContent = fire.length ? String(med) : '–';
    $('#hm-score-lbl').textContent = fire.length
      ? levelText[level(med)] + ' risk. Haritadaki ' + fire.length + ' orman yangını bildiriminin ortanca puanı.'
      : 'Henüz orman yangını bildirimi yok. İlkini sen yap.';
    $('#hm-facts').textContent = open.length
      ? people + ' gönüllü, ' + hoods + ' mahallede ' + open.length + ' riskli noktayı haritaya ekledi.'
      : 'Harita yeni. İlk bildirimi yapan sen ol.';
  }
  function renderAboutStats() {
    countTo($('#ab-total'), approved.length, 1200);
    countTo($('#ab-high'), approved.filter((r) => (r.risk_score || 0) >= 67).length, 1200);
    countTo($('#ab-dist'), new Set(approved.map((r) => r.district).filter(Boolean)).size, 1200);
  }

  function buildLegend() {
    $('#legend-body').innerHTML = Object.values(CATS).map((c) =>
      '<span><i data-css="background:' + c.color + '"></i>' + esc(c.label) + '</span>').join('') +
      '<span class="small muted">Pin ne kadar koyuysa risk puanı o kadar yüksek. Nabız atan pinler yüksek risklidir.</span>' +
      '<span class="small muted"><i class="gz-key"></i>Gaziemir odak alanı</span>';
  }

  function fillHoodFilter() {
    const sel = $('#f-hood'), cur = sel.value;
    const list = Array.from(new Set(approved.map((r) => r.district).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'tr'));
    sel.innerHTML = '<option value="all">Tüm ilçeler</option>' + list.map((h) => '<option>' + esc(h) + '</option>').join('');
    sel.value = list.includes(cur) ? cur : 'all';
  }

  function fillSubFilter() {
    const sel = $('#f-sub');
    if (filt.cat === 'all') {
      sel.innerHTML = '<option value="all">Tümü</option>';
      sel.disabled = true;
    } else {
      sel.disabled = false;
      sel.innerHTML = '<option value="all">Tümü</option>' +
        Object.entries(SUBS[filt.cat]).map(([k, v]) => '<option value="' + k + '">' + esc(v[0]) + '</option>').join('');
    }
    filt.sub = 'all';
  }

  function matches(r) {
    // çözülen sorunlar 2 gün gri görünür, sonra haritadan kalkar
    if (r.resolved_at && Date.now() - new Date(r.resolved_at) > 2 * 864e5) return false;
    const cats = (r.categories && r.categories.length) ? r.categories : [catOf(r)];
    if (filt.cat !== 'all' && !cats.includes(filt.cat)) return false;
    if (filt.sub !== 'all' && r.subcategory !== filt.sub) return false;
    if (filt.hood !== 'all' && r.district !== filt.hood) return false;
    if (filt.level !== 'all' && level(r.risk_score || 0) !== filt.level) return false;
    if (filt.days && Date.now() - new Date(r.created_at) > filt.days * 864e5) return false;
    if (filt.open && (r.resolved_at || r.fix_flagged_at)) return false;
    if (filt.q) {
      const hay = [r.district, r.neighborhood, r.notes, r.address, observerOf(r), subLabel(r)].join(' ').toLowerCase();
      if (!hay.includes(filt.q.toLowerCase())) return false;
    }
    return true;
  }

  // Çok sayıda noktada tarayıcı kasılmasın:
  //  - noktalar kümeleme katmanına tek seferde (addLayers + chunkedLoading) eklenir
  //  - balon içeriği tıklanınca üretilir (tembel)
  //  - CANVAS_LIMIT'ten fazla nokta varsa DOM pini yerine canvas daireleri çizilir
  //  - liste LIST_PAGE kadar gösterilir, "Daha fazla" ile açılır
  const CANVAS_LIMIT = 800, LIST_PAGE = 120;
  let shown = [], listLimit = LIST_PAGE, firstFit = true, canvasR = null, drawnOnce = false;
  function renderMap(opts) {
    opts = opts || {};
    const animate = !drawnOnce || !!opts.fit;
    drawnOnce = true;
    shown = approved.filter(matches);
    markerLayer.clearLayers();
    Object.keys(markerById).forEach((k) => delete markerById[k]);
    const useCanvas = shown.length > (lite() ? 250 : CANVAS_LIMIT);
    if (useCanvas && !canvasR) canvasR = L.canvas({ padding: 0.3 });
    const desktop = document.documentElement.dataset.ui !== 'mobile';
    // balon haritadan uzun olmasın; sığmazsa içinde kaydırılır
    const popMaxH = Math.max(280, mainMap.getSize().y - 150);
    const ms = shown.map((r, i) => {
      const color = r.resolved_at ? '#64748B' : CATS[catOf(r)].color;
      const m = useCanvas
        ? L.circleMarker([r.lat, r.lng], { renderer: canvasR, radius: (r.risk_score || 0) >= 67 ? 8 : 6, color: '#fff', weight: 1.5, fillColor: color, fillOpacity: 0.9 })
        : L.marker([r.lat, r.lng], {
          icon: isUrgentOpen(r) ? urgentIcon() : pinIcon(color, r.resolved_at ? 0 : r.risk_score, Math.min(i, 30) * 35, !animate),
          title: subLabel(r), zIndexOffset: isUrgentOpen(r) ? 1000 : 0, riseOnHover: true,
        });
      m.bindPopup(() => popupHtml(r), { maxWidth: 320, minWidth: 260, maxHeight: popMaxH, className: 'gg-popup', autoPan: desktop, autoPanPaddingTopLeft: [40, 70], autoPanPaddingBottomRight: [40, 40] });
      if (desktop) m.bindTooltip('<b>' + esc(subLabel(r)) + '</b><span>' + esc(placeOf(r)) + ' · risk ' + (r.risk_score || 0) + '</span>', { direction: 'top', offset: [0, useCanvas ? -8 : -36], className: 'gg-tip', opacity: 1 });
      m._rid = r.id; m._risk = r.risk_score || 0; markerById[r.id] = m;
      return m;
    });
    if (markerLayer.addLayers) markerLayer.addLayers(ms); else ms.forEach((m) => m.addTo(markerLayer));
    if (!opts.noFit && !filt.view && shown.length > 1 && (firstFit || opts.fit) && mainMap.getSize().x > 0) {
      mainMap.fitBounds(shown.map((r) => [r.lat, r.lng]), { padding: [60, 60], maxZoom: 16 });
      firstFit = false;
    }
    listLimit = LIST_PAGE;
    renderList({ animate });
  }
  // Liste ve özet sayılar ("sadece ekrandaki alan" açıksa harita kaydıkça güncellenir)
  function renderList(opts) {
    $('#list').classList.toggle('still', !(opts && opts.animate));
    let list = shown;
    if (filt.view && mainMap) { const b = mainMap.getBounds(); list = list.filter((r) => b.contains([r.lat, r.lng])); }
    if (filt.near) {
      const me = L.latLng(filt.near.lat, filt.near.lng);
      list = list.map((r) => Object.assign(Object.create(r), { _d: me.distanceTo([r.lat, r.lng]) })).sort((a, b) => a._d - b._d);
    }
    const ul = $('#list'); ul.innerHTML = '';
    show($('#near-bar'), !!filt.near);
    $('#count').textContent = filt.near ? 'Konumuna en yakından uzağa sıralı' : list.length + (filt.view ? ' bildirim bu alanda' : ' bildirim gösteriliyor');
    if ($('#btn-list-n')) $('#btn-list-n').textContent = 'Liste · ' + list.length + ' bildirim';
    countTo($('#st-total'), list.length);
    countTo($('#st-high'), list.filter((r) => (r.risk_score || 0) >= 67).length);
    countTo($('#st-week'), list.filter((r) => Date.now() - new Date(r.created_at) < 7 * 864e5).length);
    updateFilterBadge();
    if (!list.length) {
      ul.innerHTML = '<li class="empty">' + (filt.view ? 'Haritanın bu bölümünde bildirim yok. Uzaklaş ya da haritayı kaydır.' : 'Bu filtrelerle eşleşen bildirim yok.') +
        (activeFilterCount() ? ' <button type="button" class="linkish" data-reset-filters>Filtreleri sıfırla</button>' : '') + '</li>';
      return;
    }
    const frag = document.createDocumentFragment();
    list.slice(0, listLimit).forEach((r, i) => {
      const ps = photosOf(r);
      const li = document.createElement('li');
      li.style.setProperty('--i', Math.min(i, 15));
      li.innerHTML = '<button type="button" class="item">' +
        (ps.length ? '<img alt="" loading="lazy" decoding="async" src="' + esc(thumbUrl(ps[0])) + '">' : '') +
        '<span><b>' + esc(subLabel(r)) + '</b>' +
        (r._d != null ? '<span class="dist">' + fmtMeters(r._d) + ' uzakta</span>' : '') +
        '<span class="meta">' + esc(placeOf(r)) + ' · ' + esc(fmtDate(r.observed_at)) + '</span><br>' +
        '<span class="tags">' + catBadge(r) + scoreTag(r) + '</span></span></button>';
      $('button', li).addEventListener('click', () => focusReport(r));
      frag.appendChild(li);
    });
    ul.appendChild(frag);
    if (list.length > listLimit) {
      const li = document.createElement('li'); li.className = 'more';
      li.innerHTML = '<button type="button" class="btn ghost">' + (list.length - listLimit) + ' bildirim daha göster</button>';
      $('button', li).addEventListener('click', () => { listLimit += LIST_PAGE; renderList(); });
      ul.appendChild(li);
    }
  }
  const fmtMeters = (m) => m < 1000 ? Math.round(m / 10) * 10 + ' m' : (m / 1000).toLocaleString('tr-TR', { maximumFractionDigits: 1 }) + ' km';
  // "Yakınımdaki sorunlar": konumu al, listeyi uzaklığa göre sırala, haritayı en yakınlara odakla
  let nearBusy = false;
  function showNearby() {
    if (nearBusy) return;
    if (!navigator.geolocation) return toast('Bu tarayıcı konum desteklemiyor.');
    nearBusy = true;
    const btns = $$('[data-tool=nearby], #btn-near'); btns.forEach((b) => b.classList.add('busy'));
    toast('Konumun alınıyor…');
    window.GGMap.tools.locate((ll) => {
      nearBusy = false; btns.forEach((b) => b.classList.remove('busy'));
      if (!inIzmir(ll.lat, ll.lng)) toast('Şu an İzmir dışındasın; yine de en yakın bildirimler sıralandı.');
      filt.near = { lat: ll.lat, lng: ll.lng };
      renderList();
      const near = shown.map((r) => ({ r, d: ll.distanceTo([r.lat, r.lng]) })).sort((a, b) => a.d - b.d).slice(0, 5);
      if (near.length) {
        mainMap.flyToBounds(L.latLngBounds([ll].concat(near.map((x) => [x.r.lat, x.r.lng]))).pad(0.15), { maxZoom: 17, duration: calm() ? 0 : 1, paddingTopLeft: [20, 80], paddingBottomRight: [20, document.documentElement.dataset.ui === 'mobile' ? 260 : 40] });
        toast('En yakın bildirim ' + fmtMeters(near[0].d) + ' uzakta.');
      } else toast('Yakınında gösterilecek bildirim yok.');
      if (document.documentElement.dataset.ui === 'mobile') setSheet('half');
      $('#list').scrollTop = 0;
    });
    setTimeout(() => { if (nearBusy) { nearBusy = false; btns.forEach((b) => b.classList.remove('busy')); } }, 15000);
  }
  function clearNearby() { filt.near = null; renderList(); }
  const activeFilterCount = () => ['cat', 'sub', 'hood', 'level'].filter((k) => filt[k] !== 'all').length + (filt.q ? 1 : 0) + (filt.days ? 1 : 0) + (filt.open ? 1 : 0) + (filt.view ? 1 : 0);
  function updateFilterBadge() {
    const n = activeFilterCount(), b = $('#filter-count');
    if (!b) return;
    b.textContent = n; show(b, n > 0); show($('#f-reset'), n > 0);
  }
  function resetFilters() {
    Object.assign(filt, { cat: 'all', sub: 'all', hood: 'all', level: 'all', q: '', days: 0, open: false, view: false });
    $('#f-search').value = ''; $('#f-hood').value = 'all'; $('#f-sub').value = 'all'; $('#f-open').checked = false; $('#f-view').checked = false;
    $$('#f-cat .chip, #f-level .chip, #f-days .chip').forEach((c) => c.classList.toggle('on', c.dataset.cat === 'all' || c.dataset.level === 'all' || c.dataset.days === '0'));
    fillSubFilter && fillSubFilter();
    renderMap({ fit: true });
  }


  // Haritada bir bildirime git ve balonunu aç
  function focusReport(r) {
    const m = markerById[r.id]; if (!m) return;
    if (document.documentElement.dataset.ui === 'mobile') {
      // telefonda ayrıntı ekranın üstünde tam ekran açılır; harita arkada konuma gider
      // harita yakınlaşmaz; "Haritada göster" ile gidilir
      setSheet('peek');
      openReport(r);
      return;
    }
    $('#map').scrollIntoView({ block: 'center', behavior: 'smooth' });
    const open = () => { mainMap.flyTo([r.lat, r.lng], 18, { duration: calm() ? 0 : 0.8 }); setTimeout(() => m.openPopup(), calm() ? 0 : 850); };
    if (markerLayer.zoomToShowLayer && markerLayer.hasLayer(m)) markerLayer.zoomToShowLayer(m, open); else open();
  }

  // Telefonda bildirim ayrıntısı: ekranın üstünde, tam ekran, "Kapat" düğmeli
  let openRid = null;
  function reportViewHtml(r) {
    const ps = photosOf(r), n = r.risk_score == null ? 0 : r.risk_score, c = CATS[catOf(r)] || {};
    const who = esc(observerOf(r)) + whoSuffix(r);
    return '<article class="rv" data-css="--c:' + (c.color || 'var(--accent)') + '">' +
      (ps.length ? '<div class="rv-hero"><div class="rv-shots">' + ps.map((p) =>
        '<img alt="Bildirim fotoğrafı" data-full="' + esc(photoUrl(p)) + '" src="' + esc(photoUrl(p)) + '">').join('') + '</div>' +
        (ps.length > 1 ? '<span class="rv-count">📷 ' + ps.length + ' fotoğraf · kaydır</span>' : '') + '</div>'
        : '<div class="rv-hero empty"><span>' + (c.ico || '📍') + '</span></div>') +
      '<div class="rv-main">' +
        '<div class="tags">' + catBadge(r) + scoreTag(r) + (isUrgentOpen(r) ? '<span class="tag rejected">🚨 Acil</span>' : '') + '</div>' +
        '<h2 class="rv-title">' + esc(subLabel(r)) + '</h2>' +
        '<div class="rv-meter ' + level(n) + '" title="Risk puanı ' + n + '/100"><i data-css="width:' + Math.max(4, Math.min(100, n)) + '%"></i></div>' +
        '<div class="rv-grid">' +
          '<div><small>📍 Konum</small><b>' + esc(placeOf(r)) + '</b></div>' +
          '<div><small>🕒 Gözlem</small><b>' + esc(fmtDate(r.observed_at)) + '</b></div>' +
        '</div>' +
        (detailLines(r) ? '<div class="rv-card"><small>Ayrıntılar</small><p>' + esc(detailLines(r)) + '</p></div>' : '') +
        (r.notes ? '<div class="rv-card"><small>Not</small><p>' + esc(r.notes) + '</p></div>' : '') +
        '<div class="rv-card rv-who"><p>👤 ' + who + '</p><p class="muted small">Haritaya eklendi: ' + esc(fmtDate(r.created_at)) + ' · ' + esc(timeAgo(r.created_at)) + '</p></div>' +
        voteHtml(r) +
        '<button type="button" class="btn ghost big rv-map" data-rvmap="' + esc(r.id) + '">🗺️ Haritada göster</button>' +
        (profile && profile.is_admin ? '<button type="button" class="btn ghost big" data-photos="' + esc(r.id) + '">Fotoğrafları düzenle</button>' : '') +
        (session && r.user_id === session.user.id
          ? '<div class="rv-owner"><span class="muted small">Bu senin bildirimin · ' + esc(r.resolved_at ? 'Çözüldü' : STATUS[r.status] || r.status) + '</span>' +
            '<button type="button" class="btn danger" data-act="delete" data-id="' + esc(r.id) + '">Bildirimi sil</button></div>' : '') +
      '</div></article>';
  }
  function openReport(r) {
    openRid = r.id;
    qSet('explore');
    $('#rv-body').innerHTML = reportViewHtml(r);
    $('#rv-body').scrollTop = 0;
    show($('#report-view'), true);
    document.documentElement.classList.add('rv-open');
    $('#rv-close').focus({ preventScroll: true });
  }
  function closeReport() {
    openRid = null;
    show($('#report-view'), false);
    document.documentElement.classList.remove('rv-open');
    $('#rv-body').innerHTML = '';
  }

  // Panelin üstünde çözülmemiş acil durumlar (son 7 gün)
  function renderUrgent() {
    const list = approved.filter((r) => isUrgentOpen(r) && Date.now() - new Date(r.created_at) < 7 * 864e5);
    show($('#urgent-strip'), list.length > 0);
    if ($('#btn-list .urg')) show($('#btn-list .urg'), list.length > 0);
    $('#urgent-list').innerHTML = list.map((r) =>
      '<button type="button" class="urgent-card" data-uid="' + esc(r.id) + '">' +
      '<b>' + esc(subLabel(r)) + '</b><span>' + esc(placeOf(r)) + '</span>' +
      '<small>' + esc(timeAgo(r.created_at)) + (r.urgent_flow ? ' · ' + esc(UFLOW[r.urgent_flow]) : '') + '</small></button>').join('');
  }

  /* =================== FORM: KATEGORİ =================== */
  let formCat = null;

  // Sade seçim: 2 büyük başlık + "Başka bir risk" (altında 4 küçük başlık). Alt başlık seçilince hepsi tek satıra kapanır.
  const OTHER_CATS = ['flood', 'waste', 'infra', 'road'];
  const SUB_ICO = {
    dry_fuel: '🌾', interface: '🏡', burning: '🌫️', fire_infra: '🚒', rubble: '🧱', glass: '🍾', agchem: '🧴',
    channel: '🏞️', culvert: '🕳️', erosion: '⛰️', power: '⚡', escape: '🚪', water_pipe: '💧', sewer: '🚽',
    power_line: '🔌', gas: '💨', pothole: '🕳️', manhole: '⭕', collapse: '⚠️', sidewalk: '🚶',
  };
  function buildCatPicker() {
    const tile = (k, i) => {
      const c = CATS[k];
      return '<button type="button" class="cat' + (c.featured ? ' featured' : '') + (c.urgent ? ' urgent' : '') + '" data-cat="' + k + '" data-css="--c:' + c.color + ';--i:' + i + '">' +
        (c.featured ? '<span class="cat-badge">Ana odak · küresel sorun, yerel çözüm</span>' : '') +
        (c.urgent ? '<span class="cat-badge red">ACİL</span>' : '') +
        '<span class="cat-ico" aria-hidden="true">' + c.ico + '</span><b>' + esc(c.short) + '</b><small>' + esc(c.desc) + '</small><span class="cat-tick" aria-hidden="true">✓</span></button>';
    };
    $('#cat-pick').innerHTML = tile('fire', 0) + tile('urgent', 1) +
      '<button type="button" class="cat other" data-other data-css="--c:#475569;--i:2"><span class="cat-ico" aria-hidden="true">🧭</span><b>Başka bir risk</b>' +
        '<small>Sel · Atık · Altyapı · Yol</small><span class="cat-chev" aria-hidden="true">⌄</span></button>' +
      '<div class="other-row" id="other-row" hidden>' + OTHER_CATS.map((k, i) =>
        '<button type="button" class="cat mini" data-cat="' + k + '" data-css="--c:' + CATS[k].color + ';--i:' + i + '"><span class="cat-ico" aria-hidden="true">' + CATS[k].ico + '</span><b>' + esc(CATS[k].short.replace(' riski', '').replace(' hasarı', '')) + '</b><span class="cat-tick" aria-hidden="true">✓</span></button>').join('') +
      '</div>';
    $('#cat-pick').addEventListener('click', (e) => {
      if (e.target.closest('[data-other]')) { toggleOther(); return; }
      const b = e.target.closest('[data-cat]'); if (!b) return;
      setFormCat(b.dataset.cat);
      setTimeout(() => $('#sub-card').scrollIntoView({ behavior: calm() ? 'auto' : 'smooth', block: 'nearest' }), 60);
    });
    // alt başlık seçilince seçimler tek satıra kapanır, formun geri kalanı açılır
    $('#sub-pick').addEventListener('change', () => {
      const first = $('#form-rest').hidden;
      collapseCats(true);
      revealRest(true);
      if (first) setTimeout(() => $('#form-rest').scrollIntoView({ behavior: calm() ? 'auto' : 'smooth', block: 'start' }), 120);
    });
    $('#cat-change').addEventListener('click', () => {
      collapseCats(false);
      $('#cat-card').scrollIntoView({ behavior: calm() ? 'auto' : 'smooth', block: 'start' });
    });
  }
  function toggleOther(force) {
    const row = $('#other-row'), open = force === undefined ? row.hidden : force;
    show(row, open);
    $('#cat-pick [data-other]').classList.toggle('open', open);
    if (open) { row.classList.remove('pop'); void row.offsetWidth; row.classList.add('pop'); }
  }
  function collapseCats(on) {
    const card = $('#cat-card');
    card.classList.toggle('collapsed', on);
    show($('#cat-pick'), !on); show($('#cat-sum'), on);
    show($('#sub-card'), !on && !!formCat);
    if (on && formCat) {
      const c = CATS[formCat], sub = ($('#sub-pick input:checked') || {}).value, sv = SUBS[formCat][sub];
      $('#cat-sum-ico').textContent = sub && SUB_ICO[sub] ? SUB_ICO[sub] : c.ico;
      $('#cat-sum-text').innerHTML = '<small data-css="color:' + c.color + '">' + c.ico + ' ' + esc(c.short) + '</small><b>' + esc(sv ? sv[0] : c.label) + '</b>';
      card.style.setProperty('--c', c.color);
      card.classList.remove('pop'); void card.offsetWidth; card.classList.add('pop');
    }
  }
  function revealRest(on) {
    const rest = $('#form-rest');
    if (on && rest.hidden) {
      rest.hidden = false;
      $$(':scope > .card, :scope > fieldset', rest).forEach((el, i) => { el.style.setProperty('--ri', Math.min(i, 8)); el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); });
      if (pickMap) setTimeout(() => pickMap.invalidateSize(), 50);
      else initPickMap();
    } else if (!on) rest.hidden = true;
    updateSteps();
  }

  // Üstteki 4 adımlı ilerleme göstergesi
  function updateSteps() {
    const d = formData();
    const need = {
      fire: ['veg', 'dist', 'slope', 'water', 'struct', 'acc'], waste: ['wtype', 'wamount', 'dist', 'struct', 'acc'],
      flood: ['drain', 'dist', 'slope', 'struct', 'acc'], infra: ['dist', 'struct', 'acc'],
      road: ['rsize', 'rdepth', 'rpos', 'rtraffic'], urgent: ['uflow', 'usince'],
    }[formCat] || [];
    const st = {
      cat: !!(formCat && d.sub),
      loc: !!picked,
      photo: shots.length > 0,
      detail: need.every((k) => d[k]) && $('#r-name').value.trim().length >= 2 && !!$('#r-dt').value,
    };
    const total = 2 + 1 + 1 + need.length + 1;
    const filled = (formCat ? 1 : 0) + (d.sub ? 1 : 0) + (st.loc ? 1 : 0) + (st.photo ? 1 : 0) +
      need.filter((k) => d[k]).length + ($('#r-name').value.trim().length >= 2 ? 1 : 0);
    $$('#rep-steps li').forEach((li) => li.classList.toggle('done', !!st[li.dataset.step]));
    $('#steps-fill').style.width = Math.round(filled / total * 100) + '%';
  }

  // Eksik alana kaydır, salla ve mesajı göster
  function formError(el, msg) {
    setMsg('#report-msg', msg);
    toast('⚠️ ' + msg);
    const box = el ? (el.closest('fieldset, .card') || el) : $('#report-msg');
    if (box.hidden) revealRest(true);
    box.scrollIntoView({ behavior: calm() ? 'auto' : 'smooth', block: 'center' });
    box.classList.remove('shake', 'need'); void box.offsetWidth; box.classList.add('shake', 'need');
    setTimeout(() => box.classList.remove('shake'), 700);
    if (navigator.vibrate) navigator.vibrate(60);
    return false;
  }

  function setFormCat(cat) {
    formCat = cat;
    $$('#cat-pick .cat').forEach((b) => b.classList.toggle('on', b.dataset.cat === cat));
    $('#cat-pick [data-other]').classList.toggle('on', OTHER_CATS.includes(cat));
    if (OTHER_CATS.includes(cat) && $('#other-row').hidden) toggleOther(true);
    const c = CATS[cat];
    $('#report-form').dataset.cat = cat;

    $('#sub-pick').innerHTML = Object.entries(SUBS[cat]).map(([k, v], i) =>
      '<label class="sub" data-css="--c:' + c.color + ';--i:' + i + '"><input type="radio" name="sub" value="' + k + '">' +
      '<span><i class="sub-ico" aria-hidden="true">' + (SUB_ICO[k] || c.ico) + '</i><em>' + esc(v[0]) + '<small>' + esc(v[1]) + '</small></em></span></label>').join('');
    $('#sub-legend').textContent = c.ico + ' ' + c.short + ': tam olarak hangisi?';
    show($('#sub-card'), true);
    $('#sub-card').classList.remove('pop'); void $('#sub-card').offsetWidth; $('#sub-card').classList.add('pop');
    revealRest(false);

    // başka kategoriye geçince gizlenen soruların cevapları da silinsin
    $$('#report-form [data-for]').forEach((el) => {
      const on = el.dataset.for.split(' ').includes(cat);
      if (!on) $$('input[type=radio]', el).forEach((i) => { i.checked = false; });
      show(el, on);
    });

    const dl = DIST_LABEL[cat] || DIST_LABEL.fire;
    $('#dist-legend').innerHTML = esc(dl[0]) + ' <b class="req">*</b>';
    $('#dist-help').textContent = dl[1];
    $('#slope-help').textContent = SLOPE_HELP[cat] || '';

    // ek gözlem kutuları: önce kendi başlığı, sonra diğerleri
    const order = [cat].concat(Object.keys(CHECKS).filter((k) => k !== cat));
    $('#risk-checks').innerHTML = order.map((c) =>
      '<p class="group-title">' + esc(CATS[c].label) + '</p>' +
      Object.entries(CHECKS[c]).map(([k, v]) =>
        '<label class="check"><input type="checkbox" value="' + k + '">' + esc(v) + '</label>').join('')
    ).join('');
    updateScore();
  }

  /* =================== FORM: FOTOĞRAFLAR =================== */
  let shots = []; // {file, url}

  function renderShots() {
    $('#photo-list').innerHTML = shots.map((s, i) =>
      '<div class="shot"><img alt="Seçilen fotoğraf ' + (i + 1) + '" src="' + s.url + '">' +
      '<button type="button" data-rm="' + i + '" aria-label="Bu fotoğrafı kaldır">×</button></div>').join('');
    $('#r-photo').disabled = shots.length >= MAX_PHOTOS;
    $('.drop').classList.toggle('full', shots.length >= MAX_PHOTOS);
    $('.drop b').textContent = shots.length >= MAX_PHOTOS ? 'En fazla 3 fotoğraf eklendi' : shots.length ? 'Bir fotoğraf daha ekle' : 'Fotoğraf çek veya seç';
    updateSteps();
  }
  function addFiles(files) {
    for (const f of files) {
      if (shots.length >= MAX_PHOTOS) { toast('En fazla ' + MAX_PHOTOS + ' fotoğraf ekleyebilirsin.'); break; }
      if (!/^image\//.test(f.type)) { toast('Sadece fotoğraf eklenebilir.'); continue; }
      if (f.size > 10 * 1024 * 1024) { toast(f.name + ' 10 MB sınırını aşıyor.'); continue; }
      shots.push({ file: f, url: URL.createObjectURL(f) });
    }
    renderShots();
  }
  function clearShots() {
    shots.forEach((s) => URL.revokeObjectURL(s.url));
    shots = []; renderShots();
  }

  async function compress(file) {
    try {
      const bmp = await createImageBitmap(file);
      const max = 1600, scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
      const c = document.createElement('canvas');
      c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
      c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
      const blob = await new Promise((res) => c.toBlob(res, 'image/jpeg', 0.85));
      let thumb = null;
      try {
        const ts = Math.min(1, 360 / Math.max(bmp.width, bmp.height)), t = document.createElement('canvas');
        t.width = Math.round(bmp.width * ts); t.height = Math.round(bmp.height * ts);
        t.getContext('2d').drawImage(bmp, 0, 0, t.width, t.height);
        thumb = await new Promise((res) => t.toBlob(res, 'image/jpeg', 0.72));
      } catch (_) { /* önizlemesiz devam */ }
      if (blob) return { blob, type: 'image/jpeg', ext: 'jpg', thumb };
    } catch (_) { /* yoksa özgün dosya */ }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Fotoğraf JPEG, PNG veya WebP olmalı.');
    return { blob: file, type: file.type, ext: file.type.split('/')[1].replace('jpeg', 'jpg') };
  }

  /* =================== FORM: GÖNDER =================== */
  // Gönderim sırasında beklenmeyen bir hata olursa buton sessizce takılı kalmasın, ekranda görünsün
  async function onReport(e) {
    e.preventDefault();
    try { await submitReport(); }
    catch (err) {
      console.error(err);
      const btn = $('#btn-send'); btn.disabled = false; btn.textContent = 'Bildirimi gönder';
      formError(null, 'Beklenmeyen bir hata oldu: ' + (err && err.message ? err.message : err) + '. Sayfayı yenileyip tekrar dene.');
    }
  }

  async function submitReport() {
    setMsg('#report-msg', '');
    const d = formData();
    const name = $('#r-name').value.trim(), dt = $('#r-dt').value;
    const hood = $('#r-hood').value.trim();
    const q = (n) => $('input[name=' + n + ']');
    const simple = formCat === 'road' || formCat === 'urgent'; // itfaiye erişimi ve yapı sayısı sorulmaz

    if (!formCat) return formError($('#cat-pick'), 'Önce ne gördüğünü seç.');
    if (!d.sub) return formError($('#sub-pick'), 'Alt başlığı seç.');
    if (!picked) return formError($('#pick-map'), 'Konumu işaretle: “Bulunduğum konumu kullan”a bas ya da haritaya dokun.');
    if (!inIzmir(picked.lat, picked.lng)) return formError($('#pick-map'), 'Seçtiğin nokta İzmir dışında, şu an desteklenmiyor.');
    if (!shots.length) return formError($('#photo-list'), 'En az bir fotoğraf ekle.');
    if (formCat === 'urgent' && !d.uflow) return formError(q('uflow'), 'Durumun ne kadar ciddi olduğunu seç.');
    if (formCat === 'urgent' && !d.usince) return formError(q('usince'), 'Ne zamandır böyle olduğunu seç.');
    if (formCat === 'fire' && !d.veg) return formError(q('veg'), 'Bitki örtüsü yoğunluğunu seç.');
    if (formCat === 'road' && !d.rsize) return formError(q('rsize'), 'Çukurun boyutunu seç.');
    if (formCat === 'road' && !d.rdepth) return formError(q('rdepth'), 'Çukurun derinliğini seç.');
    if (formCat === 'road' && !d.rpos) return formError(q('rpos'), 'Hasarın yolun neresinde olduğunu seç.');
    if (formCat === 'road' && !d.rtraffic) return formError(q('rtraffic'), 'Trafik yoğunluğunu seç.');
    if (!simple && !d.dist) return formError(q('dist'), (DIST_LABEL[formCat] || DIST_LABEL.fire)[0] + ' sorusunu yanıtla.');
    if (formCat === 'flood' && !d.drain) return formError(q('drain'), 'Menfez ve gider durumunu seç.');
    if (formCat === 'waste' && !d.wtype) return formError(q('wtype'), 'Atık türünü seç.');
    if (formCat === 'waste' && !d.wamount) return formError(q('wamount'), 'Atık miktarını seç.');
    if ((formCat === 'fire' || formCat === 'flood') && !d.slope) return formError(q('slope'), 'Arazi eğimini seç.');
    if (formCat === 'fire' && !d.water) return formError(q('water'), 'Su ikmal noktası sorusunu yanıtla.');
    if (!simple && !d.struct) return formError(q('struct'), 'Çevredeki yapı sayısını seç.');
    if (!simple && !d.acc) return formError(q('acc'), 'İtfaiye erişimi puanını seç.');
    if (name.length < 2) return formError($('#r-name'), 'Gözlemci adı ve soyadını yaz.');
    if (!dt) return formError($('#r-dt'), 'Gözlem tarihini ve saatini seç.');
    if (new Date(dt) > new Date(Date.now() + 60000)) return formError($('#r-dt'), 'Gözlem tarihi gelecekte olamaz.');
    if (place.pending) await place.pending; // ilçe bulunuyorsa bekle

    const review = reviewReport(d, { name, notes: $('#r-notes').value.trim(), address: $('#r-addr').value.trim(), observedAt: dt });
    const flag = review ? review.reason : null;
    const status = review && review.severe ? 'pending' : 'approved';

    const btn = $('#btn-send'); btn.disabled = true; btn.textContent = 'Gönderiliyor…';
    const uploaded = [];
    try {
      // fotoğraflar tek tek sırayla değil, aynı anda yüklenir (N+1 bekleme yok); sıra korunur
      let done = 0;
      btn.textContent = 'Fotoğraf yükleniyor 0/' + shots.length + '…';
      const paths = await Promise.all(shots.map(async (s) => {
        const img = await compress(s.file);
        const base = session.user.id + '/' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
        let path = base + '.' + img.ext;
        if (img.thumb) {
          const tu = await sb.storage.from(BUCKET).upload(base + '.k.jpg', img.thumb, { contentType: 'image/jpeg' });
          if (!tu.error) { uploaded.push(base + '.k.jpg'); path = base + '.t.jpg'; }
        }
        const up = await sb.storage.from(BUCKET).upload(path, img.blob, { contentType: img.type });
        if (up.error) throw up.error;
        uploaded.push(path);
        btn.textContent = 'Fotoğraf yükleniyor ' + (++done) + '/' + shots.length + '…';
        return path;
      }));
      btn.textContent = 'Kaydediliyor…';
      const riskScore = scoreOf(d).score, sentCat = formCat;
      const ins = await sb.from('reports').insert({
        username: profile ? profile.username : null,
        observer_name: name,
        observed_at: new Date(dt).toISOString(),
        lat: picked.lat, lng: picked.lng,
        district: place.district || null,
        neighborhood: hood || place.hood || null,
        status: status,
        flag_reason: flag,
        address: $('#r-addr').value.trim() || null,
        photo_paths: paths,
        photo_path: paths[0],
        category: formCat,
        subcategory: d.sub,
        categories: derivedCats(d),
        vegetation: d.veg, edge_distance: d.dist, slope: d.slope, water_source: d.water,
        flood_drain: d.drain, waste_type: d.wtype, waste_amount: d.wamount,
        road_size: d.rsize, road_depth: d.rdepth, road_position: d.rpos, road_traffic: d.rtraffic,
        urgent_flow: d.uflow, urgent_since: d.usince,
        structures: simple ? null : d.struct, risks: d.checks, access_score: simple ? null : Number(d.acc),
        risk_score: riskScore,
        notes: $('#r-notes').value.trim() || null,
      }).select('id, status, flag_reason').single();
      if (ins.error) throw ins.error;
      // sunucu denetimi (küfür, kısa sürede çok bildirim) durumu değiştirmiş olabilir
      const finalStatus = ins.data ? ins.data.status : status;
      const finalReason = ins.data ? ins.data.flag_reason : flag;

      $('#report-form').reset(); clearShots();
      picked = null; Object.assign(place, { district: null, hood: null, pending: null });
      if (pickMarker) { pickMap.removeLayer(pickMarker); pickMarker = null; }
      $('#pick-info').textContent = 'Ya da haritaya dokunarak noktayı işaretle. İlçe ve mahalle otomatik bulunur.';
      show($('#place'), false);
      formCat = null; $$('#cat-pick .cat').forEach((b) => b.classList.remove('on'));
      delete $('#report-form').dataset.cat;
      show($('#sub-card'), false); collapseCats(false); show($('#sub-card'), false); toggleOther(false); revealRest(false);
      if (navigator.vibrate) navigator.vibrate([30, 40, 30]);
      $('#score-val').textContent = '—'; $('#score-val').dataset.n = 0; $('#score-bar').style.width = '0%'; $('#cat-out').textContent = '';
      $('#score-card').removeAttribute('data-level');
      showSuccess({ status: finalStatus, reason: finalReason, cat: sentCat, score: riskScore });
    } catch (err) {
      // başarısız gönderimde yüklenen fotoğrafları geri al
      if (uploaded.length) sb.storage.from(BUCKET).remove(uploaded);
      const m = String(err.message || err);
      formError(null, /road_|urgent_|reports_category_ok/.test(m)
        ? 'Veritabanı bu sürüm için güncellenmemiş. Yöneticiye haber ver.'
        : /fetch|network|Failed/i.test(m) ? 'İnternet bağlantısı yok gibi görünüyor. Bağlanınca tekrar dene.'
        : 'Gönderilemedi: ' + m);
    } finally {
      btn.disabled = false; btn.textContent = 'Bildirimi gönder';
    }
  }

  /* =================== GÖNDERİLDİ EKRANI =================== */
  // Sunucudaki puan kuralının aynısı (report_points): tahmini kazanılan puan
  const estPoints = (st, cat, score) => st !== 'approved' ? 0
    : 10 + (score >= 67 ? 5 : 0) + (cat === 'fire' ? 3 : 0) + (cat === 'urgent' ? 3 : 0);

  async function showSuccess({ status, reason, cat, score }) {
    const ok = status === 'approved', plus = estPoints(status, cat, score);
    qSet('report');
    const box = $('#success');
    box.dataset.state = ok ? 'ok' : 'wait';
    $('#sx-title').textContent = ok ? 'Bildirimin yayında!' : 'Bildirimin alındı';
    $('#sx-text').textContent = ok
      ? (reason ? 'Yöneticiye küçük bir not düştük: ' + reason + '. Ama bildirimin haritada.' : 'Teşekkürler! Gözlemin haritaya eklendi.')
      : 'Kısa bir kontrol için yönetici onayına gönderildi (' + (reason || 'otomatik denetim') + '). Onaylanınca puanın eklenir.';
    $('#sx-plus').textContent = '0'; $('#sx-plus').dataset.n = 0;
    $('#sx-total').textContent = '…'; $('#sx-total').dataset.n = 0;
    $('#sx-bar').style.width = '0%'; $('#sx-next').textContent = 'Puanın güncelleniyor…';
    $('#sx-map').setAttribute('href', ok ? '#/harita' : '#/bildirimlerim');
    $('#sx-map').textContent = ok ? 'Haritada gör' : 'Bildirimlerime git';
    show(box, true);
    box.classList.remove('in'); void box.offsetWidth; box.classList.add('in');
    if (ok) { setTimeout(confetti, 350); if (navigator.vibrate) navigator.vibrate([20, 60, 40]); }
    setTimeout(() => countTo($('#sx-plus'), plus, 900), 600);
    // puan sunucuda hesaplanır; kısa bir bekleyişten sonra gerçek toplamı çek ve say
    const before = myTags ? myTags.points : null;
    await new Promise((r) => setTimeout(r, 1400));
    const t = await loadMyTags();
    if (!t) { $('#sx-next').textContent = ''; return; }
    if (before !== null) { $('#sx-total').textContent = before; $('#sx-total').dataset.n = before; }
    countTo($('#sx-total'), t.points, 1400);
    const prevNeed = (TIERS.filter((x) => x[1] <= t.points).pop() || TIERS[0])[1];
    const pct = t.next ? Math.round((t.points - prevNeed) / (t.next.need - prevNeed) * 100) : 100;
    setTimeout(() => { $('#sx-bar').style.width = pct + '%'; }, 200);
    $('#sx-next').textContent = t.next ? '“' + t.next.tag + '” rozetine ' + (t.next.need - t.points) + ' puan kaldı' : 'Tüm seviye rozetlerini kazandın! 👑';
    renderBell();
  }
  function closeSuccess() { show($('#success'), false); }

  /* =================== KONUM =================== */
  // İlçe ve mahalle seçtirmiyoruz: işaretlenen noktadan otomatik bulunur
  const place = { district: null, hood: null, pending: null, autoHood: '' };
  const trLower = (s) => String(s || '').toLocaleLowerCase('tr-TR');
  const findDistrict = (...names) => {
    for (const n of names) {
      const hit = DISTRICTS.find((d) => trLower(n).includes(trLower(d)));
      if (hit) return hit;
    }
    return null;
  };

  // Bir noktanın ilçe / mahalle / sokak bilgisi. Form ve yönetici içe aktarması AYNI kuralı kullanır:
  // ilçe önce kendi Gaziemir sınır dosyamızdan, mahalle OpenStreetMap'ten (zoom 17) gelir.
  async function lookupPlace(lat, lng) {
    const inGz = SIN && SIN.gaziemir.some((r) => pointInRing(lat, lng, r));
    let district = inGz ? 'Gaziemir' : null, hood = null, road = null, ok = false;
    try {
      const ctl = new AbortController(); setTimeout(() => ctl.abort(), 8000);
      const res = await fetch('https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=17&accept-language=tr&lat=' + lat + '&lon=' + lng, { signal: ctl.signal });
      const j = await res.json(), a = j.address || {};
      district = district || findDistrict(a.town, a.county, a.city_district, a.district, a.city, a.municipality);
      hood = a.suburb || a.quarter || a.neighbourhood || a.village || null;
      road = a.road || null; ok = true;
    } catch (_) { /* çevrimdışı ya da yavaş */ }
    return { district, hood, road, ok };
  }

  async function reverseGeocode(lat, lng) {
    // önce kendi sınır dosyamız: Gaziemir içindeyse ağ isteğine gerek yok
    const inGz = SIN && SIN.gaziemir.some((r) => pointInRing(lat, lng, r));
    $('#place-main').textContent = inGz ? 'Gaziemir' : 'Adres bulunuyor…';
    $('#place-sub').textContent = lat.toFixed(5) + ', ' + lng.toFixed(5);
    show($('#place'), true);
    $('#place').classList.add('loading');
    void inGz;
    const pl = await lookupPlace(lat, lng);
    const dist = pl.district, hood = pl.hood, road = pl.road;
    $('#place').classList.remove('loading');
    // kullanıcı bu arada başka nokta seçtiyse eski cevabı yok say
    if (!picked || picked.lat !== lat || picked.lng !== lng) return;
    place.district = dist; place.hood = hood;
    $('#place-main').textContent = [dist || 'İzmir', hood].filter(Boolean).join(' · ');
    $('#place-sub').textContent = (road ? road + ' · ' : '') + lat.toFixed(5) + ', ' + lng.toFixed(5);
    // mahalle alanı boşsa ya da daha önce otomatik doldurulduysa güncelle
    const h = $('#r-hood');
    if (hood && (!h.value || h.value === place.autoHood)) { h.value = hood; place.autoHood = hood; }
    if (road && !$('#r-addr').value) $('#r-addr').value = road;
  }

  function setPicked(lat, lng, zoom) {
    if (!inIzmir(lat, lng)) {
      picked = null;
      if (pickMarker) { pickMap.removeLayer(pickMarker); pickMarker = null; }
      pickMap.getContainer().classList.remove('has-pick');
      show($('#place'), false);
      $('#pick-info').textContent = 'Bu nokta İzmir sınırlarının dışında, şu an desteklenmiyor. Lütfen İzmir içinden bir yer seç.';
      toast('Şu an sadece İzmir içindeki noktalar bildirilebiliyor.');
      updateSteps();
      return;
    }
    picked = { lat, lng };
    pickMap.getContainer().classList.add('has-pick');
    if (!pickMarker) pickMarker = L.marker([lat, lng], { icon: pinIcon(formCat ? CATS[formCat].color : '#C2410C', 100), draggable: true })
      .on('dragend', (e) => { const p = e.target.getLatLng(); setPicked(p.lat, p.lng); }).addTo(pickMap);
    else pickMarker.setLatLng([lat, lng]);
    if (zoom) pickMap.flyTo([lat, lng], zoom, { duration: calm() ? 0 : 0.8 });
    $('#pick-info').textContent = 'İğneyi sürükleyerek konumu düzeltebilirsin.';
    $('#loc-card').classList.remove('need');
    place.pending = reverseGeocode(lat, lng);
    updateSteps();
  }
  // Haritadaki koordinat aracından "Bu noktayı bildir" ile gelindiyse o noktayı işaretle
  function usePendingPoint() {
    const pp = window.GG && GG.get().pendingPoint;
    if (!pp || !pickMap) return;
    GG.set({ pendingPoint: null });
    setPicked(pp.lat, pp.lng);
    pickMap.setView([pp.lat, pp.lng], 17);
    toast('Haritada seçtiğin nokta konum olarak işaretlendi.');
  }
  function initPickMap() {
    if (pickMap) { pickMap.invalidateSize(); usePendingPoint(); return; }
    pickMap = makeMap('pick-map');
    pickMap.on('click', (e) => setPicked(e.latlng.lat, e.latlng.lng));
    // haritanın üstünde kısa yönerge (dokunmayı engellemez) ve klavyeyle seçim: Enter / boşluk = ortadaki nokta
    const hint = L.DomUtil.create('div', 'pick-hint', pickMap.getContainer());
    hint.textContent = matchMedia('(pointer:coarse)').matches ? 'Riskli noktaya dokun' : 'Riskli noktaya tıkla';
    pickMap.getContainer().addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && e.target === pickMap.getContainer()) {
        e.preventDefault(); const c = pickMap.getCenter(); setPicked(c.lat, c.lng);
      }
    });
    usePendingPoint();
  }

  /* =================== OTURUM =================== */
  async function loadProfile() {
    profile = null;
    if (sb && session) {
      const { data } = await sb.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
      profile = data;
    }
    updateNav();
    renderQuest();
  }
  function updateNav() {
    const logged = !!session;
    $$('[data-auth]').forEach((el) => show(el, logged));
    $$('[data-guest]').forEach((el) => show(el, !logged));
    $$('[data-admin]').forEach((el) => show(el, !!(profile && profile.is_admin)));
    $('#tb-me-label').textContent = logged ? (profile ? '@' + profile.username : 'Profil') : 'Giriş';
    if (logged && profile) $('#tb-avatar').innerHTML = avatarHtml(profile, 'xs');
    else $('#tb-avatar').innerHTML = '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>';
    $('#tb-me').setAttribute('href', logged ? '#/ayarlar' : '#/giris');
    $('#tb-me').dataset.nav = logged ? 'ayarlar' : 'giris';
  }

  /* =================== GELEN BİLDİRİMLER (ZİL) =================== */
  const KIND = { info: ['ℹ️', 'Bilgi'], success: ['✅', 'Başarılı'], warning: ['⚠️', 'Uyarı'], alert: ['🚨', 'Acil'] };
  let inbox = [], readSet = new Set(), notifChannel = null;

  const myInbox = () => inbox.filter((n) => (!n.user_id || (session && n.user_id === session.user.id)) && wantsNotif(n));
  const timeAgo = (d) => {
    const s = (Date.now() - new Date(d)) / 1000;
    if (s < 60) return 'az önce';
    if (s < 3600) return Math.floor(s / 60) + ' dk önce';
    if (s < 86400) return Math.floor(s / 3600) + ' sa önce';
    if (s < 7 * 86400) return Math.floor(s / 86400) + ' gün önce';
    return fmtDate(d);
  };

  async function loadInbox() {
    if (!sb || !session) return;
    const [n, r] = await Promise.all([
      sb.from('notifications').select('*').order('created_at', { ascending: false }).limit(60),
      sb.from('notification_reads').select('notification_id'),
    ]);
    if (n.error) return console.warn('Bildirimler yüklenemedi:', n.error.message);
    inbox = n.data || [];
    readSet = new Set((r.data || []).map((x) => x.notification_id));
    renderBell();
  }

  function notifItem(n) {
    const unread = !readSet.has(n.id), k = KIND[n.kind] || KIND.info;
    return '<li class="nitem ' + n.kind + (unread ? ' unread' : '') + '" data-nid="' + esc(n.id) + '"' +
      (n.link ? ' data-link="' + esc(n.link) + '"' : '') + '>' +
      '<span class="nico" aria-hidden="true">' + k[0] + '</span>' +
      '<span class="nbody"><b>' + esc(n.title) + '</b>' + (n.body ? '<span>' + esc(n.body) + '</span>' : '') +
      '<small>' + (n.user_id ? 'Sana özel' : 'Herkese') + ' · ' + esc(timeAgo(n.created_at)) + '</small></span></li>';
  }

  function renderBell() {
    const list = myInbox(), unread = list.filter((n) => !readSet.has(n.id)).length;
    const c = $('#bell-count');
    c.textContent = unread > 9 ? '9+' : unread; show(c, unread > 0);
    $('#tb-count').textContent = c.textContent; show($('#tb-count'), unread > 0);
    $('#btn-bell').classList.toggle('has', unread > 0);
    $('#bell-list').innerHTML = list.length ? list.slice(0, 20).map(notifItem).join('')
      : '<li class="empty">Henüz bildirim yok.</li>';
    if (!$('#mine-inbox').hidden) renderMineInbox();
  }

  async function markRead(ids) {
    ids = ids.filter((id) => !readSet.has(id));
    if (!ids.length || !session) return;
    ids.forEach((id) => readSet.add(id));
    renderBell();
    await sb.from('notification_reads').upsert(ids.map((id) => ({ user_id: session.user.id, notification_id: id })),
      { onConflict: 'user_id,notification_id', ignoreDuplicates: true });
  }

  function subscribeInbox() {
    if (!sb || !session || notifChannel) return;
    notifChannel = sb.channel('bildirimler-' + session.user.id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (p) => {
        const n = p.new;
        if (n.user_id && n.user_id !== session.user.id) return;
        if (inbox.some((x) => x.id === n.id)) return;
        inbox.unshift(n);
        renderBell();
        if (!wantsNotif(n)) return; // sistem duyuruları kapalı
        systemNotify(n);
        ding();
        toast((KIND[n.kind] || KIND.info)[0] + ' ' + n.title);
        $('#btn-bell').classList.remove('ring'); void $('#btn-bell').offsetWidth; $('#btn-bell').classList.add('ring');
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'notifications' }, (p) => {
        inbox = inbox.filter((x) => x.id !== p.old.id); renderBell();
      })
      .subscribe();
  }
  function unsubscribeInbox() {
    if (notifChannel) { sb.removeChannel(notifChannel); notifChannel = null; }
    inbox = []; readSet = new Set();
  }

  /* =================== ETKİNLİK GÜNLÜĞÜ =================== */
  const ACTIONS = {
    signup:            ['🎉', 'Kayıt oldu', 'lo'],
    login:             ['🔑', 'Giriş yaptı', 'lo'],
    logout:            ['🚪', 'Çıkış yaptı', 'muted'],
    report_create:     ['📍', 'Bildirim gönderdi', 'lo'],
    report_status:     ['🔄', 'Durum değiştirdi', 'mid'],
    report_delete:     ['🗑️', 'Bildirim sildi', 'hi'],
    report_resolved:   ['✅', 'Sorun çözüldü', 'lo'],
    user_ban:          ['⛔', 'Kullanıcı kısıtladı', 'hi'],
    user_delete:       ['🗑️', 'Hesap sildi', 'hi'],
    admin_password:    ['🔑', 'Şifre belirledi', 'mid'],
    user_unban:        ['🔓', 'Kısıtlamayı kaldırdı', 'mid'],
    photo_edit:        ['🖼️', 'Fotoğraf düzenledi', 'mid'],
    import:            ['📥', 'Veri içe aktardı', 'mid'],
    maintenance:       ['🛠️', 'Bakım modu', 'mid'],
    admin_toggle:      ['🛡️', 'Yetki değişikliği', 'hi'],
    notification_send: ['📣', 'Bildirim yolladı', 'mid'],
    settings_update:   ['⚙️', 'Ayar değiştirdi', 'muted'],
    password_change:   ['🔒', 'Şifre değiştirdi', 'mid'],
  };
  const STATUS_WORD = { pending: 'İncelemede', approved: 'Yayında', rejected: 'Kaldırıldı' };
  // Günlükteki teknik ifadeleri (fire/pothole, approved) Türkçeye çevir
  function prettyDetail(t) {
    return String(t || '')
      .replace(/\b(fire|waste|flood|infra|road|urgent)\/(\w*)/g, (m, c, s) => (CATS[c] ? CATS[c].short : c) +
        (SUBS[c] && SUBS[c][s] ? ' – ' + SUBS[c][s][0] : ''))
      .replace(/\b(fire|waste|flood|infra|road|urgent)\b/g, (m) => (CATS[m] ? CATS[m].short : m))
      .replace(/\b(pending|approved|rejected)\b/g, (m) => STATUS_WORD[m]);
  }

  function logTable(rows, withUser) {
    if (!rows.length) return '<p class="empty">Kayıt yok.</p>';
    return '<ol class="timeline">' + rows.map((r, i) => {
      const a = ACTIONS[r.action] || ['•', r.action, 'muted'];
      return '<li class="tl ' + a[2] + '" data-css="--i:' + Math.min(i, 20) + '">' +
        '<span class="tl-ico" aria-hidden="true">' + a[0] + '</span>' +
        '<div><b>' + (withUser ? '<span class="who">@' + esc(r.username || 'silinmiş kullanıcı') + '</span> ' : '') + esc(a[1]) + '</b>' +
        (r.detail ? '<span class="small">' + esc(prettyDetail(r.detail)) + '</span>' : '') +
        '<time class="small muted" datetime="' + esc(r.created_at) + '" title="' + esc(fmtDate(r.created_at)) + '">' + esc(timeAgo(r.created_at)) + '</time></div></li>';
    }).join('') + '</ol>';
  }

  /* =================== BİLDİRİMLERİM: SEKMELER =================== */
  let mineTab = 'reports';
  function setMineTab(t) {
    mineTab = t;
    $$('#mine-tabs .chip').forEach((b) => b.classList.toggle('on', b.dataset.mtab === t));
    show($('#mine-list'), t === 'reports'); show($('#mine-inbox'), t === 'inbox'); show($('#mine-log'), t === 'log');
    if (t === 'inbox') { renderMineInbox(); markRead(myInbox().map((n) => n.id)); }
    if (t === 'log') loadMyLog();
  }
  function renderMineInbox() {
    const list = myInbox();
    $('#mine-inbox').innerHTML = list.length ? '<ul class="bell-list big">' + list.map(notifItem).join('') + '</ul>'
      : '<p class="empty">Sana gelmiş bir bildirim yok. Yöneticiler duyuru yaptığında veya bildirimin incelendiğinde burada görürsün.</p>';
  }
  async function loadMyLog() {
    const box = $('#mine-log');
    box.innerHTML = skeleton(4);
    const { data, error } = await withBusy(sb.from('activity_log').select('*').eq('user_id', session.user.id)
      .order('created_at', { ascending: false }).limit(100));
    box.innerHTML = error ? '<p class="msg">' + esc(error.message) + '</p>' : logTable(data, false);
  }
  const skeleton = (n) => '<div class="skel-list">' + Array.from({ length: n }, () => '<div class="skel"></div>').join('') + '</div>';

  /* =================== AYARLAR =================== */
  function renderSettings() {
    if (!session) return;
    const u = session.user, name = profile ? profile.username : u.email.split('@')[0];
    $('#set-name').textContent = '@' + name;
    $('#set-meta').textContent = u.email + ' · ' + (profile && profile.is_admin ? 'Yönetici' : 'Kullanıcı') +
      ' · Üyelik: ' + new Date(u.created_at).toLocaleDateString('tr-TR', { dateStyle: 'long' }) +
      (u.app_metadata && u.app_metadata.provider === 'google' ? ' · Google hesabı' : '');
    $('#set-user').value = name;
    $$('#set-mode .chip').forEach((b) => b.classList.toggle('on', b.dataset.mode === theme.mode));
    $$('#set-basemap .chip').forEach((b) => b.classList.toggle('on', b.dataset.basemap === prefs.basemap));
    if (window.GGLite) {
      const lp = GGLite.pref();
      $$('#set-lite .chip').forEach((b) => { const on = b.dataset.lite === lp; b.classList.toggle('on', on); b.setAttribute('aria-checked', String(on)); });
      $('#set-lite-now').textContent = 'Şu an: ' + (lite() ? 'hafif mod açık' : 'tam görünüm') + (lp === 'auto' ? ' (cihaza göre otomatik seçildi)' : '');
    }
    $('#set-motion').checked = prefs.motion === 'on';
    $('#set-sound').checked = prefs.sound === 'on';
    $('#set-contrast').checked = theme.contrast === 'on';
    $('#set-device').textContent = (/ios|android|ipados/.test(DEVICE.os) ? '📱 ' : '💻 ') + DEVICE.label +
      ' · ' + (document.documentElement.dataset.ui === 'mobile' ? 'telefon arayüzü' : 'bilgisayar arayüzü') +
      ' · oturum ' + (remembering() ? 'hatırlanıyor' : 'tarayıcı kapanınca kapanır');
    show($('#btn-install2'), !DEVICE.standalone);
    renderSettingsExtras();
  }

  async function onSetUsername(e) {
    e.preventDefault();
    const v = $('#set-user').value.trim();
    if (profile && v === profile.username) return setMsg('#set-user-msg', 'Bu zaten senin kullanıcı adın.', 'info');
    if (!/^[\p{L}\p{N}_.-]{3,24}$/u.test(v)) return setMsg('#set-user-msg', 'Kullanıcı adı 3-24 karakter olmalı; harf, rakam, nokta, tire ve alt çizgi kullanabilirsin.');
    if (unNextAt() > Date.now() && !(profile && profile.is_admin)) return setMsg('#set-user-msg', 'Kullanıcı adını 72 saatte bir değiştirebilirsin. Kalan: ' + fmtLeft(unNextAt() - Date.now()));
    if (!confirm('Kullanıcı adın “' + v + '” olacak. Sonraki değişiklik 72 saat sonra yapılabilir. Onaylıyor musun?')) return;
    const { error } = await withBusy(sb.rpc('update_my_username', { new_name: v }));
    if (error) return setMsg('#set-user-msg', error.message);
    await loadProfile(); renderSettings(); renderUsernameSection(); updateNav();
    setMsg('#set-user-msg', 'Kullanıcı adın güncellendi. 🎉', 'ok');
    confetti();
  }

  // 72 saat kuralı: sonraki değişiklik zamanı
  const unNextAt = () => profile && profile.username_changed_at ? new Date(profile.username_changed_at).getTime() + 72 * 3600e3 : 0;
  let unTimer = null, unCheckT = null;
  async function renderUsernameSection() {
    if (!profile) return;
    $('#un-last').textContent = profile.username_changed_at ? fmtDate(profile.username_changed_at) : 'Hiç değiştirilmedi';
    clearInterval(unTimer);
    const tick = () => {
      const left = unNextAt() - Date.now();
      const can = left <= 0 || profile.is_admin;
      $('#un-next').textContent = can ? 'Şimdi değiştirebilirsin ✅' : '⏳ ' + fmtLeft(left);
      $('#un-status').classList.toggle('locked', !can);
      $('#set-user').disabled = !can; $('#un-save').disabled = !can;
      $('#menu-un-sub').textContent = can ? '@' + profile.username + ' · değiştirilebilir' : '@' + profile.username + ' · ' + fmtLeft(left) + ' sonra';
      if (can) clearInterval(unTimer);
    };
    tick(); unTimer = setInterval(tick, 1000);
    const { data } = await sb.from('username_history').select('*').eq('user_id', session.user.id).order('changed_at', { ascending: false });
    $('#un-history').innerHTML = (data || []).length ? data.map((h) =>
      '<li><span class="old">@' + esc(h.old_username) + '</span><span class="arrow">→</span><span>@' + esc(h.new_username) + '</span><small class="muted">' + esc(fmtDate(h.changed_at)) + '</small></li>').join('')
      : '<li class="muted small">Henüz kullanıcı adı değiştirmedin.</li>';
  }
  // Yazarken uygunluk kontrolü (sunucudaki kara liste ve benzersizlik dahil)
  function liveCheckUsername() {
    clearTimeout(unCheckT);
    const v = $('#set-user').value.trim(), out = $('#un-live');
    if (!v || (profile && v === profile.username)) { out.textContent = ''; out.className = 'un-live small'; return; }
    out.textContent = 'Kontrol ediliyor…'; out.className = 'un-live small';
    unCheckT = setTimeout(async () => {
      const { data } = await sb.rpc('check_username', { p: v });
      if ($('#set-user').value.trim() !== v) return;
      out.textContent = data ? '✖ ' + data : '✔ “' + v + '” kullanılabilir';
      out.className = 'un-live small ' + (data ? 'bad' : 'good');
    }, 400);
  }

  async function onSetPass(e) {
    e.preventDefault();
    const p1 = $('#set-pass').value, p2 = $('#set-pass2').value;
    if (p1.length < 8) return setMsg('#set-pass-msg', 'Şifre en az 8 karakter olmalı.');
    if (p1 !== p2) return setMsg('#set-pass-msg', 'İki şifre birbirini tutmuyor.');
    if (passScore(p1) < 2) return setMsg('#set-pass-msg', 'Bu şifre çok zayıf. Büyük harf, rakam veya sembol ekle.');
    const { error } = await withBusy(sb.auth.updateUser({ password: p1 }));
    if (error) return setMsg('#set-pass-msg', authErrTr(error));
    logEvent('password_change', 'Ayarlar sayfasından');
    $('#form-setpass').reset(); $('#set-strength').dataset.s = -1; $('#set-strength span').textContent = '';
    setMsg('#set-pass-msg', 'Şifren değiştirildi.', 'ok');
  }

  async function doLogout(scope) {
    logEvent('logout', scope === 'global' ? 'Tüm cihazlardan' : null);
    await new Promise((r) => setTimeout(r, 250)); // günlük kaydı gitsin
    await sb.auth.signOut(scope === 'global' ? { scope: 'global' } : undefined);
    toast(scope === 'global' ? 'Tüm cihazlardan çıkış yapıldı.' : 'Çıkış yapıldı.');
    location.hash = '#/harita';
  }

  async function onDeleteMe() {
    const word = prompt('Hesabın ve tüm bildirimlerin kalıcı olarak silinecek.\nOnaylamak için büyük harflerle SİL yaz:');
    if (word === null) return;
    if (word.trim().toLocaleUpperCase('tr-TR') !== 'SİL') return toast('Onay kelimesi yanlış, hesap silinmedi.');
    // önce fotoğrafları temizle
    const { data } = await sb.from('reports').select('photo_paths, photo_path').eq('user_id', session.user.id);
    const ps = (data || []).flatMap(photosOf);
    if (ps.length) await sb.storage.from(BUCKET).remove(withThumbs(ps));
    const { error } = await withBusy(sb.rpc('delete_my_account'));
    if (error) return toast('Hesap silinemedi: ' + error.message);
    await sb.auth.signOut();
    toast('Hesabın silindi. Katkıların için teşekkürler.');
    location.hash = '#/harita';
  }

  /* =================== YÖNETİCİ: KAYITLAR VE BİLDİRİM GÖNDER =================== */
  let adminLogs = [], adminSent = [];
  const logFilt = { action: 'all', q: '' };

  async function loadAdminLogs() {
    const { data, error } = await withBusy(sb.from('activity_log').select('*').order('created_at', { ascending: false }).limit(400));
    if (error) { $('#admin-body').innerHTML = '<p class="msg">' + esc(error.message) + '</p>'; return; }
    adminLogs = data; renderAdminLogs();
  }
  function renderAdminLogs() {
    let rows = adminLogs;
    if (logFilt.action !== 'all') rows = rows.filter((r) => r.action === logFilt.action);
    if (logFilt.q) { const q = logFilt.q.toLowerCase(); rows = rows.filter((r) => ((r.username || '') + ' ' + (r.detail || '')).toLowerCase().includes(q)); }
    const today = adminLogs.filter((r) => Date.now() - new Date(r.created_at) < 864e5);
    const activeUsers = new Set(today.map((r) => r.user_id).filter(Boolean)).size;
    $('#admin-body').innerHTML =
      '<div class="stats mini">' +
        '<div class="stat"><span>Son 24 saat olay</span><b>' + today.length + '</b></div>' +
        '<div class="stat"><span>Son 24 saat aktif kullanıcı</span><b>' + activeUsers + '</b></div>' +
        '<div class="stat"><span>Son 24 saat giriş</span><b>' + today.filter((r) => r.action === 'login').length + '</b></div>' +
      '</div>' +
      '<div class="row-gap log-tools">' +
        '<select id="log-action" aria-label="Olay türü"><option value="all">Tüm olaylar</option>' +
          Object.entries(ACTIONS).map(([k, v]) => '<option value="' + k + '"' + (logFilt.action === k ? ' selected' : '') + '>' + v[0] + ' ' + esc(v[1]) + '</option>').join('') +
        '</select>' +
        '<input id="log-q" type="search" placeholder="Kullanıcı veya ayrıntı ara…" value="' + esc(logFilt.q) + '">' +
        '<button type="button" class="btn ghost sm" id="log-csv">Kayıtları CSV indir</button>' +
      '</div>' +
      '<p class="muted small">' + rows.length + ' kayıt (en yeni 400 olay)</p>' + logTable(rows, true);
  }

  async function loadAdminSent() {
    const { data } = await sb.from('notifications').select('*').order('created_at', { ascending: false }).limit(40);
    adminSent = data || [];
  }
  function renderNotify(prefillUser) {
    const opts = '<option value="">📢 Herkese (tüm kullanıcılar)</option>' +
      adminUsers.map((u) => '<option value="' + esc(u.id) + '"' + (prefillUser === u.id ? ' selected' : '') + '>@' + esc(u.username) +
        (u.email ? ' · ' + esc(u.email) : '') + '</option>').join('');
    $('#admin-body').innerHTML =
      '<div class="notify-grid">' +
      '<form id="form-notify" class="card stack" novalidate>' +
        '<h2>Yeni bildirim</h2>' +
        '<label for="n-to">Alıcı</label><select id="n-to">' + opts + '</select>' +
        '<span class="label">Tür</span><div class="chips" id="n-kind">' +
          Object.entries(KIND).map(([k, v], i) => '<label class="chip-radio"><input type="radio" name="nkind" value="' + k + '"' + (i === 0 ? ' checked' : '') + '><span>' + v[0] + ' ' + v[1] + '</span></label>').join('') +
        '</div>' +
        '<label for="n-title">Başlık</label><input id="n-title" type="text" maxlength="120" placeholder="Örn. Hafta sonu saha çalışması">' +
        '<label for="n-body">Mesaj</label><textarea id="n-body" rows="4" maxlength="1000" placeholder="Kullanıcılara iletmek istediğin mesaj…"></textarea>' +
        '<label for="n-link">Tıklayınca açılsın (isteğe bağlı)</label><select id="n-link">' +
          '<option value="">Hiçbir yer</option><option value="#/harita">Harita</option><option value="#/bildir">Riskli alan bildir</option><option value="#/ayarlar">Ayarlar</option></select>' +
        '<p class="msg" id="notify-msg" role="alert" hidden></p>' +
        '<button class="btn green big" type="submit">Gönder</button>' +
      '</form>' +
      '<div class="card stack"><h2>Önizleme</h2><ul class="bell-list" id="n-preview"></ul>' +
        '<h2 class="sec-title">Son gönderilenler</h2><ul class="bell-list sent" id="n-sent"></ul></div>' +
      '</div>';
    renderNotifyPreview(); renderSent();
  }
  function renderNotifyPreview() {
    const kind = (($('input[name=nkind]:checked') || {}).value) || 'info';
    $('#n-preview').innerHTML = notifItem({ id: 'onizleme', kind, title: $('#n-title').value || 'Başlık burada görünür',
      body: $('#n-body').value, user_id: $('#n-to').value || null, created_at: new Date().toISOString() });
  }
  function renderSent() {
    const box = $('#n-sent'); if (!box) return;
    const manual = adminSent.filter((n) => n.link !== '#/bildirimlerim');
    box.innerHTML = manual.length ? manual.map((n) => {
      const to = n.user_id ? '@' + ((adminUsers.find((u) => u.id === n.user_id) || {}).username || '?') : 'Herkese';
      return '<li class="nitem ' + n.kind + '"><span class="nico">' + (KIND[n.kind] || KIND.info)[0] + '</span>' +
        '<span class="nbody"><b>' + esc(n.title) + '</b><small>' + esc(to) + ' · ' + esc(timeAgo(n.created_at)) + '</small></span>' +
        '<button type="button" class="linkish small" data-delnotif="' + esc(n.id) + '">Geri çek</button></li>';
    }).join('') : '<li class="empty">Henüz elle gönderilmiş bildirim yok.</li>';
  }
  async function onNotifySubmit(e) {
    e.preventDefault();
    const title = $('#n-title').value.trim(), body = $('#n-body').value.trim();
    if (title.length < 3) return setMsg('#notify-msg', 'Başlık en az 3 karakter olmalı.');
    const to = $('#n-to').value || null;
    if (!to && !confirm('Bu bildirim tüm kullanıcılara gidecek. Gönderilsin mi?')) return;
    const btn = $('#form-notify button[type=submit]'); btn.disabled = true;
    const { error } = await withBusy(sb.from('notifications').insert({
      user_id: to, title, body: body || null, kind: $('input[name=nkind]:checked').value, link: $('#n-link').value || null,
    }));
    btn.disabled = false;
    if (error) return setMsg('#notify-msg', 'Gönderilemedi: ' + error.message);
    toast('Bildirim gönderildi.');
    $('#n-title').value = ''; $('#n-body').value = '';
    await loadAdminSent(); renderSent(); renderNotifyPreview();
    setMsg('#notify-msg', 'Gönderildi. Çevrimiçi kullanıcılar anında görür.', 'ok');
  }

  function exportLogsCsv() {
    const cell = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
    const csv = '﻿' + ['zaman', 'kullanici', 'olay', 'ayrinti'].join(';') + '\n' +
      adminLogs.map((r) => [r.created_at, r.username, (ACTIONS[r.action] || [, r.action])[1], prettyDetail(r.detail)].map(cell).join(';')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'etkinlik-kayitlari-' + new Date().toISOString().slice(0, 10) + '.csv';
    a.click(); URL.revokeObjectURL(a.href);
  }

  /* =================== KAYIT / GİRİŞ / OTP =================== */
  let pendingEmail = null, pendingPass = null, otpType = 'signup', recovering = RECOVERY_LINK;
  let loginMethod = null; // bir sonraki SIGNED_IN olayında günlüğe yazılacak giriş yolu
  let pendingAuthError = null;
  let resetError = null, resetDone = false; // şifre yenileme sayfasının durumu
  const siteUrl = () => location.origin + location.pathname;
  // Not: adreste "#" olmamalı (Supabase jetonları "#" ile ekler); ?sifre=1 sayfanın şifre yenileme ekranını açmasını sağlar
  const resetUrl = () => siteUrl() + '?sifre=1';
  // Supabase'in İngilizce hata mesajlarını Türkçeye çevir
  function authErrTr(error) {
    const m = String((error && error.message) || error || '');
    if (/same|different from the old/i.test(m)) return 'Yeni şifre eskisiyle aynı olamaz.';
    if (/at least|too short|weak/i.test(m)) return 'Şifre çok kısa ya da zayıf. En az 8 karakter, harf ve rakam kullan.';
    if (/session.*missing|not authenticated|jwt|expired|invalid.*token/i.test(m)) return 'Sıfırlama bağlantısının süresi dolmuş. “Şifremi unuttum”dan yeni bağlantı iste.';
    if (/rate limit|too many/i.test(m)) return 'Çok fazla deneme yapıldı. Birkaç dakika sonra tekrar dene.';
    if (/network|fetch/i.test(m)) return 'Bağlantı hatası. İnternetini kontrol edip tekrar dene.';
    return 'İşlem tamamlanamadı: ' + m;
  }

  // Tarayıcının kendi adına günlüğe yazabildiği olaylar (giriş, çıkış, ayar)
  function logEvent(action, detail) {
    if (!sb || !session) return;
    if (action === 'login') detail = (detail ? detail + ' · ' : '') + DEVICE.label;
    sb.from('activity_log').insert({
      user_id: session.user.id, username: profile ? profile.username : null, action, detail: detail || null,
    }).then(({ error }) => { if (error) console.warn('Günlük yazılamadı:', error.message); });
  }

  // Maildeki bağlantıdan dönüşte adres çubuğunda hata varsa anlaşılır göster
  function readAuthHashError() {
    const h = location.hash;
    if (!/error_description=|error_code=/.test(h)) return null;
    const p = new URLSearchParams(h.replace(/^#\/?/, ''));
    const code = p.get('error_code') || '';
    // şifre sıfırlama bağlantısı (?sifre=1) hatalıysa kendi sayfasında anlatılır ve yeni bağlantı oradan istenir
    if (RESET_LINK) {
      history.replaceState(null, '', location.pathname + '#/sifre-yenile');
      resetError = /otp_expired/.test(code)
        ? 'Bu sıfırlama bağlantısının süresi dolmuş ya da daha önce kullanılmış. Bağlantılar 1 saat geçerlidir ve tek kullanımlıktır. Aşağıdan yenisini iste.'
        : 'Sıfırlama bağlantısı doğrulanamadı (' + (p.get('error_description') || code).replace(/\+/g, ' ') + '). Aşağıdan yeni bir bağlantı iste.';
      return null;
    }
    history.replaceState(null, '', location.pathname + '#/giris');
    if (/otp_expired/.test(code)) return 'Bu e-posta bağlantısının süresi dolmuş ya da zaten kullanılmış. Aşağıdan yeni bir şifre sıfırlama bağlantısı iste.';
    return 'Bağlantı ile giriş yapılamadı: ' + (p.get('error_description') || code).replace(/\+/g, ' ');
  }

  // Şifre gücü: uzunluk, büyük/küçük harf, rakam, sembol
  function passScore(p) {
    let s = 0;
    if (p.length >= 8) s++; if (p.length >= 12) s++;
    if (/[a-zçğıöşü]/.test(p) && /[A-ZÇĞİÖŞÜ]/.test(p)) s++;
    if (/\d/.test(p)) s++; if (/[^\p{L}\p{N}]/u.test(p)) s++;
    return Math.min(4, s);
  }
  function bindStrength(inputId, boxId) {
    const box = $('#' + boxId); if (!box) return;
    $('#' + inputId).addEventListener('input', (e) => {
      const v = e.target.value, s = v ? passScore(v) : -1;
      box.dataset.s = s;
      $('span', box).textContent = s < 0 ? '' : ['Çok zayıf', 'Zayıf', 'İdare eder', 'Güçlü', 'Çok güçlü'][s];
    });
  }

  const AUTH_FORMS = ['signup', 'login', 'verify', 'forgot', 'maillogin'];
  function authTab(which) {
    $('#tab-signup').setAttribute('aria-selected', which === 'signup');
    $('#tab-login').setAttribute('aria-selected', which === 'login');
    AUTH_FORMS.forEach((f) => show($('#form-' + f), f === which));
    show($('.seg'), which === 'signup' || which === 'login');
    show($('#oauth-box'), !!$('#oauth-box').dataset.on && (which === 'signup' || which === 'login'));
    show($('#form-verify .waiting'), which === 'verify' && !!pendingPass);
  }

  async function onSignup(e) {
    e.preventDefault();
    if (!sb) return setMsg('#signup-msg', 'Site henüz Supabase’e bağlanmadı (config.js).');
    const username = $('#s-user').value.trim(), email = $('#s-mail').value.trim(), password = $('#s-pass').value;
    if (!/^[\p{L}\p{N}_.-]{3,24}$/u.test(username)) return setMsg('#signup-msg', 'Kullanıcı adı 3-24 karakter olmalı; harf, rakam, nokta, tire ve alt çizgi kullanabilirsin.');
    if (!/^\S+@\S+\.\S+$/.test(email)) return setMsg('#signup-msg', 'Geçerli bir e-posta yaz.');
    if (password.length < 8) return setMsg('#signup-msg', 'Şifre en az 8 karakter olmalı.');
    setMsg('#signup-msg', '');
    // kara liste, ayrılmış adlar ve benzersizlik sunucuda kontrol edilir
    const { data: unProblem } = await sb.rpc('check_username', { p: username });
    if (unProblem) return setMsg('#signup-msg', unProblem);
    loginMethod = 'Yeni kayıt';
    const btn = $('#form-signup button[type=submit]'); btn.disabled = true; btn.textContent = 'Hesap açılıyor…';
    try {
      // Beta: e-posta doğrulaması yok. Hesap sunucu fonksiyonunda doğrudan onaylı açılır (mail sınırına takılmaz).
      const { data, error } = await withBusy(sb.functions.invoke('signup', { body: { email, password, username } }));
      if (error || (data && data.error)) {
        let msg = data && data.error;
        if (!msg && error && error.context && error.context.json) { try { msg = (await error.context.json()).error; } catch (_) { /* yok say */ } }
        msg = msg || 'Kayıt yapılamadı. İnternet bağlantını kontrol et.';
        if (/zaten kayıtlı/.test(msg)) { $('#l-mail').value = email; authTab('login'); return setMsg('#login-msg', msg, 'info'); }
        return setMsg('#signup-msg', msg);
      }
      const { error: le } = await sb.auth.signInWithPassword({ email, password });
      if (le) { $('#l-mail').value = email; authTab('login'); return setMsg('#login-msg', 'Hesabın açıldı! Şimdi giriş yapabilirsin.', 'ok'); }
      safe(() => localStorage.setItem('gyrh-last-mail', email));
      toast('Hoş geldin, ' + username + '! 🎉'); confetti(); afterLogin();
    } finally { btn.disabled = false; btn.textContent = 'Kayıt ol'; }
  }

  // Kullanıcı maildeki bağlantıya (telefondan bile) tıklarsa hesap onaylanır;
  // burada arada bir şifreyle girmeyi deneyip onaylandığı anda içeri alırız.
  let confirmTimer = null;
  let confirmBusy = false;
  // Bağlantı tıklandı mı? Şifre biliniyorsa şifreyle dener; şifresiz girişte oturumun gelmesini bekler.
  async function checkConfirmed(manual) {
    if (confirmBusy || $('#form-verify').hidden) return;
    if (session) { clearInterval(confirmTimer); return afterLogin(); }
    confirmBusy = true;
    try {
      if (pendingPass) {
        const { error } = await sb.auth.signInWithPassword({ email: pendingEmail, password: pendingPass });
        if (!error) {
          clearInterval(confirmTimer); pendingPass = null;
          toast('E-postan doğrulandı, hoş geldin! 🎉'); confetti(); afterLogin(); return;
        }
      } else {
        const { data } = await sb.auth.getSession();
        if (data.session) { clearInterval(confirmTimer); session = data.session; afterLogin(); return; }
      }
      if (manual) setMsg('#verify-msg', 'Henüz onaylanmamış görünüyor. Maildeki “Confirm email address” bağlantısına tıkladığından emin ol (spam klasörüne de bak).', 'info');
    } finally { confirmBusy = false; }
  }
  function waitForConfirm() {
    clearInterval(confirmTimer);
    if (!pendingEmail) return;
    const t0 = Date.now();
    confirmTimer = setInterval(() => {
      if (session || Date.now() - t0 > 20 * 60000 || $('#form-verify').hidden) return clearInterval(confirmTimer);
      checkConfirmed(false);
    }, 4000);
  }
  // Arka plandaki sekmede tarayıcı zamanlayıcıları yavaşlatır; sekmeye dönünce hemen kontrol et
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && pendingEmail) checkConfirmed(false); });
  window.addEventListener('focus', () => { if (pendingEmail) checkConfirmed(false); });

  // Doğrulama ekranını hazırla: e-posta sağlayıcısına göre "Mail kutumu aç" bağlantısı
  function showVerify(email, kind) {
    const dom = (email.split('@')[1] || '').toLowerCase();
    const inbox = /gmail|googlemail/.test(dom) ? 'https://mail.google.com/mail/u/0/#inbox'
      : /outlook|hotmail|live|msn/.test(dom) ? 'https://outlook.live.com/mail/'
      : /yahoo/.test(dom) ? 'https://mail.yahoo.com/' : /icloud|me\.com|mac\.com/.test(dom) ? 'https://www.icloud.com/mail/'
      : /yandex/.test(dom) ? 'https://mail.yandex.com.tr/' : null;
    const a = $('#open-mail');
    show(a, !!inbox); if (inbox) a.href = inbox;
    $('#verify-title').textContent = kind === 'login' ? 'Giriş bağlantını aç' : 'Mail kutunu kontrol et';
    $('#verify-to').innerHTML = '<b>' + esc(email) + '</b> adresine ' + (kind === 'login'
      ? 'bir giriş bağlantısı gönderdik. Maildeki “Sign in” bağlantısına tıklaman yeterli.'
      : 'bir doğrulama e-postası gönderdik. Kaydını bitirmek için maili açıp bağlantıya tıkla.');
    $$('.verify-steps li')[1].querySelector('b').textContent = kind === 'login' ? '“Sign in” bağlantısına tıkla' : '“Confirm email address” bağlantısına tıkla';
    setMsg('#verify-msg', '');
    authTab('verify');
    show($('#form-verify .waiting'), true);
    waitForConfirm();
  }

  // Supabase'in ücretsiz e-posta sınırına takılınca anlaşılır mesaj ver
  function mailError(error) {
    if (/rate limit|too many|security purposes/i.test(error.message))
      return 'Çok fazla e-posta isteği gönderildi. Birkaç dakika bekle ya da “Google ile devam et” düğmesini kullan.';
    if (/sending|smtp|email/i.test(error.message) && /error|fail/i.test(error.message))
      return 'Doğrulama e-postası gönderilemedi. “Google ile devam et” ile girebilirsin.';
    return error.message;
  }

  // Google sağlayıcısı Supabase'de açık değilse düğmeyi hiç gösterme
  async function checkGoogle() {
    let on = false;
    try {
      const res = await fetch(cfg.SUPABASE_URL + '/auth/v1/settings', { headers: { apikey: cfg.SUPABASE_ANON_KEY } });
      on = !!(await res.json()).external.google;
    } catch (_) { /* ağ hatası: gizli kalsın */ }
    show($('#oauth-box'), on);
    $('#oauth-box').dataset.on = on ? '1' : '';
    if (!on) console.info('Google girişi kapalı: Supabase > Authentication > Sign In / Providers > Google');
  }

  async function onGoogle() {
    if (!sb) return toast('Site henüz Supabase’e bağlanmadı (config.js).');
    const { error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: location.origin + location.pathname },
    });
    if (error) toast(/not enabled|unsupported/i.test(error.message)
      ? 'Google girişi henüz açılmadı. Yönetici Supabase’de Google sağlayıcısını etkinleştirmeli.'
      : 'Google ile giriş başarısız: ' + error.message);
  }

  async function onVerify(e) {
    e.preventDefault();
    const token = $('#v-code').value.replace(/\D/g, '');
    if (token.length < 6) return setMsg('#verify-msg', 'Kod 6 haneli olmalı.');
    setMsg('#verify-msg', '');
    let { error } = await sb.auth.verifyOtp({ email: pendingEmail, token, type: otpType });
    if (error) {
      const alt = otpType === 'signup' ? 'email' : 'signup';
      const r = await sb.auth.verifyOtp({ email: pendingEmail, token, type: alt });
      error = r.error;
    }
    if (error) return setMsg('#verify-msg', 'Kod doğrulanamadı. Süresi dolmuş olabilir, yeni kod iste.');
    loginMethod = 'E-posta kodu';
    if (pendingPass) await sb.auth.signInWithPassword({ email: pendingEmail, password: pendingPass });
    pendingPass = null;
    toast('E-postan doğrulandı.');
    afterLogin();
  }

  async function onResend() {
    if (!pendingEmail) return;
    const btn = $('#btn-resend'); if (btn.disabled) return;
    const { error } = otpType === 'email'
      ? (await sb.auth.signInWithOtp({ email: pendingEmail, options: { shouldCreateUser: false, emailRedirectTo: siteUrl() } }))
      : (await sb.auth.resend({ type: 'signup', email: pendingEmail, options: { emailRedirectTo: siteUrl() } }));
    if (error) return toast('Mail gönderilemedi: ' + mailError(error));
    toast('Yeni mail gönderildi. Son gelen maildeki bağlantıyı kullan.');
    // 60 saniye bekleme (e-posta sınırına takılmamak için)
    let left = 60; btn.disabled = true;
    const t = setInterval(() => { left--; btn.textContent = 'Tekrar göndermek için ' + left + ' sn'; if (left <= 0) { clearInterval(t); btn.disabled = false; btn.textContent = 'Maili tekrar gönder'; } }, 1000);
  }

  // Giriş denemesi sınırı (kaba kuvvet / şifre deneme koruması). Sunucu tarafında Supabase Auth da IP başına
  // istek sınırı uygular; bu katman aynı tarayıcıdan art arda yanlış şifre denemelerini kademeli olarak yavaşlatır:
  // 5 hatalı denemeden sonra 30 sn, sonra her hatada süre ikiye katlanır (en çok 15 dk). Başarılı girişte sıfırlanır.
  const LOGIN_RL_KEY = 'gg-login-rl';
  const loginRl = {
    read() { return safe(() => JSON.parse(localStorage.getItem(LOGIN_RL_KEY) || '{}'), {}) || {}; },
    write(v) { safe(() => localStorage.setItem(LOGIN_RL_KEY, JSON.stringify(v))); },
    waitMs() { const v = this.read(); return Math.max(0, (v.until || 0) - Date.now()); },
    fail() {
      const v = this.read(), now = Date.now();
      if (!v.first || now - v.first > 15 * 60e3) { v.first = now; v.n = 0; }
      v.n = (v.n || 0) + 1;
      if (v.n >= 5) v.until = now + Math.min(15 * 60e3, 30e3 * Math.pow(2, v.n - 5));
      this.write(v);
    },
    reset() { safe(() => localStorage.removeItem(LOGIN_RL_KEY)); },
  };
  const waitText = (ms) => { const sn = Math.ceil(ms / 1000); return sn >= 60 ? Math.ceil(sn / 60) + ' dakika' : sn + ' saniye'; };

  async function onLogin(e) {
    e.preventDefault();
    if (!sb) return setMsg('#login-msg', 'Site henüz Supabase’e bağlanmadı (config.js).');
    setMsg('#login-msg', '');
    const email = $('#l-mail').value.trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setMsg('#login-msg', 'Geçerli bir e-posta yaz.');
    if (!$('#l-pass').value) return setMsg('#login-msg', 'Şifreni yaz.');
    const lockMs = loginRl.waitMs();
    if (lockMs) return setMsg('#login-msg', 'Çok fazla hatalı deneme yapıldı. Güvenliğin için ' + waitText(lockMs) + ' sonra tekrar dene.');
    try {
      localStorage.setItem('gyrh-last-mail', email);
      localStorage.setItem(REMEMBER_KEY, $('#l-remember').checked ? 'yes' : 'no');
      if ($('#l-remember').checked) localStorage.setItem(REMEMBER_AT, String(Date.now())); else localStorage.removeItem(REMEMBER_AT);
    } catch (_) { /* yok say */ }
    loginMethod = 'Şifre ile' + ($('#l-remember').checked ? ' · beni hatırla' : '');
    const { error } = await withBusy(sb.auth.signInWithPassword({ email, password: $('#l-pass').value }));
    if (error) {
      if (/confirm|not confirmed/i.test(error.message)) {
        pendingEmail = email; pendingPass = $('#l-pass').value; otpType = 'signup';
        await sb.auth.resend({ type: 'signup', email });
        showVerify(email, 'signup');
        setMsg('#verify-msg', 'Hesabın henüz doğrulanmamış. Yeni bir doğrulama maili gönderdik.', 'info');
        return;
      }
      if (/banned/i.test(error.message) || error.code === 'user_banned') {
        const { data: b } = await sb.rpc('ban_lookup', { p_email: email });
        showBan(b || { by: 'hesap', reason: null, expires_at: null });
        return setMsg('#login-msg', 'Bu hesap askıya alınmış.');
      }
      // ağ hatası / çok deneme gibi durumlar "şifre hatalı" diye gösterilmesin
      if (/invalid.*credentials|invalid login/i.test(error.message)) {
        loginRl.fail();
        const w = loginRl.waitMs();
        if (w) return setMsg('#login-msg', 'E-posta veya şifre hatalı. Çok fazla hatalı deneme yapıldığı için giriş ' + waitText(w) + ' kilitlendi.');
      }
      if (/invalid.*credentials|invalid login/i.test(error.message)) return setMsg('#login-msg', 'E-posta veya şifre hatalı. Şifreni unuttuysan “Şifremi unuttum”a bas.');
      return setMsg('#login-msg', authErrTr(error));
    }
    loginRl.reset();
    afterLogin();
  }


  async function onForgot(e) {
    e.preventDefault();
    const email = $('#fg-mail').value.trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setMsg('#forgot-msg', 'Geçerli bir e-posta yaz.');
    // Not: redirectTo'da "#" olmamalı; Supabase jetonları "#" ile eklediği için çift "#" olur ve bağlantı çalışmaz
    const { error } = await withBusy(sb.auth.resetPasswordForEmail(email, { redirectTo: resetUrl() }));
    if (error) return setMsg('#forgot-msg', mailError(error));
    loginMethod = 'Şifre sıfırlama bağlantısı';
    setMsg('#forgot-msg', 'Bağlantı gönderildi. E-postanı kontrol et, gelmezse spam klasörüne bak.', 'ok');
  }

  async function onMailLogin(e) {
    e.preventDefault();
    const email = $('#ml-mail').value.trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setMsg('#maillogin-msg', 'Geçerli bir e-posta yaz.');
    const { error } = await withBusy(sb.auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: siteUrl() } }));
    if (error) return setMsg('#maillogin-msg', /not found|signups/i.test(error.message)
      ? 'Bu e-postayla kayıtlı hesap yok. Önce kayıt ol.' : mailError(error));
    pendingEmail = email; pendingPass = null; otpType = 'email';
    showVerify(email, 'login');
  }

  /* ---- Şifre yenileme sayfası (#/sifre-yenile) ----
     Akış: "Şifremi unuttum" → Supabase sıfırlama e-postası → bağlantı ?sifre=1#access_token…&type=recovery ile döner →
     supabase-js jetonu adresten okuyup geçici oturum açar (PASSWORD_RECOVERY) → bu sayfada yeni şifre + tekrarı →
     updateUser({ password }) → diğer cihazlardaki oturumlar kapatılır. Jeton hiçbir yerde ayrıca saklanmaz ya da yazdırılmaz. */
  function resetState(k) { ['rs-checking', 'form-reset', 'rs-invalid', 'rs-done'].forEach((id) => show($('#' + id), id === k)); }
  function resetInvalid(text) {
    resetState('rs-invalid');
    $('#rs-invalid-text').textContent = text;
    if (!$('#rs-mail').value) { try { $('#rs-mail').value = localStorage.getItem('gyrh-last-mail') || ''; } catch (_) { /* yok say */ } }
  }
  function renderReset() {
    // ?sifre=1 işi bitti: adres çubuğunda kalmasın (jeton zaten supabase-js tarafından adresten silinir)
    if (location.search && !/access_token=|error_code=/.test(location.hash)) history.replaceState(null, '', location.pathname + location.hash);
    if (resetError) { const t = resetError; resetError = null; resetMark(false); return resetInvalid(t); }
    if (resetDone) return resetState('rs-done');
    if (!sb) return resetInvalid('Site sunucuya bağlanamadı. İnternetini kontrol edip sayfayı yenile.');
    if (session && (recovering || resetActive())) {
      recovering = true;
      resetState('form-reset');
      const m = session.user && session.user.email ? session.user.email : '';
      $('#rs-who').textContent = m ? 'Hesap: ' + m.replace(/^(.).*(@.*)$/, '$1•••$2') : '';
      setTimeout(() => { if (!$('#form-reset').hidden) $('#rs-pass').focus(); }, 250);
      return;
    }
    // jeton adresten okunuyor olabilir (bağlantıyla yeni gelindi); doğrulama bitince sayfa yeniden çizilir
    if (RECOVERY_LINK && !session && !renderReset.waited) {
      renderReset.waited = true; resetState('rs-checking');
      setTimeout(() => { if (document.documentElement.dataset.route === 'sifre-yenile' && !session) renderReset(); }, 8000);
      return;
    }
    resetMark(false);
    resetInvalid(session
      ? 'Bu sayfa yalnız e-postadaki şifre sıfırlama bağlantısıyla açılır. Giriş yapmış durumdasın; şifreni Ayarlar → Güvenlik bölümünden de değiştirebilirsin.'
      : 'Bu sayfa e-postadaki şifre sıfırlama bağlantısıyla açılır. Bağlantının süresi dolmuş ya da daha önce kullanılmış olabilir. Aşağıdan yeni bağlantı iste.');
  }
  async function onReset(e) {
    e.preventDefault();
    const p1 = $('#rs-pass').value, p2 = $('#rs-pass2').value, btn = $('#rs-save');
    setMsg('#reset-msg', '');
    if (p1.length < 8) { $('#rs-pass').focus(); return setMsg('#reset-msg', 'Şifre en az 8 karakter olmalı.'); }
    if (passScore(p1) < 2) { $('#rs-pass').focus(); return setMsg('#reset-msg', 'Şifre çok zayıf: harf ve rakamı karıştır ya da daha uzun yaz.'); }
    if (!p2) { $('#rs-pass2').focus(); return setMsg('#reset-msg', 'Yeni şifreyi bir kez daha yaz.'); }
    if (p1 !== p2) { $('#rs-pass2').focus(); return setMsg('#reset-msg', 'İki şifre aynı değil. Tekrar yaz.'); }
    if (!session) return resetInvalid('Sıfırlama oturumunun süresi doldu. Aşağıdan yeni bağlantı iste.');
    btn.disabled = true; btn.setAttribute('aria-busy', 'true'); btn.textContent = 'Kaydediliyor…';
    let error = null;
    try { ({ error } = await withBusy(sb.auth.updateUser({ password: p1 }))); } catch (err) { error = err; }
    btn.disabled = false; btn.removeAttribute('aria-busy'); btn.textContent = 'Şifreyi kaydet';
    if (error) {
      const m = String(error.message || error), c = error.code || '';
      if (/session.*missing|not authenticated|jwt|expired|invalid.*(token|claim)|reauthentication/i.test(m + ' ' + c)) {
        return resetInvalid('Sıfırlama oturumunun süresi doldu. Güvenliğin için aşağıdan yeni bir bağlantı iste.');
      }
      if (/same_password|same|different from the old/i.test(m + ' ' + c)) return setMsg('#reset-msg', 'Yeni şifre eskisiyle aynı olamaz.');
      if (/weak|pwned|leaked|at least|too short/i.test(m + ' ' + c)) return setMsg('#reset-msg', 'Bu şifre zayıf ya da sızdırılmış şifre listelerinde var. Daha uzun ve farklı bir şifre seç.');
      return setMsg('#reset-msg', authErrTr(error));
    }
    // şifre değişti: başka cihazlardaki (belki çalınmış) oturumlar kapanır, bu oturum açık kalır
    try { await sb.auth.signOut({ scope: 'others' }); } catch (_) { /* ağ hatası olsa da şifre değişti */ }
    logEvent('password_change', 'Şifre sıfırlama bağlantısıyla');
    recovering = false; resetDone = true; resetMark(false);
    $('#rs-pass').value = ''; $('#rs-pass2').value = ''; delete $('#rs-strength').dataset.s; $('#rs-strength span').textContent = '';
    resetState('rs-done');
    toast('Şifren güncellendi.');
  }
  async function onResetAgain(e) {
    e.preventDefault();
    const email = $('#rs-mail').value.trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setMsg('#reset-again-msg', 'Geçerli bir e-posta yaz.');
    if (!sb) return setMsg('#reset-again-msg', 'Site sunucuya bağlanamadı. İnternetini kontrol et.');
    const btn = $('#form-reset-again button[type=submit]'); btn.disabled = true;
    const { error } = await withBusy(sb.auth.resetPasswordForEmail(email, { redirectTo: resetUrl() }));
    btn.disabled = false;
    if (error) return setMsg('#reset-again-msg', mailError(error));
    try { localStorage.setItem('gyrh-last-mail', email); } catch (_) { /* yok say */ }
    setMsg('#reset-again-msg', 'Bağlantı gönderildi (kayıtlı bir hesapsa). E-postanı kontrol et; gelmezse spam klasörüne bak.', 'ok');
  }

  let nextHash = null;
  function afterLogin() {
    const go = nextHash || '#/harita'; nextHash = null;
    if (window.GGSinema && window.GGSinema.welcome) window.GGSinema.welcome(profile && profile.username);
    location.hash = go;
  }

  /* =================== YÖNETİCİ: VERİ İÇE AKTAR =================== */
  // Proje öncesi toplanan saha gözlemlerini (Excel / CSV / GeoJSON) haritaya ekler.
  // Konum: dosyadaki koordinat ya da Google / Apple Haritalar bağlantısının işaret ettiği KESİN nokta
  // (sunucudaki resolve-maps fonksiyonu çözer). İlçe ve mahalle, formdaki kuralla o noktadan bulunur.
  // Gözlemci adı herkese maskeli görünür; "@kullanıcı" yerine "Yönetici tarafından eklendi" yazar.
  // İçe aktarılan kayıtlar puan / lider tablosuna sayılmaz (veritabanı: source = 'import').
  const IMP_FIELDS = [
    ['link', 'Harita bağlantısı (Google / Apple)', [/harita.*(bağlant|baglant|link)/i, /maps.*link/i, /konum.*(bağlant|link)/i, /link|bağlantı|baglanti/i]],
    ['lat', 'Enlem', [/enlem|latitude/i, /^lat$/i]],
    ['lng', 'Boylam', [/boylam|longitude/i, /^(lng|lon)$/i]],
    ['coord', 'Koordinat (tek sütunda “enlem, boylam”)', [/koordinat|coordinates?/i]],
    ['date', 'Gözlem tarihi', [/g[öo]zlem.*tarih/i, /tarih|date/i, /zaman/i]],
    ['observer', 'Gözlemci adı', [/g[öo]zlemci/i, /ad[ıi]? ?(ve )?soyad/i, /isim|observer/i]],
    ['notes', 'Notlar', [/genel not|ek g[öo]zlem/i, /not|a[çc][ıi]klama|description/i]],
    ['veg', 'Bitki örtüsü yoğunluğu', [/bitki/i, /vejetasyon|vegetation/i]],
    ['risks', 'Riskli unsurlar', [/riskli unsur/i, /unsur|risks?$/i]],
    ['access', 'İtfaiye erişimi (1-5)', [/itfaiye/i, /eri[şs]im|access/i]],
    ['photo', 'Fotoğraf bağlantısı', [/foto[ğg]raf|photo|resim/i]],
    ['address', 'Açık adres', [/adres|address|sokak/i]],
  ];
  const imp = { file: '', head: [], data: [], map: {}, cat: 'fire', sub: 'interface', rows: [], busy: false, pmap: null, pins: null, picking: -1 };

  async function loadXlsxLib() {
    if (window.XLSX) return;
    await new Promise((ok, bad) => {
      const sc = document.createElement('script'); sc.src = 'vendor/xlsx.full.min.js?v=1';
      sc.onload = ok; sc.onerror = () => bad(new Error('Excel okuyucu yüklenemedi. İnternet bağlantını kontrol et.'));
      document.head.appendChild(sc);
    });
  }
  // derece-dakika-saniye ("38°18'33.5\"N") ya da ondalık
  function impNum(v) {
    if (typeof v === 'number') return v;
    const s = String(v == null ? '' : v).trim();
    if (!s) return null;
    if (s.includes('°')) {
      const m = s.match(/(-?\d+(?:[.,]\d+)?)\s*°\s*(?:(\d+(?:[.,]\d+)?)\s*['′’]\s*)?(?:(\d+(?:[.,]\d+)?)\s*["″”]?)?\s*([NSEWKGDB])?/i);
      if (!m) return null;
      let d = Number(m[1].replace(',', '.')) + (m[2] ? Number(m[2].replace(',', '.')) / 60 : 0) + (m[3] ? Number(m[3].replace(',', '.')) / 3600 : 0);
      if (m[4] && /[SWGB]/i.test(m[4])) d = -Math.abs(d);
      return d;
    }
    const n = Number(s.replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  }
  function impPair(v) {
    const s = String(v == null ? '' : v);
    let m = s.match(/(-?\d{1,2}\.\d+)\s*[,;\s]\s*(-?\d{1,3}\.\d+)/) || s.match(/(-?\d{1,2},\d+)\s*[;\s]\s*(-?\d{1,3},\d+)/);
    return m ? { lat: Number(m[1].replace(',', '.')), lng: Number(m[2].replace(',', '.')) } : null;
  }
  // bağlantının içinde açık koordinat varsa sunucuya gitmeden al (sunucudaki kuralın aynısı)
  function impFromUrl(u) {
    const s = decodeURIComponent(String(u || ''));
    let m = s.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/); if (m) return { lat: +m[1], lng: +m[2], how: 'place' };
    m = s.match(/[?&](?:coordinate|q|ll|daddr)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/); if (m) return { lat: +m[1], lng: +m[2], how: 'coordinate' };
    return null;
  }
  function impDate(v) {
    if (v instanceof Date && !isNaN(v)) return v;
    const s = String(v || '').trim(); if (!s) return null;
    let m = s.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
    if (m) {
      // 9/4/2026 (Google Forms, ABD) ↔ 04.09.2026 (Türkiye): nokta ise gün.ay, eğik çizgi ise ay/gün
      const dot = s.includes('.'), d = Number(dot ? m[1] : m[2]), mo = Number(dot ? m[2] : m[1]);
      return new Date(Number(m[3]), mo - 1, d, Number(m[4] || 12), Number(m[5] || 0));
    }
    const t = new Date(s); return isNaN(t) ? null : t;
  }
  function impVeg(v) {
    const n = norm(v);
    if (/dusuk|az|seyrek/.test(n)) return 'low';
    if (/orta/.test(n)) return 'mid';
    if (/yogun|yuksek|sik/.test(n)) return 'high';
    return null;
  }
  // "Riskli unsurlar" metinlerini sitedeki kutucuklarla eşleştir; eşleşmeyenler nota eklenir
  function impChecks(v, cat) {
    const parts = String(v || '').split(/[,;\n]+/).map((x) => x.trim()).filter(Boolean);
    const all = [cat].concat(Object.keys(CHECKS).filter((c) => c !== cat));
    const keys = [], extra = [];
    parts.forEach((p) => {
      const np = norm(p).replace(/\s+/g, ' ').trim(); let hit = null;
      for (const c of all) {
        for (const [k, label] of Object.entries(CHECKS[c])) {
          const nl = norm(label).replace(/\s+/g, ' ').trim();
          const words = nl.split(' ').filter((w) => w.length > 3), same = words.filter((w) => np.includes(w.slice(0, Math.max(4, w.length - 2)))).length;
          if (np === nl || np.includes(nl) || nl.includes(np) || (words.length && same / words.length >= 0.67)) { hit = k; break; }
        }
        if (hit) break;
      }
      if (hit) { if (!keys.includes(hit)) keys.push(hit); } else extra.push(p);
    });
    return { keys, extra };
  }
  const impHash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); };
  const impCell = (row, f) => (imp.map[f] != null && imp.map[f] !== '' ? row[imp.map[f]] : '');

  async function readImportFile(file) {
    imp.file = file.name;
    if (/\.(geo)?json$/i.test(file.name)) {
      const j = JSON.parse(await file.text());
      const feats = (j.features || (Array.isArray(j) ? j : [])).filter((f) => f && (f.geometry || f.lat));
      const keys = Array.from(new Set(feats.flatMap((f) => Object.keys(f.properties || f))));
      imp.head = ['lat', 'lng'].concat(keys.filter((k) => !/^(lat|lng|lon)$/i.test(k)));
      imp.data = feats.map((f) => {
        const p = f.properties || f, c = f.geometry && f.geometry.type === 'Point' ? f.geometry.coordinates : [p.lng || p.lon, p.lat];
        return [c[1], c[0]].concat(imp.head.slice(2).map((k) => p[k]));
      });
    } else {
      await loadXlsxLib();
      const wb = window.XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true });
      const arr = window.XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: true, defval: '' });
      imp.head = (arr[0] || []).map((h) => String(h).trim());
      imp.data = arr.slice(1).filter((r) => r.some((v) => String(v).trim()));
    }
    // sütunları otomatik eşle: her alan için en iyi eşleşen ve dolu olan sütun
    imp.map = {};
    const used = new Set();
    IMP_FIELDS.forEach(([f, , res]) => {
      for (const re of res) {
        const i = imp.head.findIndex((h, k) => !used.has(k) && re.test(h) && imp.data.some((r) => String(r[k] ?? '').trim()));
        if (i >= 0) { imp.map[f] = i; used.add(i); break; }
      }
    });
    if (/orman.?yerle/i.test(file.name + ' ' + imp.head.join(' '))) { imp.cat = 'fire'; imp.sub = 'interface'; }
    imp.rows = [];
  }

  async function prepareImport() {
    if (imp.busy) return;
    imp.busy = true; renderImport();
    const prog = (t) => { const e = $('#imp-prog'); if (e) e.textContent = t; };
    try {
      imp.rows = imp.data.map((src, i) => {
        const observer = String(impCell(src, 'observer') || '').trim();
        const date = impDate(impCell(src, 'date'));
        const ck = impChecks(impCell(src, 'risks'), imp.cat);
        const notes = [String(impCell(src, 'notes') || '').trim(), ck.extra.length ? 'Diğer gözlemler: ' + ck.extra.join(', ') : ''].filter(Boolean).join('\n');
        const r = { line: i + 2, src, observer, date, notes, checks: ck.keys, veg: impVeg(impCell(src, 'veg')),
          acc: Math.min(5, Math.max(1, Number(impCell(src, 'access')) || 3)), photo: String(impCell(src, 'photo') || '').trim(),
          address: String(impCell(src, 'address') || '').trim(), lat: null, lng: null, how: '', state: 'wait', err: '', place: null };
        const la = impNum(impCell(src, 'lat')), lo = impNum(impCell(src, 'lng')), pair = impPair(impCell(src, 'coord'));
        const link = String(impCell(src, 'link') || '').trim();
        if (la != null && lo != null && la && lo) Object.assign(r, { lat: la, lng: lo, how: 'dosya' });
        else if (pair) Object.assign(r, pair, { how: 'dosya' });
        else if (link) { const u = impFromUrl(link); if (u) Object.assign(r, u); else r.link = link; }
        if (r.lat == null && !r.link) { r.state = 'err'; r.err = 'Konum yok: koordinatı yaz ya da haritada seç'; }
        return r;
      });
      // kısa bağlantılar: sunucuda çöz
      const need = imp.rows.filter((r) => r.link);
      for (let k = 0; k < need.length; k += 20) {
        prog('Harita bağlantıları çözülüyor… ' + Math.min(k + 20, need.length) + '/' + need.length);
        const part = need.slice(k, k + 20);
        const { data, error } = await sb.functions.invoke('resolve-maps', { body: { urls: part.map((r) => r.link) } });
        if (error || !data || !data.results) throw new Error('Bağlantılar çözülemedi: ' + ((data && data.error) || (error && error.message) || 'bilinmeyen hata'));
        part.forEach((r, j) => {
          const x = data.results[j] || {};
          if (x.error) { r.state = 'err'; r.err = x.error; }
          else { Object.assign(r, { lat: x.lat, lng: x.lng, how: x.how }); if (x.approx) r.warn = 'Bağlantı yalnızca harita merkezini veriyor; noktayı haritada kontrol et.'; if (!r.address && x.address) r.address = x.address; }
        });
      }
      // ilçe / mahalle (OpenStreetMap kuralı: saniyede en fazla 1 istek)
      const withPos = imp.rows.filter((r) => r.lat != null);
      for (let k = 0; k < withPos.length; k++) {
        prog('İlçe ve mahalle bulunuyor… ' + (k + 1) + '/' + withPos.length);
        await impLocate(withPos[k], false);
        if (k < withPos.length - 1) await new Promise((ok) => setTimeout(ok, 1100));
      }
      // daha önce eklenmiş mi?
      imp.rows.forEach((r) => { r.ref = 'import:' + impHash([imp.file.replace(/\.[^.]+$/, ''), r.line, r.observer, r.date ? r.date.toISOString() : '', r.notes].join('|')); });
      const refs = imp.rows.map((r) => r.ref);
      const { data: ex } = await sb.from('reports').select('source_ref').in('source_ref', refs);
      const have = new Set((ex || []).map((x) => x.source_ref));
      imp.rows.forEach((r) => { if (have.has(r.ref)) { r.state = 'dup'; r.err = 'Bu satır daha önce eklenmiş'; } });
    } catch (e) { toast(e.message || String(e)); }
    imp.busy = false; renderImport();
  }
  async function impLocate(r, redraw) {
    if (!Number.isFinite(r.lat) || !Number.isFinite(r.lng)) { r.state = 'err'; r.err = 'Koordinat okunamadı'; return; }
    if (!inIzmir(r.lat, r.lng)) { r.state = 'err'; r.err = 'Nokta İzmir sınırlarının dışında'; r.place = null; if (redraw) renderImport(); return; }
    r.place = await lookupPlace(r.lat, r.lng);
    r.state = 'ok'; r.err = r.place.ok ? '' : 'Mahalle bulunamadı (internet?)';
    if (redraw) renderImport();
  }
  function impScore(r) {
    return scoreOf({ cat: imp.cat, sub: imp.sub, veg: r.veg, acc: String(r.acc), checks: r.checks }).score;
  }

  async function commitImport() {
    const ok = imp.rows.filter((r) => r.state === 'ok');
    if (!ok.length) return toast('Eklenecek hazır satır yok.');
    if (!confirm(ok.length + ' gözlem haritaya eklensin mi? Gözlemci adları maskeli görünecek.')) return;
    imp.busy = true; renderImport();
    // satır satır değil, 50'lik toplu ekleme (N+1 yok); bir parti hata verirse yalnız o partideki satırlar tek tek denenir
    let n = 0;
    const rowOf = (r) => {
      const pl = r.place || {};
      const adminNote = 'İçe aktarıldı: ' + imp.file + ', satır ' + r.line + (r.photo ? '\nÖzgün fotoğraf: ' + r.photo : '');
      return {
        observer_name: r.observer || 'Saha ekibi',
        observed_at: (r.date || new Date()).toISOString(),
        lat: r.lat, lng: r.lng, district: pl.district || null, neighborhood: pl.hood || null,
        address: r.address || pl.road || null,
        status: 'approved', photo_paths: [], photo_path: null,
        category: imp.cat, subcategory: imp.sub, categories: derivedCats({ cat: imp.cat, checks: r.checks }),
        vegetation: r.veg, access_score: r.acc, risks: r.checks, risk_score: impScore(r),
        notes: r.notes || null, admin_note: adminNote, source: 'import', source_ref: r.ref,
      };
    };
    for (let k = 0; k < ok.length; k += 50) {
      const part = ok.slice(k, k + 50);
      const { error } = await sb.from('reports').insert(part.map(rowOf));
      if (!error) { part.forEach((r) => { r.state = 'done'; }); n += part.length; }
      else {
        for (const r of part) {
          const { error: e1 } = await sb.from('reports').insert(rowOf(r));
          if (e1) { r.state = 'err'; r.err = e1.message; } else { r.state = 'done'; n++; }
        }
      }
      const e = $('#imp-prog'); if (e) e.textContent = 'Ekleniyor… ' + n + '/' + ok.length;
    }
    imp.busy = false;
    logEvent('import', imp.file + ' · ' + n + ' gözlem eklendi');
    toast(n + ' gözlem haritaya eklendi.' + (n < ok.length ? ' ' + (ok.length - n) + ' satır eklenemedi.' : ''));
    renderImport();
    loadApproved();
  }

  function renderImport() {
    const body = $('#admin-body');
    const cnt = (st) => imp.rows.filter((r) => r.state === st).length;
    const fieldOpts = (f) => '<option value="">—</option>' + imp.head.map((h, i) => '<option value="' + i + '"' + (imp.map[f] === i ? ' selected' : '') + '>' + esc(h || (i + 1) + '. sütun') + '</option>').join('');
    const catOpts = Object.entries(CATS).map(([k, c]) => '<option value="' + k + '"' + (k === imp.cat ? ' selected' : '') + '>' + esc(c.short) + '</option>').join('');
    const subOpts = Object.entries(SUBS[imp.cat] || {}).map(([k, v]) => '<option value="' + k + '"' + (k === imp.sub ? ' selected' : '') + '>' + esc(v[0]) + '</option>').join('');
    body.innerHTML =
      '<section class="imp">' +
      '<header class="imp-head"><h2>Veri içe aktar</h2><p class="muted">Proje öncesinde toplanan saha gözlemlerini haritaya ekle. Excel (.xlsx), CSV ya da GeoJSON yükle; konum dosyadaki koordinattan ya da Google / Apple Haritalar bağlantısının işaret ettiği noktadan alınır. Gözlemci adları herkese maskeli görünür, kullanıcı adı yerine “Yönetici tarafından eklendi” yazar. Bu kayıtlar puan ve lider tablosuna sayılmaz.</p></header>' +
      '<div class="imp-step"><b>1</b><div><label class="btn ghost imp-file"><input type="file" id="imp-file" accept=".xlsx,.xls,.csv,.json,.geojson" hidden>' + (imp.file ? 'Başka dosya seç' : 'Dosya seç') + '</label>' +
        (imp.file ? '<span class="imp-fname">' + esc(imp.file) + ' · ' + imp.data.length + ' satır, ' + imp.head.length + ' sütun</span>' : '<span class="muted small">Google Forms yanıtlarını “Yanıtlar → E-Tablolar → Dosya → İndir → Excel” ile alabilirsin.</span>') + '</div></div>' +
      (imp.file ? '<div class="imp-step"><b>2</b><div><p class="imp-sub">Sütunları kontrol et</p><div class="imp-map">' +
        IMP_FIELDS.map(([f, label]) => '<label><span>' + esc(label) + '</span><select data-impf="' + f + '">' + fieldOpts(f) + '</select></label>').join('') +
        '<label><span>Ana başlık</span><select id="imp-cat">' + catOpts + '</select></label>' +
        '<label><span>Alt başlık</span><select id="imp-sub">' + subOpts + '</select></label>' +
        '</div><button type="button" class="btn green" id="imp-prepare"' + (imp.busy ? ' disabled' : '') + '>' + (imp.rows.length ? 'Yeniden hazırla' : 'Konumları bul ve önizle') + '</button> <span class="muted small" id="imp-prog">' + (imp.busy ? 'Çalışıyor…' : '') + '</span></div></div>' : '') +
      (imp.rows.length ? '<div class="imp-step"><b>3</b><div><p class="imp-sub">Önizle ve ekle</p>' +
        '<p class="imp-sum"><span class="ok">' + cnt('ok') + ' hazır</span><span class="err">' + cnt('err') + ' sorunlu</span><span class="dup">' + cnt('dup') + ' zaten ekli</span><span class="done">' + cnt('done') + ' eklendi</span></p>' +
        '<div id="imp-map" class="imp-pmap"></div>' +
        '<p class="muted small">Koordinatı düzeltmek için hücreye “enlem, boylam” yaz ya da “Haritada seç”e basıp önizleme haritasına dokun. Her satırın ilçe ve mahallesi o noktadan yeniden bulunur.</p>' +
        '<div class="table-wrap"><table class="imp-table"><thead><tr><th>#</th><th>Durum</th><th>Konum</th><th>İlçe / mahalle</th><th>Gözlem</th><th class="num">Risk</th></tr></thead><tbody>' +
        imp.rows.map((r, i) => '<tr class="st-' + r.state + '" data-impr="' + i + '">' +
          '<td>' + r.line + '</td>' +
          '<td><span class="imp-st">' + ({ ok: 'Hazır', err: 'Sorun', dup: 'Zaten ekli', done: 'Eklendi', wait: 'Bekliyor' }[r.state]) + '</span>' + (r.err ? '<small>' + esc(r.err) + '</small>' : '') + (r.warn ? '<small class="warn">' + esc(r.warn) + '</small>' : '') + '</td>' +
          '<td><input class="imp-ll" value="' + (r.lat != null ? r.lat.toFixed(6) + ', ' + r.lng.toFixed(6) : '') + '" placeholder="38.3096, 27.1710"' + (r.state === 'done' ? ' disabled' : '') + '>' +
            (r.state !== 'done' ? '<button type="button" class="linkish small" data-imppick="' + i + '">' + (imp.picking === i ? 'Haritaya dokun…' : 'Haritada seç') + '</button>' : '') +
            (r.how ? '<small class="muted">' + esc({ place: 'Google yer işareti', coordinate: 'Harita bağlantısı', dosya: 'Dosyadaki koordinat', center: 'Harita merkezi (yaklaşık)', haritadan: 'Haritadan seçildi', 'elle': 'Elle girildi' }[r.how] || r.how) + '</small>' : '') + '</td>' +
          '<td>' + (r.place ? '<b>' + esc(r.place.district || '—') + '</b><small>' + esc(r.place.hood || 'mahalle bulunamadı') + '</small>' : '<span class="muted">—</span>') + '</td>' +
          '<td><small>' + esc(r.date ? fmtDate(r.date.toISOString()) : 'tarih yok') + ' · ' + esc(r.observer ? r.observer.replace(/(\S)\S*/g, '$1***') : 'Saha ekibi') + '</small><span class="imp-note">' + esc((r.notes || '').slice(0, 90)) + '</span></td>' +
          '<td class="num">' + impScore(r) + '</td></tr>').join('') +
        '</tbody></table></div>' +
        '<div class="imp-actions"><button type="button" class="btn fire big" id="imp-commit"' + (imp.busy || !cnt('ok') ? ' disabled' : '') + '>' + cnt('ok') + ' gözlemi haritaya ekle</button>' +
        '<span class="muted small">Eklenen kayıtlar “Yayında” sekmesinde; fotoğrafları “Fotoğrafları düzenle” ile ekleyebilirsin (özgün Drive bağlantısı yönetici notunda).</span></div>' +
        '</div></div>' : '') +
      '</section>';

    $('#imp-file').addEventListener('change', async (e) => {
      const f = e.target.files[0]; if (!f) return;
      try { await readImportFile(f); } catch (err) { toast('Dosya okunamadı: ' + err.message); }
      renderImport();
    });
    $$('[data-impf]').forEach((sel) => sel.addEventListener('change', () => { imp.map[sel.dataset.impf] = sel.value === '' ? '' : Number(sel.value); }));
    if ($('#imp-cat')) $('#imp-cat').addEventListener('change', (e) => { imp.cat = e.target.value; imp.sub = Object.keys(SUBS[imp.cat])[0]; renderImport(); });
    if ($('#imp-sub')) $('#imp-sub').addEventListener('change', (e) => { imp.sub = e.target.value; renderImport(); });
    if ($('#imp-prepare')) $('#imp-prepare').addEventListener('click', prepareImport);
    if ($('#imp-commit')) $('#imp-commit').addEventListener('click', commitImport);
    $$('.imp-ll').forEach((inp) => inp.addEventListener('change', async () => {
      const r = imp.rows[Number(inp.closest('[data-impr]').dataset.impr)];
      const p = impPair(inp.value) || (() => { const a = inp.value.split(/[,;]\s*/); const la = impNum(a[0]), lo = impNum(a[1]); return la != null && lo != null ? { lat: la, lng: lo } : null; })();
      if (!p) return toast('Koordinatı “38.3096, 27.1710” biçiminde yaz.');
      Object.assign(r, p, { how: 'elle', warn: '' }); r.state = 'wait'; await impLocate(r, true);
    }));
    $$('[data-imppick]').forEach((b) => b.addEventListener('click', () => {
      imp.picking = imp.picking === Number(b.dataset.imppick) ? -1 : Number(b.dataset.imppick);
      renderImport();
      if (imp.picking >= 0) { toast('Önizleme haritasında doğru noktaya dokun.'); $('#imp-map').scrollIntoView({ behavior: calm() ? 'auto' : 'smooth', block: 'center' }); }
    }));
    $$('.imp-table tbody tr').forEach((tr) => tr.addEventListener('click', (e) => {
      if (e.target.closest('input,button')) return;
      const r = imp.rows[Number(tr.dataset.impr)]; if (r && r.lat != null && imp.pmap) imp.pmap.flyTo([r.lat, r.lng], 17, { duration: calm() ? 0 : 0.8 });
    }));

    // önizleme haritası
    if ($('#imp-map')) {
      if (imp.pmap) { imp.pmap.remove(); imp.pmap = null; }
      imp.pmap = makeMap('imp-map');
      const pts = [];
      imp.rows.forEach((r, i) => {
        if (r.lat == null) return;
        pts.push([r.lat, r.lng]);
        L.marker([r.lat, r.lng], { icon: L.divIcon({ className: 'imp-pin st-' + r.state, html: '<span>' + r.line + '</span>', iconSize: [28, 28] }) })
          .bindTooltip('Satır ' + r.line + (r.place ? ' · ' + [r.place.district, r.place.hood].filter(Boolean).join(' / ') : ''), { direction: 'top', offset: [0, -12] })
          .addTo(imp.pmap);
        void i;
      });
      if (pts.length) imp.pmap.fitBounds(pts, { padding: [40, 40], maxZoom: 16 });
      imp.pmap.on('click', async (e) => {
        if (imp.picking < 0) return;
        const r = imp.rows[imp.picking]; imp.picking = -1;
        Object.assign(r, { lat: e.latlng.lat, lng: e.latlng.lng, how: 'haritadan', warn: '' }); r.state = 'wait';
        await impLocate(r, true);
      });
      $('#imp-map').classList.toggle('picking', imp.picking >= 0);
    }
  }


  /* =================== YÖNETİCİ: FOTOĞRAF DÜZENLEME =================== */
  // Kapak yap, 90° döndür, sil, yeni fotoğraf ekle. Değişiklikler "Kaydet"e basınca uygulanır.
  const MAX_EDIT_PHOTOS = 6;
  const findReport = (id) => approved.find((x) => x.id === id) || (typeof adminReports !== 'undefined' && adminReports.find((x) => x.id === id)) ||
    (typeof mineReports !== 'undefined' && mineReports.find((x) => x.id === id)) || null;
  async function rotateBlob(src, quarterTurns) {
    const res = await fetch(src, { cache: 'no-store' });
    if (!res.ok) throw new Error('Fotoğraf indirilemedi');
    const bmp = await createImageBitmap(await res.blob());
    const t = ((quarterTurns % 4) + 4) % 4, side = t % 2 === 1;
    const c = document.createElement('canvas');
    c.width = side ? bmp.height : bmp.width; c.height = side ? bmp.width : bmp.height;
    const g = c.getContext('2d');
    g.translate(c.width / 2, c.height / 2); g.rotate(t * Math.PI / 2); g.drawImage(bmp, -bmp.width / 2, -bmp.height / 2);
    return new Promise((ok, bad) => c.toBlob((b) => (b ? ok(b) : bad(new Error('Döndürülemedi'))), 'image/jpeg', 0.88));
  }
  function openPhotoEditor(id) {
    const r = findReport(id);
    if (!r) return toast('Bildirim bulunamadı, sayfayı yenile.');
    if (!(profile && profile.is_admin)) return toast('Bu işlem yalnızca yöneticiler içindir.');
    let items = photosOf(r).map((path) => ({ path, url: photoUrl(path), rot: 0, file: null }));
    const removed = [];
    const draw = () => {
      $('#pe-grid').innerHTML = items.map((it, i) =>
        '<figure class="pe-item' + (i === 0 ? ' cover' : '') + '" data-i="' + i + '">' +
          '<div class="pe-img"><img alt="" src="' + esc(it.url) + '" data-css="transform:rotate(' + it.rot * 90 + 'deg)">' + (i === 0 ? '<span class="pe-badge">Kapak</span>' : '') + (it.file ? '<span class="pe-badge new">Yeni</span>' : '') + '</div>' +
          '<figcaption>' +
            (i ? '<button type="button" data-pe="cover">Kapak yap</button>' : '') +
            '<button type="button" data-pe="rot" aria-label="90 derece döndür">Döndür</button>' +
            '<button type="button" data-pe="del" class="bad">Sil</button>' +
          '</figcaption></figure>').join('') ||
        '<p class="empty">Bu bildirimde fotoğraf kalmadı. Haritada fotoğrafsız görünecek.</p>';
      $('#pe-add').disabled = items.length >= MAX_EDIT_PHOTOS;
      $('#pe-count').textContent = items.length + ' / ' + MAX_EDIT_PHOTOS + ' fotoğraf';
    };
    openModal('Fotoğrafları düzenle',
      '<form class="stack" id="pe-form"><p class="muted small">' + esc(subLabel(r)) + ' · ' + esc(placeOf(r)) + '. İlk fotoğraf haritada kapak olarak görünür.</p>' +
      '<div class="pe-grid" id="pe-grid"></div>' +
      '<div class="row-between"><span class="muted small" id="pe-count"></span>' +
      '<label class="btn ghost sm pe-addlbl"><input type="file" id="pe-add" accept="image/*" multiple hidden>Fotoğraf ekle</label></div>' +
      '<p class="msg" id="pe-msg" hidden></p>' +
      '<button class="btn green big" type="submit" id="pe-save">Değişiklikleri kaydet</button></form>',
      async () => {
        const btn = $('#pe-save'); btn.disabled = true; btn.textContent = 'Kaydediliyor…';
        try {
          const owner = r.user_id || 'yonetici', final = [], stamp = Date.now();
          for (let i = 0; i < items.length; i++) {
            const it = items[i];
            if (!it.file && !it.rot) { final.push(it.path); continue; }
            let blob;
            if (it.file) { const c = await compress(it.file); blob = it.rot ? await rotateBlob(URL.createObjectURL(c.blob), it.rot) : c.blob; }
            else { blob = await rotateBlob(it.url, it.rot); removed.push(it.path); }
            const path = owner + '/' + stamp + '-' + i + '-yonetici.jpg';
            const { error } = await sb.storage.from('report-photos').upload(path, blob, { contentType: 'image/jpeg', upsert: false });
            if (error) throw new Error('Yükleme başarısız: ' + error.message);
            final.push(path);
          }
          const { error } = await sb.from('reports').update({ photo_paths: final, photo_path: final[0] || null }).eq('id', r.id);
          if (error) throw new Error(error.message);
          if (removed.length) await sb.storage.from('report-photos').remove(withThumbs(removed));
          logEvent('photo_edit', subLabel(r) + ' · ' + final.length + ' fotoğraf' + (removed.length ? ' · ' + removed.length + ' kaldırıldı' : ''));
          [approved, typeof adminReports !== 'undefined' ? adminReports : [], typeof mineReports !== 'undefined' ? mineReports : []].forEach((list) => {
            const x = list.find((y) => y.id === r.id); if (x) { x.photo_paths = final; x.photo_path = final[0] || null; }
          });
          closeModal(); toast('Fotoğraflar güncellendi.');
          if (markerById[r.id]) markerById[r.id].setPopupContent(popupHtml(findReport(r.id) || r));
          if (openRid === r.id) $('#rv-body').innerHTML = reportViewHtml(findReport(r.id) || r);
          renderList();
          if (document.documentElement.dataset.route === 'yonetici') loadAdmin();
        } catch (err) {
          btn.disabled = false; btn.textContent = 'Değişiklikleri kaydet';
          setMsg('#pe-msg', err.message || String(err));
        }
      });
    draw();
    $('#pe-grid').addEventListener('click', (e) => {
      const b = e.target.closest('[data-pe]'); if (!b) return;
      const i = Number(b.closest('[data-i]').dataset.i), it = items[i];
      if (b.dataset.pe === 'cover') { items.splice(i, 1); items.unshift(it); }
      else if (b.dataset.pe === 'rot') it.rot = (it.rot + 1) % 4;
      else if (b.dataset.pe === 'del') { items.splice(i, 1); if (!it.file) removed.push(it.path); }
      draw();
    });
    $('#pe-add').addEventListener('change', (e) => {
      const files = Array.from(e.target.files || []).filter((f) => /^image\//.test(f.type));
      files.slice(0, MAX_EDIT_PHOTOS - items.length).forEach((f) => items.push({ path: null, url: URL.createObjectURL(f), rot: 0, file: f }));
      if (files.length > MAX_EDIT_PHOTOS - items.length) toast('En fazla ' + MAX_EDIT_PHOTOS + ' fotoğraf olabilir.');
      e.target.value = ''; draw();
    });
  }

  /* =================== BİLDİRİM KARTI =================== */
  function reportCard(r, isAdmin, isOwner) {
    const acts = [];
    if (isOwner) acts.push('<button class="btn danger sm" data-act="delete" data-id="' + esc(r.id) + '">Sil</button>');
    if (isAdmin) {
      if (r.category === 'urgent' && !r.resolved_at) acts.push('<button class="btn green sm" data-act="resolve" data-id="' + esc(r.id) + '">✅ Çözüldü</button>');
      if (r.status !== 'approved') acts.push('<button class="btn green sm" data-act="approved" data-id="' + esc(r.id) + '">Yayına al</button>');
      if (r.status !== 'rejected') acts.push('<button class="btn ghost sm" data-act="rejected" data-id="' + esc(r.id) + '">Yayından kaldır</button>');
      acts.push('<button class="btn ghost sm" type="button" data-photos="' + esc(r.id) + '">Fotoğrafları düzenle</button>');
      acts.push('<a class="btn ghost sm" target="_blank" rel="noopener" href="https://www.google.com/maps?q=' + r.lat + ',' + r.lng + '">Konum</a>');
      acts.push('<button class="btn danger sm" data-act="delete" data-id="' + esc(r.id) + '">Sil</button>');
    }
    const risks = (r.risks || []).map(checkLabel);
    return '<article class="rcard">' + shotsHtml(r) + '<div class="body">' +
      '<div class="tags">' + catBadge(r) + scoreTag(r) + '<span class="tag ' + r.status + '">' + STATUS[r.status] + '</span></div>' +
      '<b>' + esc(subLabel(r)) + '</b>' +
      '<span class="muted small">' + esc(placeOf(r)) + ' · ' + esc(fmtDate(r.observed_at)) + ' · ' +
        esc(observerOf(r)) + (r.source === 'import' ? ' · Yönetici tarafından eklendi' : isAdmin && r.username ? ' (@' + esc(r.username) + ')' : '') + '</span>' +
      '<span class="small">' + esc(detailLines(r)) + '</span>' +
      (r.address ? '<span class="small muted">' + esc(r.address) + '</span>' : '') +
      (risks.length ? '<span class="small muted">Ek unsurlar: ' + esc(risks.join(', ')) + '</span>' : '') +
      (r.notes ? '<span class="small muted">“' + esc(r.notes) + '”</span>' : '') +
      (r.flag_reason ? (r.status === 'pending'
        ? '<span class="msg small" data-css="padding:8px 10px"><b>Onay bekliyor:</b> ' + esc(r.flag_reason) + '</span>'
        : (isAdmin ? '<span class="msg info small" data-css="padding:8px 10px"><b>📝 Otomatik not:</b> ' + esc(r.flag_reason) + '</span>' : '')) : '') +
      (r.admin_note ? '<span class="small"><b>Yönetici notu:</b> ' + esc(r.admin_note) + '</span>' : '') +
      (isAdmin ? '<textarea data-note="' + esc(r.id) + '" rows="1" placeholder="Yönetici notu ekle, çıkınca kaydedilir">' + esc(r.admin_note || '') + '</textarea>' : '') +
      (acts.length ? '<div class="actions">' + acts.join('') + '</div>' : '') +
      '</div></article>';
  }

  // Bildirimlerim: kompakt satırlar; dokununca ayrıntı ekranı (silme orada)
  let mineReports = [];
  function mineRow(r) {
    const ps = photosOf(r), n = r.risk_score || 0, c = CATS[catOf(r)] || {};
    const st = r.resolved_at ? ['resolved', 'Çözüldü'] : [r.status, STATUS[r.status] || r.status];
    const v = votes[r.id];
    return '<button type="button" class="mrow-card" data-mine="' + esc(r.id) + '" data-css="--c:' + (c.color || 'var(--accent)') + '">' +
      (ps.length ? '<img alt="" loading="lazy" decoding="async" src="' + esc(thumbUrl(ps[0])) + '">' : '<span class="mrow-ph" aria-hidden="true">' + (c.ico || '') + '</span>') +
      '<span class="mrow-body"><span class="mrow-top"><b>' + esc(subLabel(r)) + '</b><i class="st ' + esc(st[0]) + '">' + esc(st[1]) + '</i></span>' +
      '<small>' + esc(placeOf(r)) + ' · ' + esc(timeAgo(r.created_at)) + '</small>' +
      '<span class="mrow-meter ' + level(n) + '"><span class="mbar"><i data-css="width:' + Math.max(4, n) + '%"></i></span><em>Risk ' + n + '</em>' +
        (v && (v.fixed || v.still) ? '<em>' + v.fixed + ' düzelmiş · ' + v.still + ' hâlâ var</em>' : '') + '</span>' +
      (r.status === 'pending' && r.flag_reason ? '<small class="mrow-note">İncelemede: ' + esc(r.flag_reason) + '</small>' : '') +
      '</span><span class="mrow-chev" aria-hidden="true">›</span></button>';
  }
  async function loadMine() {
    const box = $('#mine-list');
    box.innerHTML = skeleton(3);
    const { data, error } = await withBusy(sb.from('reports').select(REPORT_COLS).eq('user_id', session.user.id).order('created_at', { ascending: false }));
    if (error) { box.innerHTML = '<p class="msg">' + esc(error.message) + '</p>'; return; }
    mineReports = data || [];
    if (!Object.keys(votes).length) await loadVotes();
    const unread = myInbox().filter((n) => !readSet.has(n.id)).length;
    const pts = myTags ? myTags.points || 0 : 0;
    $('#mine-stats').innerHTML =
      '<div><b data-c="' + data.length + '">0</b><span>bildirim</span></div>' +
      '<div><b data-c="' + data.filter((r) => r.status === 'approved').length + '">0</b><span>yayında</span></div>' +
      '<div><b data-c="' + data.filter((r) => r.status === 'pending').length + '">0</b><span>incelemede</span></div>' +
      '<div><b data-c="' + pts + '">0</b><span>puan</span></div>';
    $$('#mine-stats [data-c]').forEach((b) => countTo(b, Number(b.dataset.c), 900));
    $('#mt-reports').textContent = data.length;
    $('#mt-inbox').textContent = unread; show($('#mt-inbox'), unread > 0);
    box.innerHTML = data.length ? data.map(mineRow).join('')
      : '<div class="empty-cta"><b>Henüz bildirim göndermedin.</b><span>Çevrende kuru ot birikimi, patlak boru ya da yol çukuru gördüğünde fotoğrafla ve haritaya ekle.</span><a class="btn fire" href="#/bildir">İlk bildirimini yap</a></div>';
    setMineTab(mineTab);
  }

  /* =================== YÖNETİCİ =================== */
  async function loadAdmin() {
    $('#admin-body').innerHTML = skeleton(4);
    const [rs, ps, bs] = await withBusy(Promise.all([
      sb.from('reports').select(REPORT_COLS).order('created_at', { ascending: false }),
      sb.from('profiles').select('*').order('created_at', { ascending: false }),
      sb.from('bans').select('*'),
      loadAdminSent(),
    ]));
    if (rs.error || ps.error) { $('#admin-body').innerHTML = '<p class="msg">' + esc((rs.error || ps.error).message) + '</p>'; return; }
    adminReports = rs.data; adminUsers = ps.data; adminBans = bs.data || [];
    await Promise.all([loadRealNames(), loadVotes()]);
    renderAdmin();
  }

  // Bildirim istatistikleri (Genel bakış sekmesinde)
  function renderAdminReportStats() {
    const R = adminReports;
    if (!$('#stats')) return;
    const cnt = (s) => R.filter((r) => r.status === s).length;
    const avg = R.length ? Math.round(R.reduce((a, r) => a + (r.risk_score || 0), 0) / R.length) : 0;
    const week = R.filter((r) => Date.now() - new Date(r.created_at) < 7 * 864e5).length;

    $('#stats').innerHTML =
      '<div class="stat"><span>Toplam bildirim</span><b>' + R.length + '</b></div>' +
      '<div class="stat"><span>İncelenecek</span><b data-css="color:var(--fire)">' + cnt('pending') + '</b></div>' +
      '<div class="stat"><span>Yayında</span><b>' + cnt('approved') + '</b></div>' +
      '<div class="stat"><span>Son 7 gün</span><b>' + week + '</b></div>' +
      '<div class="stat"><span>Ortalama risk puanı</span><b data-css="color:var(--' + (level(avg) === 'high' ? 'hi' : level(avg) === 'mid' ? 'mid' : 'lo') + ')">' + avg + '</b></div>' +
      '<div class="stat"><span>Yüksek riskli (67+)</span><b data-css="color:var(--hi)">' + R.filter((r) => (r.risk_score || 0) >= 67).length + '</b></div>' +
      '<div class="stat"><span>Kayıtlı kullanıcı</span><b>' + adminUsers.length + '</b></div>';

    // kategori dağılımı
    $('#cat-bar').innerHTML = Object.entries(CATS).map(([k, c]) => {
      const inCat = R.filter((r) => ((r.categories && r.categories.length) ? r.categories : [catOf(r)]).includes(k));
      const pend = inCat.filter((r) => r.status === 'pending').length;
      const hi = inCat.filter((r) => (r.risk_score || 0) >= 67).length;
      return '<div class="stat" data-css="--c:' + c.color + '"><span>' + esc(c.label) + '</span><b>' + inCat.length + '</b>' +
        '<span class="small">' + pend + ' incelenecek · ' + hi + ' yüksek riskli</span></div>';
    }).join('');

    const byDistrict = {};
    R.forEach((r) => { const k = r.district || '—'; byDistrict[k] = (byDistrict[k] || 0) + 1; });
    const top = Object.entries(byDistrict).sort((a, b) => b[1] - a[1]).slice(0, 6);
    $('#dist-bar').innerHTML = top.length
      ? top.map(([k, v]) => '<span class="badge">' + esc(k) + ' · ' + v + '</span>').join('')
      : '<span class="muted small">Henüz bildirim yok.</span>';

  }

  // Oylarda "düzelmiş" çıkan bildirimler: yönetici karar verir
  const fixCandidates = () => adminReports.filter((r) => r.status === 'approved' && !r.resolved_at && (r.fix_flagged_at || (votes[r.id] && votes[r.id].fixed > 0)))
    .sort((a, b) => (b.fix_flagged_at ? 1 : 0) - (a.fix_flagged_at ? 1 : 0) || ((votes[b.id] || {}).fixed || 0) - ((votes[a.id] || {}).fixed || 0));
  function renderFixCheck() {
    const list = fixCandidates();
    $('#admin-body').innerHTML = '<p class="muted small">Haritayı kullananlar “Sorun çözüldü mü?” sorusuna oy veriyor. En az 3 oy ve %60’tan fazlası “düzelmiş” derse bildirim burada <b>🔧 öne çıkar</b> ve yöneticilere haber gider.</p>' +
      (list.length ? '<div class="cards">' + list.map((r) => {
        const v = votes[r.id] || { fixed: 0, still: 0 }, tot = v.fixed + v.still, pct = tot ? Math.round(v.fixed / tot * 100) : 0;
        return '<article class="rcard fixcard' + (r.fix_flagged_at ? ' flagged' : '') + '">' + shotsHtml(r) + '<div class="body">' +
          '<div class="tags">' + catBadge(r) + (r.fix_flagged_at ? '<span class="tag pending">🔧 Düzelmiş olabilir</span>' : '') + '</div>' +
          '<b>' + esc(subLabel(r)) + '</b><span class="small muted">' + esc(placeOf(r)) + ' · eklendi ' + esc(timeAgo(r.created_at)) + '</span>' +
          '<div class="fix-votes"><span>👍 Düzelmiş <b>' + v.fixed + '</b></span><span>👎 Hâlâ var <b>' + v.still + '</b></span><span class="muted">%' + pct + '</span></div>' +
          '<i class="vote-bar"><i data-css="width:' + pct + '%"></i></i>' +
          '<div class="actions">' +
            '<button class="btn green sm" data-act="resolve" data-id="' + esc(r.id) + '">✅ Çözüldü, haritadan kaldır</button>' +
            '<button class="btn ghost sm" data-resetvotes="' + esc(r.id) + '">👎 Hâlâ var, oyları sıfırla</button>' +
            '<button class="btn danger sm" data-act="rejected" data-id="' + esc(r.id) + '">Yayından kaldır</button>' +
            '<a class="btn ghost sm" target="_blank" rel="noopener" href="https://www.google.com/maps?q=' + r.lat + ',' + r.lng + '">Konum</a>' +
          '</div></div></article>';
      }).join('') + '</div>' : '<p class="empty">Şu an “düzelmiş” oyu alan bildirim yok. 👍</p>');
  }

  function renderAdmin() {
    const R = adminReports;
    const pend = R.filter((r) => r.status === 'pending').length;
    show($('#cnt-pending'), pend > 0); $('#cnt-pending').textContent = pend;
    const fx = R.filter((r) => r.fix_flagged_at && !r.resolved_at && r.status === 'approved').length;
    show($('#cnt-fix'), fx > 0); $('#cnt-fix').textContent = fx;
    $$('#admin-tabs [data-tab]').forEach((b) => b.classList.toggle('on', b.dataset.tab === admin.tab));
    const body = $('#admin-body');
    show($('#admin-filters'), ['pending', 'approved', 'rejected'].includes(admin.tab));

    if (admin.tab === 'logs') { body.innerHTML = skeleton(5); loadAdminLogs(); return; }
    if (admin.tab === 'bans') { renderBans(); return; }
    if (admin.tab === 'notify') { renderNotify(admin.notifyTo); admin.notifyTo = null; return; }
    if (admin.tab === 'overview') { renderOverview(); return; }
    if (admin.tab === 'fixcheck') { renderFixCheck(); return; }
    if (admin.tab === 'import') { renderImport(); return; }
    if (admin.tab === 'complaints') { renderComplaints(); return; }

    if (admin.tab === 'users') {
      if (!$('#users-table')) {
        body.innerHTML = '<div class="row-gap users-tools"><input id="u-search" type="search" placeholder="🔍 Kullanıcı adı, e-posta veya rozet ara…" value="' + esc(admin.uq || '') + '">' +
          '<select id="u-filter"><option value="all">Herkes</option><option value="admin">Yöneticiler</option><option value="banned">Kısıtlılar</option><option value="online">Çevrimiçi</option></select></div>' +
          '<div id="users-table"></div>';
        $('#u-filter').value = admin.uf || 'all';
      }
      const q = (admin.uq || '').toLocaleLowerCase('tr-TR'), uf = admin.uf || 'all';
      const users = adminUsers.filter((u) => {
        if (q && !((u.username + ' ' + (u.email || '') + ' ' + (u.special_tags || []).join(' ') + ' ' + (u.nametag || '')).toLocaleLowerCase('tr-TR').includes(q))) return false;
        if (uf === 'admin') return u.is_admin;
        if (uf === 'banned') return userBanned(u.id);
        if (uf === 'online') return u.last_seen && Date.now() - new Date(u.last_seen) < 10 * 60000;
        return true;
      });
      $('#users-table').innerHTML = '<p class="muted small">' + users.length + ' / ' + adminUsers.length + ' kullanıcı</p><div class="user-list">' +
        users.map((u) => {
          const n = adminReports.filter((r) => r.user_id === u.id).length;
          const online = u.last_seen && Date.now() - new Date(u.last_seen) < 10 * 60000;
          const isBan = userBanned(u.id);
          return '<div class="urow' + (isBan ? ' banned' : '') + '">' +
            '<div class="user-cell"><span class="av-wrap">' + avatarHtml(u, 'sm') + '<span class="online' + (online ? ' on' : '') + '"></span></span>' +
            '<div><span class="uname"><a href="#/profil/' + encodeURIComponent(u.username) + '">@' + esc(u.username) + '</a>' + verifiedMark(u.special_tags) + '</span>' +
            '<small class="muted">' + esc(u.email || '') + '</small>' +
            '<span class="badge-row">' + badgesHtml(u.special_tags, { compact: true, max: 6 }) + '</span></div></div>' +
            '<div class="umeta small muted"><span>' + (u.is_admin ? '<b class="role admin">Yönetici</b>' : isBan ? '<b class="role ban">⛔ Kısıtlı</b>' : '<b class="role">Gözlemci</b>') + '</span>' +
            '<span>' + n + ' bildirim</span><span>' + (online ? '🟢 çevrimiçi' : u.last_seen ? esc(timeAgo(u.last_seen)) : '—') + '</span></div>' +
            '<button class="btn ghost sm" data-manage="' + esc(u.id) + '">Yönet ⋯</button></div>';        }).join('') + '</div>';
      return;
    }

    let list = R.filter((r) => r.status === admin.tab);
    if (admin.cat !== 'all') list = list.filter((r) => ((r.categories && r.categories.length) ? r.categories : [catOf(r)]).includes(admin.cat));
    if (admin.q) {
      const q = admin.q.toLowerCase();
      list = list.filter((r) => [r.district, r.neighborhood, r.notes, r.address, observerOf(r), r.username, subLabel(r)].join(' ').toLowerCase().includes(q));
    }
    const sorters = {
      new: (a, b) => new Date(b.created_at) - new Date(a.created_at),
      old: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      score: (a, b) => (b.risk_score || 0) - (a.risk_score || 0),
      access: (a, b) => a.access_score - b.access_score,
    };
    list = list.slice().sort(sorters[admin.sort]);

    body.innerHTML = (list.length
      ? '<p class="muted small">' + list.length + ' kayıt</p><div class="cards">' + list.map((r) => reportCard(r, true)).join('') + '</div>'
      : '<p class="empty">Bu başlıkta bildirim yok.</p>');
  }

  async function onOwnerAction(e) {
    const btn = e.target.closest('[data-act="delete"]'); if (!btn) return;
    if (!confirm('Bu bildirim ve fotoğrafları kalıcı olarak silinsin mi?')) return;
    btn.disabled = true;
    const { data } = await sb.from('reports').select(REPORT_COLS).eq('id', btn.dataset.id).maybeSingle();
    if (data) { const ps = photosOf(data); if (ps.length) await sb.storage.from(BUCKET).remove(withThumbs(ps)); }
    const { error } = await sb.from('reports').delete().eq('id', btn.dataset.id);
    if (error) { toast('Silinemedi: ' + error.message); btn.disabled = false; return; }
    toast('Bildirimin silindi.'); show($('#report-view'), false); openRid = null; loadMine(); loadApproved();
  }

  async function onAdminAction(e) {
    const nu = e.target.closest('[data-notifyuser]');
    if (nu) { admin.tab = 'notify'; admin.notifyTo = nu.dataset.notifyuser; renderAdmin(); return; }
    const dn = e.target.closest('[data-delnotif]');
    if (dn) {
      if (!confirm('Bu bildirim kullanıcıların kutusundan silinsin mi?')) return;
      const { error } = await sb.from('notifications').delete().eq('id', dn.dataset.delnotif);
      if (error) return toast('Geri çekilemedi: ' + error.message);
      adminSent = adminSent.filter((n) => n.id !== dn.dataset.delnotif); renderSent(); toast('Bildirim geri çekildi.');
      return;
    }
    if (e.target.id === 'log-csv') return exportLogsCsv();
    const findU = (id) => adminUsers.find((u) => u.id === id);
    const mg = e.target.closest('[data-manage]'); if (mg) return openManageModal(findU(mg.dataset.manage));
    if (e.target.id === 'maint-toggle') {
      const on = !maint.on;
      if (on && !confirm('Bakım modu açılsın mı? Yöneticiler dışında herkes siteyi kullanamaz.')) return;
      const { data, error } = await withBusy(sb.rpc('admin_set_maintenance', { p_on: on, p_message: $('#maint-msg').value.trim() || null }));
      if (error) return toast('Değiştirilemedi: ' + error.message);
      maint = { on: !!data.on, message: data.message || null }; applyMaint();
      toast(on ? '🛠️ Bakım modu açıldı. Kullanıcılar 30 saniye içinde bakım ekranını görür.' : '✅ Bakım bitti, site herkese açık.');
      return renderOverview();
    }
    if (e.target.id === 'ban-go') {
      const q = $('#ban-user').value.trim().replace(/^@/, '').toLocaleLowerCase('tr-TR');
      const u = adminUsers.find((x) => x.username.toLocaleLowerCase('tr-TR') === q);
      if (!u) return toast('Bu adla bir kullanıcı bulunamadı.');
      if (u.is_admin) return toast('Yöneticiler banlanamaz. Önce yöneticiliğini kaldır.');
      return openBanModal(u);
    }
    if (e.target.closest('#modal-body [data-notifyuser], #modal-body [data-admintoggle], #modal-body [data-unbanuser]')) closeModal();
    const bn = e.target.closest('[data-ban]'); if (bn) return openBanModal(findU(bn.dataset.ban));
    const du = e.target.closest('[data-deluser]'); if (du) return openDeleteModal(findU(du.dataset.deluser));
    const dv = e.target.closest('[data-devices]'); if (dv) return openDevicesModal(findU(dv.dataset.devices));
    const tg = e.target.closest('[data-tags]'); if (tg) return openTagsModal(findU(tg.dataset.tags));
    const ub = e.target.closest('[data-unbanuser]');
    if (ub) {
      if (!confirm('Bu kullanıcının hesap, cihaz ve IP kısıtlamaları kaldırılsın mı?')) return;
      const { error } = await sb.rpc('admin_unban_user', { p_user: ub.dataset.unbanuser });
      if (error) return toast('Kaldırılamadı: ' + error.message);
      toast('Kısıtlama kaldırıldı, kullanıcı tekrar her şeyi kullanabilir.'); return loadAdmin();
    }
    const unb = e.target.closest('[data-unban]');
    if (unb) {
      if (!confirm('Bu ban (hesap, cihaz ve IP kısıtlamaları birlikte) kaldırılsın mı?')) return;
      const { error } = await sb.rpc('admin_lift_ban', { p_ban: unb.dataset.unban });
      if (error) return toast('Kaldırılamadı: ' + error.message);
      toast('Ban kaldırıldı (geçmişte kalır).');
      return loadAdmin();
    }
    const pw = e.target.closest('[data-pwreset]'); if (pw) return openPasswordModal(findU(pw.dataset.pwreset));
    // yasaklı kelimeler, şikâyetler, ad düzeltme
    const cr = e.target.closest('[data-cres]');
    if (cr) {
      const note = cr.dataset.cres === 'dismissed' ? prompt('Reddetme notu (isteğe bağlı):', '') : prompt('Ne yapıldı? (isteğe bağlı not)', '');
      if (note === null) return;
      const { error } = await sb.from('user_reports').update({ status: cr.dataset.cres, admin_note: note || null, resolved_by: session.user.id, resolved_at: new Date().toISOString() }).eq('id', cr.dataset.cid);
      if (error) return toast('Güncellenemedi: ' + error.message);
      toast('Şikâyet güncellendi.'); return renderComplaints();
    }
    const rv = e.target.closest('[data-resetvotes]');
    if (rv) {
      if (!confirm('Bu bildirimin tüm oyları silinsin mi? (Sorun hâlâ duruyorsa)')) return;
      const { error } = await sb.from('report_votes').delete().eq('report_id', rv.dataset.resetvotes);
      if (error) return toast('Sıfırlanamadı: ' + error.message);
      const r = adminReports.find((x) => x.id === rv.dataset.resetvotes); if (r) r.fix_flagged_at = null;
      await loadVotes(); toast('Oylar sıfırlandı, bildirim haritada kalıyor.'); return renderAdmin();
    }    const rn = e.target.closest('[data-rename]'); if (rn) return openRenameModal(findU(rn.dataset.rename));
    const tog = e.target.closest('[data-admintoggle]');
    if (tog) {
      tog.disabled = true;
      const val = tog.dataset.val === '1';
      const { error } = await sb.from('profiles').update({ is_admin: val }).eq('id', tog.dataset.admintoggle);
      if (error) { toast('Değiştirilemedi: ' + error.message); tog.disabled = false; return; }
      const u = adminUsers.find((x) => x.id === tog.dataset.admintoggle); if (u) u.is_admin = val;
      toast(val ? 'Kullanıcı yönetici yapıldı.' : 'Yöneticilik kaldırıldı.');
      renderAdmin(); return;
    }
    const btn = e.target.closest('[data-act]'); if (!btn) return;
    const id = btn.dataset.id, act = btn.dataset.act;
    const r = adminReports.find((x) => x.id === id); if (!r) return;
    btn.disabled = true;
    if (act === 'resolve') {
      const { error } = await sb.from('reports').update({ resolved_at: new Date().toISOString(), resolved_by: session.user.id }).eq('id', id);
      if (error) { toast('İşaretlenemedi: ' + error.message); btn.disabled = false; return; }
      r.resolved_at = new Date().toISOString();
      toast('Çözüldü olarak işaretlendi; 2 gün sonra haritadan kalkar. Bildiren kişiye haber verildi.');
      renderAdmin(); return;
    }
    if (act === 'delete') {
      if (!confirm('Bu bildirim ve fotoğrafları kalıcı olarak silinsin mi?')) { btn.disabled = false; return; }
      const ps = photosOf(r); if (ps.length) await sb.storage.from(BUCKET).remove(withThumbs(ps));
      const { error } = await sb.from('reports').delete().eq('id', id);
      if (error) { toast('Silinemedi: ' + error.message); btn.disabled = false; return; }
      adminReports = adminReports.filter((x) => x.id !== id);
      toast('Bildirim silindi.');
    } else {
      const { error } = await sb.from('reports').update({ status: act, reviewed_at: new Date().toISOString() }).eq('id', id);
      if (error) { toast('Güncellenemedi: ' + error.message); btn.disabled = false; return; }
      r.status = act;
      toast(act === 'approved' ? 'Bildirim yayına alındı.' : 'Bildirim yayından kaldırıldı.');
    }
    renderAdmin();
  }

  async function saveNote(e) {
    const ta = e.target.closest('[data-note]'); if (!ta) return;
    const id = ta.dataset.note, r = adminReports.find((x) => x.id === id);
    const val = ta.value.trim() || null;
    if (!r || val === (r.admin_note || null)) return;
    const { error } = await sb.from('reports').update({ admin_note: val }).eq('id', id);
    if (error) return toast('Not kaydedilemedi: ' + error.message);
    r.admin_note = val; toast('Yönetici notu kaydedildi.');
  }

  function exportCsv() {
    const cols = ['created_at', 'status', 'category', 'subcategory', 'risk_score', 'district', 'neighborhood', 'observer_name',
      'username', 'observed_at', 'lat', 'lng', 'vegetation', 'edge_distance', 'slope', 'water_source',
      'flood_drain', 'waste_type', 'waste_amount', 'road_size', 'road_depth', 'road_position', 'road_traffic', 'structures', 'access_score', 'risks', 'address', 'notes', 'admin_note', 'flag_reason'];
    const cell = (v) => '"' + String(Array.isArray(v) ? v.join('|') : (v ?? '')).replace(/"/g, '""') + '"';
    const csv = '\uFEFF' + cols.join(';') + '\n' +
      adminReports.map((r) => cols.map((c) => cell(c === 'observer_name' ? observerOf(r) : r[c])).join(';')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'gaziemir-bildirimler-' + new Date().toISOString().slice(0, 10) + '.csv';
    a.click(); URL.revokeObjectURL(a.href);
  }

  /* =================== AVATAR VE ROZETLER =================== */
  const hueColor = (s) => 'hsl(' + ([...String(s || '?')].reduce((a, c) => a + c.charCodeAt(0), 0) % 360) + ' 55% 42%)';
  function avatarHtml(p, cls) {
    const name = (p && p.username) || '?';
    const bg = (p && p.avatar_color) || hueColor(name);
    const inner = p && p.avatar_url ? '<img src="' + esc(p.avatar_url) + '" alt="" loading="lazy">'
      : esc((p && p.avatar_emoji) || name.charAt(0).toUpperCase());
    return '<span class="avatar ' + (cls || '') + '" data-css="background:' + esc(bg) + '">' + inner + '</span>';
  }
  const TIERS = [['Yeni Gözlemci', 0, '🌱'], ['Mahalle Gözcüsü', 20, '👀'], ['Doğa Dostu', 60, '🍃'], ['Orman Bekçisi', 100, '🌲'],
    ['Risk Avcısı', 200, '🎯'], ['Yangın Kalkanı', 400, '🛡️'], ['Gaziemir Efsanesi', 800, '👑']];
  const EXTRA_TAGS = [['Ateş Gözcüsü', '🔥', '5+ yayında orman yangını riski bildirimi'], ['Acil Durum Kahramanı', '🚨', '3+ acil durum bildirimi'],
    ['Keskin Göz', '🦅', '5+ yüksek riskli nokta'], ['Yönetici', '🛡️', 'Yönetici hesapları'],
    ['Proje Ekibi', '⭐', 'Yönetici verir'], ['Saha Ekibi', '🧭', 'Yönetici verir'], ['Gönüllü', '🤝', 'Yönetici verir'], ['Jüri Favorisi', '🏆', 'Yönetici verir']];
  // Rozetler: yöneticiler verir (Yönetici rozeti hesaba otomatik gelir). ikon, renk, animasyon, açıklama
  const BADGES = {
    'Kurucu':                { ico: '👑', cls: 'gold shine',   desc: 'Projeyi kuran ekip' },
    'Yönetici':              { ico: '🛡️', cls: 'blue',         desc: 'Site yöneticisi' },
    'Moderatör':             { ico: '⚖️', cls: 'purple',       desc: 'İçerik denetimine yardım eder' },
    'Doğrulanmış Kullanıcı': { ico: '✔',  cls: 'verified',     desc: 'Kimliği doğrulanmış gözlemci' },
    'VIP':                   { ico: '💎', cls: 'vip sparkle',  desc: 'Özel katkı' },
    'Destekçi':              { ico: '💚', cls: 'green',        desc: 'Projeyi destekleyen' },
    'İçerik Üreticisi':      { ico: '🎬', cls: 'pink',         desc: 'Projeyi tanıtan içerik üretir' },
    'Erken Katılan':         { ico: '🌅', cls: 'orange',       desc: 'İlk katılanlardan' },
    'Beta Kullanıcısı':      { ico: '🧪', cls: 'teal',         desc: 'Beta sürümünü test etti' },
    'Proje Ekibi':           { ico: '⭐', cls: 'gold',         desc: 'TÜBİTAK proje ekibi' },
    'Saha Ekibi':            { ico: '🧭', cls: 'green',        desc: 'Sahada gözlem yapar' },
    'Gönüllü':               { ico: '🤝', cls: 'teal',         desc: 'Gönüllü gözlemci' },
    'Jüri Favorisi':         { ico: '🏆', cls: 'gold shine',   desc: 'Jürinin beğendiği' },
  };
  const ADMIN_TAGS = Object.keys(BADGES).filter((b) => b !== 'Yönetici');
  const BADGE_ORDER = Object.keys(BADGES);
  // Rozet sırası katalogdaki önem sırasına göre; compact: sadece ikon
  function badgesHtml(list, opts = {}) {
    // katalogdaki rozetler önce (önem sırasıyla), yöneticinin serbest yazdığı rozetler sonra
    const rank = (b) => (BADGE_ORDER.indexOf(b) + 1) || 999;
    const arr = (list || []).filter(Boolean).sort((a, b) => rank(a) - rank(b));
    const meta = (b) => BADGES[b] || { ico: '🏷️', cls: 'custom', desc: 'Yönetici tarafından verilen özel rozet' };
    const shown = opts.max ? arr.slice(0, opts.max) : arr;
    return shown.map((b) => '<span class="bdg ' + meta(b).cls + (opts.compact ? ' compact' : '') + '" title="' + esc(b + ' — ' + meta(b).desc) + '">' +
      '<i>' + meta(b).ico + '</i>' + (opts.compact ? '' : '<span>' + esc(b) + '</span>') + '</span>').join('') +
      (opts.max && arr.length > opts.max ? '<span class="bdg more">+' + (arr.length - opts.max) + '</span>' : '');
  }
  const verifiedMark = (list) => (list || []).includes('Doğrulanmış Kullanıcı') ? '<span class="vmark" title="Doğrulanmış kullanıcı">✔</span>' : '';
  const myBadges = () => profile ? (profile.special_tags || []) : [];
  const tagIcon = (t) => ((TIERS.find((x) => x[0] === t) || [])[2]) || ((EXTRA_TAGS.find((x) => x[0] === t) || [])[1]) || '🏷️';
  const tagHtml = (t) => t ? '<span class="nametag">' + tagIcon(t) + ' ' + esc(t) + '</span>' : '';
  const AV_EMOJIS = ['🌲', '🔥', '🌊', '🍃', '🦊', '🦉', '🐢', '🐝', '🦅', '🐺', '🌻', '⛰️', '🚒', '🧭', '🛡️', '⭐', '🌍', '💧', '🌙', '⚡'];
  const AV_COLORS = ['#1F4D3A', '#2E6B50', '#C2410C', '#B42318', '#1D4ED8', '#0F766E', '#6D28D9', '#BE185D', '#334155', '#A16207'];

  /* =================== YASAK =================== */
  let banned = null, banTimer = null;
  const fmtLeft = (ms) => {
    if (ms <= 0) return 'Süre doldu';
    const s = Math.floor(ms / 1000), d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), sec = s % 60;
    return (d ? d + 'g ' : '') + (d || h ? h + 'sa ' : '') + m + 'dk ' + String(sec).padStart(2, '0') + 'sn';
  };
  function showBan(b) {
    banned = b;
    const account = b.by === 'hesap';
    $('#ban-title').textContent = account ? 'Hesabın askıya alındı' : 'Erişimin kısıtlandı';
    $('#ban-text').textContent = ({ hesap: 'Hesabın', cihaz: 'Bu cihaz', ip: 'Bu internet bağlantısı (IP)' }[b.by] || 'Erişimin') +
      ' yöneticiler tarafından kısıtlandı.' + (b.reason ? ' Sebep: “' + b.reason + '”' : '');
    $('#ban-until').textContent = b.expires_at ? 'Kısıtlama bitişi: ' + fmtDate(b.expires_at) : 'Süresiz kısıtlama.';
    clearInterval(banTimer);
    show($('#ban-count'), !!b.expires_at);
    if (b.expires_at) {
      const tick = () => {
        const left = new Date(b.expires_at) - Date.now();
        $('#ban-left').textContent = fmtLeft(left);
        if (left <= 0) { clearInterval(banTimer); liftBanLocally('Kısıtlama süresi doldu, tekrar her şeyi kullanabilirsin.'); }
      };
      tick(); banTimer = setInterval(tick, 1000);
    }
    show($('#ban-screen'), true);
    show($('#ban-banner'), true);
    document.documentElement.dataset.banned = 'yes';
    // Oturum kapanmaz: kişi giriş yapmış kalır ama kısıtlama bitene kadar sadece haritayı görür
    if (!/^#\/(harita)?$/.test(location.hash || '#/') && location.hash) location.hash = '#/harita';
  }
  function liftBanLocally(msg) {
    if (!banned) return;
    banned = null; clearInterval(banTimer);
    show($('#ban-screen'), false); show($('#ban-banner'), false);
    delete document.documentElement.dataset.banned;
    if (msg) toast('✅ ' + msg);
  }
  // Açıkken yönetici banlarsa / kaldırırsa sayfa yenilenmeden anlaşılsın
  async function recheckBan() {
    if (!sb || document.hidden) return;
    const { data: b, error } = await sb.rpc('my_ban');
    if (error) return;
    if (b && !banned) showBan(b);
    else if (!b && banned) liftBanLocally('Kısıtlaman kaldırıldı, tekrar her şeyi kullanabilirsin.');
  }
  // Banlıyken açılabilen sayfalar (giriş yapmamış cihaz/IP yasağında giriş ekranı da açık)
  const banAllows = (name) => name === 'harita' || (name === 'giris' && !session);

  /* =================== BAKIM MODU =================== */
  let maint = { on: false, message: null }, maintAdminLogin = false;
  const isAdminNow = () => !!(profile && profile.is_admin);
  async function checkMaint() {
    if (!sb) return;
    const { data, error } = await sb.from('app_settings').select('value').eq('key', 'maintenance').maybeSingle();
    if (error) return; // tablo yoksa / ağ yoksa siteyi kilitleme
    const v = (data && data.value) || {};
    const was = maint.on;
    maint = { on: !!v.on, message: v.message || null };
    applyMaint();
    if (was && !maint.on && !isAdminNow()) { toast('✅ Bakım bitti, hoş geldin!'); route(); }
  }
  function applyMaint() {
    const admin = isAdminNow();
    const block = maint.on && !admin && !(maintAdminLogin && /^#\/giris/.test(location.hash));
    $('#maint-text').textContent = maint.message || 'Yeni özellikler ekliyoruz. Kısa süre içinde geri döneceğiz.';
    show($('#maint-screen'), block);
    show($('#maint-banner'), maint.on && admin);
    document.documentElement.classList.toggle('maint-lock', block);
  }

  /* =================== GENEL PENCERE =================== */
  let modalSubmit = null;
  function openModal(title, html, onSubmit) {
    $('#modal-title').textContent = title;
    $('#modal-body').innerHTML = html;
    modalSubmit = onSubmit || null;
    show($('#modal'), true);
    const f = $('#modal-body input, #modal-body select, #modal-body textarea'); if (f) setTimeout(() => f.focus(), 50);
  }
  const closeModal = () => { show($('#modal'), false); $('#modal').classList.remove('wide'); $('#modal-body').innerHTML = ''; modalSubmit = null; };

  /* =================== LİDER TABLOSU =================== */
  const lb = { period: 'all', cat: 'all' };
  let myTags = null;
  async function loadMyTags() {
    if (!sb || !session) { myTags = null; return null; }
    const { data } = await sb.rpc('user_tags', { p_user: session.user.id });
    myTags = data || null; renderQuest(); return myTags;
  }
  async function loadLeaders() {
    $('#podium').innerHTML = ''; $('#lb-list').innerHTML = '<li>' + skeleton(3) + '</li>';
    const [{ data, error }] = await withBusy(Promise.all([
      sb.rpc('leaderboard', { p_period: lb.period, p_cat: lb.cat, p_limit: 100 }), loadMyTags()]));
    if (error) { $('#lb-list').innerHTML = '<li class="msg">' + esc(error.message) + '</li>'; return; }
    renderLeaders(data || []);
  }
  function renderLeaders(rows) {
    const top = rows.slice(0, 3), rest = rows.slice(3);
    const medal = ['🥇', '🥈', '🥉'];
    // podyum sırası: 2 - 1 - 3
    $('#podium').innerHTML = rows.length ? [1, 0, 2].filter((i) => top[i]).map((i) => {
      const r = top[i];
      return '<a class="pod p' + (i + 1) + (r.is_me ? ' me' : '') + '" href="#/profil/' + encodeURIComponent(r.username) + '" data-css="--d:' + ([1, 0, 2].indexOf(i) * 120) + 'ms">' +
        '<span class="medal">' + medal[i] + '</span>' + avatarHtml(r, 'xl') +
        '<b>@' + esc(r.username) + verifiedMark(r.badges) + '</b><span class="badge-row">' + badgesHtml(r.badges, { compact: true, max: 4 }) + '</span>' + tagHtml(r.nametag) +
        '<span class="pts"><b data-c="' + r.points + '">0</b> puan</span>' +
        '<span class="small muted">' + r.reports + ' bildirim' + (r.fire ? ' · 🔥 ' + r.fire : '') + (r.urgent ? ' · 🚨 ' + r.urgent : '') + '</span>' +
        '<div class="step">' + (i + 1) + '</div></a>';
    }).join('') : '<p class="empty">Bu dönemde henüz yayında bildirim yok. İlk sırayı sen al! <a href="#/bildir">Riskli alan bildir</a></p>';
    $$('#podium [data-c]').forEach((b) => countTo(b, Number(b.dataset.c), 1200));
    $('#lb-list').innerHTML = rest.map((r, i) =>
      '<li data-css="--i:' + Math.min(i, 15) + '"><a class="lb-row' + (r.is_me ? ' me' : '') + '" href="#/profil/' + encodeURIComponent(r.username) + '">' +
      '<span class="rk">' + r.rank + '</span>' + avatarHtml(r) +
      '<span class="who"><b>@' + esc(r.username) + verifiedMark(r.badges) + '</b>' +
      '<span class="badge-row">' + badgesHtml(r.badges, { compact: true, max: 5 }) + tagHtml(r.nametag) + '</span>' +
      ((r.prev_names || []).length ? '<small class="muted">↺ eski: ' + r.prev_names.map((n) => '@' + esc(n)).join(', ') + '</small>' : '') +
      (r.bio ? '<small class="muted">' + esc(r.bio) + '</small>' : '') + '</span>' +
      '<span class="mini small muted">' + r.reports + ' 📍' + (r.fire ? ' · ' + r.fire + ' 🔥' : '') + (r.urgent ? ' · ' + r.urgent + ' 🚨' : '') + '</span>' +
      '<span class="pts"><b>' + r.points + '</b><small>puan</small></span></a></li>').join('');
    const me = rows.find((r) => r.is_me);
    show($('#lb-me'), !!session);
    if (session) {
      const p = profile || {};
      $('#lb-me').innerHTML = avatarHtml(p, 'lg') + '<div><b>' + (me ? 'Sen ' + me.rank + '. sıradasın' : 'Bu listede henüz yoksun') + '</b>' +
        '<span class="small muted">' + (myTags ? myTags.points + ' toplam puan · ' + myTags.reports + ' yayında bildirim' : '') +
        (myTags && myTags.next ? ' · “' + esc(myTags.next.tag) + '” rozetine ' + (myTags.next.need - myTags.points) + ' puan kaldı' : '') + '</span></div>' +
        '<a class="btn fire sm" href="#/bildir">+ Bildir</a>';
    }
    renderTagLadder();
  }
  function renderTagLadder() {
    const have = new Set(myTags ? myTags.unlocked : []);
    const pts = myTags ? myTags.points : 0;
    $('#tag-ladder').innerHTML = TIERS.map(([t, need, ico]) =>
      '<div class="tier' + (have.has(t) ? ' got' : '') + '"><span class="ti">' + ico + '</span><b>' + esc(t) + '</b>' +
      '<small>' + (need ? need + ' puan' : 'Başlangıç') + '</small>' +
      (!have.has(t) && myTags ? '<i class="prog"><i data-css="width:' + Math.min(100, Math.round(pts / need * 100)) + '%"></i></i>' : '') + '</div>').join('') +
      EXTRA_TAGS.map(([t, ico, how]) => '<div class="tier extra' + (have.has(t) ? ' got' : '') + '"><span class="ti">' + ico + '</span><b>' + esc(t) + '</b><small>' + esc(how) + '</small></div>').join('');
  }

  /* =================== PROFİL DÜZENLEYİCİ =================== */
  let avDraft = {};
  function renderAvatarPreview() {
    const p = Object.assign({}, profile, { avatar_url: avDraft.url, avatar_emoji: avDraft.emoji, avatar_color: avDraft.color });
    $('#set-avatar').outerHTML = avatarHtml(p, 'xl" id="set-avatar');
    $$('#av-emoji button').forEach((b) => b.classList.toggle('on', b.dataset.e === avDraft.emoji && !avDraft.url));
    $$('#av-color button').forEach((b) => b.classList.toggle('on', b.dataset.c === avDraft.color));
    show($('#av-clear'), !!avDraft.url);
  }
  async function renderProfileEditor() {
    if (!profile) return;
    avDraft = { emoji: profile.avatar_emoji || null, color: profile.avatar_color || null, url: profile.avatar_url || null,
      tag: profile.nametag || null, bio: profile.bio || '' };
    $('#av-emoji').innerHTML = AV_EMOJIS.map((e) => '<button type="button" data-e="' + e + '">' + e + '</button>').join('');
    $('#av-color').innerHTML = AV_COLORS.map((c) => '<button type="button" class="sw" data-c="' + c + '" data-css="--s:' + c + '" aria-label="Renk ' + c + '"></button>').join('');
    $('#av-bio').value = avDraft.bio;
    renderAvatarPreview();
    $('#set-tag').innerHTML = profile.nametag ? tagIcon(profile.nametag) + ' ' + esc(profile.nametag) : '';
    show($('#set-tag'), !!profile.nametag);
    await loadMyTags();
    const opts = (myTags ? myTags.unlocked : ['Yeni Gözlemci']);
    $('#av-tag').innerHTML = '<option value="">Rozet takma</option>' + opts.map((t) => '<option value="' + esc(t) + '"' + (t === avDraft.tag ? ' selected' : '') + '>' + tagIcon(t) + ' ' + esc(t) + '</option>').join('');
    if (myTags) {
      const nx = myTags.next, prevNeed = (TIERS.filter((t) => t[1] <= myTags.points).pop() || TIERS[0])[1];
      const pct = nx ? Math.round((myTags.points - prevNeed) / (nx.need - prevNeed) * 100) : 100;
      $('#set-points').innerHTML = '<div class="row-between small"><b>⭐ ' + myTags.points + ' puan</b><span class="muted">' +
        (nx ? 'Sonraki rozet: ' + tagIcon(nx.tag) + ' ' + esc(nx.tag) + ' (' + nx.need + ')' : 'Tüm seviye rozetlerini kazandın!') + '</span></div>' +
        '<i class="bar"><i data-css="width:' + pct + '%"></i></i><a class="small" href="#/liderler">Lider tablosunu gör →</a>';
    }
  }
  // Kare kırp + 256 px'e küçült
  async function squareAvatar(file) {
    const bmp = await createImageBitmap(file);
    const s = Math.min(bmp.width, bmp.height), c = document.createElement('canvas');
    c.width = c.height = 256;
    c.getContext('2d').drawImage(bmp, (bmp.width - s) / 2, (bmp.height - s) / 2, s, s, 0, 0, 256, 256);
    return new Promise((res) => c.toBlob(res, 'image/jpeg', 0.88));
  }
  async function onAvatarFile(e) {
    const f = e.target.files[0]; e.target.value = '';
    if (!f) return;
    if (!/^image\//.test(f.type)) return toast('Sadece fotoğraf seçebilirsin.');
    try {
      const blob = await squareAvatar(f);
      const path = session.user.id + '/avatar-' + Date.now() + '.jpg';
      const { error } = await withBusy(sb.storage.from('avatars').upload(path, blob, { contentType: 'image/jpeg', upsert: true }));
      if (error) throw error;
      // eski avatarları temizle
      const { data: old } = await sb.storage.from('avatars').list(session.user.id);
      const stale = (old || []).map((o) => session.user.id + '/' + o.name).filter((p) => p !== path);
      if (stale.length) sb.storage.from('avatars').remove(stale);
      avDraft.url = sb.storage.from('avatars').getPublicUrl(path).data.publicUrl;
      renderAvatarPreview();
      toast('Fotoğraf yüklendi. Kaydetmeyi unutma.');
    } catch (err) { toast('Avatar yüklenemedi: ' + (err.message || err)); }
  }
  async function onAvatarSave() {
    const { error } = await withBusy(sb.rpc('update_my_profile', {
      p_emoji: avDraft.emoji, p_color: avDraft.color, p_nametag: $('#av-tag').value || null,
      p_bio: $('#av-bio').value, p_avatar_url: avDraft.url,
    }));
    if (error) return setMsg('#av-msg', error.message);
    await loadProfile(); renderSettings(); renderProfileEditor();
    setMsg('#av-msg', 'Profilin güncellendi.', 'ok');
    confetti();
  }

  async function loadMyDevices() {
    const { data } = await sb.from('user_devices').select('*').eq('user_id', session.user.id).order('last_seen', { ascending: false });
    $('#my-devices').innerHTML = (data || []).map((d) => '<li><span>' + (d.device_id === DEVICE_ID ? '📍 ' : '') + esc(d.label || 'Bilinmeyen cihaz') +
      (d.device_id === DEVICE_ID ? ' <b class="small">(bu cihaz)</b>' : '') + '</span><small class="muted">' + esc(timeAgo(d.last_seen)) + '</small></li>').join('')
      || '<li class="muted small">Henüz kayıt yok.</li>';
  }

  /* =================== YÖNETİCİ: YASAK, CİHAZ, ROZET =================== */
  let adminBans = [];
  const activeBan = (b) => !b.lifted_at && (!b.expires_at || new Date(b.expires_at) > new Date());
  const userBanned = (uid) => adminBans.some((b) => b.user_id === uid && activeBan(b));

  function openBanModal(u) {
    openModal('@' + u.username + ' kısıtlansın mı?',
      '<form class="stack" id="ban-form">' +
      '<label for="ban-reason">Sebep (kullanıcıya gösterilir)</label><input id="ban-reason" maxlength="300" placeholder="Ör. Uygunsuz fotoğraflar, sahte bildirimler">' +
      '<label for="ban-days">Süre</label><select id="ban-days"><option value="1">1 gün (geçici)</option><option value="3">3 gün</option><option value="7" selected>7 gün</option><option value="30">30 gün</option><option value="0">Süresiz</option></select>' +
      '<p class="muted small">Kısıtlanan kişi oturumda kalır ama süre bitene kadar sadece haritayı görür; sebebi ve kalan süreyi geri sayımla görür. Cihaz ve IP bilgisi arka planda kaydedilir.</p>' +
      '<label class="check"><input type="checkbox" id="ban-dev" checked>Kullandığı cihazları da kısıtla (yeni hesap açsa da bildirim gönderemez)</label>' +
      '<label class="check"><input type="checkbox" id="ban-ip">IP adreslerini de kısıtla <small class="muted">(okul/ev ağındaki herkesi etkileyebilir)</small></label>' +
      '<button class="btn danger big" type="submit">Kısıtla</button></form>',
      async () => {
        const days = Number($('#ban-days').value);
        const { error } = await withBusy(sb.rpc('admin_ban_user', { p_user: u.id, p_reason: $('#ban-reason').value.trim() || null,
          p_days: days, p_devices: $('#ban-dev').checked, p_ips: $('#ban-ip').checked }));
        if (error) return toast('Kısıtlanamadı: ' + error.message);
        closeModal(); toast('@' + u.username + ' kısıtlandı. En geç 30 saniye içinde sadece haritayı görebilecek.'); loadAdmin();
      });
  }
  async function openDevicesModal(u) {
    openModal('@' + u.username + ' · cihazlar', skeleton(2));
    const { data, error } = await sb.from('user_devices').select('*').eq('user_id', u.id).order('last_seen', { ascending: false });
    if (error) return ($('#modal-body').innerHTML = '<p class="msg">' + esc(error.message) + '</p>');
    $('#modal-body').innerHTML = data.length ? '<ul class="device-list admin">' + data.map((d) => {
      const devBan = adminBans.some((b) => b.device_id === d.device_id && activeBan(b));
      const ipBan = d.ip && adminBans.some((b) => b.ip === d.ip && activeBan(b));
      return '<li><div><b>' + esc(d.label || 'Bilinmeyen cihaz') + '</b><small class="muted">IP: ' + esc(d.ip || '—') +
        ' · ilk: ' + esc(fmtDate(d.first_seen)) + ' · son: ' + esc(timeAgo(d.last_seen)) + '</small>' +
        '<small class="muted ua">' + esc(d.user_agent || '') + '</small></div><div class="row-gap">' +
        (devBan ? '<span class="tag rejected">Cihaz kısıtlı</span>' : '<button class="btn ghost sm" data-bandev="' + esc(d.device_id) + '">Cihazı kısıtla</button>') +
        (d.ip ? (ipBan ? '<span class="tag rejected">IP kısıtlı</span>' : '<button class="btn ghost sm" data-banip="' + esc(d.ip) + '">IP\'yi kısıtla</button>') : '') +
        '</div></li>';
    }).join('') + '</ul>' : '<p class="empty">Bu kullanıcı henüz yeni sürümle giriş yapmadı; cihaz kaydı yok.</p>';
  }
  function openTagsModal(u) {
    const cur = new Set(u.special_tags || []);
    const me = session && u.id === session.user.id;
    // katalog (Yönetici dahil: kendi rozetini de kaldırabilir) + bu kişide olan serbest rozetler
    const all = Object.keys(BADGES).concat([...cur].filter((t) => !BADGES[t]));
    const pick = (t) => {
      const m = BADGES[t] || { ico: '🏷️', cls: 'custom', desc: 'Özel rozet' };
      return '<label class="bp"><input type="checkbox" value="' + esc(t) + '"' + (cur.has(t) ? ' checked' : '') + '>' +
        '<span class="bdg ' + m.cls + '"><i>' + m.ico + '</i><span>' + esc(t) + '</span></span><small class="muted">' + esc(m.desc) + '</small></label>';
    };
    openModal('@' + u.username + ' · rozetler' + (me ? ' (sen)' : ''),
      '<form class="stack" id="tags-form"><p class="muted small">İşaretli rozetler profilde ve lider tablosunda görünür. İşareti kaldırarak ' + (me ? 'kendi rozetlerini de' : 'rozetleri') + ' silebilirsin. En fazla 12 rozet.</p>' +
      '<div class="badge-pick" id="bp-list">' + all.map(pick).join('') + '</div>' +
      '<label for="bp-new">Özel rozet ekle (istediğin adı yaz)</label>' +
      '<div class="row-gap"><input id="bp-new" maxlength="24" placeholder="Ör. Sınıf Temsilcisi, 9-A Gözcüsü"><button type="button" class="btn ghost" id="bp-add">Ekle</button></div>' +
      '<button class="btn green big" type="submit">Rozetleri kaydet</button></form>',
      async () => {
        const tags = $$('#tags-form input[type=checkbox]:checked').map((i) => i.value);
        const { error } = await withBusy(sb.rpc('admin_set_special_tags', { p_user: u.id, p_tags: tags }));
        if (error) return toast('Kaydedilemedi: ' + error.message);
        closeModal(); toast('Rozetler güncellendi.');
        if (session && u.id === session.user.id) { await loadProfile(); }
        loadAdmin();
      });
  }
  function renderBans() {
    const uname = (id) => '@' + ((adminUsers.find((u) => u.id === id) || {}).username || '?');
    // Bir banla oluşan hesap + cihaz + IP satırları tek kayıt olarak görünür (IP/cihaz arka planda yine uygulanır)
    const groups = {};
    adminBans.forEach((b) => { (groups[b.group_id || b.id] = groups[b.group_id || b.id] || []).push(b); });
    const rows = Object.values(groups).map((g) => {
      const main = g.find((x) => x.user_id) || g[0];
      return Object.assign({}, main, {
        lifted_at: g.every((x) => x.lifted_at) ? main.lifted_at || g[0].lifted_at : null,
        extra: { dev: g.filter((x) => x.device_id).length, ip: g.filter((x) => x.ip).length },
      });
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const act = rows.filter(activeBan).length;
    const state = (b) => b.lifted_at ? '<span class="tag approved">Kaldırıldı · ' + esc(fmtDate(b.lifted_at)) + '</span>'
      : activeBan(b) ? '<span class="tag rejected">Aktif' + (b.expires_at ? ' · ' + fmtLeft(new Date(b.expires_at) - Date.now()) + ' kaldı' : ' · süresiz') + '</span>'
      : '<span class="tag pending">Süresi doldu</span>';
    const candidates = adminUsers.filter((u) => !u.is_admin && !(session && u.id === session.user.id) && !userBanned(u.id));
    $('#admin-body').innerHTML =
      '<div class="card ban-new"><h2>⛔ Kullanıcı banla</h2>' +
      '<div class="row-gap"><input id="ban-user" list="ban-users" placeholder="Kullanıcı adı yaz veya seç…" autocomplete="off">' +
      '<datalist id="ban-users">' + candidates.map((u) => '<option value="@' + esc(u.username) + '">' + esc(u.email || '') + '</option>').join('') + '</datalist>' +
      '<button type="button" class="btn danger" id="ban-go">Devam et</button></div>' +
      '<p class="muted small">Sonraki adımda sebep, süre (geçici/süresiz) ve cihaz/IP seçeneklerini belirlersin. Banlanan kişi giriş yapamaz.</p></div>' +
      '<h2 class="sec-title">Ban geçmişi</h2><p class="muted small">' + act + ' aktif kısıtlama · toplam ' + rows.length + ' kayıt</p>' +
      (rows.length ? '<div class="ban-rows">' +
      rows.map((b) => '<div class="ban-row' + (activeBan(b) ? '' : ' off') + '">' +
        '<div class="ban-who">' + (b.user_id
          ? '<a href="#/profil/' + encodeURIComponent(uname(b.user_id).slice(1)) + '"><b>' + esc(uname(b.user_id)) + '</b></a>'
          : '<b>' + (b.device_id ? '📱 Cihaz kısıtlaması' : '🌐 IP kısıtlaması') + '</b>') +
          ' ' + state(b) +
          '<small class="muted">' + esc(b.reason ? '“' + b.reason + '”' : 'Sebep yazılmadı') + ' · ' + esc(fmtDate(b.created_at)) + ' → ' +
            (b.expires_at ? esc(fmtDate(b.expires_at)) : 'süresiz') + (b.created_by ? ' · veren ' + esc(uname(b.created_by)) : '') + '</small></div>' +
        (activeBan(b) ? '<button class="btn ghost sm" data-unban="' + esc(b.id) + '">🔓 Kaldır</button>' : '') +
        '</div>').join('') + '</div>'
      : '<p class="empty">Hiç kısıtlama yok. Kullanıcılar sekmesinden bir kullanıcıyı kısıtlayabilirsin.</p>');
  }

  /* =================== AYARLAR: BÖLÜMLER =================== */
  const SET_SECS = ['profil', 'kullanici-adi', 'hesap', 'guvenlik', 'bildirimler', 'gorunum', 'cihaz', 'yardim', 'sil'];
  function showSettingsSection(sub) {
    const v = $('#view-settings');
    // telefonda: alt bölüm yoksa menü; bilgisayarda: menü + varsayılan "profil"
    const mobile = document.documentElement.dataset.ui === 'mobile';
    const sec = SET_SECS.includes(sub) ? sub : (mobile ? '' : 'profil');
    v.dataset.sub = sec;
    $$('#view-settings [data-sec]').forEach((c) => {
      const on = c.dataset.sec === sec;
      if (on && c.hidden !== false) { c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop'); }
      c.hidden = !on;
    });
    $$('.set-menu [data-go]').forEach((a) => a.classList.toggle('on', a.dataset.go === sec));
    if (sec === 'kullanici-adi') { renderUsernameSection(); setTimeout(() => !mobile && $('#set-user').focus(), 300); }
  }

  function renderSettingsExtras() {
    if (!profile || !session) return;
    const bl = myBadges();
    $('#hero-avatar').innerHTML = avatarHtml(profile, 'lg');
    $('#hero-name').innerHTML = '@' + esc(profile.username) + verifiedMark(bl);
    $('#hero-badges').innerHTML = badgesHtml(bl, { compact: true, max: 6 });
    $('#hero-sub').textContent = (profile.nametag ? profile.nametag + ' · ' : '') + (myTags ? myTags.points + ' puan' : 'Profilini düzenle');
    $('#my-public').setAttribute('href', '#/profil/' + encodeURIComponent(profile.username));
    const u = session.user;
    const rows = [
      ['Kullanıcı adı', '@' + profile.username], ['E-posta', u.email],
      ['Giriş yöntemi', u.app_metadata && u.app_metadata.provider === 'google' ? 'Google' : 'E-posta ve şifre'],
      ['Rol', profile.is_admin ? 'Yönetici' : 'Gözlemci'],
      ['Üyelik tarihi', new Date(profile.created_at || u.created_at).toLocaleDateString('tr-TR', { dateStyle: 'long' })],
      ['Son ad değişikliği', profile.username_changed_at ? fmtDate(profile.username_changed_at) : '—'],
      ['Hesap kimliği', u.id.slice(0, 8) + '…'],
    ];
    $('#acc-info').innerHTML = rows.map(([k, v]) => '<div><dt>' + esc(k) + '</dt><dd>' + esc(v) + '</dd></div>').join('');
    $('#acc-badges').innerHTML = bl.length ? badgesHtml(bl) : '<span class="muted small">Henüz rozetin yok. Yöneticiler özel rozetler verebilir.</span>';
    $('#n-push').checked = profile.notify_push !== false && pushAllowed();
    $('#n-email').checked = !!profile.notify_email;
    $('#n-system').checked = profile.notify_system !== false;
    $('#push-state').textContent = !('Notification' in window) ? 'Bu tarayıcı anlık bildirimleri desteklemiyor.'
      : Notification.permission === 'denied' ? 'Tarayıcı ayarlarında bildirim izni kapalı; oradan açman gerekiyor.'
      : (DEVICE.os === 'ios' || DEVICE.os === 'ipados') && !DEVICE.standalone ? 'iPhone’da anlık bildirim için önce siteyi ana ekrana ekle.'
      : 'Uygulama açıkken ya da arka plandayken telefon/bilgisayar bildirimi.';
    $('#menu-un-sub').textContent = '@' + profile.username;
  }

  /* =================== BİLDİRİM TERCİHLERİ VE ANLIK BİLDİRİM =================== */
  const pushAllowed = () => 'Notification' in window && Notification.permission === 'granted';
  async function saveSettings(p) {
    const { error } = await sb.rpc('set_my_settings', { p });
    if (error) return toast('Kaydedilemedi: ' + error.message);
    Object.assign(profile, {
      notify_push: p.notify_push ?? profile.notify_push, notify_email: p.notify_email ?? profile.notify_email,
      notify_system: p.notify_system ?? profile.notify_system,
    });
    toast('Tercihin kaydedildi.');
  }
  async function onPushToggle(e) {
    if (e.target.checked) {
      if (!('Notification' in window)) { e.target.checked = false; return toast('Bu tarayıcı anlık bildirimleri desteklemiyor.'); }
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') { e.target.checked = false; renderSettingsExtras(); return toast('Bildirim izni verilmedi.'); }
    }
    saveSettings({ notify_push: e.target.checked });
  }
  // Uygulama arka plandayken gelen bildirimi telefon/bilgisayar bildirimi olarak göster
  async function systemNotify(n) {
    if (!profile || profile.notify_push === false || !pushAllowed()) return;
    if (document.visibilityState === 'visible' && document.hasFocus()) return; // ekrandaysa zaten görüyor
    const opt = { body: n.body || '', icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: n.id, data: { link: n.link || '#/gelen' } };
    try {
      const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : null;
      if (reg) reg.showNotification(n.title, opt); else new Notification(n.title, opt);
    } catch (_) { /* desteklenmiyor */ }
  }
  // "Sistem duyuruları" kapalıysa herkese giden duyurular gizlenir (acil olanlar hariç)
  const wantsNotif = (n) => !(n && !n.user_id && n.kind !== 'alert' && profile && profile.notify_system === false);

  /* =================== YARDIM MERKEZİ =================== */
  const GUIDE = [
    ['🔥 Riskli alanı nasıl bildiririm?', 'Alttaki turuncu <b>+</b> düğmesine (bilgisayarda “Riskli alan bildir”) bas. Önce ne gördüğünü seç, sonra konumu işaretle, fotoğraf ekle ve kısa soruları yanıtla. Risk puanı otomatik hesaplanır.'],
    ['📍 Konumu nasıl seçerim?', '“Bulunduğum konumu kullan”a bas ya da haritaya dokun. İğneyi sürükleyerek düzeltebilirsin. İlçe ve mahalle otomatik bulunur.'],
    ['🚨 Acil durumda ne yapmalıyım?', 'Patlak boru, taşan kanalizasyon, kopmuş kablo gibi durumlarda önce ilgili kurumu ara: 185 (su), 187 (doğalgaz), 186 (elektrik), 112 (acil). Sonra “Acil altyapı arızası” olarak bildir.'],
    ['⭐ Puan ve rozet nasıl kazanırım?', 'Yayına giren her bildirim 10 puan; yüksek risk +5, orman yangını +3, acil durum +3, çözülen sorun +5. Puanla nametag unvanları açılır; yöneticiler özel rozetler verebilir.'],
    ['🗺️ Haritayı nasıl kullanırım?', 'Pinlere dokunarak ayrıntıları gör. Telefonda alttaki listeyi yukarı çekerek tüm bildirimleri, filtreleri ve acil durumları görebilirsin.'],
  ];
  const FAQ = [
    ['Bildirimim neden hemen yayına girmedi?', 'Küfür, anlamsız yazı ya da kısa sürede çok fazla bildirim gibi şüpheli durumlarda yönetici onayı gerekir. Onaylanınca bildirim alırsın ve puanın eklenir.'],
    ['Bu harita aktif yangınları gösteriyor mu?', 'Hayır. Henüz yanmamış ama risk taşıyan alanları topluyoruz. Yanan bir yer görürsen hemen 112’yi ara.'],
    ['Kullanıcı adımı neden sık değiştiremiyorum?', 'Kötüye kullanımı önlemek için kullanıcı adı 72 saatte bir değiştirilebilir. Eski adların profilinde görünür.'],
    ['Fotoğraflarım kimlere görünür?', 'Yayındaki bildirimlerin fotoğrafları herkese açıktır. Yüz ve plaka içeren fotoğraf yüklememeye dikkat et.'],
    ['Mail gelmiyor, ne yapmalıyım?', 'Spam klasörüne bak. Kayıt sonrası gelen bağlantıya tıklaman yeterli; açık bekleyen sayfa kendiliğinden giriş yapar.'],
    ['Birini nasıl şikâyet ederim?', 'Lider tablosunda ya da bir profilde “Şikâyet et” düğmesine bas, sebebi seç. Yöneticiler inceler.'],
    ['Hesabım askıya alındı, ne yapmalıyım?', 'Ekranda sebebi ve kalan süreyi görürsün. Bir hata olduğunu düşünüyorsan okul yöneticinle iletişime geç.'],
  ];
  const accordion = (items) => items.map(([q, a]) => '<details><summary>' + q + '</summary><div>' + a + '</div></details>').join('');

  /* =================== KARŞILAMA EKRANLARI + TANITIM TURU =================== */
  // Her ekranda animasyonlu bir çizim (art) ve kısa metin. İki ekranda kendin deneyebileceğin mini demo var.
  const pinSvg = (c, d) => '<svg class="art-pin" data-css="--d:' + d + 'ms" viewBox="0 0 24 30"><path d="M12 29C5 20 2 15 2 11a10 10 0 0 1 20 0c0 4-3 9-10 18z" fill="' + c + '" stroke="#fff" stroke-width="2"/><circle cx="12" cy="11" r="3.5" fill="#fff"/></svg>';
  const SLIDES = [
    { art: () => '<div class="art map"><i class="g"></i><i class="g h"></i><i class="ring"></i>' +
        '<span class="p1">' + pinSvg('#B42318', 200) + '</span><span class="p2">' + pinSvg('#1D4ED8', 450) + '</span><span class="p3">' + pinSvg('#0F766E', 700) + '</span>' +
        '<b class="flame">🔥</b></div>',
      title: (n) => 'Hoş geldin' + (n ? ', @' + n : '') + '!',
      text: 'Orman yangınları küresel bir sorun. Biz bu soruna <b>mahallemizden</b> çözüm üretiyoruz: yangın çıkmadan önce riskli alanları birlikte haritalıyoruz.' },

    { art: () => '<div class="art cats">' + [['🔥', 'Yangın riski', '#B42318', 'ana odak'], ['🚨', 'Acil arıza', '#E11D48'], ['🌊', 'Sel', '#1D4ED8'], ['🗑️', 'Atık', '#7C5A00'], ['⚡', 'Altyapı', '#6D28D9'], ['🚧', 'Yol çukuru', '#0F766E']]
        .map((c, i) => '<span class="cat-chip' + (c[3] ? ' big' : '') + '" data-css="--c:' + c[2] + ';--d:' + i * 110 + 'ms"><i>' + c[0] + '</i>' + c[1] + (c[3] ? '<small>' + c[3] + '</small>' : '') + '</span>').join('') + '</div>',
      title: () => 'Neleri haritalıyoruz?',
      text: 'Ana odağımız <b>orman yangını riski taşıyan alanlar</b>: kuru ot birikimi, ormana bitişik evler, yangın altyapısı eksikliği. Ayrıca patlak boru gibi acil arızalar, sel, atık ve yol hasarı.' },

    { art: () => '<div class="art steps4">' + [['📍', 'Konum'], ['📷', 'Fotoğraf'], ['📝', 'Birkaç soru'], ['✅', 'Gönder']]
        .map((s, i) => '<span class="st" data-css="--i:' + i + '"><i>' + s[0] + '</i><b>' + (i + 1) + '</b>' + s[1] + '</span>').join('<u></u>') + '</div>',
      title: () => '4 adımda bildir',
      text: 'Ne gördüğünü seç, konumu işaretle (ilçe ve mahalle <b>otomatik</b> bulunur), fotoğraf ekle ve kısa soruları yanıtla. Bir dakikadan kısa sürer.' },

    { art: () => '<div class="art demo" id="demo-risk"><div class="demo-chips">' +
        '<button type="button" data-dr="30">🌿 Kuru ot çok</button><button type="button" data-dr="25">🌲 Ormana 50 m</button><button type="button" data-dr="20">🚒 Hidrant yok</button><button type="button" data-dr="15">⛰️ Dik yamaç</button></div>' +
        '<div class="demo-meter"><b id="dr-val">10</b><span id="dr-lbl">Düşük risk</span><i><em id="dr-bar" data-css="width:10%"></em></i></div></div>',
      title: () => 'Risk puanını sen de dene',
      text: 'Cevapların <b>0-100</b> arası bir risk puanına dönüşür. Yukarıdakilere dokunarak puanın nasıl yükseldiğini gör. <b>67+</b> “yüksek risk” sayılır ve haritada nabız gibi atar.' },

    { art: () => '<div class="art safe">' +
        '<div class="rule"><i>✋</i><span><b>Güvenli mesafe</b>Fotoğrafı uzaktan çek, tehlikeli alana girme.</span></div>' +
        '<div class="rule hot"><i>🔥</i><span><b>Yanan bir yer mi?</b>Bildirme, hemen <a href="tel:112">112</a>’yi ara.</span></div>' +
        '<div class="rule"><i>🙈</i><span><b>Mahremiyet</b>Fotoğrafta yüz ve plaka olmasın.</span></div></div>',
      title: () => 'Önce güvenlik',
      text: 'Bu harita <b>aktif yangınları göstermez</b> ve kurumlara otomatik haber vermez. Acil durumda önce 112, patlak boruda 185, doğalgazda 187 ara.' },

    { art: () => '<div class="art demo" id="demo-vote"><div class="demo-pop"><b>Kuru ot ve yanıcı atık</b><small>Gaziemir · 2 gün önce</small>' +
        '<div class="demo-vb"><button type="button" data-dv="1">👍 Düzelmiş <em id="dv-y">2</em></button><button type="button" data-dv="-1">👎 Hâlâ var <em id="dv-n">1</em></button></div>' +
        '<i class="demo-bar"><em id="dv-bar" data-css="width:66%"></em></i></div></div>',
      title: () => 'Sorun çözüldü mü? Sen de oy ver',
      text: 'Haritada bir yerden geçtin mi? Orası düzelmişse 👍, hâlâ duruyorsa 👎 de. <b>Çoğunluk “düzelmiş” derse</b> yöneticilere haber gider; yoksa bildirim haritada kalır.' },

    { art: () => '<div class="art ladder"><div class="lad-row"><span class="ti">🌱</span><b>Yeni Gözlemci</b><em>0</em></div><div class="lad-row"><span class="ti">👀</span><b>Mahalle Gözcüsü</b><em>20</em></div>' +
        '<div class="lad-row"><span class="ti">🌲</span><b>Orman Bekçisi</b><em>100</em></div><div class="lad-row"><span class="ti">👑</span><b>Gaziemir Efsanesi</b><em>800</em></div>' +
        '<div class="lad-pts"><span>+10 bildirim</span><span>+5 yüksek risk</span><span>+3 yangın riski</span></div></div>',
      title: () => 'Puan kazan, rozet topla',
      text: 'Yayına giren her bildirim puan kazandırır. Puanla unvanlar açılır, lider tablosunda yükselirsin. Gözlemci adın herkese <b>“B---r U---l”</b> gibi maskeli görünür.' },

    { art: () => '<div class="art ready"><span class="rocket">🚀</span><div class="confetti-dots"><i></i><i></i><i></i><i></i><i></i><i></i></div></div>',
      title: () => 'Hazırsın!',
      text: 'Şimdi sana uygulamanın önemli yerlerini tek tek göstereceğiz. Ardından <b>ilk görevlerini</b> tamamla: profilini düzenle, haritayı gez, ilk bildirimini yap.' },
  ];
  let wlIdx = 0;
  function startOnboarding(ask) {
    // sinematik sesli tur (sinema.js) varsa onu aç; bitince ya da kesilince ilk görevler başlar.
    // ask === true: yeni hesabın ilk girişi → önce sorulur (davet kartı); Ayarlar'daki düğme doğrudan başlatır.
    if (window.GGSinema && window.GGSinema.startTour && window.gsap) {
      show($('#install'), false);
      const opt = { onEnd: () => finishOnboarding() };
      if (ask === true && window.GGSinema.inviteTour) window.GGSinema.inviteTour(opt); else window.GGSinema.startTour(opt);
      return;
    }
    wlIdx = 0;
    show($('#install'), false);
    const name = profile ? profile.username : '';
    $('#wl-slides').innerHTML = SLIDES.map((s, i) => '<div class="wl-slide" data-i="' + i + '">' + s.art() +
      '<h2' + (i === 0 ? ' id="wl-title"' : '') + '>' + esc(s.title(name)) + '</h2><p>' + s.text + '</p></div>').join('');
    $('#wl-dots').innerHTML = SLIDES.map((_, i) => '<i data-i="' + i + '"></i>').join('');
    show($('#welcome'), true);
    renderSlide();
    bindDemos();
  }
  // Kendin dene mini demoları
  function bindDemos() {
    const risk = $('#demo-risk');
    if (risk) {
      const on = new Set();
      risk.addEventListener('click', (e) => {
        const b = e.target.closest('[data-dr]'); if (!b) return;
        on.has(b.dataset.dr + b.textContent) ? on.delete(b.dataset.dr + b.textContent) : on.add(b.dataset.dr + b.textContent);
        b.classList.toggle('on');
        const v = Math.min(100, 10 + $$('[data-dr].on', risk).reduce((a, x) => a + Number(x.dataset.dr), 0));
        countTo($('#dr-val'), v, 450); $('#dr-bar').style.width = v + '%';
        $('#dr-bar').style.background = v >= 67 ? 'var(--hi)' : v >= 34 ? 'var(--mid)' : 'var(--lo)';
        $('#dr-lbl').textContent = (v >= 67 ? 'Yüksek' : v >= 34 ? 'Orta' : 'Düşük') + ' risk';
        if (v >= 67 && navigator.vibrate) navigator.vibrate(30);
      });
    }
    const vote = $('#demo-vote');
    if (vote) {
      let y = 2, n = 1, mine = 0;
      vote.addEventListener('click', (e) => {
        const b = e.target.closest('[data-dv]'); if (!b) return;
        const v = Number(b.dataset.dv);
        if (mine === 1) y--; if (mine === -1) n--;
        mine = mine === v ? 0 : v;
        if (mine === 1) y++; if (mine === -1) n++;
        $('#dv-y').textContent = y; $('#dv-n').textContent = n;
        $('#dv-bar').style.width = Math.round(y / (y + n) * 100) + '%';
        $$('[data-dv]', vote).forEach((x) => x.classList.toggle('on', mine !== 0 && Number(x.dataset.dv) === mine));
      });
    }
  }
  function renderSlide() {
    $$('.wl-slide').forEach((s) => { const i = Number(s.dataset.i); s.classList.toggle('on', i === wlIdx); s.classList.toggle('left', i < wlIdx); });
    $$('#wl-dots i').forEach((d) => d.classList.toggle('on', Number(d.dataset.i) === wlIdx));
    $('#wl-bar').style.width = ((wlIdx + 1) / SLIDES.length * 100) + '%';
    $('#wl-prev').style.visibility = wlIdx ? 'visible' : 'hidden';
    $('#wl-next').textContent = wlIdx === SLIDES.length - 1 ? 'Turu başlat 🚀' : 'İleri';
    $('#wl-count').textContent = (wlIdx + 1) + ' / ' + SLIDES.length;
  }

  function endWelcome(goTour) { show($('#welcome'), false); if (goTour) startTour(); else finishOnboarding(); }

  // Ekrandaki gerçek öğeleri sırayla vurgulayan tur. Telefon ve bilgisayarda farklı öğeler.
  const tourSteps = () => {
    const m = document.documentElement.dataset.ui === 'mobile';
    return [
      { route: '#/harita', sel: '#legend-toggle', title: 'Renklerin anlamı', text: 'Her renk bir risk türü. Orman yangını riski kırmızıdır. Bu kutuyu açıp kapatabilirsin.' },
      { route: '#/harita', sel: '.leaflet-marker-icon', title: 'Bir pine dokun', text: 'Fotoğrafı, risk puanını, ne zaman eklendiğini görürsün. Altındaki 👍/👎 ile “sorun çözüldü mü?” oyu verebilirsin.' },
      { route: '#/harita', sel: m ? '#sheet-handle' : '.panel-head', title: 'Bildirim listesi', text: m ? 'Bu tutamacı yukarı çekince tüm bildirimleri, filtreleri ve acil durumları görürsün.' : 'Tüm bildirimler, filtreler ve acil durumlar burada. Bir satıra tıklayınca harita oraya uçar.' },
      { route: '#/harita', sel: m ? '#tabbar [data-nav="liderler"]' : '.nav [data-nav="liderler"]', title: 'Lider tablosu', text: 'En çok katkı verenleri gör, sıralamada yüksel. Birine dokununca profili açılır.' },
      { route: '#/ayarlar', sel: '#set-hero', title: 'Burası profil sayfan', text: 'Avatarın, rozetlerin ve puanın burada. Dokunarak fotoğraf, emoji ve nametag seçebilirsin.' },
      { route: '#/ayarlar', sel: '[data-go="kullanici-adi"]', title: 'Kullanıcı adını buradan değiştir', text: 'Kullanıcı adı 72 saatte bir değiştirilebilir; eski adların profilinde görünür.' },
      { route: '#/ayarlar', sel: '[data-go="yardim"]', title: 'Yardım merkezi', text: 'Bu turu tekrar izleyebilir, kullanım rehberine ve sık sorulan sorulara ulaşabilirsin.' },
      { route: '#/harita', sel: m ? '#tabbar .fab' : '.nav .btn.fire', title: 'Riskli alan bildir', text: 'Bir risk gördüğünde buraya dokun. İlk bildirimin seni bekliyor! 🔥' },
    ];
  };
  let tourIdx = 0, tourList = [];
  function startTour() { tourList = tourSteps(); tourIdx = 0; show($('#tour'), true); goTourStep(); }
  function goTourStep() {
    const st = tourList[tourIdx];
    if (!st) return endTour();
    if (location.hash !== st.route && !location.hash.startsWith(st.route + '/')) location.hash = st.route;
    if (st.route === '#/ayarlar' && document.documentElement.dataset.ui === 'mobile') showSettingsSection('');
    setTimeout(() => placeTour(st), 380);
  }
  function placeTour(st) {
    const el = $(st.sel);
    $('#tour-step').textContent = 'Adım ' + (tourIdx + 1) + ' / ' + tourList.length;
    $('#tour-title').textContent = st.title; $('#tour-text').textContent = st.text;
    $('#tour-bar').style.width = ((tourIdx + 1) / tourList.length * 100) + '%';
    $('#tour-prev').style.visibility = tourIdx ? 'visible' : 'hidden';
    $('#tour-next').textContent = tourIdx === tourList.length - 1 ? 'Bitir 🎉' : 'İleri';
    const hole = $('#tour-hole'), tip = $('#tour-tip');
    if (!el || !el.offsetParent) { hole.style.cssText = 'opacity:0'; tip.style.cssText = 'left:50%;top:50%;transform:translate(-50%,-50%)'; return; }
    el.scrollIntoView({ block: 'center', behavior: calm() ? 'auto' : 'smooth' });
    setTimeout(() => {
      const r = el.getBoundingClientRect(), pad = 8;
      hole.style.cssText = 'opacity:1;left:' + (r.left - pad) + 'px;top:' + (r.top - pad) + 'px;width:' + (r.width + pad * 2) + 'px;height:' + (r.height + pad * 2) + 'px';
      const tw = Math.min(340, innerWidth - 24), below = r.bottom + 16 + 190 < innerHeight;
      const left = Math.max(12, Math.min(innerWidth - tw - 12, r.left + r.width / 2 - tw / 2));
      tip.style.cssText = 'width:' + tw + 'px;left:' + left + 'px;' + (below ? 'top:' + (r.bottom + 16) + 'px' : 'bottom:' + (innerHeight - r.top + 16) + 'px');
      tip.classList.remove('in'); void tip.offsetWidth; tip.classList.add('in');
    }, calm() ? 0 : 320);
  }
  function endTour() { show($('#tour'), false); finishOnboarding(); }
  function finishOnboarding() {
    safe(() => localStorage.setItem('gyrh-onboarded-' + (session ? session.user.id : 'x'), '1'));
    if (session) sb.rpc('set_my_settings', { p: { onboarded: true } }).then(() => { if (profile) profile.onboarded_at = new Date().toISOString(); });
    toast('Hazırsın! Sırada ilk görevlerin var 🎯');
    safe(() => localStorage.removeItem('gyrh-q-dismiss-' + (session ? session.user.id : 'x')));
    setTimeout(renderQuest, 300);
  }

  /* =================== İLK GÖREVLER =================== */
  const qKey = (k) => 'gyrh-q-' + k + '-' + (session ? session.user.id : 'x');
  const qFlag = (k) => safe(() => localStorage.getItem(qKey(k)) === '1', false);
  const qSet = (k) => { if (!session || qFlag(k)) return; safe(() => localStorage.setItem(qKey(k), '1')); renderQuest(); };
  function questList() {
    const myVoted = Object.values(votes).some((v) => v.my_vote);
    return [
      { id: 'profile', ico: '🎨', text: 'Profilini düzenle', sub: 'Avatar veya nametag seç', done: !!(profile && (profile.avatar_emoji || profile.avatar_url || profile.nametag)), go: '#/ayarlar/profil' },
      { id: 'explore', ico: '🗺️', text: 'Haritada bir bildirime bak', sub: 'Bir pine dokun', done: qFlag('explore'), go: '#/harita' },
      { id: 'vote', ico: '👍', text: 'Bir soruna oy ver', sub: 'Düzelmiş mi, hâlâ var mı?', done: myVoted || qFlag('vote'), go: '#/harita' },
      { id: 'board', ico: '🏆', text: 'Lider tablosuna göz at', sub: 'Kimler öne çıkmış?', done: qFlag('board'), go: '#/liderler' },
      { id: 'report', ico: '📍', text: 'İlk bildirimini yap', sub: '+10 puan kazan', done: !!(myTags && myTags.reports > 0) || qFlag('report'), go: '#/bildir' },
    ];
  }
  let questDone = false;
  function renderQuest() {
    const box = $('#quest'); if (!box) return;
    const dismissed = session && safe(() => localStorage.getItem('gyrh-q-dismiss-' + session.user.id) === '1', false);
    if (!session || !profile || banned || dismissed || !(profile.onboarded_at || qFlag('seen') || safe(() => localStorage.getItem('gyrh-onboarded-' + session.user.id), null))) { show(box, false); return; }
    const list = questList(), n = list.filter((q) => q.done).length;
    if (n === list.length) {
      if (!questDone && qFlag('celebrated') === false) { qSet('celebrated'); confetti(); toast('🎉 Tüm ilk görevleri tamamladın!'); }
      questDone = true; show(box, false); return;
    }
    questDone = false;
    show(box, true);
    $('#quest-count').textContent = n + ' / ' + list.length;
    $('#quest-bar').style.width = Math.round(n / list.length * 100) + '%';
    $('#quest-list').innerHTML = list.map((q) => '<a class="q' + (q.done ? ' done' : '') + '" href="' + q.go + '"><i>' + (q.done ? '✔' : q.ico) + '</i><span><b>' + esc(q.text) + '</b><small>' + esc(q.sub) + '</small></span></a>').join('');
  }
  // Yeni kayıt olan ya da turu hiç görmemiş kullanıcıya otomatik göster
  function maybeOnboard() {
    if (!profile || profile.onboarded_at || banned) return;
    if (safe(() => localStorage.getItem('gyrh-onboarded-' + session.user.id), null)) return;
    setTimeout(() => startOnboarding(true), 2200); // "hoş geldin" perdesi bittikten sonra
  }

  /* =================== HERKESE AÇIK PROFİL + ŞİKÂYET =================== */
  let ppData = null;
  async function loadPublicProfile(name) {
    const box = $('#pp-body');
    box.innerHTML = skeleton(3);
    if (!name) { box.innerHTML = '<p class="empty">Profil bulunamadı.</p>'; return; }
    const { data, error } = await withBusy(sb.rpc('public_profile', { p_username: name }));
    if (error || !data) { box.innerHTML = '<p class="empty">“' + esc(name) + '” adında bir kullanıcı bulunamadı.</p>'; return; }
    ppData = data;
    const p = data, bl = p.badges || [];
    box.innerHTML =
      (p.found_via_old_name ? '<p class="msg info">“@' + esc(p.found_via_old_name) + '” artık <b>@' + esc(p.username) + '</b> adını kullanıyor.</p>' : '') +
      '<div class="pp-hero glass">' +
        '<div class="pp-cover"></div>' + avatarHtml(p, 'xl') +
        '<h1>@' + esc(p.username) + verifiedMark(bl) + '</h1>' + tagHtml(p.nametag) +
        (p.banned ? '<span class="tag rejected">⛔ Hesap askıda</span>' : '') +
        (p.bio ? '<p class="muted">' + esc(p.bio) + '</p>' : '') +
        '<div class="badge-row big">' + badgesHtml(bl) + '</div>' +
        '<div class="pp-stats">' +
          '<div><b data-c="' + (p.points || 0) + '">0</b><small>puan</small></div>' +
          '<div><b>' + (p.rank ? '#' + p.rank : '—') + '</b><small>sıra</small></div>' +
          '<div><b data-c="' + (p.reports || 0) + '">0</b><small>bildirim</small></div>' +
          '<div><b data-c="' + (p.fire || 0) + '">0</b><small>🔥 yangın riski</small></div>' +
        '</div>' +
        '<small class="muted">Üyelik: ' + esc(new Date(p.created_at).toLocaleDateString('tr-TR', { dateStyle: 'long' })) + '</small>' +
        (session && !p.is_me ? '<button type="button" class="btn ghost sm" id="pp-report">🚩 Şikâyet et</button>' : '') +
        (p.is_me ? '<a class="btn ghost sm" href="#/ayarlar/profil">✏️ Profilimi düzenle</a>' : '') +
      '</div>' +
      '<div class="card"><h2>Geçmiş kullanıcı adları</h2>' + ((p.history || []).length
        ? '<ol class="un-history">' + p.history.map((h) => '<li><span class="old">@' + esc(h.old) + '</span><span class="arrow">→</span><span>@' + esc(h.new) + '</span><small class="muted">' + esc(fmtDate(h.at)) + '</small></li>').join('') + '</ol>'
        : '<p class="muted small">Bu kullanıcı adını hiç değiştirmedi.</p>') + '</div>' +
      '<div class="card"><h2>Son bildirimleri</h2>' + ((p.recent || []).length
        ? '<div class="pp-grid">' + p.recent.map((r) => '<a class="pp-item" href="#/harita" data-focus="' + esc(r.id) + '">' +
          (r.photo ? '<img loading="lazy" decoding="async" alt="" src="' + esc(thumbUrl(r.photo)) + '">' : '<span class="pp-noimg">' + ((CATS[r.category] || {}).ico || '📍') + '</span>') +
          '<span><b>' + esc((SUBS[r.category] && SUBS[r.category][r.subcategory] || [CATS[r.category] ? CATS[r.category].short : ''])[0]) + '</b><small>' +
          esc([r.district, r.neighborhood].filter(Boolean).join(' / ')) + ' · ' + esc(timeAgo(r.created_at)) + '</small></span></a>').join('') + '</div>'
        : '<p class="muted small">Henüz yayında bildirimi yok.</p>') + '</div>';
    $$('#pp-body [data-c]').forEach((b) => countTo(b, Number(b.dataset.c), 1000));
  }
  function openReportUser() {
    if (!ppData) return;
    openModal('@' + ppData.username + ' kullanıcısını şikâyet et',
      '<form class="stack" id="ur-form">' +
      '<label for="ur-reason">Sebep</label><select id="ur-reason">' +
        '<option value="uygunsuz_ad">Uygunsuz kullanıcı adı</option><option value="uygunsuz_icerik">Uygunsuz fotoğraf veya yazı</option>' +
        '<option value="sahte_bildirim">Sahte / gerçek dışı bildirim</option><option value="spam">Spam</option>' +
        '<option value="taciz">Taciz veya zorbalık</option><option value="diger">Diğer</option></select>' +
      '<label for="ur-details">Açıklama (isteğe bağlı)</label><textarea id="ur-details" rows="3" maxlength="500"></textarea>' +
      '<p class="muted small">Şikâyetin yalnızca yöneticilere görünür.</p>' +
      '<button class="btn danger big" type="submit">Şikâyeti gönder</button></form>',
      async () => {
        const { error } = await withBusy(sb.from('user_reports').insert({ target_id: ppData.id, reason: $('#ur-reason').value, details: $('#ur-details').value.trim() || null }));
        if (error) return toast(/duplicate|unique/i.test(error.message) ? 'Bu kullanıcı için zaten açık bir şikâyetin var.' : 'Gönderilemedi: ' + error.message);
        closeModal(); toast('Şikâyetin alındı. Teşekkürler.');
      });
  }

  /* =================== YÖNETİCİ: GENEL BAKIŞ, KELİMELER, ŞİKÂYETLER =================== */
  async function renderOverview() {
    const body = $('#admin-body');
    body.innerHTML = skeleton(3);
    const { data: s, error } = await withBusy(sb.rpc('admin_stats'));
    if (error || !s) { body.innerHTML = '<p class="msg">' + esc(error ? error.message : 'İstatistikler alınamadı, “Yenile”ye bas.') + '</p>'; return; }
    s.signups_14d = s.signups_14d || []; s.top = s.top || [];
    const max = Math.max(1, ...s.signups_14d.map((x) => x.n));
    body.innerHTML =
      '<div class="card maint-card' + (maint.on ? ' on' : '') + '"><div><h2>🛠️ Bakım modu ' + (maint.on ? '<span class="tag rejected">AÇIK</span>' : '<span class="tag approved">kapalı</span>') + '</h2>' +
        '<p class="muted small">Açıkken yöneticiler dışında kimse siteyi kullanamaz; herkes “Site güncelleniyor” ekranını görür. Güncellemeyi siteye yüklemeden önce aç, bitince kapat.</p>' +
        '<input id="maint-msg" maxlength="200" placeholder="Kullanıcılara mesaj (isteğe bağlı), ör. 15 dakika içinde dönüyoruz" value="' + esc(maint.message || '') + '"></div>' +
        '<button type="button" class="btn ' + (maint.on ? 'green' : 'danger') + '" id="maint-toggle">' + (maint.on ? '✅ Bakımı bitir' : '🛠️ Bakım modunu aç') + '</button></div>' +
      '<div class="kpis">' +
        kpi('👥', 'Toplam kullanıcı', s.users) + kpi('🟢', 'Günlük aktif', s.dau, 'son 24 saat') + kpi('📅', 'Haftalık aktif', s.wau) +
        kpi('✨', 'Yeni kayıt', s.new_7d, s.new_24h + ' bugün') + kpi('⛔', 'Askıdaki hesap', s.banned) +
        kpi('🚩', 'Açık şikâyet', s.open_reports) + kpi('⏳', 'Onay bekleyen bildirim', s.pending) +
      '</div>' +
      '<div class="ov-grid">' +
        '<div class="card"><h2>Son 14 gün yeni kayıt</h2><div class="spark">' + s.signups_14d.map((x) =>
          '<i data-css="--h:' + Math.round(x.n / max * 100) + '%" title="' + esc(new Date(x.d).toLocaleDateString('tr-TR')) + ': ' + x.n + '"><b>' + (x.n || '') + '</b></i>').join('') + '</div></div>' +
        '<div class="card"><h2>En aktif kullanıcılar <small class="muted">(30 gün)</small></h2><ol class="top-users">' + (s.top || []).map((u, i) =>
          '<li><span class="rk">' + (i + 1) + '</span>' + avatarHtml(u, 'sm') + '<a href="#/profil/' + encodeURIComponent(u.username) + '">@' + esc(u.username) + '</a>' +
          '<small class="muted">' + u.reports_30d + ' bildirim' + (u.last_seen ? ' · ' + esc(timeAgo(u.last_seen)) : '') + '</small></li>').join('') + '</ol></div>' +
      '</div>' +
      '<h2 class="sec-title">Bildirimler</h2><div class="stats" id="stats"></div>' +
      '<h2 class="sec-title">Ana başlıklara göre</h2><div class="catbar" id="cat-bar"></div>' +
      '<h2 class="sec-title">En çok bildirim gelen ilçeler</h2><div class="tags" id="dist-bar"></div>';
    renderAdminReportStats();
    $$('#admin-body .kpi b[data-c]').forEach((b) => countTo(b, Number(b.dataset.c), 900));
    show($('#cnt-complaints'), s.open_reports > 0); $('#cnt-complaints').textContent = s.open_reports;
  }
  const kpi = (ico, label, val, sub) => '<div class="kpi glass"><span class="kpi-ico">' + ico + '</span><b data-c="' + (val || 0) + '">0</b><span>' + esc(label) + '</span>' + (sub ? '<small class="muted">' + esc(String(sub)) + '</small>' : '') + '</div>';

  async function renderComplaints() {
    const body = $('#admin-body');
    const { data, error } = await withBusy(sb.from('user_reports').select('*').order('created_at', { ascending: false }).limit(200));
    if (error) { body.innerHTML = '<p class="msg">' + esc(error.message) + '</p>'; return; }
    const uname = (id) => (adminUsers.find((u) => u.id === id) || {}).username || '?';
    const RS = { uygunsuz_ad: 'Uygunsuz ad', uygunsuz_icerik: 'Uygunsuz içerik', sahte_bildirim: 'Sahte bildirim', spam: 'Spam', taciz: 'Taciz', diger: 'Diğer' };
    const open = data.filter((r) => r.status === 'open').length;
    show($('#cnt-complaints'), open > 0); $('#cnt-complaints').textContent = open;
    body.innerHTML = data.length ? '<div class="cards">' + data.map((r) =>
      '<article class="rcard complaint ' + r.status + '"><div class="body">' +
      '<div class="tags"><span class="tag ' + (r.status === 'open' ? 'pending' : r.status === 'resolved' ? 'approved' : 'rejected') + '">' +
        ({ open: 'Açık', resolved: 'Çözüldü', dismissed: 'Reddedildi' }[r.status]) + '</span><span class="badge">' + esc(RS[r.reason] || r.reason) + '</span></div>' +
      '<b><a href="#/profil/' + encodeURIComponent(uname(r.target_id)) + '">@' + esc(uname(r.target_id)) + '</a> şikâyet edildi</b>' +
      '<span class="small muted">Şikâyet eden: @' + esc(uname(r.reporter_id)) + ' · ' + esc(timeAgo(r.created_at)) + '</span>' +
      (r.details ? '<span class="small">“' + esc(r.details) + '”</span>' : '') +
      (r.admin_note ? '<span class="small"><b>Not:</b> ' + esc(r.admin_note) + '</span>' : '') +
      (r.status === 'open' ? '<div class="actions">' +
        '<button class="btn green sm" data-cres="resolved" data-cid="' + esc(r.id) + '">✔ Çözüldü</button>' +
        '<button class="btn ghost sm" data-cres="dismissed" data-cid="' + esc(r.id) + '">Reddet</button>' +
        '<button class="btn danger sm" data-ban="' + esc(r.target_id) + '">⛔ Kısıtla</button>' +
        '<button class="btn ghost sm" data-rename="' + esc(r.target_id) + '">✏️ Adı düzelt</button></div>' : '') +
      '</div></article>').join('') + '</div>'
      : '<p class="empty">Hiç şikâyet yok. 🎉</p>';
  }
  // Tüm yöneticiler aynı yetkiye sahip; 'Kurucu' sadece görünen bir rozet. Yönetici hesapları silinemez (sunucu da denetler)
  const canDeleteUsers = () => !!(profile && profile.is_admin);
  function openDeleteModal(u) {
    if (!u) return;
    const n = adminReports.filter((r) => r.user_id === u.id).length;
    openModal('🗑️ @' + u.username + ' hesabı silinsin mi?',
      '<form class="stack" id="del-form"><p class="msg">Bu işlem <b>geri alınamaz</b>. Hesap, <b>' + n + ' bildirim</b>, fotoğraflar, oylar ve bildirim kutusu kalıcı olarak silinir. Puanlar lider tablosundan kalkar.</p>' +
      '<p class="muted small">' + esc(u.email || '') + '</p>' +
      '<p class="muted small">Silindikten sonra bu e-posta ve kullanıcı adıyla yeniden hesap açılabilir.</p>' +
      '<div class="row-gap"><button class="btn ghost" type="button" id="del-cancel">Vazgeç</button><button class="btn danger big" type="submit" id="del-go">🗑️ Evet, sil</button></div></form>',
      async () => {
        const btn = $('#del-go'); btn.disabled = true; btn.textContent = 'Siliniyor…';
        const { data, error } = await withBusy(sb.functions.invoke('admin-user', { body: { action: 'delete_user', user_id: u.id } }));
        let msg = data && data.error;
        if (!msg && error) { msg = error.message; try { if (error.context && error.context.json) msg = (await error.context.json()).error || msg; } catch (_) { /* yok say */ } }
        if (msg) { btn.disabled = false; btn.textContent = 'Hesabı kalıcı olarak sil'; return toast('Silinemedi: ' + msg); }
        closeModal(); toast('🗑️ @' + u.username + ' silindi' + (data && data.photos ? ' (' + data.photos + ' fotoğrafla birlikte)' : '') + '.');
        loadAdmin();
      });
    $('#del-cancel').addEventListener('click', closeModal);
  }

  // Tek kullanıcı için tüm işlemler tek pencerede
  function openManageModal(u) {
    const me = session && u.id === session.user.id, isBan = userBanned(u.id);
    const act = (attr, ico, label, cls) => '<button type="button" class="mrow ' + (cls || '') + '" ' + attr + '="' + esc(u.id) + '"><i>' + ico + '</i><span>' + label + '</span></button>';
    openModal('Kullanıcıyı yönet',
      '<div class="manage-head">' + avatarHtml(u, 'lg') + '<div><b>@' + esc(u.username) + verifiedMark(u.special_tags) + '</b>' +
        '<small class="muted">' + esc(u.email || '') + ' · ' + (u.is_admin ? 'Yönetici' : 'Gözlemci') + (isBan ? ' · ⛔ kısıtlı' : '') + '</small>' +
        '<span class="badge-row">' + badgesHtml(u.special_tags, { compact: true }) + '</span></div></div>' +
      '<div class="mlist">' +
        '<a class="mrow" href="#/profil/' + encodeURIComponent(u.username) + '"><i>👁</i><span>Profili görüntüle</span></a>' +
        act('data-tags', '🏅', 'Rozet ver / kaldır') +
        act('data-rename', '✏️', 'Kullanıcı adını düzenle') +
        act('data-notifyuser', '📣', 'Bildirim gönder') +
        act('data-devices', '📱', 'Cihazlar ve IP adresleri') +
        (me || u.is_admin ? '' : act('data-pwreset', '🔑', 'Şifre sıfırla')) +
        (me ? '' : act('data-admintoggle', u.is_admin ? '⬇️' : '🛡️', u.is_admin ? 'Yöneticiliği al' : 'Yönetici yap').replace('data-admintoggle=', 'data-val="' + (u.is_admin ? '0' : '1') + '" data-admintoggle=')) +
        (canDeleteUsers() && !me && !u.is_admin ? act('data-deluser', '🗑️', 'Hesabı sil (kalıcı)', 'bad') : '') +
        (me || u.is_admin ? '' : isBan ? act('data-unbanuser', '🔓', 'Kısıtlamayı kaldır', 'good') : act('data-ban', '⛔', 'Banla (hesabı kısıtla)', 'bad')) +
      '</div>');
  }

  function openRenameModal(u) {
    openModal('@' + u.username + ' · kullanıcı adını düzenle',
      '<form class="stack"><label for="rn-new">Yeni kullanıcı adı</label><input id="rn-new" value="' + esc(u.username) + '" maxlength="24">' +
      '<p class="muted small">Yönetici değişikliği 72 saat kuralına takılmaz ve geçmişe kaydedilir.</p>' +
      '<button class="btn green big" type="submit">Kaydet</button></form>',
      async () => {
        const { error } = await withBusy(sb.rpc('admin_rename_user', { p_user: u.id, p_name: $('#rn-new').value.trim() }));
        if (error) return toast('Değiştirilemedi: ' + error.message);
        closeModal(); toast('Kullanıcı adı güncellendi.'); loadAdmin();
      });
  }
  // Yönetici: kullanıcının şifresini sıfırla (mail bağlantısı ya da doğrudan yeni şifre)
  function openPasswordModal(u) {
    const gen = () => {
      const a = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789', b = new Uint32Array(10);
      crypto.getRandomValues(b); return Array.from(b, (x) => a[x % a.length]).join('');
    };
    openModal('@' + u.username + ' · şifre sıfırla',
      '<div class="stack">' +
      '<div class="card pw-opt"><b>📧 Sıfırlama bağlantısı gönder</b><small class="muted">' + esc(u.email || 'E-posta bilinmiyor') + ' adresine bağlantı gider; kullanıcı yeni şifresini kendisi belirler.</small>' +
      '<button type="button" class="btn ghost" id="pw-mail"' + (u.email ? '' : ' disabled') + '>Bağlantıyı gönder</button></div>' +
      '<form class="card pw-opt stack" id="pw-form"><b>🔑 Yeni şifre belirle</b><small class="muted">Mail gelmiyorsa: şifreyi sen belirle, kullanıcıya yüz yüze söyle. Giriş yaptıktan sonra Ayarlar → Güvenlik’ten değiştirmesini iste.</small>' +
      '<div class="row-gap"><input id="pw-new" minlength="8" maxlength="72" autocomplete="off" value="' + gen() + '"><button type="button" class="btn ghost sm" id="pw-gen">🎲 Yeni</button></div>' +
      '<button class="btn danger" type="submit">Şifreyi değiştir</button></form>' +
      '<p class="msg" id="pw-msg" hidden></p></div>',
      async () => {
        const pass = $('#pw-new').value.trim();
        if (pass.length < 8) return setMsg('#pw-msg', 'Şifre en az 8 karakter olmalı.');
        const { data, error } = await withBusy(sb.functions.invoke('admin-user', { body: { action: 'set_password', user_id: u.id, password: pass } }));
        const err = (data && data.error) || (error && error.message);
        if (err) return setMsg('#pw-msg', 'Değiştirilemedi: ' + err);
        setMsg('#pw-msg', '✅ Şifre değişti. Yeni şifre: ' + pass + ' — kullanıcıya ilet.', 'ok');
      });
    $('#pw-gen').addEventListener('click', () => { $('#pw-new').value = gen(); });
    $('#pw-mail').addEventListener('click', async () => {
      const { error } = await withBusy(sb.auth.resetPasswordForEmail(u.email, { redirectTo: resetUrl() }));
      setMsg('#pw-msg', error ? mailError(error) : '✅ Sıfırlama bağlantısı ' + u.email + ' adresine gönderildi (spam klasörüne de baksın).', error ? '' : 'ok');
    });
  }

  /* =================== GİZLİLİK VE KOŞULLAR =================== */
  const LEGAL_DATE = '11 Ekim 2026';
  const contact = () => cfg.CONTACT_EMAIL ? '<a href="mailto:' + esc(cfg.CONTACT_EMAIL) + '">' + esc(cfg.CONTACT_EMAIL) + '</a>' : 'EGEV 100. Yıl Lisesi proje ekibi (okul yönetimi aracılığıyla)';
  const LEGAL = {
    gizlilik: ['Gizlilik Politikası', () => `
      <p class="muted small">Son güncelleme: ${LEGAL_DATE}</p>
      <p><b>${esc(cfg.APP_NAME || 'GeoGözcü')}</b>, EGEV 100. Yıl Lisesi öğrencilerinin TÜBİTAK kapsamında geliştirdiği, orman yangını riski taşıyan alanları ve çevresel riskleri haritalayan gönüllü bir vatandaş bilimi projesidir. Gizliliğine önem veriyoruz; bu metin hangi bilgileri neden topladığımızı açıklar.</p>
      <h3>Kim sorumlu?</h3><p>Veri sorumlusu proje ekibidir. İletişim: ${contact()}.</p>
      <h3>Herkese ne görünür?</h3>
      <ul><li><b>Görünür:</b> kullanıcı adın, avatarın, rozetlerin, puanın, yayındaki bildirimlerin (fotoğraf, konum, anket cevapları, notlar).</li>
      <li><b>Gizlenir:</b> gözlemci ad-soyadın herkese <b>“B---r U---l”</b> gibi maskeli gösterilir; gerçek adı sadece yöneticiler görür. E-posta adresin hiçbir kullanıcıya gösterilmez.</li>
      <li><b>Sadece sana ve yöneticilere:</b> giriş kayıtların, cihaz listen, gönderdiğin şikâyetler.</li></ul>
      <h3>Takip ve güvenlik</h3><ul><li><b>Oturum kaydı (session replay), reklam, analitik ya da takip çerezi yoktur.</b> Sitede hiçbir üçüncü taraf izleme betiği çalışmaz; fare hareketlerin, tıklamaların ve yazdıkların kaydedilmez. Bunu sunucunun içerik güvenlik politikası da (CSP) zorunlu kılar: site yalnızca kendi dosyalarını ve harita/veritabanı sunucularını yükleyebilir.</li><li><b>Oturum:</b> “Beni hatırla” kapalıyken oturum tarayıcıyı kapatınca biter (sessionStorage); açıkken en çok 30 gün sürer. Ortak bilgisayarda kapalı bırak.</li><li><b>Şifre:</b> şifren bizde açık hâliyle saklanmaz; doğrulamayı Supabase Auth yapar. Art arda hatalı girişlerde giriş geçici olarak kilitlenir.</li><li><b>Yetki:</b> yönetici işlemleri tarayıcıda değil, veritabanında (satır düzeyi güvenlik kuralları) denetlenir.</li></ul>
      <h3>Haklarında</h3><p>6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) m.11 kapsamında; verilerinin işlenip işlenmediğini öğrenme, bilgi isteme, düzeltilmesini veya silinmesini isteme ve itiraz etme hakkın vardır. Hesabını ve tüm bildirimlerini <b>Ayarlar → Hesabı sil</b> ile istediğin an kalıcı olarak silebilirsin. Diğer talepler için: ${contact()}.</p>
      <h3>Çocuklar</h3><p>Site öğrencilere yöneliktir. 13 yaşından küçükler veli izniyle kullanmalıdır. Konum ve fotoğraf paylaşırken kendi güvenliğini ve başkalarının mahremiyetini koru.</p>
      <p class="muted small">Bu metin bir okul projesi için hazırlanmış bilgilendirme metnidir; hukuki danışmanlık yerine geçmez.</p>`],
    veri: ['Verilerini nasıl kullanıyoruz?', () => `
      <p class="muted small">Son güncelleme: ${LEGAL_DATE}</p>
      <table class="legal-table"><thead><tr><th>Ne topluyoruz?</th><th>Neden?</th></tr></thead><tbody>
      <tr><td>E-posta, şifre (şifrelenmiş saklanır), kullanıcı adı</td><td>Hesap açmak, giriş yapmak, hesabını korumak</td></tr>
      <tr><td>Avatar, tanıtım yazısı, rozet seçimi</td><td>Profilini ve lider tablosunu göstermek</td></tr>
      <tr><td>Gözlemci ad-soyadı</td><td>Bildirimin güvenilirliğini yöneticilerin denetleyebilmesi (herkese maskeli görünür)</td></tr>
      <tr><td>Konum (enlem/boylam), ilçe, mahalle, adres</td><td>Riski haritada doğru yerde göstermek</td></tr>
      <tr><td>Fotoğraflar, anket cevapları, notlar, gözlem tarihi</td><td>Risk puanını hesaplamak ve riski belgelemek</td></tr>
      <tr><td>IP adresi, rastgele cihaz kimliği, cihaz/tarayıcı bilgisi, giriş kayıtları</td><td>Kötüye kullanımı (sahte bildirim, spam, hakaret) önlemek ve gerektiğinde hesap/cihaz kısıtlamak</td></tr>
      <tr><td>Bildirim, tema, ses tercihlerin</td><td>Siteyi senin istediğin gibi çalıştırmak (bazıları sadece cihazında saklanır)</td></tr>
      </tbody></table>
      <h3>Kimlerle paylaşılıyor?</h3>
      <p>Verilerini satmayız ve reklam için kullanmayız. Sitenin çalışması için şu hizmetleri kullanıyoruz:</p>
      <ul><li><b>Supabase</b> — veritabanı, giriş ve fotoğraf depolama (sunucular yurt dışında bulunur).</li>
      <li><b>Cloudflare</b> — sitenin barındırılması ve saldırılara (DDoS) karşı koruma.</li>
      <li><b>Esri / OpenStreetMap / OpenTopoMap</b> — uydu görüntüsü, sokak ve topoğrafik harita; işaretlediğin noktanın ilçe/mahalle adını bulmak için koordinat <b>OpenStreetMap Nominatim</b>'e gönderilir.</li>
      <li><b>Google Fonts, cdnjs, jsDelivr</b> — yazı tipleri ve yazılım kütüphaneleri (tarayıcın bu sunuculara bağlanır).</li></ul>
      <p>TÜBİTAK proje raporunda yalnızca <b>toplu ve kimliksiz</b> istatistikler (ör. “Gaziemir'de 12 yüksek riskli nokta”) kullanılır.</p>
      <h3>Ne kadar saklıyoruz?</h3>
      <p>Hesabın açık olduğu sürece. Hesabını silersen profilin, bildirimlerin ve fotoğrafların kalıcı olarak silinir; güvenlik kayıtlarında adın kaldırılarak kimliksiz hâle getirilir.</p>`],
    kosullar: ['Kullanım koşulları', () => `
      <p class="muted small">Son güncelleme: ${LEGAL_DATE}</p>
      <ol class="legal-ol">
      <li><b>Bu bir acil durum servisi değildir.</b> Harita aktif yangınları göstermez ve kurumlara otomatik bildirim yapmaz. Yanan bir yer ya da acil durum görürsen hemen <b>112</b>'yi ara.</li>
      <li><b>Doğru bilgi paylaş.</b> Sadece kendi gördüğün, gerçek riskleri bildir. Sahte veya yanıltıcı bildirim yapma.</li>
      <li><b>Güvenliğin önce gelir.</b> Fotoğrafı güvenli bir mesafeden çek; tehlikeli alanlara, özel mülke girme.</li>
      <li><b>Mahremiyete saygı göster.</b> Fotoğraflarda insan yüzü, araç plakası, ev içi gibi kişisel bilgiler olmasın.</li>
      <li><b>Saygılı ol.</b> Küfür, hakaret, ayrımcılık, taciz yasaktır. Kullanıcı adları ve notlar otomatik denetlenir.</li>
      <li><b>Kurallara uymayan</b> bildirimler yayından kaldırılabilir; hesaplar, cihazlar veya bağlantılar geçici ya da süresiz kısıtlanabilir.</li>
      <li><b>Puan ve rozetler</b> katkıyı teşvik içindir; maddi bir karşılığı yoktur ve yöneticiler gerektiğinde düzeltebilir.</li>
      <li>Haritadaki bilgiler gönüllü gözlemlere dayanır; doğruluğu garanti edilmez. Resmî kararlar için ilgili kurumlara başvurulmalıdır.</li>
      </ol>`],
  };
  function openLegal(key) {
    const d = LEGAL[key]; if (!d) return;
    openModal(d[0], '<div class="legal">' + d[1]() + '</div>');
    $('#modal').classList.add('wide');
  }

  /* =================== TELEFON ARAYÜZÜ =================== */
  // Haritadaki liste telefonda alttan açılan bir panel olur: peek (kapalı) → half → full
  // Telefonda liste paneli: peek = kapalı (harita tam ekran), half = yarım, full = tam açık
  function setSheet(state) {
    const p = $('#panel'); if (!p) return;
    p.dataset.sheet = state;
    $('#sheet-handle').setAttribute('aria-expanded', String(state !== 'peek'));
    const b = $('#btn-list'); if (b) b.setAttribute('aria-expanded', String(state !== 'peek'));
    document.documentElement.classList.toggle('sheet-open', state !== 'peek');
    if (state === 'half') p.scrollTop = 0;
  }
  function bindSheet() {
    const p = $('#panel');
    // tutamaca dokununca yarım ↔ tam
    $('#sheet-handle').addEventListener('click', () => setSheet(p.dataset.sheet === 'full' ? 'half' : 'full'));
    $('#btn-list').addEventListener('click', () => setSheet('half'));
    $('#sheet-close').addEventListener('click', () => setSheet('peek'));
    // yarım açıkken listede kaydırmaya başlayınca tam aç (aksi hâlde alttaki bildirimler ekran dışında kalır)
    p.addEventListener('scroll', () => { if (p.dataset.sheet === 'half' && p.scrollTop > 12 && document.documentElement.dataset.ui === 'mobile') setSheet('full'); }, { passive: true });
    // Leaflet kaynak yazısı telefonda tek satır; dokununca tamamı
    const attr = $('#map .leaflet-control-attribution');
    if (attr) attr.addEventListener('click', (e) => { if (!e.target.closest('a')) attr.classList.toggle('open'); });
    // Parmağı takip eden sürükleme: tutamaçtan / başlıktan ya da liste en üstteyken aşağı çekince
    let y0 = null, t0 = 0, base = 0, dragging = false;
    const offsetOf = () => { const m = new DOMMatrix(getComputedStyle(p).transform); return m.m42; };
    const start = (e) => {
      if (document.documentElement.dataset.ui !== 'mobile') return;
      const onHead = e.target.closest('.sheet-handle, .panel-head');
      const atTop = p.scrollTop <= 0 && p.dataset.sheet !== 'peek';
      if (!onHead && !atTop && p.dataset.sheet !== 'peek') return;
      y0 = e.touches[0].clientY; t0 = Date.now(); base = offsetOf(); dragging = false;
    };
    const move = (e) => {
      if (y0 === null) return;
      const dy = e.touches[0].clientY - y0;
      if (!dragging) {
        // liste içinde yukarı kaydırma normal kaydırmadır; sadece aşağı çekme ya da başlıktan sürükleme paneli taşır
        if (Math.abs(dy) < 8) return;
        if (dy < 0 && p.dataset.sheet === 'full') { y0 = null; return; }
        if (p.scrollTop > 0) { y0 = null; return; }
        dragging = true; p.style.transition = 'none';
      }
      e.preventDefault();
      p.style.transform = 'translateY(' + Math.max(0, base + dy) + 'px)';
    };
    const end = (e) => {
      if (y0 === null) return;
      const dy = e.changedTouches[0].clientY - y0, fast = Date.now() - t0 < 250;
      y0 = null; p.style.transition = ''; p.style.transform = '';
      if (!dragging) return;
      const h = p.offsetHeight, pos = Math.max(0, base + dy) / h; // 0 = tam açık, ~1 = kapalı
      let st = pos < 0.25 ? 'full' : pos < 0.7 ? 'half' : 'peek';
      if (fast) st = dy < 0 ? (p.dataset.sheet === 'peek' ? 'half' : 'full') : (p.dataset.sheet === 'full' ? 'half' : 'peek');
      setSheet(st);
    };
    p.addEventListener('touchstart', start, { passive: true });
    p.addEventListener('touchmove', move, { passive: false });
    p.addEventListener('touchend', end, { passive: true });
    p.addEventListener('touchcancel', end, { passive: true });
    // haritaya dokununca / haritayı kaydırınca panel aşağı insin, harita rahat kullanılsın
    // Not: "zoomstart" kullanılmaz; uygulamanın kendi yakınlaştırmaları (ör. Yakınımdakiler) paneli kapatmasın.
    const lower = () => { if (document.documentElement.dataset.ui === 'mobile' && p.dataset.sheet !== 'peek' && GG.get().tool === 'none') setSheet('peek'); };
    mainMap.on('click dragstart', lower);
    const mc = mainMap.getContainer();
    mc.addEventListener('touchstart', (e) => { if (e.touches.length > 1) lower(); }, { passive: true }); // iki parmakla yakınlaştırma
    mc.addEventListener('wheel', lower, { passive: true });
    $('#urgent-list').addEventListener('click', (e) => {
      const b = e.target.closest('[data-uid]'); if (!b) return;
      const r = approved.find((x) => x.id === b.dataset.uid); if (r) focusReport(r);
    });
  }

  // "Ana ekrana ekle": Android/Chrome'da gerçek yükleme penceresi, iPhone'da adım adım tarif
  let installEvt = null;
  const INSTALL_KEY = 'gyrh-install-x';
  function installHow() {
    if (DEVICE.os === 'ios' || DEVICE.os === 'ipados') {
      return DEVICE.browser === 'safari'
        ? 'Alttaki <b>Paylaş</b> <span class="ios-share">⬆︎</span> simgesine dokun, sonra <b>“Ana Ekrana Ekle”</b>yi seç.'
        : 'Sağ üstteki <b>Paylaş</b> <span class="ios-share">⬆︎</span> menüsünden <b>“Ana Ekrana Ekle”</b>yi seç. Görmüyorsan siteyi Safari ile aç.';
    }
    if (installEvt) return 'Tek dokunuşla ana ekranına ekle, uygulama gibi tam ekran açılsın.';
    if (DEVICE.os === 'android') return DEVICE.browser === 'firefox'
      ? 'Sağ üstteki <b>⋮</b> menüsünden <b>“Yükle”</b>yi seç.'
      : 'Sağ üstteki <b>⋮</b> menüsünden <b>“Ana ekrana ekle”</b> ya da <b>“Uygulamayı yükle”</b>yi seç.';
    return 'Adres çubuğundaki yükle simgesine tıkla.';
  }
  function maybeShowInstall(force) {
    if (DEVICE.standalone) return;
    if (!$('#welcome').hidden || !$('#tour').hidden) { setTimeout(() => maybeShowInstall(force), 8000); return; } // tanıtım bitince göster
    // ana sayfa, giriş ve form ekranlarında düğmelerin üstünü kapatmasın: haritaya geçince gösterilir
    if (['ana', 'giris', 'bildir', 'sifre-yenile'].includes(document.documentElement.dataset.route)) { setTimeout(() => maybeShowInstall(force), 8000); return; }
    const dismissed = safe(() => Number(localStorage.getItem(INSTALL_KEY) || 0), 0);
    if (!force && (document.documentElement.dataset.ui !== 'mobile' || Date.now() - dismissed < 14 * 864e5)) return;
    $('#install-how').innerHTML = installHow();
    $('#install-go').textContent = installEvt ? 'Yükle' : 'Tamam';
    show($('#install'), true);
    $('#install').classList.remove('in'); void $('#install').offsetWidth; $('#install').classList.add('in');
  }
  function bindInstall() {
    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvt = e; if (!$('#install').hidden) maybeShowInstall(true); });
    window.addEventListener('appinstalled', () => { show($('#install'), false); toast('Uygulama ana ekranına eklendi 🎉'); installEvt = null; });
    const close = () => { show($('#install'), false); safe(() => localStorage.setItem(INSTALL_KEY, String(Date.now()))); };
    $('#install-x').addEventListener('click', close);
    $('#install-go').addEventListener('click', async () => {
      if (installEvt) { installEvt.prompt(); const c = await installEvt.userChoice; installEvt = null; if (c.outcome === 'accepted') return show($('#install'), false); }
      close();
    });
    setTimeout(() => maybeShowInstall(false), 5000);
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
      const hadController = !!navigator.serviceWorker.controller;
      navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' })
        .then((reg) => { reg.update(); setInterval(() => reg.update(), 30 * 60000); })
        .catch((err) => console.warn('Servis çalışanı kurulamadı:', err.message));
      // Yeni sürüm yüklenince sayfayı bir kez kendiliğinden yenile (eski kod kullanılmaya devam etmesin)
      let reloaded = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!hadController || reloaded || AUTH_LINK) return;
        reloaded = true;
        if (!$('#form-rest') || $('#form-rest').hidden) location.reload(); // form dolduruluyorsa bozma
        else toast('Yeni sürüm hazır. Bildirimini gönderdikten sonra sayfayı yenile.');
      });
    }
    // ekran döndürülünce / boyut değişince arayüzü yeniden seç
    let rt; window.addEventListener('resize', () => {
      clearTimeout(rt); rt = setTimeout(() => {
        const was = document.documentElement.dataset.ui; applyDevice();
        if (was !== document.documentElement.dataset.ui) { mainMap.invalidateSize(); if (pickMap) pickMap.invalidateSize(); }
      }, 200);
    });
    window.addEventListener('online', () => toast('İnternet bağlantısı geri geldi.'));
    window.addEventListener('offline', () => toast('İnternet bağlantısı yok. Harita son yüklenen hâliyle duruyor.'));
  }

  /* =================== YÖNLENDİRME =================== */
  const ROUTES = { ana: 'home', proje: 'project', harita: 'map', bildir: 'report', giris: 'auth', bildirimlerim: 'mine', gelen: 'mine', yonetici: 'admin', ayarlar: 'settings', liderler: 'leaders', profil: 'profile', 'sifre-yenile': 'reset' };
  let routeSub = '';
  const PRIVATE = ['bildir', 'bildirimlerim', 'gelen', 'ayarlar'];

  function route() {
    // maildeki bağlantıdan dönen jetonları adres çubuğundan temizle
    if (/access_token=|refresh_token=|type=(magiclink|signup|recovery)/.test(location.hash)) {
      history.replaceState(null, '', location.pathname + (recovering ? '#/sifre-yenile' : '#/harita'));
    }
    // adres boşsa: giriş yapmamış ziyaretçiye karşılama sayfası, giriş yapmışa harita
    const raw = (location.hash && location.hash.startsWith('#/') ? location.hash
      : (RESET_LINK || (recovering && session) ? '#/sifre-yenile' : session ? '#/harita' : '#/ana')).replace('#/', '');
    let [name, sub] = raw.split('/');
    sub = sub ? decodeURIComponent(sub) : '';
    if (!ROUTES[name]) name = 'harita';
    routeSub = sub;
    if (PRIVATE.includes(name) && !session) { nextHash = '#/' + name; location.hash = '#/giris'; return; }
    if (banned && !isAdminNow() && !banAllows(name)) {
      toast('⛔ Hesabın kısıtlı: kısıtlama bitene kadar sadece haritayı görebilirsin.');
      if (location.hash !== '#/harita') location.hash = '#/harita';
      return;
    }
    document.documentElement.dataset.route = name;
    if (['ana', 'giris', 'bildir', 'sifre-yenile'].includes(name) && !$('#install').hidden) show($('#install'), false);
    if (name === 'yonetici' && !(profile && profile.is_admin)) {
      if (!session) { nextHash = '#/yonetici'; location.hash = '#/giris'; return; }
      toast('Bu sayfa sadece yöneticiler içindir.'); location.hash = '#/harita'; return;
    }
    // Zaten giriş yapılmışsa (ör. maildeki bağlantıya başka sekmede tıklandı) giriş ekranında bekletme
    if (name === 'giris' && session && recovering) { location.hash = '#/sifre-yenile'; return; }
    if (name === 'giris' && session && !recovering) {
      clearInterval(confirmTimer); pendingPass = null;
      const go = nextHash || '#/harita'; nextHash = null;
      toast('Giriş yapıldı, hoş geldin!');
      location.hash = go; return;
    }
    const sameView = !$('#view-' + ROUTES[name]).hidden;
    Object.values(ROUTES).forEach((v) => show($('#view-' + v), v === ROUTES[name]));
    $$('[data-nav]').forEach((a) => a.classList.toggle('active', a.dataset.nav === name));
    window.scrollTo(0, 0);
    if (!sameView) replayView($('#view-' + ROUTES[name]));
    if (name === 'ayarlar') { showSettingsSection(sub); if (!sameView) { renderSettings(); renderProfileEditor(); loadMyDevices(); } }
    if (name === 'profil') loadPublicProfile(sub);
    if (name === 'sifre-yenile') renderReset(); else if (resetDone) resetDone = false;
    if (name === 'liderler') { loadLeaders(); qSet('board'); }
    if (name === 'harita') {
      mainMap.invalidateSize();
      probeFps();
      if (firstFit && shown.length > 1 && !filt.view) { mainMap.fitBounds(shown.map((r) => [r.lat, r.lng]), { padding: [60, 60], maxZoom: 16, animate: false }); firstFit = false; }
      loadApproved();
    }
    if (name === 'ana') { renderHomeStats(); Promise.resolve(loadApproved()).then(renderHomeStats); }
    if (name === 'proje') { renderProject(); if (!approved.length) Promise.resolve(loadApproved()).then(renderProject); }
    if (name === 'bildir') {
      if (!$('#form-rest').hidden) initPickMap();
      if (!$('#r-dt').value) $('#r-dt').value = localNow();
      if (!$('#r-name').value && profile && profile.full_name) $('#r-name').value = profile.full_name;
      try { const n = localStorage.getItem('gyrh-observer'); if (n && !$('#r-name').value) $('#r-name').value = n; } catch (_) { /* yok say */ }
      updateSteps();
    }
    if (name === 'giris') {
      const hashErr = pendingAuthError; pendingAuthError = null;
      setMsg('#auth-note', hashErr || (nextHash ? 'Devam etmek için giriş yap veya kayıt ol.' : ''), 'info');
      if (hashErr) authTab(/süresi dolmuş/.test(hashErr) ? 'forgot' : 'login');
      if (approved.length) renderAboutStats();
      else if (sb) sb.from('reports').select('district, risk_score').eq('status', 'approved')
        .then(({ data }) => { if (data && !approved.length) { const keep = approved; approved = data; renderAboutStats(); approved = keep; } });
    }
    if (name === 'gelen') { mineTab = 'inbox'; loadMine(); }
    if (name === 'bildirimlerim') { if (mineTab === 'inbox') mineTab = 'reports'; loadMine(); }
    if (name === 'harita' && document.documentElement.dataset.ui === 'mobile') setSheet('peek');
    if (name === 'yonetici') loadAdmin();
  }
  function localNow() {
    const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  }

  /* =================== BAŞLANGIÇ =================== */
  function init() {
    // site adı config.js'den (ör. GeoGözcü / GeoSarnıç)
    if (cfg.APP_NAME) {
      $$('[data-appname]').forEach((el) => { el.textContent = cfg.APP_NAME; });
      document.title = cfg.APP_NAME + ' · Gaziemir yangın risk haritası';
    }
    applyTheme();
    savePrefs();
    splitWords();
    buildLegend();
    pendingAuthError = readAuthHashError();
    // bağlantıdan mı geldik? (e-posta bağlantısı / Google)
    if (/access_token=/.test(location.hash)) loginMethod = /provider_token=/.test(location.hash) ? 'Google' : 'E-posta bağlantısı';
    setTimeout(hideSplash, 6000); // ağ çok yavaşsa bile yükleme ekranı sonsuza kadar kalmasın

    // gösterge aç/kapa
    // renk anahtarı her ekranda kapalı başlar (küçük "Risk türleri" hapı); dokununca açılır
    $('#legend').classList.add('closed'); $('#legend-toggle').setAttribute('aria-expanded', 'false');
    if (document.documentElement.dataset.ui === 'mobile') {
      $('#filter-box').open = false;
      $('#legend').classList.add('closed'); $('#legend-toggle').setAttribute('aria-expanded', 'false');
    }
    $('#modal-body').addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.id === 'bp-new') { e.preventDefault(); $('#bp-add').click(); } });
    $('#legend-toggle').addEventListener('click', () => {
      const l = $('#legend'), open = !l.classList.toggle('closed');
      $('#legend-toggle').setAttribute('aria-expanded', String(open));
    });

    // bildirim kutusu: bilgisayarda açılır pencere, telefonda alttan açılan sayfa
    const bellOpen = () => !$('#bell-panel').hidden;
    function setBell(on) {
      show($('#bell-panel'), on); show($('#bell-scrim'), on);
      $('#btn-bell').setAttribute('aria-expanded', String(on));
      document.documentElement.classList.toggle('bell-open', on);
      if (on) {
        $('#bell-list').scrollTop = 0;
        clearTimeout(setBell.t); setBell.t = setTimeout(() => { if (bellOpen()) markRead(myInbox().slice(0, 20).map((n) => n.id)); }, 3000);
      }
    }
    $('#btn-bell').addEventListener('click', (e) => { e.stopPropagation(); setBell(!bellOpen()); });
    $('#bell-x').addEventListener('click', () => setBell(false));
    $('#bell-scrim').addEventListener('click', () => setBell(false));
    $('#bell-all').addEventListener('click', () => setBell(false));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && bellOpen()) setBell(false); });
    window.addEventListener('hashchange', () => { if (bellOpen()) setBell(false); });
    document.addEventListener('click', (e) => {
      const it = e.target.closest('.nitem[data-nid]');
      if (it && it.dataset.nid !== 'onizleme') {
        markRead([it.dataset.nid]);
        if (it.dataset.link) { setBell(false); location.hash = it.dataset.link; }
      }
    });    $('#btn-readall').addEventListener('click', () => markRead(myInbox().map((n) => n.id)));

    // bildirimlerim sekmeleri
    $('#mine-tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-mtab]'); if (b) setMineTab(b.dataset.mtab); });

    // ayarlar
    $('#form-username').addEventListener('submit', onSetUsername);
    $('#form-setpass').addEventListener('submit', onSetPass);
    $('#btn-logout2').addEventListener('click', () => doLogout());
    $('#btn-logout-all').addEventListener('click', () => { if (confirm('Bu hesapla açık olan tüm cihazlardan çıkış yapılsın mı?')) doLogout('global'); });
    $('#btn-delete-me').addEventListener('click', onDeleteMe);
    $('#btn-install2').addEventListener('click', () => maybeShowInstall(true));
    $('#set-mode').addEventListener('click', (e) => { const b = e.target.closest('[data-mode]'); if (b) { theme.mode = b.dataset.mode; applyTheme(); renderSettings(); } });
    $('#set-basemap').addEventListener('click', (e) => {
      const b = e.target.closest('[data-basemap]'); if (!b) return;
      prefs.basemap = b.dataset.basemap; savePrefs(); renderSettings();
      if (mainMap && mainMap._bm) mainMap._bm.set(prefs.basemap);
      toast('Varsayılan harita kaydedildi. Sayfa yenilenince uygulanır.');
    });
    $('#set-lite').addEventListener('click', (e) => {
      const b = e.target.closest('[data-lite]'); if (!b || !window.GGLite) return;
      GGLite.set(b.dataset.lite); renderSettings();
      toast(lite() ? 'Hafif mod açık. Harita ayarlarının tamamı sayfa yenilenince uygulanır.' : 'Tam görünüm açık. Sayfa yenilenince tamamen uygulanır.');
    });
    $('#set-motion').addEventListener('change', (e) => { prefs.motion = e.target.checked ? 'on' : 'off'; savePrefs(); logEvent('settings_update', 'Animasyonlar: ' + (e.target.checked ? 'açık' : 'kapalı')); });
    $('#set-sound').addEventListener('change', (e) => { prefs.sound = e.target.checked ? 'on' : 'off'; savePrefs(); if (e.target.checked) ding(); });
    $('#set-contrast').addEventListener('change', (e) => { theme.contrast = e.target.checked ? 'on' : 'off'; applyTheme(); });

    // şifre göster/gizle, güç, caps lock
    document.addEventListener('click', (e) => {
      const b = e.target.closest('[data-eye]'); if (!b) return;
      const inp = document.getElementById(b.dataset.eye), vis = inp.type === 'password';
      inp.type = vis ? 'text' : 'password';
      b.classList.toggle('on', vis); b.setAttribute('aria-label', vis ? 'Şifreyi gizle' : 'Şifreyi göster');
    });
    bindStrength('s-pass', 's-strength');
    bindStrength('set-pass', 'set-strength');
    $('#l-pass').addEventListener('keyup', (e) => show($('#caps'), e.getModifierState && e.getModifierState('CapsLock')));
    try { const lm = localStorage.getItem('gyrh-last-mail'); if (lm) { $('#l-mail').value = lm; $('#ml-mail').value = lm; } } catch (_) { /* yok say */ }

    // yönetici: kayıtlar ve bildirim formu (içerik sonradan çizildiği için olay devri)
    $('#admin-body').addEventListener('input', (e) => {
      if (e.target.id === 'log-q') { clearTimeout(logFilt.t); logFilt.t = setTimeout(() => { logFilt.q = e.target.value.trim(); renderAdminLogs(); $('#log-q').focus(); }, 300); }
      if (['n-title', 'n-body'].includes(e.target.id)) renderNotifyPreview();
      if (e.target.id === 'u-search') { clearTimeout(admin.ut); admin.ut = setTimeout(() => { admin.uq = e.target.value.trim(); renderAdmin(); }, 200); }
    });
    $('#admin-body').addEventListener('change', (e) => {
      if (e.target.id === 'log-action') { logFilt.action = e.target.value; renderAdminLogs(); }
      if (e.target.id === 'n-to' || e.target.name === 'nkind') renderNotifyPreview();
      if (e.target.id === 'u-filter') { admin.uf = e.target.value; renderAdmin(); }
    });
    $('#admin-body').addEventListener('submit', async (e) => {
      if (e.target.id === 'form-notify') onNotifySubmit(e);
    });
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (theme.mode === 'auto') applyTheme(); });
    show($('#setup-banner'), !configured);

    // tema menüsü
    $('#btn-theme').addEventListener('click', () => {
      const m = $('#theme-menu'); m.hidden = !m.hidden;
      $('#btn-theme').setAttribute('aria-expanded', String(!m.hidden));
    });
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#theme-menu') && !e.target.closest('#btn-theme')) {
        $('#theme-menu').hidden = true; $('#btn-theme').setAttribute('aria-expanded', 'false');
      }
    });
    $('#mode-chips').addEventListener('click', (e) => { const b = e.target.closest('[data-mode]'); if (b) { theme.mode = b.dataset.mode; applyTheme(); } });
    $('#accent-swatches').addEventListener('click', (e) => { const b = e.target.closest('[data-accent]'); if (b) { theme.accent = b.dataset.accent; applyTheme(); } });
    $('#chk-contrast').addEventListener('change', (e) => { theme.contrast = e.target.checked ? 'on' : 'off'; applyTheme(); });

    // mahalleler

    // harita filtreleri
    $('#f-cat').innerHTML = '<button type="button" class="chip on" data-cat="all">Tümü</button>' +
      Object.entries(CATS).map(([k, c]) => '<button type="button" class="chip" data-cat="' + k + '" data-css="--c:' + c.color + '"><span class="dot"></span>' + esc(c.short) + '</button>').join('');
    $('#f-cat').addEventListener('click', (e) => {
      const b = e.target.closest('[data-cat]'); if (!b) return;
      filt.cat = b.dataset.cat;
      $$('#f-cat .chip').forEach((x) => x.classList.toggle('on', x === b));
      fillSubFilter(); renderMap({ fit: true });
    });
    fillSubFilter();
    $('#f-sub').addEventListener('change', (e) => { filt.sub = e.target.value; renderMap({ fit: true }); });
    $('#f-hood').addEventListener('change', (e) => { filt.hood = e.target.value; renderMap({ fit: true }); });
    $('#f-level').addEventListener('click', (e) => {
      const b = e.target.closest('[data-level]'); if (!b) return;
      filt.level = b.dataset.level;
      $$('#f-level .chip').forEach((x) => x.classList.toggle('on', x === b));
      renderMap({ fit: true });
    });
    $('#f-days').addEventListener('click', (e) => {
      const b = e.target.closest('[data-days]'); if (!b) return;
      filt.days = Number(b.dataset.days);
      $$('#f-days .chip').forEach((x) => x.classList.toggle('on', x === b));
      renderMap({ fit: true });
    });
    $('#f-open').addEventListener('change', (e) => {
      filt.open = e.target.checked; renderMap({ fit: true });
      // hiç kapanmış kayıt yoksa liste değişmez; kullanıcı bunun hata olmadığını bilsin
      if (filt.open && !approved.some((r) => r.resolved_at || r.fix_flagged_at)) toast('Şu an çözülmüş ya da “düzelmiş olabilir” işaretli bildirim yok; listedekilerin hepsi hâlâ açık.');
    });
    $('#f-view').addEventListener('change', (e) => { filt.view = e.target.checked; renderList(); });
    $('#f-reset').addEventListener('click', (e) => { e.preventDefault(); resetFilters(); });
    $('#btn-near').addEventListener('click', showNearby);
    $('#pj-csv').addEventListener('click', exportOpenCsv);
    $('#pj-geo').addEventListener('click', exportGeoJson);
    // proje sayfası içindekiler: adres çubuğu (#/proje) bozulmadan bölüme kaydır
    $('.proj-toc').addEventListener('click', (e) => { const a = e.target.closest('[data-jump]'); if (!a) return; e.preventDefault(); const t = $(a.getAttribute('href')); if (t) t.scrollIntoView({ behavior: calm() ? 'auto' : 'smooth', block: 'start' }); });
    document.addEventListener('click', (e) => { const b = e.target.closest('[data-photos]'); if (b) { e.preventDefault(); openPhotoEditor(b.dataset.photos); } });
    $('#near-x').addEventListener('click', clearNearby);
    document.addEventListener('click', (e) => { if (e.target.closest('[data-reset-filters]')) resetFilters(); });
    let st; $('#f-search').addEventListener('input', (e) => { clearTimeout(st); st = setTimeout(() => { filt.q = e.target.value.trim(); renderMap({ fit: true }); }, 250); });

    // form
    buildCatPicker();
    $('#report-form').addEventListener('change', () => { updateScore(); updateSteps(); });
    $('#report-form').addEventListener('change', (e) => { const f = e.target.closest('fieldset'); if (f) f.classList.remove('need'); });
    $('#r-name').addEventListener('input', updateSteps);
    $('#r-name').addEventListener('change', (e) => { try { localStorage.setItem('gyrh-observer', e.target.value.trim()); } catch (_) { /* yok say */ } });
    $('#report-form').addEventListener('submit', onReport);
    $('#r-photo').addEventListener('change', (e) => { addFiles(e.target.files); e.target.value = ''; });
    $('#photo-list').addEventListener('click', (e) => {
      const b = e.target.closest('[data-rm]'); if (!b) return;
      const i = Number(b.dataset.rm);
      URL.revokeObjectURL(shots[i].url); shots.splice(i, 1); renderShots();
    });
    $('#btn-locate').addEventListener('click', () => {
      const btn = $('#btn-locate');
      if (btn.getAttribute('aria-busy') === 'true') return;
      if (!window.isSecureContext) return toast('Konum yalnızca güvenli (https) bağlantıda alınabilir. Haritaya dokunarak nokta seç.');
      if (!navigator.geolocation) return toast('Tarayıcın konum özelliğini desteklemiyor. Haritaya dokunarak nokta seç.');
      btn.setAttribute('aria-busy', 'true'); $('#pick-info').textContent = 'Konumun alınıyor…';
      const done = () => btn.removeAttribute('aria-busy');
      navigator.geolocation.getCurrentPosition(
        (p) => { done(); setPicked(p.coords.latitude, p.coords.longitude, 18); },
        (err) => {
          done();
          const why = err && err.code === 1 ? 'Konum izni verilmedi. Tarayıcı ayarlarından bu siteye konum izni ver ya da haritaya dokun.'
            : err && err.code === 3 ? 'Konum zamanında alınamadı (zayıf sinyal). Tekrar dene ya da haritaya dokun.'
              : 'Konum bulunamadı. Cihazının konum servisini aç ya da haritaya dokun.';
          $('#pick-info').textContent = why; toast(why);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 });
    });

    // kayıt / giriş
    $('#tab-signup').addEventListener('click', () => authTab('signup'));
    $('#tab-login').addEventListener('click', () => authTab('login'));
    $$('[data-google]').forEach((b) => b.addEventListener('click', onGoogle));
    document.addEventListener('pointerdown', ripple);
    $('#form-signup').addEventListener('submit', onSignup);
    $('#form-login').addEventListener('submit', onLogin);
    $('#form-verify').addEventListener('submit', onVerify);
    $('#btn-resend').addEventListener('click', onResend);
    $('#btn-check-now').addEventListener('click', () => checkConfirmed(true));
    document.addEventListener('click', (e) => { const l = e.target.closest('[data-legal]'); if (l) { e.preventDefault(); openLegal(l.dataset.legal); } });
    // harita balonundaki 👍 / 👎 oylama
    // capture: Leaflet balonları tıklamanın sayfaya ulaşmasını durdurduğu için oylar balonda çalışmıyordu
    document.addEventListener('click', (e) => { const v = e.target.closest('[data-vote]'); if (v && !v.disabled) { e.preventDefault(); onVote(v); } }, true);
    $('#btn-forgot').addEventListener('click', () => authTab('forgot'));
    $('#btn-maillogin').addEventListener('click', () => authTab('maillogin'));
    $('#form-forgot').addEventListener('submit', onForgot);
    $('#form-maillogin').addEventListener('submit', onMailLogin);
    $('#form-reset').addEventListener('submit', onReset);
    $('#form-reset-again').addEventListener('submit', onResetAgain);
    bindStrength('rs-pass', 'rs-strength');
    $$('[data-back]').forEach((b) => b.addEventListener('click', () => authTab(b.dataset.back)));
    $('#accent-custom').addEventListener('input', (e) => { theme.accent = 'custom'; theme.custom = e.target.value; applyTheme(); });
    $('#btn-logout').addEventListener('click', () => doLogout());

    // yönetici
    $('#admin-tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (b) { admin.tab = b.dataset.tab; renderAdmin(); } });
    $('#a-cat').innerHTML = '<option value="all">Tüm kategoriler</option>' +
      Object.entries(CATS).map(([k, c]) => '<option value="' + k + '">' + esc(c.short) + '</option>').join('');
    $('#a-cat').addEventListener('change', (e) => { admin.cat = e.target.value; renderAdmin(); });
    $('#a-sort').addEventListener('change', (e) => { admin.sort = e.target.value; renderAdmin(); });
    let at; $('#a-search').addEventListener('input', (e) => { clearTimeout(at); at = setTimeout(() => { admin.q = e.target.value.trim(); renderAdmin(); }, 250); });
    $('#admin-body').addEventListener('click', onAdminAction);
    $('#mine-list').addEventListener('click', (e) => {
      const row = e.target.closest('[data-mine]'); if (!row) return;
      const r = mineReports.find((x) => x.id === row.dataset.mine); if (r) openReport(r);
    });
    $('#rv-body').addEventListener('click', onOwnerAction);
    $('#admin-body').addEventListener('focusout', saveNote);
    $('#btn-export').addEventListener('click', exportCsv);
    $('#btn-refresh').addEventListener('click', loadAdmin);

    // fotoğraf büyütme
    document.addEventListener('click', (e) => {
      const img = e.target.closest('[data-full]');
      if (img) { $('#lb-img').src = img.dataset.full; $('#lightbox').hidden = false; }
    }, true);
    const closeLb = () => { $('#lightbox').hidden = true; $('#lb-img').src = ''; };
    $('#lightbox').addEventListener('click', closeLb);
    $('#lb-close').addEventListener('click', closeLb);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLb(); });

    // Açılış harita sayfası değilse ana harita gizli kurulur: görünmeyen haritanın karoları indirilmez
    // (ana sayfa ilk açılışta ~40 uydu karosu / ~400 KB hafifler). Harita sayfası açılınca boyut alıp yüklenir.
    const startName = (location.hash.match(/^#\/([^/?]+)/) || [])[1];
    if (startName && startName !== 'harita' && ROUTES[startName]) $('#view-map').hidden = true;
    initMainMapSafe();
    bindSheet();
    // telefondaki bildirim ayrıntısı: Kapat düğmesi, boş alana dokunma, Esc, sayfa değişince
    $('#rv-close').addEventListener('click', closeReport);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && openRid && $('#lightbox').hidden) closeReport(); });
    $('#rv-body').addEventListener('click', (e) => {
      if (e.target.closest('a[href^="#/"]')) return closeReport();
      const mb = e.target.closest('[data-rvmap]'); if (!mb) return;
      const r = approved.find((x) => x.id === mb.dataset.rvmap); closeReport();
      if (r) mainMap.flyTo([r.lat, r.lng], 17, { duration: calm() ? 0 : 0.8 });
    });
    window.addEventListener('hashchange', closeReport);
    bindInstall();
    // pencere, yasak ekranı
    $('#modal-x').addEventListener('click', closeModal);
    $('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#modal').hidden) closeModal(); });
    $('#modal-body').addEventListener('submit', (e) => { e.preventDefault(); if (modalSubmit) modalSubmit(); });
    $('#modal-body').addEventListener('click', async (e) => {
      // "Kullanıcıyı yönet" penceresindeki işlemler yönetici panelindeki aynı işlevleri kullanır
      if (e.target.closest('.mlist [data-tags], .mlist [data-rename], .mlist [data-notifyuser], .mlist [data-devices], .mlist [data-admintoggle], .mlist [data-ban], .mlist [data-unbanuser], .mlist [data-pwreset], .mlist [data-deluser]')) return onAdminAction(e);
      if (e.target.closest('.mlist a')) return closeModal();
      if (e.target.id === 'bp-add') {
        const v = $('#bp-new').value.trim().replace(/\s+/g, ' ');
        if (v.length < 2) return toast('Rozet adı en az 2 karakter olmalı.');
        if ($$('#bp-list input').some((i) => i.value.toLocaleLowerCase('tr-TR') === v.toLocaleLowerCase('tr-TR'))) return toast('Bu rozet zaten listede.');
        $('#bp-list').insertAdjacentHTML('beforeend', '<label class="bp new"><input type="checkbox" value="' + esc(v) + '" checked>' +
          '<span class="bdg custom"><i>🏷️</i><span>' + esc(v) + '</span></span><small class="muted">Özel rozet (kaydedince uygunluk denetlenir)</small></label>');
        $('#bp-new').value = ''; return;
      }
      const d = e.target.closest('[data-bandev], [data-banip]'); if (!d) return;
      const row = d.dataset.bandev ? { device_id: d.dataset.bandev } : { ip: d.dataset.banip };
      const reason = prompt('Kısıtlama sebebi (isteğe bağlı):', '') ;
      if (reason === null) return;
      const { data, error } = await sb.from('bans').insert(Object.assign(row, { reason: reason || null })).select().single();
      if (error) return toast('Kısıtlanamadı: ' + error.message);
      adminBans.push(data); d.outerHTML = '<span class="tag rejected">' + (row.ip ? 'IP' : 'Cihaz') + ' kısıtlı</span>';
      toast('Kısıtlandı.');
    });
    $('#ban-ok').addEventListener('click', () => { show($('#ban-screen'), false); if (location.hash !== '#/harita') location.hash = '#/harita'; });
    $('#ban-banner').addEventListener('click', () => show($('#ban-screen'), true));
    $('#ban-logout').addEventListener('click', async () => { show($('#ban-screen'), false); await doLogout(); liftBanLocally(); recheckBan(); });
    // bakım ve ban durumu: 30 sn'de bir ve sekmeye dönünce kontrol
    checkMaint();
    setInterval(() => { checkMaint(); recheckBan(); }, 30000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) { checkMaint(); recheckBan(); } });
    $('#maint-admin').addEventListener('click', () => { maintAdminLogin = true; location.hash = '#/giris'; applyMaint(); });
    window.addEventListener('hashchange', applyMaint);
    $('#success').addEventListener('click', (e) => { if (e.target.closest('a') || e.target.id === 'success') closeSuccess(); });
    $('#sx-again').addEventListener('click', () => { closeSuccess(); setTimeout(() => window.scrollTo(0, 0), 50); });

    // lider tablosu
    $('#lb-cat').innerHTML = '<button type="button" class="chip on" data-lcat="all">Hepsi</button>' +
      Object.entries(CATS).map(([k, c]) => '<button type="button" class="chip" data-lcat="' + k + '">' + c.ico + ' ' + esc(c.short) + '</button>').join('');
    $('#lb-period').addEventListener('click', (e) => { const b = e.target.closest('[data-period]'); if (!b) return;
      lb.period = b.dataset.period; $$('#lb-period .chip').forEach((x) => x.classList.toggle('on', x === b)); loadLeaders(); });
    $('#lb-cat').addEventListener('click', (e) => { const b = e.target.closest('[data-lcat]'); if (!b) return;
      lb.cat = b.dataset.lcat; $$('#lb-cat .chip').forEach((x) => x.classList.toggle('on', x === b)); loadLeaders(); });

    // profil düzenleyici
    $('#av-file').addEventListener('change', onAvatarFile);
    $('#av-clear').addEventListener('click', () => { avDraft.url = null; renderAvatarPreview(); });
    $('#av-emoji').addEventListener('click', (e) => { const b = e.target.closest('[data-e]'); if (!b) return; avDraft.emoji = b.dataset.e; avDraft.url = null; renderAvatarPreview(); });
    $('#av-color').addEventListener('click', (e) => { const b = e.target.closest('[data-c]'); if (!b) return; avDraft.color = b.dataset.c; renderAvatarPreview(); });
    $('#av-save').addEventListener('click', onAvatarSave);

    // ayarlar: kullanıcı adı, bildirimler, yardım
    $('#set-user').addEventListener('input', liveCheckUsername);
    $('#n-push').addEventListener('change', onPushToggle);
    $('#n-email').addEventListener('change', (e) => saveSettings({ notify_email: e.target.checked }));
    $('#n-system').addEventListener('change', (e) => { saveSettings({ notify_system: e.target.checked }); setTimeout(renderBell, 50); });
    $('#n-test').addEventListener('click', async () => {
      const n = { id: 'test-' + Date.now(), title: 'Deneme bildirimi 🔔', body: 'Bildirimler çalışıyor!', kind: 'info', link: '#/gelen' };
      toast('🔔 ' + n.title); ding();
      if (pushAllowed()) {
        try { const reg = await navigator.serviceWorker.getRegistration(); if (reg) reg.showNotification(n.title, { body: n.body, icon: 'icons/icon-192.png' }); else new Notification(n.title, { body: n.body }); } catch (_) { /* yok say */ }
      } else toast('Telefon/bilgisayar bildirimi için önce “Anlık bildirimler”i aç.');
    });
    $('#guide').innerHTML = accordion(GUIDE);
    $('#faq').innerHTML = accordion(FAQ);
    $('#btn-tour').addEventListener('click', startOnboarding);

    // karşılama ekranları ve tur
    $('#wl-next').addEventListener('click', () => { if (wlIdx < SLIDES.length - 1) { wlIdx++; renderSlide(); } else endWelcome(true); });
    $('#wl-prev').addEventListener('click', () => { if (wlIdx > 0) { wlIdx--; renderSlide(); } });
    $('#wl-skip').addEventListener('click', () => endWelcome(false));
    $('#btn-mytags').addEventListener('click', () => { if (profile && profile.is_admin) openTagsModal(Object.assign({}, profile, { email: session.user.email })); });
    $('#home-down').addEventListener('click', () => $('#home-more').scrollIntoView({ behavior: calm() ? 'auto' : 'smooth' }));
    $('#quest-x').addEventListener('click', () => { if (session) safe(() => localStorage.setItem('gyrh-q-dismiss-' + session.user.id, '1')); show($('#quest'), false); toast('Görevler gizlendi. Ayarlar → Yardım merkezi’nden tekrar açabilirsin.'); });
    $('#btn-quest-show').addEventListener('click', () => { if (session) safe(() => localStorage.removeItem('gyrh-q-dismiss-' + session.user.id)); qSet('seen'); renderQuest(); location.hash = '#/harita'; });
    document.addEventListener('keydown', (e) => {
      if ($('#welcome').hidden) return;
      if (e.key === 'ArrowRight') $('#wl-next').click();
      else if (e.key === 'ArrowLeft') $('#wl-prev').click();
      else if (e.key === 'Escape') endWelcome(false);
    });
    $('#wl-dots').addEventListener('click', (e) => { const d = e.target.closest('[data-i]'); if (d) { wlIdx = Number(d.dataset.i); renderSlide(); } });
    let wx = null;
    $('#welcome').addEventListener('touchstart', (e) => { wx = e.touches[0].clientX; }, { passive: true });
    $('#welcome').addEventListener('touchend', (e) => {
      if (wx === null) return; const dx = e.changedTouches[0].clientX - wx; wx = null;
      if (dx < -50 && wlIdx < SLIDES.length - 1) { wlIdx++; renderSlide(); } else if (dx > 50 && wlIdx > 0) { wlIdx--; renderSlide(); }
    }, { passive: true });
    $('#tour-next').addEventListener('click', () => { tourIdx++; goTourStep(); });
    $('#tour-prev').addEventListener('click', () => { if (tourIdx > 0) { tourIdx--; goTourStep(); } });
    $('#tour-skip').addEventListener('click', endTour);
    window.addEventListener('resize', () => { if (!$('#tour').hidden && tourList[tourIdx]) placeTour(tourList[tourIdx]); });

    // herkese açık profil
    $('#pp-body').addEventListener('click', (e) => {
      if (e.target.closest('#pp-report')) return openReportUser();
      const it = e.target.closest('[data-focus]');
      if (it) { e.preventDefault(); const id = it.dataset.focus; location.hash = '#/harita'; setTimeout(() => { const r = approved.find((x) => x.id === id); if (r) focusReport(r); }, 900); }
    });

    $('#btn-forgot2').addEventListener('click', () => { $('#fg-mail').value = $('#l-mail').value; authTab('forgot'); });
    $('#l-remember').checked = remembering();

    // fotoğrafı sürükleyip bırakma (bilgisayar)
    const drop = $('.drop');
    ['dragenter', 'dragover'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add('over'); }));
    ['dragleave', 'drop'].forEach((t) => drop.addEventListener(t, () => drop.classList.remove('over')));
    drop.addEventListener('drop', (e) => { e.preventDefault(); if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files); });

    // beklenmeyen bir hata olursa kullanıcı sessizce takılı kalmasın
    window.addEventListener('unhandledrejection', (e) => {
      console.error(e.reason);
      const m = String((e.reason && e.reason.message) || e.reason || '');
      toast(/fetch|network/i.test(m) ? 'Bağlantı hatası. İnternetini kontrol edip tekrar dene.' : '⚠️ Bir hata oluştu: ' + m.slice(0, 120));
    });

    if (sb) {
      checkGoogle(); // Google düğmesi yalnızca Supabase'de Google girişi açıksa görünür
      let lastUid = null;
      // Oturum açıldı/kapandı: profil, zil ve günlük işleri
      const onUser = async () => {
        const uid = session ? session.user.id : null;
        const changed = uid !== lastUid; lastUid = uid;
        await loadProfile();
        applyMaint();
        if (changed && uid) {
          loadInbox(); subscribeInbox();
          sb.rpc('touch_last_seen', { p_label: DEVICE.label }).then(({ data }) => { if (data) showBan(data); });
          if (loginMethod) { logEvent('login', loginMethod); loginMethod = null; }
          loadMyTags();
          maybeOnboard();
        }
        if (changed && !uid) { unsubscribeInbox(); renderBell(); }
        return changed;
      };
      sb.auth.onAuthStateChange((evt, s) => {
        session = s;
        if (evt === 'PASSWORD_RECOVERY') {
          recovering = true; resetMark(true);
          setTimeout(() => { if (location.hash === '#/sifre-yenile') route(); else location.hash = '#/sifre-yenile'; }, 0);
          return;
        }
        if (evt === 'TOKEN_REFRESHED' || evt === 'INITIAL_SESSION') return; // sayfayı boşuna yeniden çizme
        setTimeout(async () => { if (await onUser() || evt === 'USER_UPDATED') route(); }, 0);
      });
      splashMsg('Oturum kontrol ediliyor…');
      sb.auth.getSession().then(async ({ data }) => {
        session = data.session;
        await onUser();
        if (!session) sb.rpc('my_ban').then(({ data: b }) => { if (b) showBan(b); }); // IP/cihaz yasağı
        splashMsg('Bildirimler yükleniyor…');
        route();
        setTimeout(hideSplash, 500);
      });
    } else { updateNav(); route(); hideSplash(); }
    window.addEventListener('hashchange', route);
  }

  function initMainMapSafe() {
    mainMap = makeMap('map');
    // Yakın pinler kümelenir; eklenti yüklenemezse düz katmana döner
    markerLayer = (L.markerClusterGroup ? L.markerClusterGroup({
      showCoverageOnHover: false, maxClusterRadius: (z) => (z < 13 ? 60 : 40), spiderfyOnMaxZoom: true,
      chunkedLoading: true, chunkInterval: 120, chunkDelay: 30, removeOutsideVisibleBounds: true,
      disableClusteringAtZoom: 18, animateAddingMarkers: false,
      iconCreateFunction: (cl) => {
        const n = cl.getChildCount();
        // kümenin içindeki en yüksek risk rengi belirler
        const max = cl.getAllChildMarkers().reduce((m, x) => Math.max(m, x._risk || 0), 0);
        const sz = n < 10 ? 40 : n < 100 ? 48 : 58;
        return L.divIcon({ className: 'cluster lv-' + level(max), html: '<span>' + n + '</span>', iconSize: [sz, sz] });
      },
    }) : L.layerGroup()).addTo(mainMap);
    // Araç çubuğu (arama, konum, mesafe, alan, koordinat) ve uygulama kancaları
    window.GGMap.addToolbar(mainMap);
    GG.configure({
      toast,
      bounds: SIN ? L.latLngBounds(SIN.izmir.flat()) : null,
      onBasemap: (k) => { prefs.basemap = k; savePrefs(); },
      onNearby: showNearby,
      inArea: (lat, lng) => inIzmir(lat, lng),
      onReportHere: () => { if (!session) { nextHash = '#/bildir'; toast('Bildirim için önce giriş yap; nokta hatırlanacak.'); location.hash = '#/giris'; } else location.hash = '#/bildir'; },
      searchLocal: (q) => {
        const n = norm(q).trim();
        const seen = new Set(), out = [];
        approved.forEach((r) => {
          const hood = r.neighborhood || r.district;
          if (hood && !seen.has(hood) && norm(hood).includes(n)) { seen.add(hood); out.push({ label: hood, sub: 'Bildirim olan mahalle', lat: r.lat, lng: r.lng, zoom: 15, kind: 'report' }); }
          if (norm(subLabel(r)).includes(n) && out.length < 6) out.push({ label: subLabel(r), sub: placeOf(r) + ' · risk ' + (r.risk_score || 0), lat: r.lat, lng: r.lng, zoom: 18, kind: 'report' });
        });
        return out;
      },
    });
    // "sadece ekrandaki alan" filtresi ve büyük veri modunda kaydırınca güncelle
    let mvT = null;
    mainMap.on('moveend', () => {
      clearTimeout(mvT);
      mvT = setTimeout(() => {
        if (filt.view) renderList();
        if (bboxMode) loadApproved();
      }, 400);
    });
    // bir bildirim balonu açılınca gösterge onu kapatmasın
    mainMap.on('popupopen', (e) => {
      qSet('explore');
      // telefonda küçük balon yerine tam ekran ayrıntı açılır
      if (document.documentElement.dataset.ui === 'mobile') {
        const rid = e.popup._source && e.popup._source._rid, r = approved.find((x) => x.id === rid);
        mainMap.closePopup();
        if (r) { if (document.documentElement.dataset.ui === 'mobile') setSheet('peek'); openReport(r); }
        return;
      }
      if (window.innerWidth < 1000) { $('#legend').classList.add('closed'); $('#legend-toggle').setAttribute('aria-expanded', 'false'); }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
