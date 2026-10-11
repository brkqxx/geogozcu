// Gerçek veritabanıyla yerel deneme sayfası: önbellek görevlisi kapalı, her dosya taze (?v=zaman)
const f = require('fs');
process.chdir('C:/Users/uberk/Downloads/files');
let h = f.readFileSync('index.html', 'utf8');
const t = Date.now();
h = h.replace(/\?v=\d+"/g, '?v=' + t + '"');
h = h.replace(/src="(vendor\/(?:gsap|ScrollTrigger|SplitText)\.min\.js)"/g, (m, s) => 'src="' + s + '?v=' + t + '"');
h = h.replace('<script src="config.js', () => '<script>navigator.serviceWorker && navigator.serviceWorker.getRegistrations().then((r) => r.forEach((x) => x.unregister())); try { delete Navigator.prototype.serviceWorker; } catch (e) {}</script>\n<script src="config.js');
f.writeFileSync('test-live.html', h);
console.log('test-live.html', /gsap\.min\.js\?v=/.test(h));
