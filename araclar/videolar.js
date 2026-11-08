// GeoGözcü videoları: Proje videosu ve Harita videosu (1920×1080, Türkçe erkek sesi, altyazı, filigran)
//   node araclar/videolar.js ses                → anlatımı üretir (tr-TR-AhmetNeural, gerekir: pip install edge-tts)
//   node araclar/videolar.js kayit [proje|harita] → sahneleri yerel siteden kaydeder (önce: node araclar/sunucu.js 8000)
//   node araclar/videolar.js birlestir          → FFmpeg ile video + ses + altyazı + filigran; media/ içine kopyalar
//   node araclar/videolar.js tur                → sitedeki tanıtım turunun seslerini aynı sesle yeniler (media/tur/)
// Metni değiştirmek için aşağıdaki sahnelerde `say` (okunan) ve `sub` (altyazı) alanlarını düzenleyin.
// Marka adı okunuşu doğru olsun diye `say` içinde "Jeogözcü", altyazıda "GeoGözcü" yazar.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, 'video', 'v2');
const MEDIA = path.join(__dirname, '..', 'media');
const SITE = process.env.GG_SITE || 'http://localhost:8000/';
const VOICE = 'tr-TR-AhmetNeural', RATE = '-3%';
const W = 1600, H = 900, DSF = 1; // ekran akışı CSS pikseli verir; 1600×900 kaydedilip 1920×1080'e büyütülür (arayüz yazıları videoda okunur boyda kalır)
const LEAD = 0.35, TAIL = 0.7, XF = 0.4;

