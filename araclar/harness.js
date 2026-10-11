// Yerel test sayfası: sahte Supabase + önbellek görevlisi kapalı + her dosya taze (?v=zaman)
const f = require('fs');
let h = f.readFileSync('index.html', 'utf8');
const t = Date.now();
h = h.replace(/\?v=\d+"/g, '?v=' + t + '"');
h = h.replace(/<script src="config\.js(\?v=\d+)?"><\/script>/, (m) => '<script>navigator.serviceWorker && navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister())); try { delete Navigator.prototype.serviceWorker; } catch (e) {}</script>\n<script src="stub-supabase.js?v=' + t + '"></script>\n' + m);
f.writeFileSync('test-harness.html', h);
console.log('harness', h.includes('stub-supabase'));
