# BENİ İLK OKU

> **GeoGözcü** · EGEV 100. Yıl Anadolu Lisesi TÜBİTAK projesi · https://geogozcu.pages.dev
> Bu kodu öğrenmek için kullanıyorsan hoş geldin. Kaynak gösterdiğin sürece eğitim amaçlı serbestçe kullanabilirsin.

Bu rehber, **daha önce hiç kod yazmamış** bir öğrenci için yazıldı. Sırayla git; her adımda küçük bir şey değiştirip sonucu gör. Bir şeyi bozarsan paketi yeniden açman yeterli.

## Bu site ne yapıyor?

Gönüllüler gördükleri yangın risklerini fotoğraf ve konumla bildiriyor. Site, verilen cevaplardan 0-100 arası bir risk puanı hesaplıyor ve bildirimi haritaya koyuyor.

Sitenin üç parçası var:

| Parça | Ne yapar? | Nerede? |
|---|---|---|
| **HTML** | Sayfanın iskeleti: başlıklar, düğmeler, kutular | `index.html` |
| **CSS** | Görünüş: renkler, boyutlar, yerleşim | `style.css` |
| **JavaScript** | Davranış: düğmeye basınca ne olacağı, harita, puan | `app.js`, `sinema.js`, `harita-araclari.js` |

Veriler (bildirimler, kullanıcılar, fotoğraflar) tarayıcıda değil, **Supabase** adlı ücretsiz bir veritabanı hizmetinde durur.

## Başlamadan önce

1. **VS Code** kur: https://code.visualstudio.com
2. **Node.js** kur (LTS sürümü): https://nodejs.org
3. Bu klasörü VS Code ile aç: *File → Open Folder*.

## 1. adım: Siteyi kendi bilgisayarında aç

VS Code'da *Terminal → New Terminal* ile terminali aç ve yaz:

```
npx serve .
```

Terminalin verdiği adresi (genellikle `http://localhost:3000`) tarayıcıda aç. Site açılır ama harita boş kalır, çünkü henüz veritabanı bağlı değil. Bu normal; 5. adımda bağlayacaksın.

Dosyayı çift tıklayarak açma. Tarayıcı güvenlik nedeniyle bazı parçaları engeller, mutlaka bu adresten aç.

## 2. adım: İlk değişikliğin (HTML)

`index.html` dosyasında `Ctrl+F` ile **dijital yangın** ifadesini ara. Yazıyı değiştir, dosyayı kaydet (`Ctrl+S`), tarayıcıyı yenile.

**Görev:** Ana sayfadaki "Kuru ot, ormana bitişik evler" cümlesini kendi cümlenle değiştir.

## 3. adım: Rengi değiştir (CSS)

`style.css` dosyasının başlarında `--accent:#1F4D3A` yazan bir satır var. Sitenin ana rengi budur. `#1F4D3A` yerine örneğin `#6D28D9` yaz.

`--` ile başlayan bu adlara **değişken** denir. Bir yeri değiştirirsin, kullanıldığı her yer değişir.

**Görev:** Tarayıcıda bir düğmeye sağ tıkla, *İncele* (Inspect) de. Sağda hangi CSS kurallarının uygulandığını gör.

## 4. adım: Mantığı oku (JavaScript)

`app.js` içinde `Ctrl+F` ile **function scoreOf** ara. Risk puanı burada hesaplanır. Soruların cevapları puana çevrilir ve toplanır.

Örneğin `{ low: 0, mid: 14, high: 28 }[d.veg]` satırı bitki örtüsünün puanıdır. Küçük bir sayıyı değiştir, sonra Riskli Alan Bildir formunda puanın değiştiğini izle. Fonksiyonun içinde `s` toplam puandır; görmek için ilgili satırın altına şunu ekle:

```js
console.log('şu ana kadarki puan:', s);
```

Sonucu tarayıcıda `F12` → *Console* sekmesinde görürsün.