const VIDEOS = {
  proje: [
    { id: 'p1', say: 'Orman yangınlarının çoğu, büyük bir alevle değil, gözden kaçan küçük bir riskle başlar. Kuru bir ot yığını, ormana dayanan bir bahçe, kapanmış bir yangın yolu.',
      sub: ['Orman yangınlarının çoğu, büyük bir alevle değil,', 'gözden kaçan küçük bir riskle başlar.', 'Kuru bir ot yığını, ormana dayanan bir bahçe,', 'kapanmış bir yangın yolu.'] },
    { id: 'p2', say: 'Jeogözcü, Egev Yüzüncü Yıl Anadolu Lisesi öğrencilerinin geliştirdiği bir vatandaş bilimi projesi. Amacımız çok açık: bu riskleri, yangın çıkmadan önce görünür kılmak.',
      sub: ['GeoGözcü, EGEV 100. Yıl Anadolu Lisesi öğrencilerinin', 'geliştirdiği bir vatandaş bilimi projesi.', 'Amacımız çok açık: bu riskleri,', 'yangın çıkmadan önce görünür kılmak.'] },
    { id: 'p3', say: 'Resmî haritalar bölgeyi gösterir, ama bir bahçenin kenarındaki ot yığınını göstermez. Biz de şunu sorduk: gönüllülerin topladığı gözlemlerle, mahalle ölçeğinde bir risk haritası çıkarılabilir mi?',
      sub: ['Resmî haritalar bölgeyi gösterir,', 'ama bir bahçenin kenarındaki ot yığınını göstermez.', 'Biz de şunu sorduk: gönüllülerin topladığı gözlemlerle,', 'mahalle ölçeğinde bir risk haritası çıkarılabilir mi?'] },
    { id: 'p4', say: 'Yöntemimiz basit. Gönüllü, riskli alanı güvenli bir mesafeden fotoğraflıyor, konumu işaretliyor ve herkes için aynı olan soruları yanıtlıyor.',
      sub: ['Yöntemimiz basit. Gönüllü, riskli alanı', 'güvenli bir mesafeden fotoğraflıyor, konumu işaretliyor', 've herkes için aynı olan soruları yanıtlıyor.'] },
    { id: 'p5', say: 'Bitki örtüsü, ormana uzaklık, eğim, su kaynağı ve itfaiye erişimi, sıfırdan yüze bir risk puanına dönüşüyor. Böylece her gözlem, diğerleriyle karşılaştırılabiliyor.',
      sub: ['Bitki örtüsü, ormana uzaklık, eğim, su kaynağı ve itfaiye erişimi,', '0-100 arası bir risk puanına dönüşüyor.', 'Böylece her gözlem, diğerleriyle karşılaştırılabiliyor.'] },
    { id: 'p6', say: 'Haritadaki her bildirim, grafiklere anında yansıyor. Riskin hangi mahallelerde biriktiğini ve zamanla nasıl değiştiğini buradan görebiliyoruz.',
      sub: ['Haritadaki her bildirim, grafiklere anında yansıyor.', 'Riskin hangi mahallelerde biriktiğini', 've zamanla nasıl değiştiğini buradan görebiliyoruz.'] },
    { id: 'p7', say: 'Veriler açık. Excel, CSV ya da Jeo Ceyson olarak indirilebiliyor ve Türkiye’nin coğrafi bilgi sistemleriyle birlikte kullanılabiliyor.',
      sub: ['Veriler açık. Excel, CSV ya da GeoJSON olarak indirilebiliyor', 've Türkiye’nin coğrafi bilgi sistemleriyle birlikte kullanılabiliyor.'] },
    { id: 'p8', say: 'Kaynak kodu da herkese açık. Başka okullar aynı sistemi kendi ilçesi için kurabilir. Kodlamayı öğrenmek isteyen öğrenciler için, adım adım bir rehber de hazırladık.',
      sub: ['Kaynak kodu da herkese açık.', 'Başka okullar aynı sistemi kendi ilçesi için kurabilir.', 'Kodlamayı öğrenmek isteyen öğrenciler için', 'adım adım bir rehber de hazırladık.'] },
    { id: 'p9', card: 'proje', say: 'Jeogözcü. Riski, yangın çıkmadan önce, birlikte haritalıyoruz.',
      sub: ['Riski, yangın çıkmadan önce, birlikte haritalıyoruz.'] },
  ],
  harita: [
    { id: 'h1', say: 'Jeogözcü haritasına hoş geldin. Buradaki her nokta, bir gönüllünün sahada fotoğrafladığı bir risk. Kümeler, riskin hangi mahallelerde biriktiğini gösteriyor.',
      sub: ['GeoGözcü haritasına hoş geldin.', 'Buradaki her nokta, bir gönüllünün sahada fotoğrafladığı bir risk.', 'Kümeler, riskin hangi mahallelerde biriktiğini gösteriyor.'] },
    { id: 'h2', say: 'Renkler, risk türünü anlatır. Orman yangını riski kırmızıyla işaretlenir. Risk türleri anahtarından diğerlerine de bakabilirsin.',
      sub: ['Renkler, risk türünü anlatır.', 'Orman yangını riski kırmızıyla işaretlenir.', 'Risk türleri anahtarından diğerlerine de bakabilirsin.'] },
    { id: 'h3', say: 'Bir noktaya dokununca, fotoğrafını ve sıfırdan yüze risk puanını görürsün. Oradan geçenler, sorunun düzelip düzelmediğini de oylar.',
      sub: ['Bir noktaya dokununca, fotoğrafını', 've 0-100 arası risk puanını görürsün.', 'Oradan geçenler, sorunun düzelip düzelmediğini de oylar.'] },
    { id: 'h4', say: 'Listede bütün bildirimler durur. İstersen yalnızca bir risk türünü seçebilir, bir kayda dokunup haritada yerine gidebilirsin.',
      sub: ['Listede bütün bildirimler durur.', 'İstersen yalnızca bir risk türünü seçebilir,', 'bir kayda dokunup haritada yerine gidebilirsin.'] },
    { id: 'h5', say: 'Ölçüm araçlarıyla iki nokta arasındaki mesafeyi, bir alanın büyüklüğünü ve koordinatları kolayca öğrenebilirsin.',
      sub: ['Ölçüm araçlarıyla iki nokta arasındaki mesafeyi,', 'bir alanın büyüklüğünü ve koordinatları', 'kolayca öğrenebilirsin.'] },
    { id: 'h6', say: 'Riskli bir alan gördüğünde, bildir düğmesine bas. Risk türünü seç, konumu işaretle, fotoğrafını ekle ve birkaç kısa soruyu yanıtla. Risk puanın hemen hesaplanır.',
      sub: ['Riskli bir alan gördüğünde, bildir düğmesine bas.', 'Risk türünü seç, konumu işaretle,', 'fotoğrafını ekle ve birkaç kısa soruyu yanıtla.', 'Risk puanın hemen hesaplanır.'] },
    { id: 'h7', card: 'acil', say: 'Unutma. Şu anda yanan bir yer görürsen bildirim yapma, hemen yüz on ikiyi ara.',
      sub: ['Unutma. Şu anda yanan bir yer görürsen', 'bildirim yapma, hemen 112’yi ara.'] },
  ],
};

const sleepS = (n) => n.toFixed(3);
const dur = (f) => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString().trim());
const mp3 = (v, s) => path.join(ROOT, v, s.id + '.mp3');

