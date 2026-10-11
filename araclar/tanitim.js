// GeoGözcü tanıtım videosu — anlatım, zamanlama, altyazı, kayıt betiği ve (FFmpeg varsa) birleştirme
//   (önce anlatım kayıtlarını araclar/video/ses/01-acilis.mp3 … adlarıyla koyun)
//   node araclar/tanitim.js kayit      → gerçek siteyi kaydedecek Playwright betiğini yazar (araclar/video/kayit-kodu.js)
//   node araclar/tanitim.js birlestir  → FFmpeg kuruluysa görüntü + anlatım + altyazıyı tanitim.mp4 yapar
// Çıktılar: araclar/video/  (ses/*.mp3, zaman.json, altyazi.srt, altyazi.vtt, anlatim.md, izle.html, tanitim.webm, tanitim.mp4)
// Anlatım değişirse ses/01-acilis.mp3 … dosyalarını aynı adla değiştirip `kayit` ve `birlestir` çalıştırın; süreler dosyalardan yeniden ölçülür.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const DIR = path.join(__dirname, 'video');
const SES = path.join(DIR, 'ses');
const SITE = process.env.GG_SITE || 'https://geogozcu.pages.dev/';
const VOICE = 'anlatıcı kaydı';
const LEAD = 0.35; // sahne başladıktan sonra anlatıma kadar boşluk (sn)
const TAIL = 0.55; // anlatım bittikten sonra sahne sonuna kadar boşluk (sn)

