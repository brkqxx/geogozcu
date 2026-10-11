// GeoGözcü tanıtım videosu (sürüm 2: yalnız gerçek site kaydı, yeni arayüz) — anlatım, zamanlama, altyazı, kayıt ve birleştirme
//   (önce anlatım kayıtlarını araclar/video/ses2/01-giris.mp3 … adlarıyla koyun)
//   node araclar/tanitim.js kayit      → gerçek siteyi kaydedecek Playwright betiğini yazar (araclar/video/kayit-kodu.js)
//   node araclar/tanitim.js birlestir  → FFmpeg ile görüntü + anlatım + altyazıyı tanitim.mp4 yapar
// Çıktılar: araclar/video/  (zaman.json, altyazi.srt, altyazi.vtt, anlatim.md, tanitim.webm, tanitim.mp4)
// Anlatım değişirse ses2/*.mp3 dosyalarını aynı adla değiştirip kayit ve birlestir çalıştırın; süreler dosyalardan yeniden ölçülür.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const DIR = path.join(__dirname, 'video');
const SES = path.join(DIR, 'ses2');
const SITE = process.env.GG_SITE || 'https://geogozcu.pages.dev/';
const VOICE = 'anlatıcı kaydı';
const LEAD = 0.35; // sahne başladıktan sonra anlatıma kadar boşluk (sn)
const TAIL = 0.55; // anlatım bittikten sonra sahne sonuna kadar boşluk (sn)

// ---- SAHNELER (sürüm 2: yalnız gerçek site kaydı, yeni arayüz, ~70 sn) ----
// Yalnızca sitede gerçekten olan özellikler anlatılır. `say` okunan metin, `sub` ekranda görünen altyazı.
// Anlatımda ve altyazıda yer adı (il / ilçe) geçmez.
const SCENES = [
  { id: '01-giris', plan: 7, title: 'Ana sayfa — film arka planı, başlık',
    say: 'GeoGözcü, orman yangını riskini, yangın çıkmadan önce görmek için kurulmuş bir vatandaş bilimi haritası.',
    sub: ['GeoGözcü, orman yangını riskini yangın çıkmadan önce', 'görmek için kurulmuş bir vatandaş bilimi haritası.'] },
  { id: '02-gosterge', plan: 7, title: 'Canlı durum — risk göstergesi',
    say: 'Ana sayfadaki canlı gösterge, haritadaki yangın bildirimlerinin ortanca risk puanını anında gösterir.',
    sub: ['Ana sayfadaki canlı gösterge, haritadaki yangın bildirimlerinin', 'ortanca risk puanını anında gösterir.'] },
  { id: '03-harita', plan: 9, title: 'Harita — noktalar ve kümeler',
    say: 'Haritada her nokta, bir gönüllünün sahada fotoğrafladığı bir risk. Kümeler, riskin hangi mahallelerde biriktiğini gösterir.',
    sub: ['Haritada her nokta, bir gönüllünün sahada fotoğrafladığı bir risk.', 'Kümeler, riskin hangi mahallelerde biriktiğini gösterir.'] },
  { id: '04-araclar', plan: 9, title: 'Risk türleri ve ölçüm araçları (canlı mesafe ölçümü)',
    say: 'Risk türleri anahtarı ve ölçüm araçları tek dokunuşla açılır; mesafe, alan ve koordinat kolayca ölçülür.',
    sub: ['Risk türleri anahtarı ve ölçüm araçları tek dokunuşla açılır;', 'mesafe, alan ve koordinat kolayca ölçülür.'] },
  { id: '05-gozlem', plan: 7, title: 'Gözlem ayrıntısı — puan ve oylama',
    say: 'Her gözlemin sıfırdan yüze bir risk puanı var. Oradan geçenler, sorunun düzelip düzelmediğini oylar.',
    sub: ['Her gözlemin 0–100 arası bir risk puanı var.', 'Oradan geçenler, sorunun düzelip düzelmediğini oylar.'] },
  { id: '06-liste', plan: 6, title: 'Bildirim listesi ve filtreler',
    say: 'Bildirim listesinde kayıtlar; türüne, risk puanına ve tarihine göre süzülebilir.',
    sub: ['Bildirim listesinde kayıtlar; türüne, risk puanına', 've tarihine göre süzülebilir.'] },
  { id: '07-katil', plan: 7, title: 'Giriş / kayıt ekranı',
    say: 'Katılmak için kısa bir kayıt yeterli. Her gönüllünün kendi profili, puanı ve rozetleri olur.',
    sub: ['Katılmak için kısa bir kayıt yeterli.', 'Her gönüllünün kendi profili, puanı ve rozetleri olur.'] },
  { id: '08-liderler', plan: 5, title: 'Liderlik tablosu',
    say: 'En çok katkı veren gönüllüler, liderlik tablosunda öne çıkar.',
    sub: ['En çok katkı veren gönüllüler, liderlik tablosunda öne çıkar.'] },
  { id: '09-proje', plan: 6, title: 'Proje sayfası — yöntem, bulgular, veri seti',
    say: 'Proje sayfasında yöntemi, canlı bulguları ve indirilebilir veri setini bulursun.',
    sub: ['Proje sayfasında yöntemi, canlı bulguları', 've indirilebilir veri setini bulursun.'] },
  { id: '10-kapanis', plan: 6, title: 'Kapanış — proje kimliği',
    say: 'Mahalleni sen koru. GeoGözcü; yangını, çıkmadan önce görmek için.',
    sub: ['Mahalleni sen koru.', 'GeoGözcü — yangını, çıkmadan önce görmek için.'] },
];