function tts(text, out) {
  execFileSync('python', ['-m', 'edge_tts', '--voice', VOICE, '--rate=' + RATE, '--text', text, '--write-media', out], { stdio: ['ignore', 'ignore', 'inherit'] });
}
function ses() {
  for (const [v, list] of Object.entries(VIDEOS)) {
    fs.mkdirSync(path.join(ROOT, v), { recursive: true });
    list.forEach((s) => { tts(s.say, mp3(v, s)); console.log(s.id, dur(mp3(v, s)).toFixed(2)); });
  }
}
// Sitedeki turun altyazıları sinema.js içinde; burada yalnız okunuş düzeltilmiş hâlleri var
const TUR = {
  1: 'Jeogözcü’ye hoş geldin. Burası, Gaziemir’in dijital yangın gözcüsü.',
  2: 'Haritada, gönüllülerin sahada fotoğrafladığı yangın risklerini görüyorsun.',
  7: 'Her renk bir risk türünü gösterir. Orman yangını riski kırmızıdır. Pin ne kadar koyuysa, risk puanı o kadar yüksektir.',
  3: 'Kümeler, riskin hangi mahallelerde biriktiğini gösterir. Yaklaştıkça gözlemler tek tek açılır.',
  4: 'Her gözlemin sıfırdan yüze bir risk puanı var. Oradan geçenler, sorunun düzelip düzelmediğini oylar.',
  8: 'Bildirim listesinde tüm kayıtları süzebilir, yakınındaki riskleri tek dokunuşla bulabilirsin.',
  9: 'Bir risk gördüğünde, Riskli Alan Bildir düğmesine dokun. Fotoğrafını ekle, konumunu işaretle, birkaç soruyu yanıtla.',
  5: 'Katkı veren gönüllüler, liderlik tablosunda yer alır.',
  10: 'Proje sayfasında yöntemi, canlı bulguları ve indirilebilir veri setini bulursun.',
  11: 'Profilini buradan düzenleyebilir, bu turu dilediğin zaman yeniden izleyebilirsin.',
  6: 'Sen de gördüğün riski ekle. Mahalleni, yangın çıkmadan önce birlikte koruyalım.',
};
function tur() { Object.entries(TUR).forEach(([n, t]) => { const f = path.join(MEDIA, 'tur', n + '.mp3'); tts(t, f); console.log('tur', n, dur(f).toFixed(2)); }); }

function timeline(v) {
  let t = 0;
  return VIDEOS[v].map((s) => {
    const voice = dur(mp3(v, s)), d = LEAD + voice + TAIL + (s.card ? 1.2 : 0);
    const o = { ...s, start: t, dur: d, voiceAt: t + LEAD, voice };
    t += d; return o;
  });
}
const ts = (s) => { const ms = Math.round(s * 1000); return [Math.floor(ms / 3600000), Math.floor(ms / 60000) % 60, Math.floor(ms / 1000) % 60].map((x) => String(x).padStart(2, '0')).join(':') + ',' + String(ms % 1000).padStart(3, '0'); };
function srt(tl) {
  const c = [];
  tl.forEach((s) => {
    // cümle cümle altyazı: en fazla iki satır birlikte görünür
    const groups = []; for (let i = 0; i < s.sub.length; i += 2) groups.push(s.sub.slice(i, i + 2));
    const total = s.sub.join('').length; let at = s.voiceAt;
    groups.forEach((g) => { const d = s.voice * g.join('').length / total; c.push({ a: at, b: at + d, t: g.join('\n') }); at += d; });
  });
  return c.map((x, i) => (i + 1) + '\n' + ts(x.a) + ' --> ' + ts(Math.max(x.a + 0.8, x.b - 0.04)) + '\n' + x.t + '\n').join('\n');
}

