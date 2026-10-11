# Rehberi 1920x1080 video dosyası olarak kaydet (sessiz, WebM) → araclar\video\rehber.webm
# Sesli anlatımlı MP4 için: tarayıcıda https://geogozcu.pages.dev/?sunum adresini aç, F11 ile tam ekran yap,
# Win+Alt+R ile Xbox Game Bar kaydını başlat, "Rehberi izle" düğmesine bas, bitince yine Win+Alt+R.
# Kullanım: powershell -ExecutionPolicy Bypass -File araclar\rehber-video.ps1 [-Adres http://localhost:8000/test-live.html]
param([string]$Adres = 'https://geogozcu.pages.dev/')
$ErrorActionPreference = 'Continue'
$sp = Split-Path -Parent $MyInvocation.MyCommand.Path
$out = Join-Path $sp 'video'
New-Item -ItemType Directory -Force $out | Out-Null
$dosya = Join-Path $out 'rehber.webm'
$s = '-s=video'
playwright-cli $s open "$($Adres)?sunum=sessiz" --browser=msedge | Out-Null
playwright-cli $s resize 1920 1080 | Out-Null
Start-Sleep 4
playwright-cli $s video-start $dosya | Out-Null
playwright-cli $s click '.gd-big' | Out-Null
playwright-cli $s mousemove 1900 1070 | Out-Null
# rehber yaklaşık 39 sn; son kare için biraz pay
Start-Sleep 44
playwright-cli $s video-stop | Out-Null
playwright-cli $s close | Out-Null
if (Test-Path $dosya) { Write-Host "Video hazır: $dosya" } else { Write-Host "Video bulunamadı; $out klasörüne bak." }