// MP3 süresi (kare başlıklarını sayarak; CBR/VBR ikisinde de çalışır)
function mp3Duration(file) {
  // ffprobe varsa en doğru ölçüm odur
  try { return Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString().trim()); } catch (e) { /* aşağıdaki sayım */ }
  const b = fs.readFileSync(file);
  const BR = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320]; // MPEG-1 L3
  const BR2 = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160]; // MPEG-2/2.5 L3
  const SR = { 3: [44100, 48000, 32000], 2: [22050, 24000, 16000], 0: [11025, 12000, 8000] };
  let i = 0, t = 0;
  if (b.slice(0, 3).toString() === 'ID3') i = 10 + ((b[6] << 21) | (b[7] << 14) | (b[8] << 7) | b[9]);
  while (i + 4 <= b.length) {
    if (b[i] !== 0xff || (b[i + 1] & 0xe0) !== 0xe0) { i++; continue; }
    const ver = (b[i + 1] >> 3) & 3, br = (b[i + 2] >> 4) & 15, sr = (b[i + 2] >> 2) & 3, pad = (b[i + 2] >> 1) & 1;
    if (ver === 1 || br === 0 || br === 15 || sr === 3) { i++; continue; }
    const rate = SR[ver][sr], kbps = (ver === 3 ? BR : BR2)[br], spf = ver === 3 ? 1152 : 576;
    const len = Math.floor((spf / 8) * kbps * 1000 / rate) + pad;
    t += spf / rate; i += len;
  }
  return t;
}

const fmt = (s, sep) => {
  const ms = Math.round(s * 1000), h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, ss = Math.floor(ms / 1000) % 60;
  return [h, m, ss].map((v) => String(v).padStart(2, '0')).join(':') + sep + String(ms % 1000).padStart(3, '0');
};

// Sahne süreleri: plan süresi ya da (boşluk + anlatım + boşluk), hangisi uzunsa. Konuşma hızlandırılmaz.
function timeline() {
  let t = 0;
  return SCENES.map((s) => {
    const file = path.join(SES, s.id + '.mp3');
    // ses dosyası henüz yoksa süre tahmin edilir (sakin Türkçe anlatım ≈ 2,3 kelime/sn); dosya gelince gerçek süre kullanılır
    const has = fs.existsSync(file);
    const voice = has ? mp3Duration(file) : s.say.split(/\s+/).length / 2.3;
    const dur = Math.max(s.plan, LEAD + voice + TAIL);
    const o = { ...s, start: +t.toFixed(3), dur: +dur.toFixed(3), voiceAt: +(t + LEAD).toFixed(3), voice: +voice.toFixed(3), estimated: !has };
    t += dur; return o;
  });
}

// Altyazı: her satır, anlatım süresi içinde karakter uzunluğuna göre paylaştırılır
function cues(tl) {
  const out = [];
  tl.forEach((s) => {
    const total = s.sub.reduce((a, x) => a + x.length, 0);
    let t = s.voiceAt;
    s.sub.forEach((line) => {
      const d = s.voice * line.length / total;
      out.push({ from: t, to: Math.min(t + d + 0.25, s.start + s.dur - 0.05), text: line });
      t += d;
    });
  });
  for (let i = 0; i < out.length - 1; i++) out[i].to = Math.min(out[i].to, out[i + 1].from - 0.04);
  return out;
}