/* ---------------- KAYIT ---------------- */
const LOGO = '<svg viewBox="0 0 48 48"><defs><linearGradient id="lg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2A6249"/><stop offset="1" stop-color="#1A4433"/></linearGradient></defs><rect width="48" height="48" rx="13" fill="url(#lg)"/><path transform="translate(9.6 7.5) scale(1.2)" fill="#F58A3A" d="M12 3c1 3 4 5 4 9a4 4 0 0 1-8 0c0-2 1-3 2-4 0 2 1 2 1 2 0-3 0-5 1-7z"/></svg>';
const CARD = {
  proje: `<div class="t">GeoGözcü</div><div class="s">yangını, çıkmadan önce görmek için</div><div class="k">EGEV 100. Yıl Anadolu Lisesi · TÜBİTAK Projesi</div><div class="u">geogozcu.pages.dev</div>`,
  acil: `<div class="n">112</div><div class="s">Yanan bir yer görürsen bildirim yapma, hemen ara.</div><div class="k">GeoGözcü · EGEV 100. Yıl Anadolu Lisesi</div><div class="u">geogozcu.pages.dev</div>`,
};
const CARD_CSS = `<link rel="stylesheet" href="/fonts/fonts.css"><style>*{margin:0;box-sizing:border-box}html,body{width:1920px;height:1080px;background:radial-gradient(70% 70% at 50% 42%,#14281f,#050b0a 75%);color:#F5FAF6;font-family:Poppins,'Segoe UI',sans-serif;display:grid;place-items:center;text-align:center}
.logo svg{width:112px;height:112px;display:block;margin:0 auto 34px}.t{font-weight:300;font-size:140px;letter-spacing:-5px;line-height:1}.n{font-weight:500;font-size:230px;letter-spacing:-6px;line-height:1;color:#FF8A3D}.s{font-weight:300;font-size:40px;opacity:.86;margin-top:22px}.k{font:600 25px 'Instrument Sans','Segoe UI',sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#88DECC;margin-top:52px}.u{font:500 26px 'Instrument Sans','Segoe UI',sans-serif;margin-top:14px;color:rgba(236,241,239,.62)}
.wm{display:inline-flex;align-items:center;gap:12px;padding:8px 18px 8px 8px;border-radius:999px;background:rgba(3,8,11,.62);color:#fff;text-align:left}.wm svg{width:46px;height:46px}.wm b{display:block;font:600 22px Poppins,'Segoe UI',sans-serif;line-height:1.1}.wm span{font:500 15px 'Instrument Sans','Segoe UI',sans-serif;opacity:.86}</style>`;

async function kartlar() {
  const { open } = require('./test/pw');
  const { browser, page } = await open({ w: 1920, h: 1080, bypassCSP: true, dark: true });
  const show = async (body) => {
    await page.route('**/__kart.html', (r) => r.fulfill({ contentType: 'text/html; charset=utf-8', body: '<!doctype html><meta charset=utf-8>' + CARD_CSS + '<body>' + body + '</body>' }));
    await page.goto(SITE + '__kart.html'); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(300); await page.unroute('**/__kart.html');
  };
  for (const [k, html] of Object.entries(CARD)) { await show('<div><div class="logo">' + LOGO + '</div>' + html + '</div>'); await page.screenshot({ path: path.join(ROOT, 'kart-' + k + '.png') }); }
  await show('<div class="wm" id="wm">' + LOGO + '<div><b>GeoGözcü</b><span>EGEV 100. Yıl Anadolu Lisesi</span></div></div>');
  await page.addStyleTag({ content: 'html,body{background:transparent!important}' });
  await page.locator('#wm').screenshot({ path: path.join(ROOT, 'filigran.png'), omitBackground: true });
  await browser.close();
}

const CURSOR = () => addEventListener('DOMContentLoaded', () => {
  const c = document.createElement('div');
  c.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24"><path d="M5 3l14 7-6 1.6L10 18z" fill="#fff" stroke="#03080B" stroke-width="1.4" stroke-linejoin="round"/></svg>';
  c.style.cssText = 'position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;transform:translate(-100px,-100px);filter:drop-shadow(0 2px 4px rgba(0,0,0,.45))';
  document.documentElement.appendChild(c);
  addEventListener('mousemove', (e) => { c.style.transform = 'translate(' + (e.clientX - 4) + 'px,' + (e.clientY - 3) + 'px)'; }, true);
  addEventListener('mousedown', (e) => {
    const r = document.createElement('i');
    r.style.cssText = 'position:fixed;z-index:2147483646;pointer-events:none;left:' + (e.clientX - 18) + 'px;top:' + (e.clientY - 18) + 'px;width:36px;height:36px;border-radius:50%;border:2px solid rgba(255,255,255,.9);opacity:.9;transition:transform .45s ease-out,opacity .45s ease-out;transform:scale(.4)';
    document.documentElement.appendChild(r); requestAnimationFrame(() => { r.style.transform = 'scale(1.25)'; r.style.opacity = '0'; }); setTimeout(() => r.remove(), 600);
  }, true);
});
const prep = async (page) => { await page.addInitScript(CURSOR); await page.addInitScript(() => { try { localStorage.setItem('gg-lite', '0'); localStorage.setItem('gg-tur-gordu', '1'); localStorage.setItem('gyrh-install-x', String(Date.now() + 864e5)); localStorage.setItem('gyrh-prefs', JSON.stringify({ motion: 'on', sound: 'off', basemap: 'sat' })); } catch (e) {} }); };

