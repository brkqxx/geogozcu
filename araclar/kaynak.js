// İndirilebilir kaynak kod paketini hazırlar: araclar/kaynak-tmp/geogozcu-kaynak/
// Gizli bilgi içermez: config.js boş şablon, kötü söz listesi çıkarılmış.
const f = require('fs'), p = require('path');
const src = 'C:/Users/uberk/Downloads/files/';
const out = p.join(__dirname, 'kaynak-tmp', 'geogozcu-kaynak');
f.rmSync(p.join(__dirname, 'kaynak-tmp'), { recursive: true, force: true });
f.mkdirSync(p.join(out, 'veritabani', 'fonksiyonlar'), { recursive: true });
const cp = (a, b) => f.cpSync(src + a, p.join(out, b || a), { recursive: true });
['index.html', 'style.css', 'app.js', 'harita-araclari.js', 'sinema.js', 'sinirlar.js', 'sw.js', 'manifest.webmanifest', '_headers', 'vendor', 'icons'].forEach((x) => cp(x));
cp('araclar/OKU-BENI.md', 'OKU-BENI.md');
// config.js: kendi projenin bilgilerini yazacağın boş şablon
let c = f.readFileSync(src + 'config.js', 'utf8');
c = c.replace(/SUPABASE_URL:\s*"[^"]*"/, 'SUPABASE_URL: ""').replace(/SUPABASE_ANON_KEY:\s*"[^"]*"/, 'SUPABASE_ANON_KEY: ""');
if (/eyJ/.test(c)) throw new Error('config.js anahtar içeriyor');
f.writeFileSync(p.join(out, 'config.js'), c);
// veritabanı dosyaları (kötü söz listesi çıkarılır)
f.readdirSync(src).filter((n) => /^(supabase|guncelleme\d*)\.sql$/.test(n)).forEach((n) => {
  let s = f.readFileSync(src + n, 'utf8');
  s = s.replace(/insert into public\.banned_words \(word\) values[\s\S]*?on conflict do nothing;/,
    "-- Kelime listesi pakete konmadı. Kendi listeni ekle, ör.:\ninsert into public.banned_words (word) values ('ornekkelime')\non conflict do nothing;");
  f.writeFileSync(p.join(out, 'veritabani', n), s);
});
f.cpSync(src + 'supabase-functions', p.join(out, 'veritabani', 'fonksiyonlar'), { recursive: true });
console.log('kaynak paketi hazır:', out);