function writeTexts(tl) {
  const c = cues(tl);
  fs.writeFileSync(path.join(DIR, 'altyazi.srt'), c.map((x, i) => (i + 1) + '\n' + fmt(x.from, ',') + ' --> ' + fmt(x.to, ',') + '\n' + x.text + '\n').join('\n'));
  fs.writeFileSync(path.join(DIR, 'altyazi.vtt'), 'WEBVTT\n\n' + c.map((x) => fmt(x.from, '.') + ' --> ' + fmt(x.to, '.') + ' line:88%\n' + x.text + '\n').join('\n'));
  const z = { voiceName: VOICE, total: +tl.reduce((a, s) => a + s.dur, 0).toFixed(3), scenes: tl, cues: c };
  fs.writeFileSync(path.join(DIR, 'zaman.json'), JSON.stringify(z, null, 1));
  // izle.html dosyadan (çift tıklayarak) açılınca da çalışsın diye aynı veri betik olarak
  fs.writeFileSync(path.join(DIR, 'zaman.js'), 'window.ZAMAN = ' + JSON.stringify(z) + ';\n');
  const md = ['# GeoGözcü tanıtım videosu — anlatım metni ve zaman kodları', '',
    tl.some((s) => s.estimated) ? '**Ses dosyaları henüz yok — süreler kelime sayısından tahmin edildi.** Ses eklenince `node araclar/tanitim.js kayit` yeniden çalıştırılır.'
      : 'Ses: araclar/video/ses/*.mp3',
    'Toplam süre: **' + tl.reduce((a, s) => a + s.dur, 0).toFixed(1) + ' sn**. Görüntü: canlı siteden (' + SITE + ') gerçek tarayıcı kaydı.', '',
    '| Sahne | Zaman | Görüntü | Anlatım |', '|---|---|---|---|',
    ...tl.map((s) => '| ' + s.id + ' | ' + fmt(s.start, '.').slice(3, 9) + '–' + fmt(s.start + s.dur, '.').slice(3, 9) + ' | ' + s.title + ' | ' + s.sub.join(' ') + ' |'), '',
    '## Okuma metni (öğrenci sesiyle kaydetmek için)', '', ...tl.map((s) => '**' + s.id + '** (' + s.voice.toFixed(1) + ' sn): ' + s.say + '\n')];
  fs.writeFileSync(path.join(DIR, 'anlatim.md'), md.join('\n'));
  return c;
}


