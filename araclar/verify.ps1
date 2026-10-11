$b = "https://geogozcu.pages.dev"
$h = (Invoke-WebRequest "$b/?x=$(Get-Random)" -UseBasicParsing).Content
$v = ([regex]::Match($h, 'app\.js\?v=([0-9]+)')).Groups[1].Value
$ap = (Invoke-WebRequest "$b/app.js?v=$v" -UseBasicParsing).Content
$cs = (Invoke-WebRequest "$b/style.css?v=$v" -UseBasicParsing).Content
"canli surum: v$v"
"liste dugmesi (html): $($h.Contains('id=""btn-list""'))"
"kapat dugmesi (html): $($h.Contains('id=""sheet-close""'))"
"will-change .view kaldirildi: $(-not $cs.Contains('.view:not([hidden]),.pop'))"
"harita gecis animasyonu muaf: $($cs.Contains(':not(#view-map){animation:viewIn'))"
"kaydirinca tam ac: $($ap.Contains('yarım açıkken listede kaydırmaya'))"