**Görevler:**
- "Orman kenarına uzaklık" ağırlığını artır. Sonuç neden değişti?
- Rüzgâr için yeni bir soru eklesen hangi yerleri değiştirmen gerekir?

## 5. adım: Kendi veritabanını kur (Supabase)

1. https://supabase.com üzerinde ücretsiz bir proje aç.
2. *SQL Editor* içinde `veritabani/supabase.sql` dosyasını çalıştır. Sonra `guncelleme.sql`, `guncelleme2.sql` … dosyalarını **sırayla** çalıştır.
3. `veritabani/fonksiyonlar/` içindeki sunucu fonksiyonlarını *Edge Functions* olarak yükle.
4. `config.js` dosyasını aç. *Project Settings → API* sayfasındaki **URL** ve **anon public** anahtarını yapıştır.

Ayrıntılı kurulum için `OKU-BENI.md` dosyasına bak.

### Çok önemli: güvenlik

- `anon` anahtarı herkese açık olabilir. Veriyi koruyan şey anahtar değil, veritabanındaki **RLS** (satır düzeyi güvenlik) kurallarıdır.
- **`service_role` anahtarını asla `config.js` içine ya da GitHub'a koyma.** O anahtar bütün veritabanını açar.
- Kullanıcıdan gelen hiçbir veriye güvenme. `app.js` içindeki `esc()` fonksiyonuna bak: yazıları ekrana basmadan önce zararsız hâle getirir (XSS saldırısına karşı).
- Yönetici kontrolü yalnız tarayıcıda yapılırsa atlatılır. Bu yüzden `veritabani/` içindeki `is_admin()` kontrolleri sunucudadır.

## 6. adım: Yayınla

Klasörü Cloudflare Pages, Netlify ya da GitHub Pages gibi ücretsiz bir statik barındırmaya yükle.

## Bu kodda neyi öğrenebilirsin?

| Konu | Nereye bak? |
|---|---|
| Sayfalar arası geçiş (tek sayfalık site) | `app.js` → `function route` |
| Harita, kümeleme | `app.js` → `function renderMap`, `vendor/leaflet.js` |
| Mesafe ve alan ölçümü | `harita-araclari.js` |
| Grafik çizmek (kütüphanesiz) | `app.js` → `barChart`, `columnChart`, `chartPng` |
| Kaydırmaya bağlı animasyon | `sinema.js` → `homeMotion` |
| Fareyi takip eden hareket | `sinema.js` → `pointerMotion` |
| Telefon ve tablet uyumu | `style.css` → `@media`, `[data-ui=mobile]` |
| Veritabanı güvenliği | `veritabani/supabase.sql` → `policy` satırları |

## Küçük projeler

1. **Kolay:** Risk türlerine yeni bir renk ver.
2. **Kolay:** Ana sayfaya okulunun adını ve bir fotoğrafını ekle.
3. **Orta:** Haritaya kendi ilçenin sınırını ekle (`sinirlar.js`).
4. **Orta:** Son 7 günün bildirimlerini gösteren yeni bir grafik yap.
5. **Zor:** Bildirim formuna rüzgâr sorusu ekle ve puana dahil et.

## Takıldığında

- `F12` → *Console*: kırmızı hatanın dosyasını ve satırını okur.
- Hatayı bir arama motoruna ya da yapay zekâ asistanına yapıştır, ama **gelen cevabı anlamadan koda koyma**.
- Bu site de yapay zekâ (Claude Code, Gemini) yardımıyla geliştirildi. Yapay zekâ bir yardımcıdır: fikri, saha verisini ve sorumluluğu proje ekibi taşır.

## Kaynak gösterme

Bu kodu kullanırsan şu satırı projene ekle:

> Bu proje, EGEV 100. Yıl Anadolu Lisesi öğrencilerinin geliştirdiği GeoGözcü'den (https://geogozcu.pages.dev) yararlanılarak yapılmıştır.

Harita verisi © OpenStreetMap katkıcıları · Uydu görüntüsü © Esri.
