// Ana sayfa tanıtım videosu (sürüm 3, ~37 sn, 16:9) — yalnız sitenin gerçek kaydı + tek parça anlatım
//   node araclar/giris-video.js kayit       → 5 sahneyi gerçek siteden kaydeder (araclar/video/giris/)
//   node araclar/giris-video.js birlestir   → FFmpeg: geçişler, anlatım, altyazı, hafif fon, mp4 (720p + 480p) ve kapak
// Anlatım: araclar/video/giris/anlatim.mp3 (tek kayıt; sesin perdesi/kimliği sahneler arasında değişmesin diye
// cümle aralarındaki sessizliklerden bölünür, aynı kaydın parçaları sahnelere yerleştirilir).
// Kayıt sırasında sahte oturum kullanılır: veritabanına hiçbir şey yazılmaz (bkz. araclar/test/sahte-oturum.js).
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const DIR = path.join(__dirname, 'video', 'giris');
const SITE = process.env.GG_SITE || 'http://localhost:8000/';
// Kayıt 1280×720 CSS pikseliyle yapılır (ekran akışı CSS pikseli verir); arayüz yazıları videoda okunur boyda kalır
const W = 1280, H = 720;

// Anlatım kaydındaki cümle başlangıç/bitişleri (ffmpeg silencedetect ile ölçüldü) ve sahnedeki yeri (sn)
// parca: kayıttan kesilecek aralık; konum: o parçanın videodaki başlangıcı; alt: ekranda görünen altyazı
const CUES = [
  { parca: [0.000, 4.081], konum: 0.500, konusma: [0.000, 3.819], alt: 'Orman yangınları çoğu zaman,\ngözden kaçan küçük risklerle başlar.' },
  { parca: [4.081, 8.607], konum: 5.138, konusma: [4.343, 8.353], alt: 'GeoGözcü, bu riskleri gönüllülerin gözüyle\ntek bir haritada topluyor.' },
  { parca: [8.607, 15.068], konum: 12.247, konusma: [8.860, 14.769], alt: 'Riskli bir alan gördüğünde konumu haritada işaretle,\nfotoğrafını ekle ve birkaç kısa soruyu yanıtla.' },
  { parca: [15.068, 19.953], konum: 21.550, konusma: [15.368, 19.612], alt: 'Her bildirim aynı ölçütlerle puanlanır\nve herkese açık haritada yerini alır.' },
  { parca: [19.953, 24.466], konum: 26.559, konusma: [20.294, 24.169], alt: 'Şu anda yanan bir yer görürsen bildirim yapma;\nhemen 112’yi ara.' },
  { parca: [24.466, 28.560], konum: 30.953, konusma: [24.763, 28.560], alt: 'GeoGözcü: riski, yangın çıkmadan önce\nbirlikte haritalıyoruz.' },
];
// Sahneler: başlangıç (sn) ve süre (geçiş payı dahil); geçişler 0,6 sn çapraz geçiş
const XF = 0.6;
const SHOTS = [
  { id: 's1', at: 0.0, len: 5.6 },   // geniş harita, yavaş yaklaşma (durağan kare)
  { id: 's2', at: 5.0, len: 7.6 },   // arayüz belirir, odaklanma, bir gözlem açılır
  { id: 's3', at: 12.0, len: 10.1 }, // Bildir akışı
  { id: 's4', at: 21.5, len: 5.6 },  // haritada bağlam: listeden bir bildirim, puanı
  // derin yakınlıktan uzaklaşırken Leaflet kısa süre karo boşluğu gösterir; videoda bunun yerine aynı sahnenin ilk karesine
  // (gerçek toplu görünüm) çapraz geçişle dönülür ve hafifçe yerine oturur
  { id: 's4b', at: 26.5, len: 5.4 }, // toplu harita görünümü
  { id: 's5', at: 31.0, len: 6.5 },  // kapanış kartı
];
const TOTAL = SHOTS[5].at + SHOTS[5].len; // 37,5 sn

