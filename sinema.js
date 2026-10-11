// GeoGözcü · hareket katmanı (GSAP + ScrollTrigger + SplitText)
// 1) Ana sayfa girişi: başlık satır satır, eş yükselti çizgileri, imleci izleyen ışık, kayan şerit
// 2) "Rehber": video gibi oynayan, bölümlü, istenirse sesli anlatımlı tanıtım (ana sayfa + proje sayfası)
// 3) Kaydırınca beliren bölümler
// Kütüphane yüklenemezse ya da kullanıcı "az hareket" seçtiyse site olduğu gibi çalışır.
(function () {
  'use strict';
  const g = window.gsap;
  const root = document.documentElement;
  const calm = () => root.dataset.motion === 'calm' || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* =================== REHBER: sahneler =================== */
  // Sahne metinleri: [bölüm, altyazı başlığı, altyazı, sesli anlatım metni]
  // Sesli metin kulağa doğal gelsin diye ayrı yazıldı (sayılar okunuşuyla, virgüller nefes yeri).
  const CH = [
    ['Sorun', 'Gaziemir’de evler ormana dayanıyor.', 'Kuru ot, budama atığı ve cam şişe; tek bir kıvılcımı yangına çevirebilir.',
      'Gaziemir’de evler ormana dayanıyor. Kuru ot, budama atığı ya da bir cam şişe, tek bir kıvılcımı yangına çevirebilir.'],
    ['Gözlem', 'Gören, fotoğraflar.', 'Gönüllü riski güvenli bir mesafeden çeker. Konum, ilçe ve mahalle kendiliğinden bulunur.',
      'Riski gören, güvenli bir mesafeden fotoğrafını çeker. Konum, ilçe ve mahalle kendiliğinden bulunur.'],
    ['Puan', 'Aynı sorular, karşılaştırılabilir puan.', 'Bitki örtüsü, ormana uzaklık, eğim, su kaynağı ve itfaiye erişimi 0-100 arası risk puanına dönüşür.',
      'Herkes aynı soruları yanıtlar. Bitki örtüsü, ormana uzaklık, eğim, su kaynağı ve itfaiye erişimi; sıfırdan yüze bir risk puanına dönüşür.'],
    ['Harita', 'Her gözlem haritaya düşer.', 'Noktalar mahalle mahalle birikir; riskin nerede yoğunlaştığı yangından önce görünür.',
      'Her gözlem haritaya düşer. Noktalar mahalle mahalle birikir; riskin nerede yoğunlaştığı, yangından önce görünür.'],
    ['Takip', 'Birlikte takip ederiz.', 'Oradan geçenler “düzeldi mi?” diye oy verir; yöneticiler sahayı kontrol eder.',
      'Oradan geçenler, sorun düzeldi mi diye oy verir. Yöneticiler de sahayı kontrol eder.'],
    ['Sen', 'Mahalleni sen koru.', 'Haritayı aç, gördüğün riski ekle. Acil durumda önce 112.',
      'Mahalleni sen koru. Haritayı aç, gördüğün riski ekle. Acil bir durumda ise, önce yüz on ikiyi ara.'],
  ];
  // En doğal Türkçe sesi seç (Edge'in "Natural/Online" sesleri > Google > diğerleri)
  let VOICE = null;
  function pickVoice() {
    if (!window.speechSynthesis) return;
    const tr = speechSynthesis.getVoices().filter((v) => /^tr/i.test(v.lang));
    const rank = (v) => (/natural|neural/i.test(v.name) ? 3 : /online|google/i.test(v.name) ? 2 : v.localService ? 1 : 0);
    VOICE = tr.sort((a, b) => rank(b) - rank(a))[0] || null;
  }
  if (window.speechSynthesis) { pickVoice(); speechSynthesis.addEventListener && speechSynthesis.addEventListener('voiceschanged', pickVoice); }
  // Haritada gösterilecek noktalar: canlı veriden gelir, gelene kadar saha gözlemlerinin yaklaşık konumları
  let PTS = window.GGPoints && window.GGPoints.length ? window.GGPoints : [[38.3093, 27.1432, 21], [38.3096, 27.1709, 17], [38.3090, 27.1744, 31], [38.3015, 27.1799, 31], [38.2994, 27.1813, 28],
    [38.2980, 27.1823, 31], [38.2958, 27.1864, 35], [38.2907, 27.1889, 14], [38.2911, 27.1889, 31], [38.2921, 27.1879, 14],
    [38.3041, 27.1783, 35], [38.3057, 27.1801, 28], [38.3048, 27.1803, 28], [38.3079, 27.1784, 31], [38.3101, 27.1702, 18], [38.3167, 27.1333, 31]];
  const lvlColor = (s) => (s >= 67 ? '#F04438' : s >= 34 ? '#F5A524' : '#4ADE80');

  // Gaziemir sınırını sahneye yerleştir
  function districtGeom() {
    const S = window.SINIRLAR;
    const rings = S && S.gaziemir && S.gaziemir.length ? S.gaziemir : [[[38.345, 27.10], [38.345, 27.21], [38.27, 27.21], [38.27, 27.10]]];
    let n = -90, s = 90, w = 180, e = -180;
    rings.flat().forEach(([la, lo]) => { n = Math.max(n, la); s = Math.min(s, la); w = Math.min(w, lo); e = Math.max(e, lo); });
    const k = Math.cos((n + s) / 2 * Math.PI / 180);
    const bw = (e - w) * k, bh = n - s, box = { x: 470, y: 150, w: 660, h: 620 };
    const sc = Math.min(box.w / bw, box.h / bh), ox = box.x + (box.w - bw * sc) / 2, oy = box.y + (box.h - bh * sc) / 2;
    const P = (la, lo) => [ox + (lo - w) * k * sc, oy + (n - la) * sc];
    const d = rings.map((r) => 'M' + r.map(([la, lo]) => P(la, lo).map((v) => v.toFixed(1)).join(' ')).join('L') + 'Z').join('');
    return { d, P };
  }

  function stageSvg() {
    const trees = [];
    for (let i = 0; i < 26; i++) {
      const x = 40 + i * 44 + (i % 3) * 9, h = 120 + ((i * 37) % 70), y = 560 - ((i * 23) % 40) - (i < 13 ? 40 : 0);
      trees.push('<path class="tr" d="M' + x + ' ' + (y - h) + 'L' + (x + 34) + ' ' + y + 'L' + (x - 34) + ' ' + y + 'Z"/>');
    }
    const grass = [];
    for (let i = 0; i < 46; i++) {
      const x = 560 + (i * 19) % 600 + (i % 4) * 4, y = 640 + ((i * 29) % 90), h = 22 + (i * 13) % 26;
      grass.push('<path class="gr" d="M' + x + ' ' + y + 'q' + (4 - (i % 3) * 4) + ' -' + h + ' ' + (10 - (i % 5) * 4) + ' -' + (h + 8) + '"/>');
    }
    const houses = [[1180, 600], [1290, 620], [1400, 596], [1500, 628]].map(([x, y]) =>
      '<g class="hs"><rect x="' + x + '" y="' + (y - 70) + '" width="90" height="70" rx="4"/><path d="M' + (x - 8) + ' ' + (y - 66) + 'L' + (x + 45) + ' ' + (y - 112) + 'L' + (x + 98) + ' ' + (y - 66) + 'Z"/><rect class="win" x="' + (x + 30) + '" y="' + (y - 48) + '" width="26" height="22" rx="2"/></g>').join('');
    const { d } = districtGeom();
    return '<svg class="gd-svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
      '<defs><radialGradient id="gd-glow"><stop offset="0" stop-color="#FFB347" stop-opacity=".95"/><stop offset=".4" stop-color="#FF6A1A" stop-opacity=".45"/><stop offset="1" stop-color="#FF4D00" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="gd-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0B1410"/><stop offset=".7" stop-color="#18261F"/><stop offset="1" stop-color="#2A2116"/></linearGradient>' +
      '<pattern id="gd-grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="rgba(255,255,255,.05)"/></pattern></defs>' +
      '<rect width="1600" height="900" fill="url(#gd-sky)"/>' +
      // 1: arazi
      '<g class="s-land"><path class="hill2" d="M0 520Q260 380 520 470T1060 430T1600 480V900H0Z"/>' +
      '<g class="trees">' + trees.join('') + '</g>' +
      '<path class="hill1" d="M0 600Q300 540 640 600T1600 590V900H0Z"/>' +
      '<g class="houses">' + houses + '</g><g class="grass">' + grass.join('') + '</g>' +
      '<g class="litter"><rect x="742" y="690" width="12" height="30" rx="3" transform="rotate(-24 748 705)"/><rect x="880" y="702" width="11" height="26" rx="3" transform="rotate(58 885 715)"/></g>' +
      '<g class="spark"><circle cx="820" cy="676" r="90" fill="url(#gd-glow)"/><circle class="core" cx="820" cy="676" r="7"/></g>' +
      '<g class="pin1"><path d="M820 540c-26 0-46 20-46 46 0 34 46 78 46 78s46-44 46-78c0-26-20-46-46-46z"/><circle cx="820" cy="586" r="16"/></g>' +
      '<g class="tag1"><rect x="880" y="530" width="300" height="70" rx="14"/><text x="902" y="560" class="t-b">Hürriyet Mahallesi</text><text x="902" y="584" class="t-s">Gaziemir · 38.3015, 27.1799</text></g></g>' +
      // 2: telefon
      '<g class="s-phone"><rect class="ph" x="250" y="170" width="300" height="600" rx="42"/><rect class="ph-scr" x="266" y="214" width="268" height="512" rx="26"/>' +
      '<g class="vf"><path d="M300 300h40M300 300v40M500 300h-40M500 300v40M300 640h40M300 640v-40M500 640h-40M500 640v-40"/><circle cx="400" cy="470" r="34"/></g>' +
      '<circle class="shutter" cx="400" cy="690" r="22"/><rect class="flash" x="266" y="214" width="268" height="512" rx="26"/></g>' +
      // 3: puan kartı
      '<g class="s-card"><rect class="cd" x="900" y="160" width="560" height="580" rx="30"/>' +
      '<text x="944" y="222" class="t-k">RİSK PUANI · ORMAN YANGINI</text>' +
      [['Kuru bitki örtüsü', 'Yoğun', '+28'], ['Orman kenarına uzaklık', '0-50 m', '+25'], ['Arazi eğimi', 'Orta', '+7'], ['Su kaynağı / hidrant', 'Yok', '+12']].map(([a, b, c], i) =>
        '<g class="q"><text x="944" y="' + (290 + i * 62) + '" class="t-s">' + a + '</text><text x="944" y="' + (316 + i * 62) + '" class="t-b">' + b + '</text><text x="1416" y="' + (306 + i * 62) + '" class="t-p" text-anchor="end">' + c + '</text></g>').join('') +
      '<rect x="944" y="560" width="472" height="12" rx="6" class="bar-bg"/><rect x="944" y="560" width="472" height="12" rx="6" class="bar"/>' +
      '<text x="944" y="680" class="t-big">0</text><text x="1416" y="676" class="t-lvl" text-anchor="end">Yüksek risk</text></g>' +
      // 4: harita
      '<g class="s-map"><rect width="1600" height="900" fill="#0C1512"/><rect width="1600" height="900" fill="url(#gd-grid)"/>' +
      '<path class="dist" d="' + d + '"/><text x="1150" y="200" class="t-k">GAZİEMİR · İZMİR</text><g class="pins"></g>' +
      '<g class="legend"><circle cx="1170" cy="250" r="8" fill="#4ADE80"/><text x="1188" y="256" class="t-s">düşük</text><circle cx="1270" cy="250" r="8" fill="#F5A524"/><text x="1288" y="256" class="t-s">orta</text><circle cx="1360" cy="250" r="8" fill="#F04438"/><text x="1378" y="256" class="t-s">yüksek</text></g>' +
      '<text x="1150" y="330" class="t-big n-pts">0</text><text x="1150" y="370" class="t-s">haritadaki risk noktası</text></g>' +
      // 5: oylama
      '<g class="s-vote"><rect class="cd" x="520" y="250" width="560" height="400" rx="30"/><text x="566" y="314" class="t-k">BURADAN GEÇTİN Mİ?</text>' +
      '<text x="566" y="366" class="t-b">Kuru ot birikimi · Hürriyet Mah.</text>' +
      '<g class="vb ok"><rect x="566" y="410" width="226" height="74" rx="18"/><text x="679" y="456" text-anchor="middle">Düzelmiş · <tspan class="v1">0</tspan></text></g>' +
      '<g class="vb no"><rect x="808" y="410" width="226" height="74" rx="18"/><text x="921" y="456" text-anchor="middle">Hâlâ var · <tspan class="v2">0</tspan></text></g>' +
      '<g class="badge"><rect x="566" y="526" width="468" height="70" rx="18"/><text x="800" y="569" text-anchor="middle">✓ Yönetici kontrol etti · Çözüldü</text></g></g>' +
      '</svg>';
  }

  // Bir oynatıcı: kök öğe [data-guide]
  function mountGuide(host, opt) {
    opt = opt || {};
    if (host.dataset.ready) return host._guide;
    host.dataset.ready = '1';
    host.innerHTML =
      '<div class="gd-stage" tabindex="-1">' + stageSvg() +
        '<div class="gd-grain" aria-hidden="true"></div>' +
        '<div class="gd-cap" aria-live="polite"><span class="gd-no">01</span><b class="gd-t"></b><p class="gd-p"></p></div>' +
        '<div class="gd-end"><a class="btn fire big" href="#/harita">Haritayı aç</a><a class="btn ghost big" href="#/bildir">Risk bildir</a></div>' +
        '<button type="button" class="gd-big" aria-label="Rehberi oynat"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg><span>Rehberi izle · 45 sn</span></button>' +
      '</div>' +
      '<div class="gd-bar">' +
        '<button type="button" class="gd-btn gd-play" aria-label="Oynat"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></button>' +
        '<div class="gd-track" role="slider" aria-label="Rehber ilerlemesi" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" tabindex="0"><i class="gd-fill"></i>' +
          CH.map((c, i) => '<span class="gd-tick" style="left:' + (i / CH.length * 100) + '%"></span>').join('') + '</div>' +
        '<span class="gd-time">0:00</span>' +
        '<button type="button" class="gd-btn gd-snd" aria-pressed="false" aria-label="Sesli anlatım" title="Sesli anlatım"><svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9z"/><path class="w" d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12"/></svg></button>' +
        '<button type="button" class="gd-btn gd-fs" aria-label="Tam ekran" title="Tam ekran"><svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg></button>' +
      '</div>' +
      '<ol class="gd-ch">' + CH.map((c, i) => '<li><button type="button" data-ch="' + i + '"><span>' + String(i + 1).padStart(2, '0') + '</span>' + c[0] + '</button></li>').join('') + '</ol>';

    const svg = $('.gd-svg', host), stage = $('.gd-stage', host);
    const q = (s) => svg.querySelectorAll(s);
    const cap = { no: $('.gd-no', host), t: $('.gd-t', host), p: $('.gd-p', host), box: $('.gd-cap', host) };
    let sound = !!opt.sound, cur = -1, playing = false;

    function drawPins() {
      const { P } = districtGeom();
      $('.pins', svg).innerHTML = PTS.map(([la, lo, s]) => {
        const [x, y] = P(la, lo);
        return '<g class="pt" transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')"><circle class="rp" r="9" fill="' + lvlColor(s) + '"/><circle r="7" fill="' + lvlColor(s) + '"/></g>';
      }).join('');
    }
    drawPins();

    // Sesli anlatım: her bölüm başında okunur. Anlatım bitmeden bölüm sonuna gelinirse görüntü
    // bölümün son karesinde bekler, ses bitince devam eder (ses ile görüntü hep aynı bölümde kalır).
    let utt = null, held = false, holdTimer = 0, spokeAt = -1;
    function hush() {
      utt = null; held = false; clearTimeout(holdTimer);
      if (window.speechSynthesis) speechSynthesis.cancel();
    }
    function speak(i) {
      if (!sound || !window.speechSynthesis) return;
      hush();
      if (!VOICE) pickVoice();
      const u = new SpeechSynthesisUtterance(CH[i][3]);
      u.lang = 'tr-TR'; u.rate = 0.97; u.pitch = 1; if (VOICE) u.voice = VOICE;
      const done = () => { if (utt !== u) return; utt = null; clearTimeout(holdTimer); if (held) { held = false; if (playing) tl.play(); } };
      u.onend = done; u.onerror = done;
      utt = u; spokeAt = i;
      // Chrome'da cancel()'dan hemen sonra speak() bazen yutulur; kısa bir ara ver
      setTimeout(() => { if (utt === u) speechSynthesis.speak(u); }, 60);
    }
    function holdForVoice() {
      if (!utt || held || !playing) return;
      const next = cur < CH.length - 1 ? tl.labels['c' + (cur + 1)] : tl.duration();
      if (tl.time() < next - 0.06) return;
      held = true; tl.pause();
      // ses motoru takılırsa en fazla 9 sn bekle
      holdTimer = setTimeout(() => { if (held) { held = false; utt = null; if (playing) tl.play(); } }, 9000);
    }
    function caption(i) {
      if (i === cur) return; cur = i;
      cap.no.textContent = String(i + 1).padStart(2, '0'); cap.t.textContent = CH[i][1]; cap.p.textContent = CH[i][2];
      $$('.gd-ch button', host).forEach((b, k) => { b.classList.toggle('on', k === i); b.setAttribute('aria-current', k === i ? 'step' : 'false'); });
      if (!calm()) g.fromTo([cap.no, cap.t, cap.p], { y: 18, opacity: 0, filter: 'blur(6px)' }, { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.6, stagger: 0.08, ease: 'power3.out', overwrite: true, clearProps: 'filter' });
      if (playing && tl && !tl.paused()) speak(i);
    }

    let tl = null;
    function build() {
      if (tl) tl.revert();
      tl = g.timeline({ paused: true, defaults: { ease: 'power3.inOut' }, onUpdate: sync, onComplete: () => setPlaying(false) });
      const cnt = { s: 0, n: 0, v1: 0, v2: 0 };
      g.set(q('.s-phone,.s-card,.s-map,.s-vote,.pin1,.tag1,.spark,.flash,.badge'), { opacity: 0 });
      g.set(q('.trees .tr'), { transformOrigin: '50% 100%', scaleY: 0 });
      g.set(q('.grass .gr'), { strokeDasharray: 60, strokeDashoffset: 60 });
      g.set(q('.houses .hs'), { y: 40, opacity: 0 });
      g.set(svg.querySelector('.s-land'), { scale: 1, svgOrigin: '820 676', opacity: 1 });
      g.set($('.gd-end', host), { autoAlpha: 0 });

      // 1 · Sorun
      tl.addLabel('c0').call(caption, [0])
        .from(q('.hill2,.hill1'), { y: 120, opacity: 0, duration: 1.2, stagger: 0.15, ease: 'power3.out' }, 'c0')
        .to(q('.trees .tr'), { scaleY: 1, duration: 0.9, stagger: { each: 0.03, from: 'random' }, ease: 'back.out(1.6)' }, 'c0+=0.3')
        .to(q('.houses .hs'), { y: 0, opacity: 1, duration: 0.7, stagger: 0.1, ease: 'power3.out' }, 'c0+=0.8')
        .to(q('.grass .gr'), { strokeDashoffset: 0, duration: 1.2, stagger: { each: 0.015, from: 'center' }, ease: 'none' }, 'c0+=1.2')
        .to(q('.spark'), { opacity: 1, duration: 0.25, repeat: 5, yoyo: true, ease: 'steps(2)' }, 'c0+=2.6')
        .to(q('.spark'), { opacity: 1, scale: 1.25, svgOrigin: '820 676', duration: 0.8, ease: 'power2.out' }, 'c0+=4')
        .to({}, { duration: 2.4 })
      // 2 · Gözlem
        .addLabel('c1').call(caption, [1])
        .to(q('.spark'), { opacity: 0, duration: 0.4 }, 'c1')
        .to(svg.querySelector('.s-land'), { scale: 1.12, duration: 6, ease: 'none' }, 'c1')
        .fromTo(q('.s-phone'), { opacity: 0, y: 260, rotate: -6, svgOrigin: '400 470' }, { opacity: 1, y: 0, rotate: 0, duration: 1.1, ease: 'expo.out' }, 'c1+=0.2')
        .to(q('.vf'), { scale: 0.9, svgOrigin: '400 470', duration: 0.5, yoyo: true, repeat: 1, ease: 'sine.inOut' }, 'c1+=1.4')
        .fromTo(q('.flash'), { opacity: 0 }, { opacity: 0.95, duration: 0.08, yoyo: true, repeat: 1, ease: 'none' }, 'c1+=2.4')
        .to(q('.s-phone'), { x: -420, opacity: 0, duration: 0.8, ease: 'power3.in' }, 'c1+=3.2')
        .fromTo(q('.pin1'), { opacity: 0, y: -160 }, { opacity: 1, y: 0, duration: 0.9, ease: 'bounce.out' }, 'c1+=3.6')
        .fromTo(q('.tag1'), { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.6, ease: 'power3.out' }, 'c1+=4.3')
        .to({}, { duration: 2.2 })
      // 3 · Puan
        .addLabel('c2').call(caption, [2])
        .to(q('.tag1'), { opacity: 0, duration: 0.4 }, 'c2')
        .fromTo(q('.s-card'), { opacity: 0, x: 120 }, { opacity: 1, x: 0, duration: 0.9, ease: 'expo.out' }, 'c2+=0.1')
        .from(q('.s-card .q'), { opacity: 0, x: 30, duration: 0.5, stagger: 0.45, ease: 'power3.out' }, 'c2+=0.7')
        .fromTo(q('.s-card .bar'), { scaleX: 0, svgOrigin: '944 566' }, { scaleX: 0.72, duration: 2.2, ease: 'power2.out' }, 'c2+=0.9')
        .to(cnt, { s: 72, duration: 2.2, ease: 'power2.out', onUpdate: () => { svg.querySelector('.s-card .t-big').textContent = Math.round(cnt.s); } }, 'c2+=0.9')
        .from(q('.s-card .t-lvl'), { opacity: 0, duration: 0.5 }, 'c2+=3')
        .to({}, { duration: 2.6 })
      // 4 · Harita
        .addLabel('c3').call(caption, [3])
        .to(q('.s-card,.pin1'), { opacity: 0, duration: 0.5 }, 'c3')
        .to(svg.querySelector('.s-land'), { opacity: 0, scale: 0.6, duration: 1, ease: 'power3.in' }, 'c3')
        .fromTo(q('.s-map'), { opacity: 0 }, { opacity: 1, duration: 0.8 }, 'c3+=0.6')
        .fromTo(q('.s-map .dist'), { strokeDasharray: 4000, strokeDashoffset: 4000 }, { strokeDashoffset: 0, duration: 2.2, ease: 'power2.inOut' }, 'c3+=0.8')
        .from(q('.s-map .pt'), { scale: 0, opacity: 0, transformOrigin: '50% 50%', duration: 0.5, stagger: 0.07, ease: 'back.out(3)' }, 'c3+=1.8')
        .to(cnt, { n: PTS.length, duration: 1.4, ease: 'none', onUpdate: () => { svg.querySelector('.n-pts').textContent = Math.round(cnt.n); } }, 'c3+=1.8')
        .from(q('.s-map .legend, .s-map .t-k'), { opacity: 0, y: 10, duration: 0.5 }, 'c3+=2')
        .to({}, { duration: 2.4 })
      // 5 · Takip
        .addLabel('c4').call(caption, [4])
        .to(q('.s-map'), { opacity: 0.25, duration: 0.6 }, 'c4')
        .fromTo(q('.s-vote'), { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 0.8, ease: 'expo.out' }, 'c4+=0.2')
        .to(cnt, { v1: 9, v2: 2, duration: 2, ease: 'power1.inOut', onUpdate: () => { svg.querySelector('.v1').textContent = Math.round(cnt.v1); svg.querySelector('.v2').textContent = Math.round(cnt.v2); } }, 'c4+=1')
        .fromTo(q('.badge'), { opacity: 0, scale: 0.9, svgOrigin: '800 561' }, { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(2)' }, 'c4+=3.2')
        .to({}, { duration: 2.4 })
      // 6 · Sen
        .addLabel('c5').call(caption, [5])
        .to(q('.s-vote'), { opacity: 0, y: -40, duration: 0.6 }, 'c5')
        .to(q('.s-map'), { opacity: 0.6, duration: 0.8 }, 'c5')
        .to($('.gd-end', host), { autoAlpha: 1, duration: 0.8 }, 'c5+=0.6')
        .to({}, { duration: 3.5 });
      tl.call(caption, [0], 0);
      $('.gd-big span', host).textContent = 'Rehberi izle · ' + Math.round(tl.duration()) + ' sn';
      sync();
    }

    const fill = $('.gd-fill', host), time = $('.gd-time', host), track = $('.gd-track', host), playBtn = $('.gd-play', host);
    function sync() {
      const p = tl.progress(), t = tl.time();
      fill.style.transform = 'scaleX(' + p + ')';
      track.setAttribute('aria-valuenow', String(Math.round(p * 100)));
      time.textContent = Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
      track.setAttribute('aria-valuetext', time.textContent + ' · ' + CH[Math.max(0, cur)][0]);
      let i = 0; CH.forEach((c, k) => { if (t >= tl.labels['c' + k] - 0.01) i = k; });
      caption(i);
      holdForVoice();
    }
    function setPlaying(on) {
      playing = on;
      host.classList.toggle('playing', on);
      host.classList.add('started');
      playBtn.innerHTML = on ? '<svg viewBox="0 0 24 24"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>' : '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
      playBtn.setAttribute('aria-label', on ? 'Duraklat' : 'Oynat');
      if (!on) hush();
    }
    function play() {
      if (tl.progress() >= 1) { cur = -1; tl.restart(); } else tl.play();
      setPlaying(true);
      if (!utt || spokeAt !== cur) speak(cur < 0 ? 0 : cur);
    }
    function pause() { tl.pause(); setPlaying(false); }
    const toggle = () => (playing ? pause() : play());
    function go(i) {
      const t = tl.labels['c' + i];
      if (calm()) { tl.seek(i < CH.length - 1 ? tl.labels['c' + (i + 1)] - 0.05 : tl.duration()); pause(); caption(i); return; }
      hush(); cur = -1; tl.seek(t); sync(); play();
    }
    function setSound(on) {
      sound = on; const b = $('.gd-snd', host);
      b.setAttribute('aria-pressed', String(sound)); b.setAttribute('aria-label', sound ? 'Sesli anlatımı kapat' : 'Sesli anlatımı aç');
      host.classList.toggle('snd', sound);
      if (sound && playing) speak(cur); else hush();
    }
    $('.gd-big', host).addEventListener('click', play);
    playBtn.addEventListener('click', toggle);
    $$('.gd-ch button', host).forEach((b) => b.addEventListener('click', () => go(+b.dataset.ch)));
    $('.gd-snd', host).addEventListener('click', () => setSound(!sound));
    if (!window.speechSynthesis) $('.gd-snd', host).hidden = true;
    if (sound) setSound(true);
    // Tam ekran: tarayıcı desteklemiyorsa (iPhone Safari) sayfayı kaplayan yedek görünüm
    // (üst öğelerdeki transform "fixed" konumu bozmasın diye oynatıcı geçici olarak body'ye taşınır)
    let spot = null;
    function fakeFs(on) {
      if (on) { spot = document.createComment('gd'); host.before(spot); document.body.appendChild(host); }
      else if (spot) { spot.replaceWith(host); spot = null; }
      host.classList.toggle('fs-fake', on); root.classList.toggle('gd-lock', on);
      $('.gd-fs', host).setAttribute('aria-label', on ? 'Tam ekrandan çık' : 'Tam ekran');
      $('.gd-fs', host).focus({ preventScroll: on }); // taşıyınca odak kaybolmasın (Esc ve kısayollar çalışsın)
    }
    function fullscreen() {
      if (host.classList.contains('fs-fake')) return fakeFs(false);
      if (document.fullscreenElement || document.webkitFullscreenElement) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); return; }
      const req = host.requestFullscreen || host.webkitRequestFullscreen;
      if (req) { const p = req.call(host); if (p && p.catch) p.catch(() => fakeFs(true)); }
      else fakeFs(true);
    }
    $('.gd-fs', host).addEventListener('click', fullscreen);
    // ilerleme çubuğunda sürükleyerek ileri / geri
    const seekAt = (x) => { const r = track.getBoundingClientRect(); tl.progress(Math.max(0, Math.min(1, (x - r.left) / r.width))); sync(); host.classList.add('started'); };
    track.addEventListener('pointerdown', (e) => {
      const was = playing; tl.pause(); hush(); track.setPointerCapture(e.pointerId); seekAt(e.clientX);
      const mv = (ev) => seekAt(ev.clientX);
      const up = () => { track.removeEventListener('pointermove', mv); track.removeEventListener('pointerup', up); track.removeEventListener('pointercancel', up); if (was) play(); else setPlaying(false); };
      track.addEventListener('pointermove', mv); track.addEventListener('pointerup', up); track.addEventListener('pointercancel', up);
    });
    const step = (d) => { hush(); tl.time(Math.max(0, Math.min(tl.duration(), tl.time() + d))); sync(); if (playing) speak(cur); };
    // Klavye: boşluk/K oynat-duraklat, ←/→ 3 sn, M ses, F tam ekran, 1-6 bölüm
    host.addEventListener('keydown', (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const k = e.key.toLowerCase();
      if ((e.target.closest('button') || e.target.closest('a')) && (k === ' ' || k === 'enter')) return; // düğmenin kendi tıklaması çalışsın
      if (k === 'arrowright') step(3); else if (k === 'arrowleft') step(-3);
      else if (k === ' ' || k === 'k' || (k === 'enter' && e.target === track)) toggle();
      else if (k === 'm') setSound(!sound);
      else if (k === 'f') fullscreen();
      else if (k === 'escape' && host.classList.contains('fs-fake')) fullscreen();
      else if (/^[1-6]$/.test(k)) go(+k - 1);
      else return;
      e.preventDefault();
    });
    // görünür olunca bir kez kendiliğinden başlasın (sessiz), görünmez olunca / sekme gizlenince dursun
    let auto = !!opt.noAuto;
    new IntersectionObserver((ents) => ents.forEach((en) => {
      if (en.isIntersecting && en.intersectionRatio > 0.55) { if (!auto && !calm()) { auto = true; play(); } }
      else if (!en.isIntersecting && playing && !host.classList.contains('fs-fake') && !document.fullscreenElement) pause();
    }), { threshold: [0, 0.55] }).observe(stage);
    document.addEventListener('visibilitychange', () => { if (document.hidden && playing) pause(); });

    build();
    if (calm()) { tl.progress(1); caption(CH.length - 1); }
    host._guide = { rebuild: () => { if (!host.classList.contains('started')) { drawPins(); build(); } else drawPins(); }, pause, play, setSound,
      state: () => ({ t: +tl.time().toFixed(2), cur, playing, held, voice: !!utt, sure: +tl.duration().toFixed(1) }) };
    return host._guide;
  }

  /* =================== ANA SAYFA GİRİŞİ =================== */
  let heroDone = false;
  function heroIntro() {
    const hero = $('#view-home .home-hero'); if (!hero || heroDone) return;
    heroDone = true;
    // Giriş: yazı tipleri hazır olunca tek geçiş. Mesafeler düğme yüksekliğine göre ölçeklenir (telefonda 0,8×).
    // Bitince satır içi stil kalmaz (clearProps), sayfa statik tasarımda kalır.
    const run = () => {
      const cta = $('.hx-cta', hero);
      const k = ((cta ? cta.getBoundingClientRect().height : 46) / 46) * (innerWidth < 650 ? 0.8 : 1);
      const d = (px) => Math.round(px * k);
      const quart = 'cubic-bezier(0.25,1,0.5,1)', expo = 'expo.out';
      const t = g.timeline({ defaults: { ease: expo, clearProps: 'all' } });
      const top = $('.top');
      t.from($('.brand', top), { opacity: 0, duration: 0.5, ease: 'power4.out' }, 0)
        .from($('.nav', top) || [], { opacity: 0, y: -d(8), duration: 0.7 }, 0.12)
        .from($$('.nav > *', top), { opacity: 0, y: -d(4), duration: 0.6, stagger: 0.045 }, 0.26)
        .from($$('.top .icon-btn'), { opacity: 0, y: -d(8), duration: 0.7 }, 0.2)
        .from($('.hx-brand', hero), { opacity: 0, y: d(10), duration: 0.65 }, 0.3)
        .from($$('.hx-ln > span', hero), { yPercent: 115, duration: 1.05, stagger: 0.09 }, 0.38)
        .from($$('.hx-lede span', hero), { opacity: 0, y: d(14), duration: 0.8, stagger: 0.06 }, 0.8)
        .from($('.hx-cta', hero), { opacity: 0, y: d(12), duration: 0.8 }, 1.0)
        .from($$('.hx-link:not([hidden])', hero), { opacity: 0, y: d(8), duration: 0.6, ease: quart, stagger: 0.06 }, 1.1)
        .from($('.hx-cue', hero), { opacity: 0, y: -d(6), duration: 0.7 }, 1.25)
        .from($('.hero-note', hero), { opacity: 0, duration: 0.8 }, 1.3);
    };
    const fontsReady = document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]) : Promise.resolve();
    fontsReady.then(run);
    // film kaydırınca yavaşça uzaklaşır (paralaks)
    const vid = $('#hero-video', hero);
    if (vid && window.ScrollTrigger) g.to(vid, { yPercent: 8, scale: 1.08, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
  }

  /* =================== HERO FİLMİ, ÜST ÇUBUK, İMLEÇ =================== */
  let chromeDone = false;
  function heroChrome() {
    const hero = $('#view-home .home-hero'); if (!hero || chromeDone) return;
    chromeDone = true;
    // film: veri tasarrufu ya da az hareket tercihinde oynamaz (kapak görseli kalır); ekranda değilken durur
    const vid = $('#hero-video', hero);
    const saveData = navigator.connection && navigator.connection.saveData;
    const canPlay = () => vid && !saveData && !calm() && root.dataset.route === 'ana' && !document.hidden;
    let seen = false;
    const sync = () => {
      if (!vid) return;
      if (seen && canPlay()) { if (vid.preload !== 'auto') vid.preload = 'auto'; const pr = vid.play(); if (pr && pr.catch) pr.catch(() => {}); }
      else if (!vid.paused) vid.pause();
    };
    if (vid) {
      vid.muted = true; vid.defaultMuted = true; vid.playsInline = true;
      new IntersectionObserver((ents) => { seen = ents[0].isIntersecting; sync(); }, { threshold: 0.05 }).observe(hero);
      document.addEventListener('visibilitychange', sync);
      window.addEventListener('hashchange', () => setTimeout(sync, 60));
    }
    // üst çubuk: hero geçilince opak
    const top = () => root.classList.toggle('top-solid', root.dataset.route === 'ana' && scrollY > hero.offsetHeight - 90);
    addEventListener('scroll', top, { passive: true }); addEventListener('hashchange', () => setTimeout(top, 60)); top();
    // özel imleç: yalnız ince işaretçi, yalnız ana sayfa
    if (!matchMedia('(pointer:fine)').matches || calm()) return;
    const dot = document.createElement('div'); dot.className = 'gg-dot'; dot.setAttribute('aria-hidden', 'true'); document.body.appendChild(dot);
    g.set(dot, { x: -100, y: -100 });
    const dx = g.quickTo(dot, 'x', { duration: 0.25, ease: 'power3' }), dy = g.quickTo(dot, 'y', { duration: 0.25, ease: 'power3' });
    addEventListener('pointermove', (e) => {
      const on = root.dataset.route === 'ana' && e.pointerType === 'mouse';
      dot.classList.toggle('on', on); if (!on) return;
      dx(e.clientX); dy(e.clientY);
      dot.classList.toggle('wide', !!(e.target.closest && e.target.closest('a,button,[role=button],.gd-track')));
    }, { passive: true });
    document.addEventListener('pointerleave', () => dot.classList.remove('on'));
    addEventListener('hashchange', () => dot.classList.remove('on'));
  }

  // Kayan şerit (sonsuz)
  function marquee() {
    $$('.mq-track').forEach((tr) => {
      if (tr.dataset.go) return; tr.dataset.go = '1';
      tr.innerHTML += tr.innerHTML;
      const kids = $$(':scope > *', tr); kids.slice(kids.length / 2).forEach((el) => el.setAttribute('aria-hidden', 'true'));
      const tw = g.to(tr, { xPercent: -50, duration: 38, ease: 'none', repeat: -1 });
      // ekranda değilken boşuna çalışmasın
      if (window.ScrollTrigger) ScrollTrigger.create({ trigger: tr, start: 'top bottom', end: 'bottom top', onToggle: (s) => tw.paused(!s.isActive) });
    });
  }

  /* =================== KAYDIRINCA BELİRME =================== */
  const SEEN = new WeakSet();
  function reveals(view) {
    if (!window.ScrollTrigger || !view) return;
    const items = $$('.home-row, .home-final, .proj-sec, .proj-head, .gd-wrap, .chart, .code-card', view).filter((el) => !SEEN.has(el));
    items.forEach((el) => SEEN.add(el));
    if (!items.length) return;
    g.set(items, { y: 48, opacity: 0 });
    ScrollTrigger.batch(items, { start: 'top 88%', once: true, onEnter: (b) => g.to(b, { y: 0, opacity: 1, duration: 1, stagger: 0.1, ease: 'expo.out', overwrite: true }) });
    // görünür alandaysa hemen göster
    requestAnimationFrame(() => ScrollTrigger.refresh());
  }

  /* =================== TANITIM TURU (kendi imleciyle gerçek arayüzü gezer, ~1 dk) =================== */
  // Ana sayfadaki "Turu izle", ilk ziyaret daveti, Ayarlar → "Turu tekrar izle" ve yeni hesabın ilk girişi bu turu açar.
  // Her adım kendi ses kaydıyla (media/tur/<f>.mp3) eşzamanlı; altyazı sesle aynı anda değişir.
  // Kullanıcı tıklar, kaydırır ya da bir tuşa basarsa tur hemen biter. auth:true adımlar yalnız giriş yapmış kullanıcıya gösterilir.
  const TOUR = [
    { f: 1, t: 'GeoGözcü’ye hoş geldin. Burası, Gaziemir’in dijital yangın gözcüsü.' },
    { f: 2, t: 'Haritada, gönüllülerin sahada fotoğrafladığı yangın risklerini görüyorsun.' },
    { f: 7, t: 'Her renk bir risk türünü gösterir; orman yangını riski kırmızıdır. Pin ne kadar koyuysa, risk puanı o kadar yüksektir.' },
    { f: 3, t: 'Kümeler, riskin hangi mahallelerde biriktiğini gösterir. Yaklaştıkça gözlemler tek tek açılır.' },
    { f: 4, t: 'Her gözlemin 0–100 arası bir risk puanı var. Oradan geçenler, sorunun düzelip düzelmediğini oylar.' },
    { f: 8, t: 'Bildirim listesinde tüm kayıtları süzebilir, yakınındaki riskleri tek dokunuşla bulabilirsin.' },
    { f: 9, t: 'Bir risk gördüğünde “Riskli alan bildir”e dokun: fotoğrafını ekle, konumunu işaretle, birkaç soruyu yanıtla.' },
    { f: 5, t: 'Katkı veren gönüllüler, liderlik tablosunda yer alır.' },
    { f: 10, t: 'Proje sayfasında yöntemi, canlı bulguları ve indirilebilir veri setini bulursun.' },
    { f: 11, t: 'Profilini buradan düzenleyebilir, bu turu dilediğin zaman yeniden izleyebilirsin.', auth: true },
    { f: 6, t: 'Sen de gördüğün riski ekle. Mahalleni, yangın çıkmadan önce birlikte koruyalım.' },
  ];
  const TOUR_SEEN = 'gg-tur-gordu';
  // ses dosyaları her yayında yeni sürümle istenir (tarayıcı önbelleğinde eski ses kalmasın)
  const MEDIA_V = (() => { const sc = document.querySelector('script[src*="sinema.js"]'); const m = sc && /[?&]v=(\d+)/.exec(sc.getAttribute('src')); return m ? '?v=' + m[1] : ''; })();
  const authed = () => { const gEl = document.querySelector('[data-guest]'); return !!gEl && gEl.hidden; };
  let tour = null;

  function tourUI() {
    const ui = document.createElement('div');
    ui.className = 'gtour';
    ui.innerHTML =
      '<div class="gtour-cursor" aria-hidden="true"><svg viewBox="0 0 28 28"><path d="M5 3l17 9.5-7.4 1.9L19.8 24l-3.6 1.7-5.1-9.6L5 21.5z"/></svg><i class="gtour-ring"></i></div>' +
      '<div class="gtour-cap" role="status" aria-live="polite"><span class="gtour-no"></span><p class="gtour-t"></p><i class="gtour-prog"><b></b></i></div>' +
      '<div class="gtour-bar"><button type="button" class="gtour-snd" aria-pressed="true" aria-label="Sesi kapat"><svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9z"/><path class="w" d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12"/></svg></button>' +
      '<button type="button" class="gtour-end">Turu bitir <kbd>Esc</kbd></button></div>';
    document.body.appendChild(ui);
    return ui;
  }

  function startTour(opt) {
    opt = opt || {};
    if (tour) return;
    try { localStorage.setItem(TOUR_SEEN, '1'); } catch (e) {}
    $$('.gtour-invite').forEach((n) => n.remove());
    const steps = TOUR.filter((s) => !s.auth || authed());
    const ui = tourUI();
    const cur = $('.gtour-cursor', ui), cap = $('.gtour-t', ui), no = $('.gtour-no', ui), prog = $('.gtour-prog b', ui);
    const clips = steps.map((s) => { const a = new Audio('media/tur/' + s.f + '.mp3' + MEDIA_V); a.preload = 'auto'; return a; });
    const st = { alive: true, sound: true, tweens: [], cur: -1 };
    tour = st;
    root.classList.add('gtour-on');
    ui.classList.toggle('touch', !matchMedia('(pointer:fine)').matches);
    const dur = (d) => (calm() ? 0.01 : d);
    const abort = () => { if (!st.alive) throw new Error('tur-bitti'); };
    const wait = (ms) => new Promise((r) => setTimeout(r, ms)).then(abort);
    const vis = (sel) => $$(sel).find((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && r.left < innerWidth && r.right > 0; });
    const until = async (fn, ms = 5000) => { const t0 = Date.now(); let v; while (!(v = fn()) && Date.now() - t0 < ms) await wait(120); return v; };
    let pos = { x: innerWidth * 0.62, y: innerHeight * 0.55 };
    g.set(cur, { x: pos.x, y: pos.y, opacity: 0 });
    // kavisli yol: hareketin ortasında hafif bir yay (el ile fare sürüklenmiş gibi)
    const move = (target, d = 1.1) => new Promise((res) => {
      let x, y;
      if (target && target.getBoundingClientRect) { const r = target.getBoundingClientRect(); x = r.left + r.width * 0.5; y = r.top + r.height * 0.55; } else ({ x, y } = target);
      const from = { ...pos }, bend = Math.min(90, Math.hypot(x - from.x, y - from.y) * 0.18), o = { t: 0 };
      st.tweens.push(g.to(o, { t: 1, duration: dur(d), ease: 'power2.inOut', onUpdate: () => {
        const t = o.t, arc = Math.sin(Math.PI * t) * bend;
        g.set(cur, { x: from.x + (x - from.x) * t, y: from.y + (y - from.y) * t - arc });
      }, onComplete: () => { pos = { x, y }; res(); } }));
    }).then(abort);
    const press = async (el) => {
      cur.classList.remove('down'); void cur.offsetWidth; cur.classList.add('down');
      await wait(calm() ? 0 : 160);
      el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      el.click();
    };
    const hover = (el) => { ['mouseover', 'mouseenter', 'mousemove'].forEach((t) => el.dispatchEvent(new MouseEvent(t, { bubbles: t !== 'mouseenter' }))); };
    const go = async (hash) => { if (location.hash !== hash) location.hash = hash; await wait(550); scrollTo(0, 0); };
    const smooth = (el) => { if (el) el.scrollIntoView({ behavior: calm() ? 'auto' : 'smooth', block: 'start' }); };
    // ses: kullanıcı dokunuşu olmadan çalınamazsa (Safari) ses düğmesi bir dokunuşla sürdürür
    const playClip = (a) => { a.muted = !st.sound; const p = a.play(); return p && p.catch ? p.catch(() => { ui.classList.add('needs-tap'); throw 0; }) : Promise.resolve(); };
    // her adım: altyazı + ses aynı anda; adım, hem hareketler hem ses bitince tamamlanır
    const say = (i) => {
      st.cur = i;
      no.textContent = String(i + 1).padStart(2, '0') + ' / ' + String(steps.length).padStart(2, '0');
      cap.textContent = steps[i].t;
      g.to(prog, { scaleX: (i + 1) / steps.length, duration: dur(0.6), ease: 'power2.out' });
      if (!calm()) g.fromTo(cap.parentNode, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' });
      const a = clips[i];
      return new Promise((res) => {
        const est = Math.max(2500, steps[i].t.length * 62); // ses çalınamazsa okuma süresi
        let done = false; const fin = () => { if (!done) { done = true; res(); } };
        a.onended = fin; a.onerror = () => setTimeout(fin, est);
        a.currentTime = 0;
        playClip(a).catch(() => setTimeout(fin, est));
        setTimeout(fin, est + 9000); // güvenlik
      }).then(abort);
    };
    const step = (i, moves) => Promise.all([say(i), moves()]);
    const ACT = {
      1: async () => { // karşılama
        const title = vis('.home-title'); if (title) await move(title, 1.2);
        const dial = vis('#hm-dial'); if (dial) { await wait(250); await move(dial, 1.1); }
        const cta = vis('.home-cta a[href="#/harita"]'); if (cta) { await wait(150); await move(cta, 1); }
      },
      2: async () => { // haritayı aç
        const cta = vis('.home-cta a[href="#/harita"]'); if (cta) await press(cta); else await go('#/harita');
        await until(() => vis('.leaflet-marker-icon'), 6000);
        await wait(400);
        await move({ x: innerWidth * 0.42, y: innerHeight * 0.5 }, 1.3);
      },
      7: async () => { // renklerin anlamı
        const lg = $('#legend'); const tg = vis('#legend-toggle');
        if (tg) { await move(tg, 1.1); if (lg && lg.classList.contains('closed')) await press(tg); }
        await wait(400);
        const body = vis('#legend-body'); if (body) await move(body, 1.2);
      },
      3: async () => { // Gaziemir odağı ve küme
        const f = vis('.focus-btn [data-f=g]'); if (f) { await move(f, 1); await press(f); await wait(1500); }
        const cl = await until(() => vis('.leaflet-marker-icon.cluster'), 3000);
        if (cl) { await move(cl, 1.1); hover(cl); await wait(600); await press(cl); await wait(1400); }
      },
      4: async () => { // bir gözlemin ayrıntısı (önce yüksek riskli, nabız atan pinler)
        const side = vis('.panel') ? vis('.panel').getBoundingClientRect() : null;
        const pin = await until(() => $$('.leaflet-marker-icon.pin').sort((x, y) => (y.classList.contains('hot') ? 1 : 0) - (x.classList.contains('hot') ? 1 : 0)).find((el) => {
          const r = el.getBoundingClientRect();
          return r.width && r.top > 90 && r.bottom < innerHeight - 90 && r.left > 40 && (!side || r.right < side.left - 20 || innerWidth < 860);
        }), 3000);
        if (pin) { await move(pin, 1.1); hover(pin); await wait(300); await press(pin); }
        await wait(800);
        const pop = vis('.leaflet-popup-content') || vis('#rv-body'); if (pop) await move(pop, 1.2);
      },
      8: async () => { // liste ve filtreler
        const x = vis('#rv-close') || vis('.leaflet-popup-close-button'); if (x) { await move(x, 0.8); await press(x); await wait(400); }
        const h = root.dataset.ui === 'mobile' ? vis('#sheet-handle') : null;
        if (h) { await move(h, 1); await press(h); await wait(700); }
        const near = vis('#btn-near'); if (near) { await move(near, 1.1); hover(near); await wait(500); }
        const chip = $$('.chip, button').find((b) => /Yangın riski/.test(b.textContent) && b.getBoundingClientRect().width && b.closest('.panel'));
        if (chip) await move(chip, 1.1);
      },
      9: async () => { // risk bildir
        const b = vis('.nav a.btn.fire[href="#/bildir"]') || vis('a.fab[href="#/bildir"]') || vis('a.btn.fire[href="#/bildir"]');
        if (!b) return;
        await move(b, 1.1);
        if (authed()) { await press(b); await wait(900); const form = vis('#view-bildir form, #view-bildir .card, #view-bildir'); if (form) await move({ x: innerWidth * 0.5, y: innerHeight * 0.45 }, 1.1); }
        else b.classList.add('gtour-glow');
      },
      5: async () => { // liderlik tablosu
        $$('.gtour-glow').forEach((n) => n.classList.remove('gtour-glow'));
        const l = vis('a[href="#/liderler"]'); if (l) { await move(l, 1.1); await press(l); } else await go('#/liderler');
        await wait(900); scrollTo(0, 0);
        await move({ x: innerWidth * 0.5, y: innerHeight * 0.48 }, 1.1);
      },
      10: async () => { // proje sayfası
        const p = vis('.nav a[href="#/proje"]'); if (p) { await move(p, 1); await press(p); } else await go('#/proje');
        await wait(800);
        smooth($('#pj-results')); await wait(900);
        const ch = vis('#pj-results .chart'); if (ch) await move(ch, 1.1);
      },
      11: async () => { // ayarlar / profil (yalnız giriş yapmış kullanıcı)
        const s = vis('a[href="#/ayarlar"]'); if (s) { await move(s, 1.1); await press(s); } else await go('#/ayarlar');
        await wait(900); scrollTo(0, 0);
        const hero = vis('#set-hero'); if (hero) await move(hero, 1.1);
        const help = vis('[data-go="yardim"]'); if (help) { await wait(300); await move(help, 1); }
      },
      6: async () => { // kapanış: haritada "Riskli alan bildir"
        await go('#/harita'); await wait(500);
        // telefonda açık kalan liste paneli haritayı kapatmasın
        const p = $('#panel'); const sx = vis('#sheet-close');
        if (root.dataset.ui === 'mobile' && p && p.dataset.sheet !== 'peek' && sx) { await move(sx, 0.8); await press(sx); await wait(500); }
        const b = vis('.nav a.btn.fire[href="#/bildir"]') || vis('a.fab[href="#/bildir"]') || vis('a.btn.fire[href="#/bildir"]');
        if (b) { await move(b, 1.2); b.classList.add('gtour-glow'); }
      },
    };

    const run = async () => {
      await go('#/ana');
      g.to(cur, { opacity: 1, duration: dur(0.4) });
      for (let i = 0; i < steps.length; i++) await step(i, ACT[steps[i].f]);
      await wait(400);
      finish(true);
    };

    function finish(done) {
      if (!st.alive) return;
      st.alive = false; tour = null;
      clips.forEach((a) => { a.pause(); a.onended = null; });
      st.tweens.forEach((t) => t.kill());
      root.classList.remove('gtour-on');
      removeEventListener('pointerdown', stopOnUser, true); removeEventListener('wheel', stopOnUser, true);
      removeEventListener('touchstart', stopOnUser, true); removeEventListener('keydown', onKey, true);
      setTimeout(() => $$('.gtour-glow').forEach((n) => n.classList.remove('gtour-glow')), done ? 6000 : 0);
      if (typeof opt.onEnd === 'function') { try { opt.onEnd(done); } catch (e) {} }
      if (done) {
        cap.textContent = 'Tur bitti. Haritayı keşfetmeye hazırsın.';
        no.textContent = 'SON';
        $('.gtour-bar', ui).innerHTML = '<a class="btn fire" href="#/harita">Haritayı aç</a><button type="button" class="gtour-again">Tekrar izle</button><button type="button" class="gtour-x">Kapat</button>';
        g.to(cur, { opacity: 0, duration: 0.4 });
        ui.classList.add('ended');
        const close = () => { g.to(ui, { opacity: 0, duration: 0.3, onComplete: () => ui.remove() }); };
        $('.gtour-x', ui).addEventListener('click', close);
        $('.gtour-bar a', ui).addEventListener('click', close);
        $('.gtour-again', ui).addEventListener('click', () => { ui.remove(); startTour(); });
        setTimeout(() => { if (ui.isConnected) close(); }, 12000);
      } else ui.remove();
    }
    // yalnız gerçek kullanıcı hareketi turu keser (turun kendi tıklamaları değil)
    const stopOnUser = (e) => { if (!e.isTrusted || (e.target.closest && e.target.closest('.gtour-bar'))) return; finish(false); };
    const onKey = (e) => { if (!e.isTrusted || e.key === 'Tab') return; if (e.target.closest && e.target.closest('.gtour-bar') && (e.key === 'Enter' || e.key === ' ')) return; finish(false); };
    addEventListener('pointerdown', stopOnUser, true); addEventListener('wheel', stopOnUser, true);
    addEventListener('touchstart', stopOnUser, true); addEventListener('keydown', onKey, true);
    $('.gtour-end', ui).addEventListener('click', () => finish(false));
    $('.gtour-snd', ui).addEventListener('click', (e) => {
      // ses engellendiyse bu dokunuş sesi başlatır; değilse aç/kapat
      if (ui.classList.contains('needs-tap')) { ui.classList.remove('needs-tap'); st.sound = true; const a = clips[st.cur]; if (a) { a.muted = false; a.play().catch(() => {}); } }
      else { st.sound = !st.sound; clips.forEach((a) => { a.muted = !st.sound; }); }
      e.currentTarget.setAttribute('aria-pressed', String(st.sound));
      e.currentTarget.setAttribute('aria-label', st.sound ? 'Sesi kapat' : 'Sesi aç');
      ui.classList.toggle('muted', !st.sound);
    });
    run().catch(() => { /* kullanıcı turu kesti */ });
  }

  // ilk ziyarette küçük davet (tur kendiliğinden başlamaz: ses için kullanıcı dokunuşu gerekir)
  function tourInvite() {
    let seen = false; try { seen = !!localStorage.getItem(TOUR_SEEN); } catch (e) { seen = true; }
    if (seen || tour || root.dataset.route !== 'ana' || $('.gtour-invite')) return;
    const box = document.createElement('div');
    box.className = 'gtour-invite';
    box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Tanıtım turu');
    box.innerHTML = '<b>GeoGözcü’yü 1 dakikada tanı</b><span>Sesli, altyazılı kısa tur: harita, gözlemler, bildirim, liderlik tablosu.</span>' +
      '<div><button type="button" class="btn fire sm" data-tour>Turu başlat</button><button type="button" class="gtour-later">Şimdi değil</button></div>';
    document.body.appendChild(box);
    if (!calm()) g.from(box, { y: 24, opacity: 0, duration: 0.7, ease: 'power3.out', delay: 1.2 });
    $('.gtour-later', box).addEventListener('click', () => { try { localStorage.setItem(TOUR_SEEN, '1'); } catch (e) {} box.remove(); });
    addEventListener('hashchange', () => { if (root.dataset.route !== 'ana') box.remove(); }, { once: true });
  }
  document.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('[data-tour]'); if (b) { e.preventDefault(); startTour(); } });

  /* =================== SUNUM MODU (?sunum) =================== */
  // Adres: geogozcu.pages.dev/?sunum  → rehber tüm ekranı kaplar, sesli anlatım açık, kontroller fare
  // durunca gizlenir. Sunumda oynatmak ya da ekrandan MP4 kaydı almak (Win+Alt+R) için.
  // ?sunum=sessiz → anlatımsız. Esc → siteye dön.
  function showMode() {
    const qs = new URLSearchParams(location.search);
    if (!qs.has('sunum')) return false;
    root.classList.add('sunum');
    const box = document.createElement('div');
    box.className = 'gd-show';
    box.innerHTML = '<div class="gd" data-guide></div><a class="gd-show-x" href="./#/ana" aria-label="Siteye dön">Siteye dön · Esc</a>';
    document.body.appendChild(box);
    const gd = mountGuide($('.gd', box), { sound: qs.get('sunum') !== 'sessiz', noAuto: true });
    let idle = 0;
    const wake = () => { box.classList.remove('idle'); clearTimeout(idle); idle = setTimeout(() => box.classList.add('idle'), 2200); };
    box.addEventListener('pointermove', wake); box.addEventListener('pointerdown', wake); wake();
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !e.defaultPrevented && !document.fullscreenElement) location.href = './#/ana'; else wake(); });
    $('.gd-big', box).focus();
    (window.GGSinema = window.GGSinema || {}).show = gd;
    return true;
  }

  /* =================== BAŞLAT =================== */
  function onRoute() {
    const r = root.dataset.route;
    $$('[data-guide]').forEach((h) => { if (h._guide && !h.closest('.view:not([hidden])')) h._guide.pause(); });
    heroChrome();
    if (root.dataset.route === 'ana') setTimeout(tourInvite, 1500);
    // tanıtım videoları: başka sayfaya geçilince dursun (gizli görünümde sesli çalmasın)
    $$('video.pv').forEach((v) => { if (!v.paused && !v.closest('.view:not([hidden])')) v.pause(); });
    if (calm()) { $$('[data-guide]').forEach((h) => { if (h.closest('.view:not([hidden])')) mountGuide(h); }); return; }
    setTimeout(() => {
      const view = $('.view:not([hidden])');
      if (r === 'ana') heroIntro();
      marquee();
      $$('[data-guide]', view || document).forEach(mountGuide);
      reveals(view);
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    }, 30);
  }

  function start() {
    if (!g) { $$('[data-guide]').forEach((h) => { h.innerHTML = '<p class="muted">Rehber şu an yüklenemedi.</p>'; }); return; }
    if (window.ScrollTrigger) g.registerPlugin(ScrollTrigger);
    if (window.SplitText) g.registerPlugin(SplitText);
    root.classList.add('gs');
    // canlı veri geldiğinde rehberdeki harita noktalarını güncelle
    document.addEventListener('gg:points', (e) => {
      const pts = (e.detail || []).filter((p) => p && Number.isFinite(p[0]));
      if (!pts.length) return;
      PTS = pts.slice(0, 160);
      $$('[data-guide]').forEach((h) => h._guide && h._guide.rebuild());
    });
    if (showMode()) return;
    window.addEventListener('hashchange', onRoute);
    onRoute();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  window.GGSinema = Object.assign(window.GGSinema || {}, { mountGuide, startTour });
})();
