# GeoGözcü · kaynak kod

EGEV 100. Yıl Lisesi TÜBİTAK projesi. Gaziemir'de orman yangını riski taşıyan alanları
vatandaş bilimiyle, **yangın çıkmadan önce** haritalayan web uygulaması.
Canlı site: https://geogozcu.pages.dev

## Ne amaçlıyoruz?
1. **Yangından önce görmek:** ormana dayanan mahallelerdeki kuru ot, atık ve eksik altyapıyı haritalamak.
2. **Herkesin katılabildiği bilim:** öğrenciler ve mahalle sakinleri aynı sorularla, karşılaştırılabilir veri toplar.
3. **Açık veri:** belediye, itfaiye ve araştırmacılar verileri CSV ya da GeoJSON olarak indirebilir.
4. **Afet bilinci:** coğrafya ve CBS derslerinde gerçek, yerel veriyle çalışmak.
5. **Kopyalanabilirlik:** başka okullar aynı sistemi kendi ilçeleri için ücretsiz araçlarla kurabilsin.

## Klasörler
| Dosya | Görevi |
|---|---|
| `index.html` | Sayfa iskeleti (tek sayfa, `#/harita`, `#/proje` gibi adresler) |
| `style.css` | Tasarım, açık / koyu tema, telefon düzeni |
| `app.js` | Uygulama mantığı: harita, bildirim formu, risk puanı, yönetici paneli |
| `harita-araclari.js` | Harita katmanları ve araçlar (arama, mesafe, alan, koordinat) |
| `sinema.js` | GSAP animasyonları ve “Rehber” tanıtımı |
| `sinirlar.js` | İzmir ve Gaziemir sınırları (OpenStreetMap) |
| `config.js` | Kendi Supabase adresin ve herkese açık (anon) anahtarın |
| `vendor/` | Leaflet, MarkerCluster, Supabase istemcisi, GSAP |
| `veritabani/` | Supabase'de sırayla çalıştırılacak SQL dosyaları ve sunucu fonksiyonları |

## Kendi bilgisayarında açmak
Bir klasörde basit bir sunucu başlat ve tarayıcıda aç:
```
npx serve .
```

## Kendi sürümünü kurmak
1. https://supabase.com üzerinde ücretsiz bir proje aç.
2. `veritabani/supabase.sql`, ardından `guncelleme.sql`, `guncelleme2.sql` … sırayla SQL Editor'de çalıştır.
3. `veritabani/fonksiyonlar/` içindeki sunucu fonksiyonlarını Supabase Edge Functions olarak yükle.
4. `config.js` içine Project Settings → API sayfasındaki **URL** ve **anon public** anahtarını yaz.
   `service_role` anahtarını asla bu dosyaya koyma.
5. Klasörü Cloudflare Pages, Netlify ya da GitHub Pages gibi bir statik barındırmaya yükle.

Not: Kötü söz filtresinin kelime listesi güvenlik için pakete konmadı; `guncelleme8.sql` içindeki
`banned_words` ekleme satırına kendi listeni yaz (yönetici panelinden de eklenebilir).

## Kullanım
Eğitim amaçlı serbestçe kullanabilir ve değiştirebilirsin; kaynak göstermen rica olunur.
Harita verisi © OpenStreetMap katkıcıları, uydu görüntüsü © Esri.