const sec = (t) => { const ms = Math.round(t * 1000); const h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60;
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0') + ',' + String(ms % 1000).padStart(3, '0'); };
function writeSubs() {
  const cues = CUES.map((c) => { const st = c.konum + (c.konusma[0] - c.parca[0]), en = c.konum + (c.konusma[1] - c.parca[0]) + 0.25; return { st, en, t: c.alt }; });
  fs.writeFileSync(path.join(DIR, 'altyazi.srt'), cues.map((c, i) => (i + 1) + '\n' + sec(c.st) + ' --> ' + sec(c.en) + '\n' + c.t + '\n').join('\n'));
  fs.writeFileSync(path.join(DIR, 'altyazi.vtt'), 'WEBVTT\n\n' + cues.map((c) => sec(c.st).replace(',', '.') + ' --> ' + sec(c.en).replace(',', '.') + '\n' + c.t + '\n').join('\n'));
  // ekran okuyucular ve sesi kapalı izleyenler için düz metin
  fs.writeFileSync(path.join(DIR, 'metin.txt'), CUES.map((c) => c.alt.replace(/\n/g, ' ')).join(' '));
  return cues;
}

/* ===================== KAYIT ===================== */
// Harita sahneleri ziyaretçi gözüyle (oturumsuz), Bildir sahnesi sahte oturumla; ikisi de 1280×720. Hiçbir veri yazılmaz.
async function kayit() {
  const { open } = require('./test/pw');
  const sahteOturum = require('./test/sahte-oturum');
  fs.mkdirSync(DIR, { recursive: true });
  const cursor = (page) => page.addInitScript(() => {
    addEventListener('DOMContentLoaded', () => {
      const c = document.createElement('div');
      c.setAttribute('data-vid-cursor', '');
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
  });
  const prep = (page) => cursor(page).then(() => page.addInitScript(() => { try { localStorage.setItem('gg-lite', '0'); localStorage.setItem('gg-tur-gordu', '1'); localStorage.setItem('gyrh-install-x', String(Date.now() + 864e5)); localStorage.setItem('gyrh-prefs', JSON.stringify({ motion: 'on', sound: 'off', basemap: 'sat' })); } catch (e) {} }));
  // Kayıt: Chrome'un kendi ekran akışı (CDP); kareler değiştikçe gelir (~60–100 kare/sn).
  // Kareler zaman damgasıyla saklanır; FFmpeg "concat" listesiyle gerçek sürelerine göre birleştirilir.
  const rec = async (page, name) => {
    const cdp = await page.context().newCDPSession(page);
    const dir = path.join(DIR, name); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    const frames = [];
    cdp.on('Page.screencastFrame', (f) => {
      const fn = String(frames.length).padStart(5, '0') + '.jpg';
      fs.writeFileSync(path.join(dir, fn), Buffer.from(f.data, 'base64'));
      frames.push({ fn, t: f.metadata.timestamp });
      cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
    });
    await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: W, maxHeight: H, everyNthFrame: 1 });
    const t0 = Date.now();
    const at = (ms) => page.waitForTimeout(Math.max(0, ms - (Date.now() - t0)));
    at.stop = async () => {
      const end = Date.now() / 1000;
      await cdp.send('Page.stopScreencast'); await page.waitForTimeout(300); await cdp.detach().catch(() => {});
      const lines = ['ffconcat version 1.0'];
      frames.forEach((fr, i) => { const d = (i + 1 < frames.length ? frames[i + 1].t : end) - fr.t; lines.push('file ' + fr.fn, 'duration ' + Math.max(0.001, d).toFixed(4)); });
      lines.push('file ' + frames[frames.length - 1].fn);
      fs.writeFileSync(path.join(dir, 'liste.txt'), lines.join('\n'));
      console.log(name, frames.length, 'kare', (end - frames[0].t).toFixed(2), 'sn');
    };
    return at;
  };

  // ---------- harita sahneleri (1, 2, 4) ----------
  {
    const { browser, page } = await open({ w: W, h: H, bypassCSP: true, dark: true });
    await prep(page);
    const sleep = (ms) => page.waitForTimeout(ms);
    const map = (fn, arg) => page.evaluate(([f, a]) => new Function('m', 'a', f)(window.GG.get().map, a), [fn, arg]);
    const tiles = () => page.waitForFunction(() => [...document.querySelectorAll('#map .leaflet-tile')].every((t) => t.complete), null, { timeout: 20000 }).catch(() => {});
    const pinClick = async (prefer) => { // görünür alanda, panelin solunda bir pin
      const i = await page.evaluate((pref) => {
        const els = [...document.querySelectorAll('#map .leaflet-marker-icon.pin')];
        const c = { x: innerWidth * pref[0], y: innerHeight * pref[1] };
        let best = -1, bd = 1e9;
        els.forEach((e, k) => { const b = e.getBoundingClientRect(), x = b.x + b.width / 2, y = b.y + b.height / 2;
          if (x < 90 || x > innerWidth - 430 || y < 170 || y > innerHeight - 90) return; const d = Math.hypot(x - c.x, y - c.y); if (d < bd) { bd = d; best = k; } });
        return best;
      }, prefer);
      if (i < 0) return false;
      const el = page.locator('#map .leaflet-marker-icon.pin').nth(i); const b = await el.boundingBox();
      await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 26 }); await sleep(260); await el.click({ force: true }); return true;
    };
    await page.goto(SITE + '#/harita'); await sleep(4500);
    await page.addStyleTag({ content: 'html.vid-clean .top,html.vid-clean .panel,html.vid-clean .leaflet-control-container,html.vid-clean #legend,html.vid-clean .gg-tools,html.vid-clean .map-list-btn{display:none!important}' +
      'html.vid-clean .map-wrap{position:fixed!important;inset:0!important;z-index:50}' });
    const VIEW = [38.33, 27.14];
    for (const z of [11.25, 12.5, 13.5]) { await map('m.setView(a[0], a[1], { animate: false })', [VIEW, z]); await sleep(1500); await tiles(); }
    // 1) arayüzsüz, tam ekran geniş harita
    await page.evaluate(() => document.documentElement.classList.add('vid-clean'));
    await map('m.invalidateSize(); m.setView(a[0], a[1], { animate: false })', [VIEW, 11.25]); await sleep(2500); await tiles(); await sleep(600);
    await page.screenshot({ path: path.join(DIR, 's1.png') });
    await page.evaluate(() => document.documentElement.classList.remove('vid-clean'));
    await map('m.invalidateSize(); m.setView(a[0], a[1], { animate: false })', [VIEW, 11.25]); await sleep(2200); await tiles();
    // 2) Gaziemir'e odak → bir gözlem seçilir, ayrıntısı açılır
    await page.mouse.move(640, 380);
    let at = await rec(page, 's2');
    await at(700); { const b = await page.locator('.focus-btn [data-f=g]').first().boundingBox(); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 30 }); }
    await at(1300); await page.locator('.focus-btn [data-f=g]').first().click();
    await at(3500); await pinClick([0.33, 0.52]);
    await at(7900);
    await at.stop();
    await page.locator('.leaflet-popup-close-button').first().click().catch(() => {});
    await page.locator('.focus-btn [data-f=g]').first().click(); await sleep(2200); await tiles();
    await page.evaluate(() => { const fb = document.getElementById('filter-box'); if (fb) fb.open = false; });
    await sleep(400);
    // 4) haritada bağlam: listedeki bir bildirim → konumu ve puanı → toplu görünüm
    await page.mouse.move(700, 420);
    at = await rec(page, 's4');
    await at(400); const item = page.locator('#list .item').nth(1);
    { const b = await item.boundingBox(); if (b) await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 30 }); }
    await at(1100); await item.click().catch(() => {});
    await at(5200); await page.locator('.leaflet-popup-close-button').first().click().catch(() => {});
    await at(5600); { const b = await page.locator('.focus-btn [data-f=g]').first().boundingBox(); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 26 }); }
    await at(6200); await page.locator('.focus-btn [data-f=g]').first().click();
    await at(7600); await page.mouse.move(520, 470, { steps: 40 });
    await at(10400);
    await at.stop();
    // 5) kapanış kartı
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(SITE + 'araclar/video/giris/son.html'); await sleep(1500);
    await page.screenshot({ path: path.join(DIR, 's5.png') });
    await browser.close();
  }

  // ---------- 3) Bildir akışı (sahte oturum) ----------
  {
    const { browser, page } = await open({ w: W, h: H, bypassCSP: true, dark: true, geo: { latitude: 38.3196, longitude: 27.1569 } });
    await prep(page);
    await sahteOturum(page, { name: 'gonullu' });
    const sleep = (ms) => page.waitForTimeout(ms);
    await page.goto(SITE + '#/bildir'); await sleep(3000);
    await page.evaluate(() => window.scrollTo(0, 0));
    const scrollTo = (sel, frac) => page.evaluate(([s, f]) => { const e = document.querySelector(s); if (e) window.scrollTo({ top: e.getBoundingClientRect().top + scrollY - innerHeight * f, behavior: 'smooth' }); }, [sel, frac]);
    const glideClick = async (loc, steps = 20) => { const b = await loc.boundingBox(); if (!b) return; await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps }); await sleep(120); await loc.click(); };
    await page.mouse.move(520, 240);
    const at = await rec(page, 's3');
    await at(250); await scrollTo('#cat-card', 0.16);
    await at(700); await glideClick(page.locator('#cat-pick > *').first());
    await at(1500); { const sub = page.locator('#sub-pick > *').first(); if (await sub.count()) await glideClick(sub); }
    await at(2300); await scrollTo('#loc-card', 0.13);
    await at(3200); { const b = await page.locator('#pick-map').boundingBox(); if (b) { const x = b.x + b.width * 0.57, y = b.y + b.height * 0.5; await page.mouse.move(x, y, { steps: 22 }); await sleep(100); await page.mouse.click(x, y); } }
    await at(4900); await scrollTo('#photo-card', 0.2);
    await at(5500); { const b = await page.locator('#photo-card .drop').boundingBox(); if (b) await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 18 }); }
    await at(6200);
    const sets = await page.evaluate(() => [...document.querySelectorAll('#form-rest fieldset')].filter((f) => f.offsetParent && f.querySelector('.pill')).slice(0, 3)
      .map((f, i) => { f.id = f.id || 'vf' + i; return '#' + f.id; }));
    if (sets[0]) await scrollTo(sets[0], 0.18);
    await sleep(650);
    for (const [i, s] of sets.entries()) {
      const pills = page.locator(s + ' .pill'); const n = await pills.count(); if (!n) continue;
      const p = pills.nth(Math.min(n - 1, i === 0 ? 2 : i === 1 ? 0 : 2));
      const b = await p.boundingBox(); if (!b || b.y < 60 || b.y > 560) continue;
      await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 12 }); await p.click(); await sleep(300);
    }
    await at(8600); await scrollTo('#score-card', 0.38);
    await at(10400);
    await at.stop();
    await browser.close();
  }
  console.log('kayıt bitti:', DIR);
}

