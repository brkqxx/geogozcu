# Sürüm artır, derle, kaynak paketini hazırla, Cloudflare'e yükle
# -Derle: yalnız araclar\cf yayın kopyasını hazırlar (sürüm artmaz, yükleme yapılmaz) — yerel ölçüm/deneme için
param([switch]$Derle)
$ErrorActionPreference = 'Stop'
$sp = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location C:\Users\uberk\Downloads\files
if (-not $Derle) { node "$sp\bump.js" }
node --check app.js
node --check harita-araclari.js
node --check sinema.js
node --check splash.js
node "$sp\build.js"
$files = 'index.html','style.css','app.js','harita-araclari.js','sinema.js','splash.js','config.js','sinirlar.js','site-tek-dosya.html','manifest.webmanifest','sw.js','_headers'
New-Item -ItemType Directory -Force "$sp\cf" | Out-Null; Copy-Item $files "$sp\cf" -Force
Copy-Item icons,vendor,media,fonts "$sp\cf" -Recurse -Force
# yayın kopyası: küçült + eski tarayıcılar için sözdizimini indir (kaynak dosyalar okunur kalır)
if (!(Test-Path "$sp\node_modules\esbuild")) { npm install --prefix "$sp" --no-fund --no-audit }
node "$sp\kucult.js" "$sp\cf"
foreach ($j in 'app.js','sinema.js','harita-araclari.js','splash.js') { node --check "$sp\cf\$j" }
node "$sp\medya-boyut.js"
node "$sp\kaynak.js"
Compress-Archive -Path "$sp\kaynak-tmp\geogozcu-kaynak" -DestinationPath "$sp\cf\geogozcu-kaynak.zip" -Force
if ($Derle) { Write-Host "Derlendi: $sp\cf (yükleme yapılmadı)"; return }
$ErrorActionPreference = 'Continue'
npx -y wrangler@latest pages deploy "$sp\cf" --project-name geogozcu --branch main --commit-dirty=true 2>&1 | Select-String "Deployment complete|ERROR|Not logged"