async function rec(page, v, s, act) {
  const dir = path.join(ROOT, v, s.id); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const cdp = await page.context().newCDPSession(page);
  const frames = [];
  cdp.on('Page.screencastFrame', (f) => {
    const fn = String(frames.length).padStart(5, '0') + '.jpg';
    fs.writeFileSync(path.join(dir, fn), Buffer.from(f.data, 'base64'));
    frames.push({ fn, t: f.metadata.timestamp });
    cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 90, maxWidth: 1920, maxHeight: 1080, everyNthFrame: 1 });
  const L = (s.dur + XF) * 1000, t0 = Date.now();
  await act((ms) => page.waitForTimeout(Math.max(0, ms - (Date.now() - t0))), L);
  await page.waitForTimeout(Math.max(0, L + 150 - (Date.now() - t0)));
  const end = Date.now() / 1000;
  await cdp.send('Page.stopScreencast'); await page.waitForTimeout(200); await cdp.detach().catch(() => {});
  if (!frames.length) throw new Error(s.id + ': kare gelmedi');
  const lines = ['ffconcat version 1.0'];
  frames.forEach((fr, i) => { const d = (i + 1 < frames.length ? frames[i + 1].t : end) - fr.t; lines.push('file ' + fr.fn, 'duration ' + Math.max(0.001, d).toFixed(4)); });
  lines.push('file ' + frames[frames.length - 1].fn);
  fs.writeFileSync(path.join(dir, 'liste.txt'), lines.join('\n'));
  console.log(s.id, frames.length, 'kare', (end - frames[0].t).toFixed(2), 'sn');
}

const tools = (page) => ({
  sleep: (ms) => page.waitForTimeout(ms),
  glide: (x, y, steps = 40) => page.mouse.move(x, y, { steps }),
  // kaydırma: sayfanın kendi sahneleri de oynasın diye rAF ile yumuşak
  scroll: (y, ms) => page.evaluate(([y, ms]) => new Promise((done) => { const s = scrollY, t0 = performance.now(); const f = (n) => { const k = Math.min(1, (n - t0) / ms), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; window.scrollTo({ top: s + (y - s) * e, behavior: 'instant' }); if (k < 1) requestAnimationFrame(f); else done(); }; requestAnimationFrame(f); }), [y, ms]),
  jump: async (sel, off = 90) => { await page.evaluate(([s, o]) => { const e = document.querySelector(s); window.scrollTo({ top: e.getBoundingClientRect().top + scrollY - o, behavior: 'instant' }); }, [sel, off]); await page.waitForTimeout(1500); },
  yOf: (sel, off = 90) => page.evaluate(([s, o]) => document.querySelector(s).getBoundingClientRect().top + scrollY - o, [sel, off]),
  center: async (loc) => { const b = await loc.boundingBox(); return b && [b.x + b.width / 2, b.y + b.height / 2]; },
});

async function kayitProje() {
  const { open } = require('./test/pw');
  const { browser, page, errs } = await open({ w: W, h: H, dsf: DSF, bypassCSP: true, dark: true });
  await prep(page);
  const { sleep, glide, scroll, jump, yOf } = tools(page);
  const S = Object.fromEntries(timeline('proje').map((s) => [s.id, s]));

  await page.goto(SITE + '#/ana'); await sleep(5500);
  await page.mouse.move(1200, 240);
  const heroH = await page.evaluate(() => document.querySelector('.home-hero').offsetHeight);
  await rec(page, 'proje', S.p1, async (at, L) => {
    await glide(520, 520, 70); await at(L * 0.34);
    await Promise.all([scroll(heroH * 0.9, L * 0.55), glide(1060, 450, 90)]);
  });
  await jump('.hm-say', 60); await page.mouse.move(500, 300);
  const y2 = await yOf('.hm-say', -40);
  await rec(page, 'proje', S.p2, async (at, L) => {
    const r = await page.evaluate(() => { const b = document.querySelector('.say-ring').getBoundingClientRect(); return { x: b.x, y: b.y, width: b.width, height: b.height }; }); console.log('daire', JSON.stringify(r));
    const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
    const orbit = async () => { for (let a = 180; a < 900; a += 7) { await page.mouse.move(cx + Math.cos(a * Math.PI / 180) * 260, cy + Math.sin(a * Math.PI / 180) * 210); await sleep(28); } };
    await Promise.all([orbit(), scroll(y2 + 120, L * 0.8)]);
  });
  await page.goto(SITE + '#/proje'); await sleep(3500);
  for (const [id, sel, by] of [['p3', '#pj-problem', 120], ['p4', '#pj-method', 240], ['p5', '#pj-score', 260], ['p6', '#pj-results', 420], ['p7', '#pj-data', 520], ['p8', '#pj-learn', 420]]) {
    await jump(sel); await page.mouse.move(950, 520);
    const y0 = await page.evaluate(() => scrollY);
    await rec(page, 'proje', S[id], async (at, L) => {
      await at(650);
      await Promise.all([scroll(y0 + by, L - 1300), glide(780, 420, 120)]);
    });
  }
  console.log('hatalar:', errs.slice(0, 6));
  await browser.close();
}

