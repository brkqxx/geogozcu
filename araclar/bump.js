// index.html ve sw.js içindeki sürüm numarasını 1 artırır
const f = require('fs');
const dir = 'C:/Users/uberk/Downloads/files/';
let h = f.readFileSync(dir + 'index.html', 'utf8');
const cur = Number((h.match(/app\.js\?v=(\d+)/) || [])[1]);
const n = cur + 1;
h = h.replace(/\?v=\d+"/g, '?v=' + n + '"');
f.writeFileSync(dir + 'index.html', h);
let s = f.readFileSync(dir + 'sw.js', 'utf8');
s = s.replace(/risk-haritasi-v\d+/, 'risk-haritasi-v' + n);
f.writeFileSync(dir + 'sw.js', s);
console.log('v' + cur + ' -> v' + n);