/* ===================== BİRLEŞTİRME ===================== */
function birlestir() {
  writeSubs();
  const ff = (args) => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit', cwd: DIR });
  const f = (n) => n.toFixed(3);
  const [s1, s2, s3, s4, s4b, s5] = SHOTS;
  // görüntü: s1 durağan kareden yavaş yaklaşma (hafif şafak sıcaklığı), s2–s4 kayıt, s5 kapanış kartı hafifçe yerine oturur
  const v = [
    `[0:v]scale=2560:1440,zoompan=z='1+0.06*on/(${Math.round(s1.len * 30)})':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${Math.round(s1.len * 30)}:s=${W}x${H}:fps=30,` +
      `colorbalance=rs=.05:gs=.01:bs=-.04:rm=.03:bm=-.02,eq=saturation=1.04,format=yuv420p,setpts=PTS-STARTPTS[v1]`,
    `[1:v]fps=30,scale=${W}:${H},trim=0:${f(s2.len)},setpts=PTS-STARTPTS,format=yuv420p[v2]`,
    `[2:v]fps=30,scale=${W}:${H},trim=0:${f(s3.len)},setpts=PTS-STARTPTS,format=yuv420p[v3]`,
    `[3:v]fps=30,scale=${W}:${H},trim=0:${f(s4.len)},setpts=PTS-STARTPTS,format=yuv420p[v4]`,
    `[4:v]scale=2560:1440,zoompan=z='1.035-0.035*min(on/90\\,1)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${Math.round(s5.len * 30)}:s=${W}x${H}:fps=30,format=yuv420p[v5]`,
    `[v1][v2]xfade=transition=fade:duration=${XF}:offset=${f(s2.at)}[x2]`,
    `[x2][v3]xfade=transition=fade:duration=${XF}:offset=${f(s3.at)}[x3]`,
    `[6:v]scale=2560:1440,zoompan=z='1.05-0.05*min(on/150\\,1)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${Math.round(s4b.len * 30)}:s=${W}x${H}:fps=30,format=yuv420p[v4b]`,
    `[x3][v4]xfade=transition=fade:duration=${XF}:offset=${f(s4.at)}[x4]`,
    `[x4][v4b]xfade=transition=fade:duration=${XF}:offset=${f(s4b.at)}[x4b]`,
    `[x4b][v5]xfade=transition=fade:duration=${XF + 0.3}:offset=${f(s5.at)}[x5]`,
    `[x5]subtitles=altyazi.srt:force_style='FontName=Segoe UI Semibold,FontSize=16,PrimaryColour=&H00FFFFFF,BackColour=&H8C0B0F0D,BorderStyle=4,Outline=0,Shadow=0,MarginV=46,Spacing=0.2',` +
      `fade=t=in:st=0:d=0.6,fade=t=out:st=${f(TOTAL - 0.8)}:d=0.8[v]`,
  ].join(';');
  // ses: aynı kaydın parçaları kendi yerlerine; altında çok hafif, anlatımda alçalan sentez fon (lisans gerektirmez)
  const parts = CUES.map((c, i) => `[5:a]atrim=${f(c.parca[0])}:${f(c.parca[1])},asetpts=PTS-STARTPTS,afade=t=in:d=0.03,areverse,afade=t=in:d=0.12,areverse,adelay=${Math.round(c.konum * 1000)}:all=1[a${i}]`);
  const pad = `aevalsrc='0.22*sin(2*PI*110*t)+0.16*sin(2*PI*164.81*t)+0.12*sin(2*PI*220*t)+0.08*sin(2*PI*277.18*t)+0.05*sin(2*PI*329.63*t)':s=48000:d=${f(TOTAL)},` +
    `tremolo=f=0.18:d=0.35,lowpass=f=900,aecho=0.8:0.7:120|260:0.25|0.18,volume=0.075,afade=t=in:d=2.5,afade=t=out:st=${f(TOTAL - 3)}:d=3[pad]`;
  const a = parts.join(';') + ';' + CUES.map((c, i) => `[a${i}]`).join('') + `amix=inputs=${CUES.length}:normalize=0:duration=longest,apad,atrim=0:${f(TOTAL)},asplit=2[voice][key];` +
    pad + ';[pad][key]sidechaincompress=threshold=0.02:ratio=6:attack=40:release=600[padd];' +
    `[voice][padd]amix=inputs=2:normalize=0:duration=first,loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000[a]`;
  const inputs = ['-loop', '1', '-t', f(s1.len), '-i', 's1.png', '-f', 'concat', '-safe', '0', '-i', 's2/liste.txt', '-f', 'concat', '-safe', '0', '-i', 's3/liste.txt', '-f', 'concat', '-safe', '0', '-i', 's4/liste.txt', '-loop', '1', '-t', f(s5.len), '-i', 's5.png', '-i', 'anlatim.mp3', '-loop', '1', '-t', f(s4b.len), '-i', 's4/00000.jpg'];
  ff([...inputs, '-filter_complex', v + ';' + a, '-map', '[v]', '-map', '[a]', '-t', f(TOTAL),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '25', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-g', '60',
    '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', 'giris-720.mp4']);
  // telefon / yavaş bağlantı için hafif sürüm ve kapak
  ff(['-i', 'giris-720.mp4', '-vf', 'scale=854:480:flags=lanczos', '-c:v', 'libx264', '-preset', 'slow', '-crf', '24', '-profile:v', 'main', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', 'giris-480.mp4']);
  ff(['-ss', f(s2.at + 4.6), '-i', 'giris-720.mp4', '-frames:v', '1', '-vf', 'scale=1024:-2', '-q:v', '7', 'giris-kapak.jpg']);
  console.log('hazır:', DIR, TOTAL.toFixed(1) + ' sn');
}

const cmd = process.argv[2];
if (cmd === 'kayit') kayit().catch((e) => { console.error(e); process.exit(1); });
else if (cmd === 'birlestir') birlestir();
else if (cmd === 'altyazi') console.log(writeSubs());
else console.log('kullanım: node araclar/giris-video.js kayit | birlestir | altyazi');