// Yalnızca sitede gerçekten olan özellikler anlatılır. `say` okunuşa göre (sayılar yazıyla), `sub` ekranda görünen altyazı.
// 01-acilis görüntüsü temsilî sinematik klip (gerçek site kaydı DEĞİL; videoda "Temsilî görüntü" yazar).
// Diğer tüm sahneler canlı sitenin gerçek tarayıcı kaydıdır.
const SCENES = [
  { id: '01-acilis', plan: 5, title: 'Açılış — temsilî sinematik klip', clip: true,
    say: 'Gaziemir’de evler ormanla iç içe. Büyük bir yangın, çoğu zaman tek bir kıvılcımla başlar.',
    sub: ['Gaziemir’de evler ormanla iç içe.', 'Büyük bir yangın, çoğu zaman tek bir kıvılcımla başlar.'] },
  { id: '02-site', plan: 10, title: 'GeoGözcü nedir — ana sayfa ve haritaya geçiş',
    say: 'GeoGözcü, Egev Yüzüncü Yıl Lisesi öğrencilerinin geliştirdiği bir vatandaş bilimi haritası. Gönüllüler, gördükleri riski fotoğraflayıp konumuyla haritaya ekliyor.',
    sub: ['GeoGözcü, EGEV 100. Yıl Lisesi öğrencilerinin geliştirdiği', 'bir vatandaş bilimi haritası.', 'Gönüllüler, gördükleri riski fotoğraflayıp', 'konumuyla haritaya ekliyor.'] },
  { id: '03-harita', plan: 10, title: 'Harita — risk türleri, puan renkleri, kümeler',
    say: 'Haritadaki her nokta bir saha gözlemi. Renk risk türünü, pinin koyuluğu risk puanını gösterir; kümeler, riskin biriktiği mahalleleri ortaya koyar.',
    sub: ['Haritadaki her nokta bir saha gözlemi.', 'Renk risk türünü, pinin koyuluğu risk puanını gösterir;', 'kümeler, riskin biriktiği mahalleleri ortaya koyar.'] },
  { id: '04-puan', plan: 8, title: 'Gözlem ayrıntısı — puan ve topluluk oylaması',
    say: 'Her bildirim aynı sorularla, sıfırdan yüze puanlanır. Oradan geçenler de sorunun düzelip düzelmediğini oylar.',
    sub: ['Her bildirim aynı sorularla 0–100 arası puanlanır.', 'Oradan geçenler de sorunun düzelip düzelmediğini oylar.'] },
  { id: '05-veri', plan: 7, title: 'Veriler — proje grafikleri ve liderlik tablosu',
    say: 'Veriler proje sayfasında grafiklerle özetlenir; en çok katkı verenler liderlik tablosunda yer alır.',
    sub: ['Veriler proje sayfasında grafiklerle özetlenir;', 'en çok katkı verenler liderlik tablosunda yer alır.'] },
  { id: '06-kapanis', plan: 5, title: 'Kapanış — proje kimliği',
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
  const rec = tl.filter((s) => !s.clip), off = rec[0].start;
  const T = rec.map((s) => Math.round((s.start - off) * 1000));
  const D = rec.map((s) => Math.round(s.dur * 1000));
  const END = Math.round((tl.reduce((a, s) => a + s.dur, 0) - off) * 1000);
  const veri = tl.find((s) => s.id === '05-veri'), vc = cues(tl).filter((c) => c.from >= veri.start && c.from < veri.start + veri.dur);
  const SW = Math.round(((vc[1] ? vc[1].from : veri.start + veri.dur * 0.55) - off - 0.3) * 1000);
  const out = path.join(DIR, 'tanitim.webm').replace(/\\/g, '/');
  const code = `async (page) => {
  const SITE = ${JSON.stringify(SITE)}, T = ${JSON.stringify(T)}, D = ${JSON.stringify(D)}, END = ${END}, SW = ${SW};
  const sleep = (ms) => page.waitForTimeout(ms);
  await page.setViewportSize({ width: 1920, height: 1080 });
  // kurulum önerisi kayıtta görünmesin; harita karolarını önceden ısıt
  await page.goto(SITE + '#/ana');
  await page.evaluate(() => { try { localStorage.setItem('gyrh-install-x', String(Date.now())); localStorage.setItem('gg-tur-gordu', '1'); } catch (e) {} });
  await page.goto(SITE + '#/harita'); await sleep(3500);
  // kayıttaki yakınlaşmanın uydu karolarını önceden önbelleğe al
  await page.locator('.focus-btn [data-f=g]').click(); await sleep(2500);
  if (await page.locator('.leaflet-marker-icon.cluster').count()) { await page.locator('.leaflet-marker-icon.cluster').first().click(); await sleep(4000); }
  await page.goto(SITE + '#/proje'); await sleep(1500);
  await page.goto(SITE + '#/liderler'); await sleep(1500);
  await page.goto('about:blank');
  await page.screencast.start({ path: ${JSON.stringify(out)}, size: { width: 1920, height: 1080 } });
  // gerçek kullanım hissi: görünür imleç (başlık balonu yok)
  await page.screencast.showActions({ cursor: 'pointer', duration: 450, style: { title: 'display: none' } });
  const t0 = Date.now();
  const at = (ms) => sleep(Math.max(0, ms - (Date.now() - t0)));
  const log = [];
  const mark = (n) => log.push(n + ' ' + ((Date.now() - t0) / 1000).toFixed(2));
  const glide = (x, y, steps = 30) => page.mouse.move(x, y, { steps });
  // kaydırma tarayıcının yumuşak kaydırmasıyla (imleç gösterimi fare tekerleği adımlarını yavaşlattığı için)
  const scrollTo = (y) => page.evaluate((v) => window.scrollTo({ top: v, behavior: 'smooth' }), y);
  // 2 · ana sayfa: başlık satır satır açılır, kayan şerit ve rehber, sonra haritayı aç
  mark('site'); await page.goto(SITE + '#/ana'); await page.mouse.move(1500, 300);
  await sleep(1600); await glide(1180, 420, 50);
  await scrollTo(840); await sleep(2900); await scrollTo(0); await sleep(1100);
  const cta = page.locator('#view-home a.btn[href="#/harita"]').first();
  await at(T[0] + D[0] - 2600); await cta.click();
  // 3 · harita: Gaziemir odağı, kümeye yakınlaş
  await at(T[1]); mark('harita');
  await page.locator('.focus-btn [data-f=g]').click();
  await sleep(1800);
  const cls = page.locator('.leaflet-marker-icon.cluster');
  for (let i = 0; i < Math.min(await cls.count(), 3); i++) { await cls.nth(i).hover(); await sleep(700); }
  await at(T[1] + D[1] - 2200);
  const cl = cls.first();
  if (await cl.count()) await cl.click();
  // 4 · gözlem ayrıntısı: risk puanı ve "düzeldi mi?" oylaması
  await at(T[2]); mark('puan');
  const pins = page.locator('.leaflet-marker-icon.pin');
  let opened = false;
  for (let i = 0; i < Math.min(await pins.count(), 12) && !opened; i++) {
    const pb = await pins.nth(i).boundingBox();
    if (pb && pb.x > 380 && pb.x < 1500 && pb.y > 160 && pb.y < 900) { await pins.nth(i).click(); opened = true; }
  }
  if (!opened) mark('pin-bulunamadi');
  // 5 · veriler: proje sayfasındaki grafikler, ardından liderlik tablosu
  await at(T[3]); mark('veri');
  await page.goto(SITE + '#/proje'); await sleep(600);
  await page.evaluate(() => { const el = document.getElementById('pj-results'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  await glide(900, 600, 40);
  await at(SW);
  await page.goto(SITE + '#/liderler'); await page.mouse.move(960, 500);
  // 6 · kapanış: ana sayfa + proje kimliği kartı
  await at(T[4]); mark('kapanis');
  await page.goto(SITE + '#/ana'); await page.mouse.move(960, 700);
  await sleep(900);
  await page.screencast.hideActions();
  await page.screencast.showOverlay('<div style="position:absolute;inset:0;display:grid;place-items:center;background:rgba(8,14,11,.86);font-family:Bricolage Grotesque,Instrument Sans,sans-serif;color:#EAF2EC;animation:gg .8s ease-out both"><style>@keyframes gg{from{opacity:0}to{opacity:1}}</style><div style="text-align:center"><div style="font:500 18px JetBrains Mono,monospace;letter-spacing:.18em;color:#F5A524">EGEV 100. YIL LİSESİ · TÜBİTAK</div><div style="font-weight:800;font-size:120px;letter-spacing:-3px;margin:14px 0 6px">GeoGözcü</div><div style="font-size:30px;color:#C9D8CF">Gaziemir’in dijital yangın gözcüsü</div><div style="font:500 22px JetBrains Mono,monospace;margin-top:34px;color:#A9BDB1">geogozcu.pages.dev</div></div></div>');
  await at(END + 300); mark('son');
  await page.screencast.stop();
  return log.join('\\n');
}`;
  fs.writeFileSync(path.join(DIR, 'kayit-kodu.js'), code);
  console.log('kayit-kodu.js yazıldı; kayıt', (END / 1000).toFixed(1), 'sn, toplam', tl.reduce((a, s) => a + s.dur, 0).toFixed(1), 'sn');
}

// FFmpeg ile birleştirme → tanitim.mp4 (1920×1080 · 30 fps · H.264 + AAC, altyazı görüntüye gömülü; ayrıca .srt/.vtt)
//  - 01-acilis: temsilî klip (klip-acilis.mp4), sahne süresine göre hafif ağır çekim; üstünde "temsilî görüntü" notu
//  - sonrası: canlı sitenin gerçek kaydı (tanitim.webm), 0,5 sn geçişle
//  - anlatım: her sahnenin sesi kendi başlangıç anına yerleştirilir, yumuşak giriş/çıkış, -16 LUFS
function birlestir() {
  const tl = timeline(); writeTexts(tl);
  const clip = tl[0], X = 0.5;
  const total = tl.reduce((a, s) => a + s.dur, 0), recLen = total - clip.dur;
  const clipDur = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path.join(DIR, 'klip-acilis.mp4')]).toString().trim());
  const need = clip.dur + X; // geçiş payı dahil klip süresi
  fs.writeFileSync(path.join(DIR, 'not.txt'), 'Temsilî görüntü');
  const font = 'C\\:/Windows/Fonts/segoeui.ttf';
  const v =
    `[0:v]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,setpts=PTS*${(need / clipDur).toFixed(4)},fps=30,trim=0:${need.toFixed(3)},setpts=PTS-STARTPTS,` +
    `drawtext=fontfile='${font}':textfile=not.txt:fontsize=24:fontcolor=white@0.85:x=48:y=48:box=1:boxcolor=black@0.35:boxborderw=10,format=yuv420p,settb=1/30[c];` +
    `[1:v]fps=30,trim=0:${(recLen + 0.2).toFixed(3)},setpts=PTS-STARTPTS,scale=1920:1080,format=yuv420p,settb=1/30[r];` +
    `[c][r]xfade=transition=fade:duration=${X}:offset=${clip.dur.toFixed(3)},` +
    `subtitles=altyazi.srt:force_style='FontName=Segoe UI,FontSize=15,PrimaryColour=&H00FFFFFF,BackColour=&H99000000,BorderStyle=3,Outline=6,Shadow=0,MarginV=34',` +
    `fade=t=in:st=0:d=0.6,fade=t=out:st=${(total - 0.7).toFixed(3)}:d=0.7[v]`;
  const a = tl.map((s, i) => `[${i + 2}:a]aresample=48000,afade=t=in:d=0.04,areverse,afade=t=in:d=0.08,areverse,adelay=${Math.round(s.voiceAt * 1000)}:all=1[a${i}]`).join(';') +
    ';' + tl.map((s, i) => `[a${i}]`).join('') + `amix=inputs=${tl.length}:normalize=0:duration=longest,apad,atrim=0:${total.toFixed(3)},loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000[a]`;
  const args = ['-y', '-i', 'klip-acilis.mp4', '-i', 'tanitim.webm'];
  tl.forEach((s) => args.push('-i', 'ses/' + s.id + '.mp3'));
  args.push('-filter_complex', v + ';' + a, '-map', '[v]', '-map', '[a]', '-t', total.toFixed(3),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '22', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', 'tanitim.mp4');
  execFileSync('ffmpeg', args, { stdio: 'inherit', cwd: DIR });
  // web için kapak görseli: gerçek arayüzden (harita sahnesi) bir kare
  const h = tl.find((s) => s.id === '03-harita');
  execFileSync('ffmpeg', ['-y', '-ss', (h.start + 3).toFixed(2), '-i', 'tanitim.mp4', '-frames:v', '1', '-vf', 'scale=1280:-2', '-q:v', '4', 'tanitim-kapak.jpg'], { stdio: 'inherit', cwd: DIR });
  console.log('hazır:', path.join(DIR, 'tanitim.mp4'), total.toFixed(1) + ' sn');
}

const cmd = process.argv[2];
if (cmd === 'kayit') kayit(); else if (cmd === 'birlestir') birlestir();
else console.log('kullanım: node araclar/tanitim.js kayit | birlestir');
