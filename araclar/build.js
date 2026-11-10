// Tek dosyalık sürüm: tüm yerel CSS/JS ve vendor/ kütüphaneleri index.html içine gömülür
const f = require('fs');
let h = f.readFileSync('index.html', 'utf8');
const inline = (name) => f.readFileSync(name, 'utf8').replace(/<\/script>/gi, '<\\/script>');
const esc = (s) => s.replace(/[.?*+^$()[\]{}|\\/]/g, '\\$&');
for (const css of ['vendor/leaflet.css', 'vendor/markercluster.css']) {
  h = h.replace(new RegExp('<link rel="stylesheet" href="' + esc(css) + '">'), () => '<style>\n' + f.readFileSync(css, 'utf8') + '\n</style>');
}
h = h.replace(/<link rel="stylesheet" href="style\.css(\?v=\d+)?">/, () => '<style>\n' + f.readFileSync('style.css', 'utf8') + '</style>');
for (const js of ['splash.js', 'vendor/leaflet.js', 'vendor/markercluster.js', 'vendor/supabase.js', 'config.js', 'sinirlar.js', 'harita-araclari.js', 'app.js', 'vendor/gsap.min.js', 'vendor/ScrollTrigger.min.js', 'vendor/SplitText.min.js', 'sinema.js']) {
  h = h.replace(new RegExp('<script src="' + esc(js) + '(\\?v=\\d+)?"><\\/script>'), () => '<script>\n' + inline(js) + '\n</script>');
}
if (/href="(style\.css|vendor\/)|src="(vendor\/|app|config|sinirlar|harita-araclari|sinema|splash)/.test(h)) throw new Error('not inlined');
f.writeFileSync('site-tek-dosya.html', h);
console.log('site-tek-dosya.html', h.length);
