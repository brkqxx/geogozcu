// media/ altındaki dosyalar (tanıtım videosu) için bayt aralığı (Range) desteği.
// Cloudflare Pages statik dosyalarda Range isteğine 200 + tüm dosya döndürüyor; iPhone Safari ise videoyu
// oynatmak için 206 (parça) bekler. Burada statik dosya akış halinde kesilip 206 olarak gönderilir
// (dosyanın tamamı belleğe alınmaz).
import SIZES from '../../araclar/medya-boyut.gen.js';

export async function onRequestGet({ request, next }) {
  const res = await next();
  const range = request.headers.get('Range');
  const name = decodeURIComponent(new URL(request.url).pathname.replace(/^.*?\/media\//, ''));
  const size = Number(res.headers.get('Content-Length')) || SIZES[name];
  const headers = new Headers(res.headers);
  headers.set('Accept-Ranges', 'bytes');
  if (!range || res.status !== 200 || !res.body || !Number.isFinite(size) || size <= 0) {
    return new Response(res.body, { status: res.status, headers });
  }
  const m = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
  let start, end;
  if (m && m[1] !== '') { start = Number(m[1]); end = m[2] !== '' ? Math.min(Number(m[2]), size - 1) : size - 1; }
  else if (m && m[2] !== '') { start = Math.max(0, size - Number(m[2])); end = size - 1; } // bytes=-N (son N bayt)
  if (!m || start === undefined || start > end || start >= size) {
    res.body.cancel();
    headers.set('Content-Range', 'bytes */' + size);
    headers.delete('Content-Length');
    return new Response(null, { status: 416, headers });
  }
  let pos = 0;
  const cut = new TransformStream({
    transform(chunk, ctl) {
      const a = pos, b = pos + chunk.byteLength; pos = b;
      if (b <= start || a > end) { if (a > end) ctl.terminate(); return; }
      ctl.enqueue(chunk.subarray(Math.max(0, start - a), Math.min(chunk.byteLength, end - a + 1)));
      if (b > end) ctl.terminate();
    },
  });
  res.body.pipeTo(cut.writable).catch(() => {}); // aralık bitince kaynak akış kapatılır
  headers.set('Content-Range', 'bytes ' + start + '-' + end + '/' + size);
  headers.set('Content-Length', String(end - start + 1));
  return new Response(cut.readable, { status: 206, headers });
}
