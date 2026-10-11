// Yayından önce media/ dosyalarının boyutlarını functions/media için modül olarak yazar
// (Pages Function içinde statik yanıtta Content-Length gelmiyor; Range için toplam boyut gerekli).
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const dir = path.join(root, 'media');
const sizes = {};
// alt klasörler dahil; anahtar media/ altındaki göreli yol (ör. tur/1.mp3)
const walk = (d, pre) => fs.readdirSync(d).forEach((n) => { const p = path.join(d, n), st = fs.statSync(p); if (st.isDirectory()) walk(p, pre + n + '/'); else sizes[pre + n] = st.size; });
if (fs.existsSync(dir)) walk(dir, '');
fs.writeFileSync(path.join(__dirname, 'medya-boyut.gen.js'), '// otomatik üretilir: araclar/medya-boyut.js\nexport default ' + JSON.stringify(sizes) + ';\n');
console.log('medya boyutları:', JSON.stringify(sizes));