// Gerçek sitenin kaydı: her sahne zaman.json'daki başlangıç anında başlar (ses ve altyazı böylece tam oturur)
function kayit() {
  const tl = timeline(); writeTexts(tl);
  const T = tl.map((s) => Math.round(s.start * 1000));
  const D = tl.map((s) => Math.round(s.dur * 1000));
  const END = Math.round(tl.reduce((a, s) => a + s.dur, 0) * 1000);
  const out = path.join(DIR, 'tanitim.webm').replace(/\\/g, '/');
  const code = `async (page) => {
  const SITE = ${JSON.stringify(SITE)}, T = ${JSON.stringify(T)}, D = ${JSON.stringify(D)}, END = ${END};
  const sleep = (ms) => page.waitForTimeout(ms);
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'no-preference' });
  // kurulum önerisi ve tur daveti kayıtta görünmesin; harita karolarını önceden ısıt
  await page.goto(SITE + '#/ana');
  await page.evaluate(() => { try { localStorage.setItem('gyrh-install-x', String(Date.now())); localStorage.setItem('gg-tur-gordu', '1'); } catch (e) {} });
  await page.goto(SITE + '#/harita'); await sleep(3500);
  await page.locator('.focus-btn [data-f=g]').click(); await sleep(2500);
  if (await page.locator('.leaflet-marker-icon.cluster').count()) { await page.locator('.leaflet-marker-icon.cluster').first().click(); await sleep(3500); }
  for (const r of ['proje', 'liderler', 'giris']) { await page.goto(SITE + '#/' + r); await sleep(1400); }
  await page.goto('about:blank');
  await page.screencast.start({ path: ${JSON.stringify(out)}, size: { width: 1920, height: 1080 } });
  await page.screencast.showActions({ cursor: 'pointer', duration: 420, style: { title: 'display: none' } });
  const t0 = Date.now();
  const at = (ms) => sleep(Math.max(0, ms - (Date.now() - t0)));
  const log = [];
  const mark = (n) => log.push(n + ' ' + ((Date.now() - t0) / 1000).toFixed(2));
  const glide = (x, y, steps = 30) => page.mouse.move(x, y, { steps });
  const scrollTo = (y) => page.evaluate((v) => window.scrollTo({ top: v, behavior: 'smooth' }), y);
  const nav = (txt) => page.locator('.top .nav a', { hasText: txt }).first();
  // 1 · ana sayfa: film arka planı, başlık satır satır açılır
  mark('giris'); await page.goto(SITE + '#/ana'); await page.mouse.move(1400, 300);
  await sleep(1500); await glide(700, 560, 60); await sleep(900); await glide(330, 830, 50);
  // 2 · canlı durum göstergesi
  await at(T[1]); mark('gosterge');
  await page.evaluate(() => { const s = document.querySelector('.home-live'); if (s) window.scrollTo({ top: s.getBoundingClientRect().top + scrollY - 90, behavior: 'smooth' }); });
  await sleep(1200);
  const dial = page.locator('#hm-dial'); const db = await dial.boundingBox(); if (db) await glide(db.x + db.width / 2, db.y + db.height * 0.45, 50);
  // 3 · harita: odak, kümeler
  await at(T[2] - 400); mark('harita');
  await nav('Harita').click(); await sleep(1600);
  await page.locator('.focus-btn [data-f=g]').click(); await sleep(1800);
  const cls = page.locator('.leaflet-marker-icon.cluster');
  for (let i = 0; i < Math.min(await cls.count(), 3); i++) { await cls.nth(i).hover(); await sleep(650); }
  // 4 · risk türleri anahtarı + ölçüm araçları (canlı mesafe ölçümü)
  await at(T[3]); mark('araclar');
  await page.evaluate(() => { const l = document.getElementById('legend'); if (!l.classList.contains('closed')) document.getElementById('legend-toggle').click(); });
  await page.locator('#legend-toggle').click(); await sleep(1400);
  await page.locator('#legend-toggle').click(); await sleep(300);
  await page.locator('.gg-tools [data-tool=more]').hover(); await sleep(650);
  await page.locator('.gg-fly [data-tool=measure]').click(); await sleep(600);
  await page.mouse.click(380, 760); await sleep(450);
  await page.mouse.click(640, 880); await sleep(450);
  await page.mouse.click(900, 720); await sleep(500);
  mark('olcum:' + await page.evaluate(() => document.querySelector('.gg-hud-val b').textContent));
  await at(T[3] + D[3] - 900);
  await page.locator('.gg-hud [data-hud=close]').click().catch(() => {});
  // 5 · gözlem ayrıntısı: puan ve oylama
  await at(T[4]); mark('gozlem');
  const pins = page.locator('.leaflet-marker-icon.pin'); let opened = false;
  for (let i = 0; i < Math.min(await pins.count(), 14) && !opened; i++) {
    const pb = await pins.nth(i).boundingBox();
    if (pb && pb.x > 380 && pb.x < 1450 && pb.y > 200 && pb.y < 900) { await pins.nth(i).click(); opened = true; }
  }
  if (!opened) mark('pin-bulunamadi'); else { await sleep(900); mark('popup:' + !!(await page.locator('.leaflet-popup-content').count())); }
  // 6 · liste ve filtreler
  await at(T[5]); mark('liste');
  await page.locator('.leaflet-popup-close-button').click().catch(() => {});
  const chip = page.locator('.panel button', { hasText: 'Yangın riski' }).first();
  if (await chip.count()) { await chip.click(); await sleep(1600); await page.locator('.panel button', { hasText: 'Tümü' }).first().click(); }
  // 7 · giriş / kayıt ekranı (film + giriş animasyonu)
  await at(T[6] - 300); mark('katil');
  await nav('Giriş yap').click(); await sleep(2200);
  const tab = page.locator('#tab-login'); if (await tab.count()) { await tab.hover(); await sleep(900); }
  // 8 · liderlik tablosu
  await at(T[7] - 300); mark('liderler');
  await nav('Liderler').click();
  // 9 · proje sayfası
  await at(T[8] - 300); mark('proje');
  await nav('Proje').click(); await sleep(900);
  await page.evaluate(() => { const el = document.getElementById('pj-results'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  await sleep(1300); await glide(900, 600, 40);
  // 10 · kapanış: ana sayfa + proje kimliği kartı
  await at(T[9] - 200); mark('kapanis');
  await page.goto(SITE + '#/ana'); await page.mouse.move(960, 700);
  await sleep(1000);
  await page.screencast.hideActions();
  await page.screencast.showOverlay('<div style="position:absolute;inset:0;display:grid;place-items:center;background:rgba(3,8,11,.9);color:#F5FAF6;font-family:Poppins,Helvetica Neue,Arial,sans-serif;animation:gg .8s ease-out both"><style>@keyframes gg{from{opacity:0}to{opacity:1}}</style><div style="text-align:center"><div style="width:72px;height:72px;margin:0 auto 26px;border-radius:50%;background:#030909;border:1px solid rgba(136,222,204,.35);display:grid;place-items:center;color:#7CC6B5"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c1 3 4 5 4 9a4 4 0 0 1-8 0c0-2 1-3 2-4 0 2 1 2 1 2 0-3 0-5 1-7z"/></svg></div><div style="font-weight:300;font-size:120px;letter-spacing:-4px;line-height:1">GeoGözcü</div><div style="font-size:28px;color:#ECF1EF;opacity:.82;margin-top:16px;font-weight:300">yangını, çıkmadan önce görmek için</div><div style="font:600 17px Instrument Sans,Arial,sans-serif;letter-spacing:.2em;text-transform:uppercase;color:#88DECC;margin-top:38px">EGEV 100. Yıl Lisesi · TÜBİTAK</div><div style="font:500 20px Instrument Sans,Arial,sans-serif;margin-top:12px;color:rgba(236,241,239,.62)">geogozcu.pages.dev</div></div></div>');
  await at(END + 300); mark('son');
  await page.screencast.stop();
  return log.join('\\n');
}`;
  fs.writeFileSync(path.join(DIR, 'kayit-kodu.js'), code);
  console.log('kayit-kodu.js yazıldı; toplam', (END / 1000).toFixed(1), 'sn');
}

