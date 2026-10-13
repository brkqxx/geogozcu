// Yayın kopyasını (araclar/cf) küçültür ve eski tarayıcılar için sözdizimini indirir (esbuild).
// Kaynak dosyalar okunur hâlde kalır; yalnız yayınlanan kopyalar değişir.
// Hedef: Chrome/Android WebView 70+, Firefox 68+, Safari 12+ (?? ve ?. gibi yeni sözdizimi eski motorlarda hata vermesin).
// Kullanım: node araclar/kucult.js [klasör]   (varsayılan araclar/cf)
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const DIR = path.resolve(process.argv[2] || path.join(__dirname, 'cf'));
const TARGET = ['chrome70', 'firefox68', 'safari12', 'edge79'];
const JS = ['app.js', 'sinema.js', 'harita-araclari.js', 'splash.js', 'sinirlar.js', 'config.js', 'vendor/supabase.js'];
const CSS = ['style.css', 'fonts/fonts.css', 'vendor/leaflet.css', 'vendor/markercluster.css'];

let before = 0, after = 0;
const row = (f, a, b) => console.log(f.padEnd(24), String(Math.round(a / 1024)).padStart(5) + ' KB →', String(Math.round(b / 1024)).padStart(4) + ' KB');
for (const f of JS) {
  const p = path.join(DIR, f);
  if (!fs.existsSync(p)) continue;
  const src = fs.readFileSync(p, 'utf8');
  // betikler klasik <script> (modül değil); üst düzey adlar (window.CONFIG vb.) korunur
  const out = esbuild.transformSync(src, { loader: 'js', target: TARGET, minify: true, legalComments: 'inline', charset: 'utf8' }).code;
  fs.writeFileSync(p, out);
  before += src.length; after += out.length; row(f, src.length, out.length);
}
for (const f of CSS) {
  const p = path.join(DIR, f);
  if (!fs.existsSync(p)) continue;
  const src = fs.readFileSync(p, 'utf8');
  const out = esbuild.transformSync(src, { loader: 'css', target: TARGET, minify: true, legalComments: 'inline', charset: 'utf8' }).code;
  fs.writeFileSync(p, out);
  before += src.length; after += out.length; row(f, src.length, out.length);
}
console.log('toplam'.padEnd(24), String(Math.round(before / 1024)).padStart(5) + ' KB →', String(Math.round(after / 1024)).padStart(4) + ' KB');