async function kayitHarita() {
  const { open } = require('./test/pw');
  const sahteOturum = require('./test/sahte-oturum');
  const S = Object.fromEntries(timeline('harita').map((s) => [s.id, s]));
  {
    const { browser, page, errs } = await open({ w: W, h: H, dsf: DSF, bypassCSP: true, dark: true });
    await prep(page);
    const { sleep, glide, center } = tools(page);
    const tiles = () => page.waitForFunction(() => [...document.querySelectorAll('#map .leaflet-tile')].every((t) => t.complete), null, { timeout: 15000 }).catch(() => {});
    const focusBtn = page.locator('.focus-btn [data-f=g]').first();
    await page.goto(SITE + '#/harita'); await sleep(5000); await tiles();
    await page.addStyleTag({ content: '.map-vid-btn{display:none!important}' });
    await focusBtn.click(); await sleep(2800); await tiles();
    await page.locator('.focus-btn [data-f=g]').first().click().catch(() => {}); await sleep(600);
    await page.mouse.move(520, 400);
    await rec(page, 'harita', S.h1, async (at, L) => {
      await at(900);
      const c = await center(focusBtn); if (c) await glide(c[0], c[1], 30);
      await at(1500); await focusBtn.click(); await at(4300);
      const cls = page.locator('.leaflet-marker-icon.cluster');
      for (let i = 0; i < Math.min(await cls.count(), 3); i++) { const p = await center(cls.nth(i)); if (p) await glide(p[0], p[1], 34); await sleep(750); }
    });
    await rec(page, 'harita', S.h2, async (at, L) => {
      const open = await page.evaluate(() => !document.getElementById('legend').classList.contains('closed'));
      if (!open) { const c = await center(page.locator('#legend-toggle')); await glide(c[0], c[1], 30); await page.locator('#legend-toggle').click(); }
      await at(1400);
      const rows = page.locator('#legend-body > *');
      for (let i = 0; i < Math.min(await rows.count(), 5); i++) { const p = await center(rows.nth(i)); if (p) await glide(p[0], p[1], 18); await sleep(520); }
    });
    await page.evaluate(() => { const l = document.getElementById('legend'); if (!l.classList.contains('closed')) document.getElementById('legend-toggle').click(); });
    await sleep(700);
    // üzerine tıklanınca açılan nokta: panelin solunda, ekranın ortasına yakın bir pin
    const pinIdx = () => page.evaluate(() => { const els = [...document.querySelectorAll('#map .leaflet-marker-icon.pin')]; let best = -1, bd = 1e9; els.forEach((e, k) => { const b = e.getBoundingClientRect(), x = b.x + b.width / 2, y = b.y + b.height / 2; if (x < 90 || x > innerWidth - 430 || y < 180 || y > innerHeight - 90) return; const d = Math.hypot(x - innerWidth * 0.33, y - innerHeight * 0.6); if (d < bd) { bd = d; best = k; } }); return best; });
    let idx = await pinIdx();
    if (idx < 0) { const cl = page.locator('.leaflet-marker-icon.cluster').first(); if (await cl.count()) { await cl.click(); await sleep(2600); await tiles(); idx = await pinIdx(); } }
    await rec(page, 'harita', S.h3, async (at, L) => {
      await at(500);
      if (idx >= 0) { const pin = page.locator('#map .leaflet-marker-icon.pin').nth(idx); const c = await center(pin); await glide(c[0], c[1], 34); await sleep(240); await pin.click({ force: true }); } else console.log('pin bulunamadı');
      await at(L - 1200); await page.locator('.leaflet-popup-close-button').first().click().catch(() => {});
    });
    await sleep(600);
    await rec(page, 'harita', S.h4, async (at, L) => {
      await at(500);
      const chip = page.locator('.panel button', { hasText: 'Yangın riski' }).first();
      if (await chip.count()) { const c = await center(chip); if (c) await glide(c[0], c[1], 30); await chip.click().catch(() => {}); }
      await at(L * 0.36);
      await page.evaluate(() => { const fb = document.getElementById('filter-box'); if (fb) fb.open = false; const p = document.getElementById('panel'); if (p) p.scrollTop = 0; });
      await at(L * 0.5);
      const item = page.locator('#list .item').nth(1);
      if (await item.count()) { const c = await center(item); if (c) await glide(c[0], c[1], 30); await item.click().catch(() => {}); }
      await at(L - 900); await page.locator('.leaflet-popup-close-button').first().click({ timeout: 800 }).catch(() => {});
    });
    await page.evaluate(() => { const fb = document.getElementById('filter-box'); if (fb) fb.open = true; });
    await sleep(300);
    const all = page.locator('.panel button', { hasText: 'Tümü' }).first(); if (await all.count()) await all.click().catch(() => {});
    await focusBtn.click().catch(() => {}); await sleep(2600); await tiles();
    await rec(page, 'harita', S.h5, async (at, L) => {
      await at(300);
      await page.locator('.gg-tools [data-tool=more]').hover().catch(() => {}); await sleep(700);
      await page.locator('.gg-fly [data-tool=measure]').click().catch((e) => console.log('ölçüm yok', e.message.slice(0, 80))); await at(1700);
      for (const [x, y] of [[320, 590], [540, 700], [760, 560]]) { await glide(x, y, 26); await page.mouse.click(x, y); await sleep(620); }
      await at(L - 700); await page.locator('.gg-hud [data-hud=close]').click().catch(() => {});
    });
    console.log('hatalar:', errs.slice(0, 6));
    await browser.close();
  }
  {
    const { browser, page, errs } = await open({ w: W, h: H, dsf: DSF, bypassCSP: true, dark: true, geo: { latitude: 38.3196, longitude: 27.1569 } });
    await prep(page); await sahteOturum(page, { name: 'gonullu' });
    const { sleep } = tools(page);
    await page.goto(SITE + '#/bildir'); await sleep(3500);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    const scrollTo = (sel, f) => page.evaluate(([s, f]) => { const e = document.querySelector(s); if (e) window.scrollTo({ top: e.getBoundingClientRect().top + scrollY - innerHeight * f, behavior: 'smooth' }); }, [sel, f]);
    const glideClick = async (loc, steps = 20) => { const b = await loc.boundingBox(); if (!b) return; await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps }); await sleep(120); await loc.click(); };
    await page.mouse.move(640, 300);
    await rec(page, 'harita', S.h6, async (at, L) => {
      const k = L / 11000; // sahne ses süresine göre esner
      await at(300 * k); await scrollTo('#cat-card', 0.16);
      await at(900 * k); await glideClick(page.locator('#cat-pick > *').first());
      await at(1800 * k); { const sub = page.locator('#sub-pick > *').first(); if (await sub.count()) await glideClick(sub); }
      await at(2700 * k); await scrollTo('#loc-card', 0.13);
      await at(3700 * k); { const b = await page.locator('#pick-map').boundingBox(); if (b) { const x = b.x + b.width * 0.57, y = b.y + b.height * 0.5; await page.mouse.move(x, y, { steps: 22 }); await sleep(100); await page.mouse.click(x, y); } }
      await at(5100 * k); await scrollTo('#photo-card', 0.2);
      await at(5800 * k); { const b = await page.locator('#photo-card .drop').boundingBox(); if (b) await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 18 }); }
      await at(6500 * k);
      const sets = await page.evaluate(() => [...document.querySelectorAll('#form-rest fieldset')].filter((f) => f.offsetParent && f.querySelector('.pill')).slice(0, 3).map((f, i) => { f.id = f.id || 'vf' + i; return '#' + f.id; }));
      if (sets[0]) await scrollTo(sets[0], 0.18);
      await sleep(700);
      for (const [i, s] of sets.entries()) { const pills = page.locator(s + ' .pill'); const n = await pills.count(); if (!n) continue; const p = pills.nth(Math.min(n - 1, i === 1 ? 0 : 2)); const b = await p.boundingBox(); if (!b || b.y < 60 || b.y > 720) continue; await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 12 }); await p.click(); await sleep(320); }
      await at(9000 * k); await scrollTo('#score-card', 0.38);
    });
    console.log('hatalar:', errs.slice(0, 6));
    await browser.close();
  }
}

