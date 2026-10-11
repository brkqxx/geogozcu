# Sürüm artır, derle, kaynak paketini hazırla, Cloudflare'e yükle
$ErrorActionPreference = 'Stop'
$sp = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location C:\Users\uberk\Downloads\files
node "$sp\bump.js"
node --check app.js
node --check harita-araclari.js
node --check sinema.js
node "$sp\build.js"
$files = 'index.html','style.css','app.js','harita-araclari.js','sinema.js','config.js','sinirlar.js','site-tek-dosya.html','manifest.webmanifest','sw.js','_headers'
New-Item -ItemType Directory -Force "$sp\cf" | Out-Null; Copy-Item $files "$sp\cf" -Force
Copy-Item icons,vendor,media "$sp\cf" -Recurse -Force
node "$sp\medya-boyut.js"
node "$sp\kaynak.js"
Compress-Archive -Path "$sp\kaynak-tmp\geogozcu-kaynak" -DestinationPath "$sp\cf\geogozcu-kaynak.zip" -Force
$ErrorActionPreference = 'Continue'
npx -y wrangler@latest pages deploy "$sp\cf" --project-name geogozcu --branch main --commit-dirty=true 2>&1 | Select-String "Deployment complete|ERROR|Not logged"