// FFmpeg ile birleştirme → tanitim.mp4 (1920×1080 · 30 fps · H.264 + AAC, altyazı görüntüye gömülü; ayrıca .srt/.vtt)
// Görüntü yalnız sitenin gerçek kaydıdır; anlatım her sahnenin başlangıç anına yerleştirilir, -16 LUFS.
function birlestir() {
  const tl = timeline(); writeTexts(tl);
  const total = tl.reduce((a, s) => a + s.dur, 0);
  const v = `[0:v]fps=30,trim=0:${total.toFixed(3)},setpts=PTS-STARTPTS,scale=1920:1080,format=yuv420p,` +
    `subtitles=altyazi.srt:force_style='FontName=Segoe UI,FontSize=15,PrimaryColour=&H00FFFFFF,BackColour=&H99000000,BorderStyle=3,Outline=6,Shadow=0,MarginV=34',` +
    `fade=t=in:st=0:d=0.5,fade=t=out:st=${(total - 0.7).toFixed(3)}:d=0.7[v]`;
  const a = tl.map((s, i) => `[${i + 1}:a]aresample=48000,afade=t=in:d=0.04,areverse,afade=t=in:d=0.08,areverse,adelay=${Math.round(s.voiceAt * 1000)}:all=1[a${i}]`).join(';') +
    ';' + tl.map((s, i) => `[a${i}]`).join('') + `amix=inputs=${tl.length}:normalize=0:duration=longest,apad,atrim=0:${total.toFixed(3)},loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000[a]`;
  const args = ['-y', '-i', 'tanitim.webm'];
  tl.forEach((s) => args.push('-i', path.relative(DIR, path.join(SES, s.id + '.mp3')).replace(/\\/g, '/')));
  args.push('-filter_complex', v + ';' + a, '-map', '[v]', '-map', '[a]', '-t', total.toFixed(3),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '23', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', 'tanitim.mp4');
  execFileSync('ffmpeg', args, { stdio: 'inherit', cwd: DIR });
  const h = tl.find((s) => s.id === '03-harita');
  execFileSync('ffmpeg', ['-y', '-ss', (h.start + 4).toFixed(2), '-i', 'tanitim.mp4', '-frames:v', '1', '-vf', 'scale=1280:-2', '-q:v', '4', 'tanitim-kapak.jpg'], { stdio: 'inherit', cwd: DIR });
  console.log('hazır:', path.join(DIR, 'tanitim.mp4'), total.toFixed(1) + ' sn');
}

const cmd = process.argv[2];
if (cmd === 'kayit') kayit(); else if (cmd === 'birlestir') birlestir();
else console.log('kullanım: node araclar/tanitim.js kayit | birlestir');