/* ---------------- BİRLEŞTİRME ---------------- */
function birlestir(v) {
  const dir = path.join(ROOT, v), tl = timeline(v), total = tl.reduce((a, s) => a + s.dur, 0), f = sleepS;
  fs.writeFileSync(path.join(dir, 'altyazi.srt'), srt(tl));
  const args = ['-hide_banner', '-loglevel', 'error', '-y'];
  tl.forEach((s) => { if (s.card) args.push('-loop', '1', '-t', f(s.dur + XF), '-i', '../kart-' + s.card + '.png'); else args.push('-f', 'concat', '-safe', '0', '-i', s.id + '/liste.txt'); });
  tl.forEach((s) => args.push('-i', s.id + '.mp3'));
  args.push('-loop', '1', '-i', '../filigran.png');
  const n = tl.length, wm = 2 * n;
  const parts = tl.map((s, i) => {
    const L = i === n - 1 ? s.dur : s.dur + XF;
    if (s.card) return `[${i}:v]scale=2112:1188,zoompan=z='1.06-0.06*min(on/(${Math.round(L * 30)})\\,1)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${Math.round(L * 30)}:s=1920x1080:fps=30,setsar=1,format=yuv420p,trim=0:${f(L)},setpts=PTS-STARTPTS[v${i}]`;
    return `[${i}:v]fps=30,scale=1920:1080:flags=lanczos,setsar=1,format=yuv420p,tpad=stop_mode=clone:stop_duration=3,trim=0:${f(L)},setpts=PTS-STARTPTS[v${i}]`;
  });
  let last = 'v0';
  tl.slice(1).forEach((s, i) => { parts.push(`[${last}][v${i + 1}]xfade=transition=fade:duration=${XF}:offset=${f(s.start)}[x${i + 1}]`); last = 'x' + (i + 1); });
  parts.push(`[${wm}:v]format=rgba,colorchannelmixer=aa=0.82[wm]`);
  parts.push(`[${last}][wm]overlay=W-w-30:H-h-26:shortest=1,subtitles=altyazi.srt:force_style='FontName=Segoe UI Semibold,FontSize=14,PrimaryColour=&H00FFFFFF,BackColour=&H8C0B0F0D,BorderStyle=4,Outline=0,Shadow=0,MarginV=30',fade=t=in:st=0:d=0.5,fade=t=out:st=${f(total - 0.7)}:d=0.7[v]`);
  tl.forEach((s, i) => parts.push(`[${n + i}:a]aresample=48000,afade=t=in:d=0.03,adelay=${Math.round(s.voiceAt * 1000)}:all=1[a${i}]`));
  parts.push(tl.map((s, i) => `[a${i}]`).join('') + `amix=inputs=${n}:normalize=0:duration=longest,apad,atrim=0:${f(total)},loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000[a]`);
  const script = path.join(dir, 'filtre.txt'); fs.writeFileSync(script, parts.join(';\n'));
  args.push('-/filter_complex', 'filtre.txt', '-map', '[v]', '-map', '[a]', '-t', f(total),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', v === 'harita' ? '27' : '25', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-g', '60',
    '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', v + '.mp4');
  execFileSync('ffmpeg', args, { stdio: 'inherit', cwd: dir });
  const ff = (a) => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...a], { stdio: 'inherit', cwd: dir });
  ff(['-i', v + '.mp4', '-vf', 'scale=854:480:flags=lanczos', '-c:v', 'libx264', '-preset', 'slow', '-crf', '25', '-profile:v', 'main', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', v + '-480.mp4']);
  const posterAt = v === 'proje' ? tl[1].start + 3.5 : tl[2].start + 4.5;
  ff(['-ss', f(posterAt), '-i', v + '.mp4', '-frames:v', '1', '-vf', 'scale=1280:-2', '-q:v', '5', v + '-kapak.jpg']);
  for (const x of [v + '.mp4', v + '-480.mp4', v + '-kapak.jpg']) fs.copyFileSync(path.join(dir, x), path.join(MEDIA, x));
  fs.copyFileSync(path.join(dir, 'altyazi.srt'), path.join(MEDIA, v + '.srt'));
  if (fs.statSync(path.join(dir, v + '.mp4')).size > 25 * 1048576) throw new Error(v + ': 25 MB sınırını aştı (Cloudflare Pages)');
  console.log(v, total.toFixed(1) + ' sn', Math.round(fs.statSync(path.join(dir, v + '.mp4')).size / 1048576) + ' MB');
}

(async () => {
  const [cmd, arg] = process.argv.slice(2);
  if (cmd === 'ses') ses();
  else if (cmd === 'tur') tur();
  else if (cmd === 'kayit') { fs.mkdirSync(ROOT, { recursive: true }); await kartlar(); if (arg !== 'harita') await kayitProje(); if (arg !== 'proje') await kayitHarita(); }
  else if (cmd === 'birlestir') { (arg ? [arg] : ['proje', 'harita']).forEach(birlestir); }
  else console.log('kullanım: node araclar/videolar.js ses | kayit [proje|harita] | birlestir [proje|harita] | tur');
})().catch((e) => { console.error(e); process.exit(1); });
