// Yerel deneme sunucusu (yalnız geliştirme): Cloudflare Pages'e benzer davranır.
// - _headers dosyasındaki başlıkları uygular (CSP vb.), böylece yerel deneme canlı siteyle aynı kurallarla çalışır
// - Range isteklerine 206 döner (video/ses ileri sarma), doğru MIME türlerini gönderir
// Kullanım: node araclar/sunucu.js [port] [kök klasör]   (varsayılan 8000, proje klasörü)
const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// GG_ROOT=araclar/cf ile küçültülmüş yayın kopyası sunulabilir (ölçüm için)
const ROOT = path.resolve(process.argv[3] || process.env.GG_ROOT || path.join(__dirname, '..'));
const PORT = Number(process.argv[2]) || 8000;
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.mp3': 'audio/mpeg', '.srt': 'text/plain; charset=utf-8', '.vtt': 'text/vtt; charset=utf-8',
  '.zip': 'application/zip', '.txt': 'text/plain; charset=utf-8',
};

// _headers: "/yol" satırları kural başlatır, girintili satırlar başlık ya da "! Ad" (kaldır) içerir
function readRules() {
  const rules = [];
  let cur = null;
  for (const line of fs.readFileSync(path.join(ROOT, '_headers'), 'utf8').split(/\r?\n/)) {
    if (!line.trim()) continue;
    if (!/^\s/.test(line)) { cur = { pat: line.trim(), set: [], del: [] }; rules.push(cur); continue; }
    const t = line.trim();
    if (t.startsWith('!')) cur.del.push(t.slice(1).trim().toLowerCase());
    else { const i = t.indexOf(':'); cur.set.push([t.slice(0, i).trim(), t.slice(i + 1).trim()]); }
  }
  return rules;
}
const match = (pat, p) => new RegExp('^' + pat.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$').test(p);

function headersFor(p) {
  const out = new Map();
  for (const r of readRules()) {
    if (!match(r.pat, p)) continue;
    r.del.forEach((d) => out.delete(d));
    r.set.forEach(([k, v]) => out.set(k.toLowerCase(), [k, v]));
  }
  return [...out.values()];
}

http.createServer((req, res) => {
  let u = decodeURIComponent(req.url.split('?')[0]);
  if (u === '/') u = '/index.html';
  const fp = path.join(ROOT, u);
  if (!fp.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  fs.stat(fp, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('404'); }
    const h = { 'Content-Type': MIME[path.extname(fp).toLowerCase()] || 'application/octet-stream', 'Accept-Ranges': 'bytes' };
    for (const [k, v] of headersFor(u)) h[k] = v;
    const range = /bytes=(\d*)-(\d*)/.exec(req.headers.range || '');
    if (range) {
      const start = range[1] ? Number(range[1]) : Math.max(0, st.size - Number(range[2]));
      const end = range[1] && range[2] ? Math.min(Number(range[2]), st.size - 1) : st.size - 1;
      if (start >= st.size) { res.writeHead(416, { 'Content-Range': 'bytes */' + st.size }); return res.end(); }
      res.writeHead(206, Object.assign(h, { 'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Content-Length': end - start + 1 }));
      return req.method === 'HEAD' ? res.end() : fs.createReadStream(fp, { start, end }).pipe(res);
    }
    // metin dosyaları gzip'le sıkıştırılır (Cloudflare da sıkıştırır; ölçümler gerçeğe yakın olsun)
    if (/^(text\/|application\/(json|manifest)|image\/svg)/.test(h['Content-Type']) && /gzip/.test(req.headers['accept-encoding'] || '')) {
      res.writeHead(200, Object.assign(h, { 'Content-Encoding': 'gzip', Vary: 'Accept-Encoding' }));
      return req.method === 'HEAD' ? res.end() : fs.createReadStream(fp).pipe(zlib.createGzip({ level: 6 })).pipe(res);
    }
    res.writeHead(200, Object.assign(h, { 'Content-Length': st.size }));
    return req.method === 'HEAD' ? res.end() : fs.createReadStream(fp).pipe(res);
  });
}).listen(PORT, () => console.log('GeoGözcü yerel sunucu: http://localhost:' + PORT));
