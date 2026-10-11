# GeoGözcü — Gaziemir'in dijital yangın gözcüsü (EGEV 100. Yıl Lisesi TÜBİTAK)

Canlı site: **https://geogozcu.pages.dev**

---

## SÜRÜM 41 — yeni hero, erkek anlatıcı, GitHub (11 Ekim 2026)
- **Ana sayfa hero yeniden:** tam ekran yeni alacakaranlık orman klibi (sol alt koyu, sağda kasaba ışıkları; `media/hero.*`), 3 katmanlı gölge, sol altta "geogözcü" künyesi + 3 satırlık ince başlık (Poppins 300) + 2 satır açıklama, krem "Haritayı aç" hapı, "Turu izle" bağlantısı, sağ altta "Kaydır". Ölçek 1280×960 referanslı `--u` birimiyle; telefon, kısa yatay ekran ve tablet kuralları ayrı.
- **Üst çubuk (ana sayfa):** cam logo hapı, siyah menü hapı, krem "Riskli alan bildir" hapı; hero geçilince buzlu cam.
- **Giriş animasyonu:** logo → menü → künye → başlık satırları maskeden yükselir → açıklama → düğmeler → "Kaydır"; bitince satır içi stil kalmaz. Az hareket tercihinde yok.
- **Canlı durum:** risk kadranı ve canlı sayılar hero'nun hemen altında ayrı bölümde.
- **Anlatıcı:** tur ve tanıtım videosu yeniden sakin erkek sesinde (tur doğal hızda ~1 dk). Medya dosyaları sürüm numarasıyla istenir (önbellekte eski ses kalmaz).
- Görüntü başlıkları Poppins 300.
- Kaynak kod özel GitHub deposunda (brkqxx/geogozcu).

## SÜRÜM 40 — harita sayfası, 1 dakikalık tur, yeni anlatıcı (11 Ekim 2026)
- **Harita (masaüstü):** sayfa artık kaymıyor; üst çubuk + harita/panel ekranı tam doldurur, alt bilgi gizli (panel kendi içinde kayar).
- **Harita kontrolleri:** yakınlaştırma, odak düğmeleri, araç çubuğu, katman seçici, açıklama kutusu, ölçek ve kaynak satırı her temada aynı koyu buzlu cam; "+ Bildir" tek satır.
- **Tur ~1 dk, 11 adım:** karşılama → harita → renklerin anlamı → küme → gözlem ayrıntısı → liste/filtreler → risk bildir → liderlik → proje → profil (giriş yapmışsa) → kapanış. Ayarlar → "Turu tekrar izle" ve yeni hesabın ilk girişi artık bu sinematik turu açar; bitince ilk görevler başlar (eski karşılama akışı yalnız yedek).
- **Anlatıcı:** kullanıcının seçtiği sıcak kadın sesi (tur ve tanıtım videosu). Tur kayıtları %10 hızlı (perde korunur), video doğal hızda. Tanıtım videosu 63 sn.
- Ses ses-ornekleri/ klasöründe karşılaştırma örnekleri var (sitede yayınlanmaz).

## SÜRÜM 39 — sesli tanıtım turu (11 Ekim 2026)
- Ana sayfada **Turu izle** (ve ilk ziyarette küçük davet kartı): kendi imleciyle gerçek arayüzü gezer — hero → harita → Gaziemir odağı/küme → gözlem ayrıntısı (puan + oylama) → liderlik tablosu → "Riskli alan bildir".
- Her adım stüdyo kalitesinde Türkçe ses kaydıyla (media/tur/*.mp3, -16 LUFS) eşzamanlı; altyazı sesle birlikte değişir. Tıklama/kaydırma/tuş turu keser. Tarayıcı konuşma sentezi kullanılmaz.
- Orman görüntüsü "Temsilî görüntü" olarak etiketli.
- Sınıf adları gtour-* (uygulamanın kendi ilk kullanım turu .tour ile çakışmasın diye).

## SÜRÜM 37 — sinematik ana sayfa (11 Ekim 2026)
- ui-ux-pro-max tasarım sistemi (kaydırmayla anlatı, doğa/bilim stili, köz turuncusu vurgu) + motionsites.ai "Nature Portfolio" şablonundan uyarlanan hareket dili.
- Ana sayfa hero: tam ekran, döngüde oynayan sessiz orman filmi (`media/hero.webm/mp4`; "temsilî görüntü" notu), kenar karartma, paralaks.
- Başlıklar Instrument Serif (hero: kelime kelime bulanıktan netleşir; "yangın gözcüsü" italik/köz rengi). Arayüz metinleri sans kalır.
- Ana sayfada üst çubuk film üstünde saydam, hero geçilince buzlu cam; "Kaydır" işareti; masaüstünde küçük fark-karışımlı imleç.
- Film; az hareket, veri tasarrufu, gizli sekme ya da başka sayfada oynamaz.
- **Rehber oynatıcısı kaldırıldı** (kullanıcı isteği): ana sayfada yerine 49 sn'lik tanıtım videosu var; Proje sayfasındaki Rehber bölümü de kaldırıldı (tanıtım videosu orada kalıyor). Sayfa değişince tanıtım videosu durur.

## SÜRÜM 34–36 — sesli tanıtım videosu yayında (10 Ekim 2026)
- **Proje → Tanıtım videosu** (`media/tanitim.mp4`, 49 sn, 1920×1080, 30 fps, H.264 + AAC, altyazı gömülü; ayrıca `media/altyazi.srt`).
  - Açılış (ilk ~7 sn): **temsilî** orman/yerleşim sahnesi; videoda "Temsilî görüntü" yazar.
  - Geri kalan her şey: canlı sitenin gerçek tarayıcı kaydı (Playwright): ana sayfa → harita/kümeler → gözlem ayrıntısı (puan + "düzeldi mi?" oyu) → Proje grafikleri → liderlik tablosu → kapanış kartı.
  - Anlatım: Türkçe anlatıcı kaydı, −16 LUFS.
  - Üretim hattı: `node araclar/tanitim.js kayit` (kayıt betiği) → playwright-cli ile kayıt → `node araclar/tanitim.js birlestir` (FFmpeg). Ayrıntı: `araclar/video/anlatim.md`.
- **iPhone için video akışı:** Cloudflare Pages statik dosyada Range isteğini desteklemiyor → `functions/media/[[path]].js` 206 parça yanıtı verir
  (boyutlar yayında `araclar/medya-boyut.js` ile üretilir). Service worker `media/` ve Range isteklerine karışmaz.
- **Arayüz denetimi (Vercel web arayüz yönergeleri):** koyu temada `color-scheme`, harita arama kutusuna görünür odak, tam ekran/sunum katmanlarında
  `overscroll-behavior: contain` ve çentik payı.

## SÜRÜM 33 — rehber cilası, sunum modu, dokunmatik iyileştirmeler (10 Ekim 2026)
- **Rehber sesli anlatımı:** okunacak metin altyazıdan ayrı ve okunuşa göre yazıldı ("sıfırdan yüze", "yüz on iki").
  Anlatım bitmeden bölüm sonuna gelinirse görüntü son karede bekler, ses bitince devam eder (ses–görüntü hep aynı bölümde).
  En doğal Türkçe ses kendiliğinden seçilir (Edge "Natural" sesleri öncelikli). Bölüm sonlarına okuma payı eklendi (~39 sn).
- **Oynatıcı:** klavye kısayolları (boşluk/K oynat, ←/→ 3 sn, M ses, F tam ekran, 1-6 bölüm); sekme gizlenince durur;
  tam ekranı desteklemeyen tarayıcılarda (iPhone Safari) sayfayı kaplayan yedek görünüm; harita nabız halkaları
  yalnız oynarken çalışır (pil/akıcılık); kayan şerit ekran dışındayken durur.
- **Sunum modu:** `https://geogozcu.pages.dev/?sunum` → rehber tüm ekranı kaplar, sesli anlatım açık, kontroller fare
  durunca gizlenir, Esc siteye döner. `?sunum=sessiz` anlatımsız.
- **Video kaydı:** `araclar\rehber-video.ps1` rehberi 1920×1080 WebM olarak kaydeder (`araclar\video\`).
- **Telefon:** harita odak düğmeleri, Proje menüsü, rehber düğmeleri ve bölüm düğmeleri parmakla rahat basılacak boyda (≥38–44 px).

## SÜRÜM 32 — sinematik arayüz, rehber, kaynak kod, saha verisi (10 Ekim 2026)
- **GSAP 3.13** (vendor/gsap.min.js, ScrollTrigger, SplitText) ve yeni `sinema.js`:
  ana sayfa başlığı satır satır açılır, imleci izleyen ışık + film greni, kayan risk şeridi, kaydırınca beliren bölümler.
- **Rehber** (ana sayfa `#rehber` ve Proje → Rehber): video gibi oynayan 45 sn'lik, 6 bölümlü tanıtım
  (sorun → gözlem → puan → harita → takip → sen). Oynat/duraklat, sürüklenebilir ilerleme çubuğu, bölüm atlama,
  tam ekran, isteğe bağlı Türkçe sesli anlatım (tarayıcının konuşma sentezi). Harita sahnesi gerçek Gaziemir
  sınırını ve canlı bildirim noktalarını kullanır. "Az hareket" seçeneğinde kendiliğinden oynamaz.
- **Proje sayfası:** bölüm menüsü bilgisayarda artık en üste yapışıyor (kayma / üst üste binme düzeldi);
  en alta "Kaynak kod ve amacımız" bölümü: hedefler + `geogozcu-kaynak.zip` indirme (deploy sırasında
  `araclar/kaynak.js` üretir; config.js boş şablon, kötü söz listesi çıkarılmış).
- **Saha verisi:** Google Forms Excel'indeki 20 gözlem (satır 2-22, konumsuz satır 6 hariç) haritaya eklendi
  (`source='import'`, gözlemci adları maskeli, puan tablosuna sayılmaz). Satır 6'nın konumu yok; yönetici
  panelindeki "Veri içe aktar" ile aynı dosya yüklenip "Haritada seç" ile eklenebilir (diğer satırlar "zaten ekli" görünür).
- Yerel deneme: `node araclar/testlive.js` → http://localhost:8000/test-live.html (gerçek veritabanı, önbellek kapalı).

## SÜRÜM 11-13 — beta testi hazırlığı (5 Ekim 2026)

- **Mailsiz kayıt:** hesap `signup` sunucu fonksiyonuyla anında onaylı açılır (IP başına saatte 10 kayıt). Google düğmesi yalnızca Supabase'de Google girişi açıksa görünür.
- **"Sorun çözüldü mü?" oylaması:** her bildirimde 👍/👎 ve eklenme tarihi. En az 3 oy ve %60+ "düzelmiş" → yöneticilere haber, "🔧 Düzelmiş olabilir" sekmesi; çözülen bildirim 2 gün sonra haritadan kalkar (`guncelleme11.sql`).
- **Yeni tanıtım:** 8 animasyonlu ekran (risk puanı ve oy demoları), 8 adımlı tur, "🎯 İlk görevlerin" kartı.
- **Yönetici:** telefonda 🛡️ düğmesi; hesap silme (fotoğraflarıyla birlikte, `admin-user` fonksiyonu); **tüm yöneticiler eşit yetkili**, "Kurucu" yalnızca görünen bir rozet; Ayarlar → "Rozetlerimi düzenle".
- **Hatalar:** bildirim kutusunun ekranı kaplaması (sınıf adı çakışması), telefonda Ayarlar kartının taşması, süresi dolmuş sıfırlama bağlantısında boş ekran.
- **Sürüm 14:** karşılama sayfası (`#/ana`; giriş yapmamış ziyaretçi ilk bunu görür), sade bildirim seçimi (Yangın / Acil / Başka bir risk → alt başlıklar; seçimden sonra tek satırlık özet), yönetici yöneticiyi silemez, hesap silme tek tık.
- **Sürüm 15 — harita:** uydu Esri World Imagery'de kaldı (Gaziemir: 20 Ocak 2026 çekimi, 34 cm; Esri yeniledikçe kendiliğinden güncellenir) ve haritada görüntü tarihi etiketi gösteriliyor. Sokak ve sade harita, güncellenmeyen Esri katmanlarından OpenStreetMap verili CARTO Voyager / Positron'a geçti.
- **Sürüm 16 — kurumsal seviye harita:**
  - `harita-araclari.js` (ayrı modül, JSDoc tipleri + `// @ts-check`): global `GG` deposu (`GG.flyTo`, `GG.get().map`, `GG.subscribe`), 5 altlıklı katman seçici (uydu, sokak, topoğrafik, gece, sade; yumuşak geçiş), araç çubuğu (yer arama/otomatik tamamlama, yakınımdakiler, konumum, mesafe ölçme, alan hesaplama, koordinat alma + "bu noktayı bildir").
  - Performans: kümeleme toplu ekleme + `chunkedLoading`, tembel balon içeriği, 800+ noktada canvas çizim, listede sayfalama, 1500+ bildirimde yalnızca ekrandaki alanı yükleme (400 ms debounce).
  - Filtreler: eklenme zamanı, sadece açık olanlar, sadece haritada görünen alan, aktif filtre sayısı ve "Sıfırla".
  - Cam efektli bildirim balonu ve üzerine gelince bilgi; kümeler en yüksek riske göre renkli.
  - Yönetici fotoğraf düzenleme (kapak yap, döndür, sil, ekle) — `guncelleme13.sql`.
  - Bildirimlerim sayfası kompakt satırlar + sekmeli yapı; "Proje" sayfası (#/proje): problem, yöntem, risk puanı tablosu, canlı grafikler, açık veri (CSV/GeoJSON).
  - Ana sayfa: yangın tehlike göstergesi kadranı + topoğrafik arka plan.
  - Açılış sağlamlığı: kütüphaneler `vendor/` klasöründen (sabit sürüm), service worker'da 4 sn ağ zaman aşımı, 12 sn'de açılmazsa "Yeniden dene".
  - Okul, ekip ve danışman bilgisi `config.js`'de (`SCHOOL`, `TEAM`, `ADVISOR`, `PROJECT_TITLE`) — proje sayfasında görünür.
- **Sürüm 17 — hata düzeltmeleri:** CARTO karoları API anahtarı istemeye başladığı için sokak haritası OpenStreetMap'e, gece ve sade harita Esri gri tuvallerine geçti (önizlemelerde "API KEY REQUIRED" görünüyordu). Telefonda dokununca takılı kalan "üzerine gelme" kaydırmaları kapatıldı; arka plan yenilemesinde liste ve pinler artık yeniden kayarak/düşerek girmiyor; uygulamanın kendi yakınlaştırmaları alt paneli kapatmıyor; katman geçişi yarım kalırsa eski katman temizleniyor; uzun bildirim balonu harita yüksekliğini aşmıyor.
- **Sürüm 18 — telefonda tam ekran harita:** bildirim listesi artık haritanın altında sürekli durmuyor; alttaki "Liste · N bildirim" düğmesiyle açılıyor (acil durum varsa kırmızı nokta), "✕", aşağı sürükleme ya da haritaya dokunma ile kapanıyor. Panel üst/alt kenara sabitlendi. Asıl hata: `.view`'deki `will-change: transform` (ve geçiş animasyonu) paneli ekrana değil sayfaya göre konumlandırıyordu; iPhone'da altta boşluk, üstte kesilme yapıyordu. Leaflet kaynak yazısı telefonda tek satır (dokununca tamamı).
- **Sürüm 19-20 — veri içe aktarma ve telefonda sade araçlar:**
  - Yönetici paneli → **Veri içe aktar**: Excel / CSV / GeoJSON. Sütunlar otomatik eşlenir (değiştirilebilir). Konum dosyadaki koordinattan (ondalık ya da 38°18'33.5"N) veya Google / Apple Haritalar bağlantısının işaret ettiği **kesin** noktadan alınır (`resolve-maps` sunucu fonksiyonu; Google'da `!3d…!4d…` yer işareti, Apple'da `coordinate=`). İlçe ve mahalle, bildirim formuyla aynı kuralla o noktadan bulunur. Önizleme haritası + tabloda koordinat düzeltme / "Haritada seç". Aynı satır iki kez eklenmez. Gözlemci adı maskeli, "@kullanıcı" yerine "Yönetici tarafından eklendi"; puana sayılmaz (`guncelleme14.sql`). Drive fotoğrafları giriş istediği için aktarılamaz; bağlantı yönetici notunda, "Fotoğrafları düzenle" ile eklenir.
  - Telefonda harita: sağ altta Ara / Konumum / Araçlar (açıklamalı menü: Yakınımdakiler, Mesafe, Alan, Koordinat), liste düğmesi sağ altta, uydu tarihi kısa ve sol altta, renk göstergesi sol üstte. Proje sayfasındaki bölüm menüsünün kaydırma çubuğu gizlendi.
  - Yardımcı betikler `araclar\` klasöründe: `deploy.ps1` (yayın), `harness.js` (yerel test sayfası), `sweep.js` (tüm sayfaları tarayan kontrol), `verify.ps1` (canlı kontrol).
- **Barındırma Netlify'dan Cloudflare Pages'e taşındı** (Netlify ücretsiz kredisi bitmişti).

---
Kullanıcılar kayıt olur, e-postasına gelen kodla hesabını doğrular, riskli alanın fotoğraflarını ve anket cevaplarını gönderir. Bildirim **anında haritada yayına girer**; sadece uygunsuz dil veya anlamsız içerik taşıyan kayıtlar incelemeye düşer.

Dosyalar: `index.html`, `style.css`, `app.js`, `config.js`, `supabase.sql` (ilk kurulum), `guncelleme.sql`, `guncelleme2.sql`, `guncelleme3.sql`, `MAIL-KODU.md`.

---

## SÜRÜM 10 — bakım modu, yeni ban sistemi, şifre sıfırlama, telefonda tam ekran bildirim

Veritabanı (`guncelleme11.sql`) ve `admin-user` sunucu fonksiyonu Claude tarafından doğrudan Supabase'e uygulandı.

- **Bakım modu:** Yönetici paneli → Genel bakış → “🛠️ Bakım modunu aç”. Açıkken yöneticiler dışında herkes “Site güncelleniyor” ekranını görür (en geç 30 sn içinde), bitince kendiliğinden açılır. Yöneticiler bakım ekranındaki “Yönetici girişi” ile girebilir. Güncelleme yüklemeden önce aç, bitince kapat.
- **Ban:** Banlanan kişinin oturumu artık kapanmaz. “Tamam”a basınca sadece haritayı görür; bildirim, oy, profil, ayarlar, lider tablosu kilitli. Üstte “Hesabın kısıtlı” şeridi durur. Ban açıkken atılırsa / kaldırılırsa 30 sn içinde sayfa yenilemeden uygulanır. Cihaz ve IP arka planda yine kaydedilir ve uygulanır.
- **Ban geçmişi sade:** Bir ban = tek satır (kullanıcı, sebep, süre, durum, “🔓 Kaldır”). Kaldır, o banın hesap + cihaz + IP kısıtlamalarını birlikte kaldırır.
- **Yönetici şifre sıfırlama:** Kullanıcı → Yönet ⋯ → 🔑 Şifre sıfırla: sıfırlama maili gönder ya da doğrudan yeni şifre belirle (başka yöneticinin şifresi değiştirilemez, işlem günlüğe yazılır).
- **Şifre sıfırlama düzeldi:** Bağlantı artık doğrudan “Yeni şifre belirle” formunu açar; hata mesajları Türkçe. Mailin Türkçe olması için `SIFRE-MAILI.md`'yi uygula (Supabase panelinden).
- **Telefonda bildirim ayrıntısı:** Listeden, pinden veya acil kartından dokununca tam ekran açılır; büyük fotoğraf (birden çoksa kaydırılır), risk çubuğu, ✕ kapat, “Haritada göster”. Harita kendiliğinden yakınlaşmaz.
- **Oylama düzeldi:** Haritadaki balonda “Sorun çözüldü mü?” düğmeleri çalışmıyordu (Leaflet tıklamayı yutuyordu).
- **Harita:** Gaziemir/İzmir düğmeleri koyu cam tasarım, İzmir sınırı camgöbeği neon çizgi, uzaktan bakınca “GAZİEMİR” etiketi; telefonda “Gaziemir” düğmesi alanın tamamını liste panelinin üstünde gösterir.
- **Giriş:** Boş alan kontrolü; ağ hatası / çok deneme artık “şifre hatalı” diye gösterilmiyor.

## SÜRÜM 9 — gizlilik, sade yönetici paneli, kayıt doğrulama

- **Gözlemci adı gizli:** Haritada ve her yerde “B---r U---l” görünür. Gerçek ad veritabanından herkese **hiç gönderilmez** (sütun yetkisi); sadece yöneticiler `admin_observer_names` ile görür.
- **Kayıt doğrulama ekranı:** Kod beklemek yerine “Mail kutunu aç → bağlantıya tıkla → geri dön” adımları, e-posta sağlayıcısına göre “Mail kutumu aç” düğmesi, sekmeye dönünce anında kontrol, “Tıkladım, kontrol et”, 60 sn beklemeli “Maili tekrar gönder”. Kod kutusu isteğe bağlı olarak altta.
- **Rozetler:** Yönetici katalogdakilerin yanında istediği adla özel rozet verebilir (uygunsuz adlar engellenir), kendi rozetlerini — “Yönetici” dahil — kaldırabilir.
- **Banlama:** “Banlama” sekmesinin başında kullanıcı seçip banlama kutusu; altında ban geçmişi.
- **Sade yönetici paneli:** Solda gruplu menü (telefonda kaydırılabilir), kullanıcılar tablo yerine sade satırlar, her kullanıcı için tek “Yönet ⋯” penceresi. İstatistikler “Genel bakış”ta.
- **Gizlilik Politikası, “Verilerini nasıl kullanıyoruz?”, Kullanım koşulları:** Sayfa altında, kayıt ve giriş formunda, Ayarlar → Yardım'da küçük bağlantılar; tıklayınca açılır. İletişim adresi `config.js` → `CONTACT_EMAIL`.
- Harita göstergesi bildirim balonunu kapatmıyor; yazıların yanlışlıkla seçilmesi engellendi.

## SÜRÜM 8 — profesyonel kullanıcı sistemi

- **Kullanıcı adı:** 72 saatte bir değiştirilebilir (geri sayım), son değişiklik tarihi görünür, büyük/küçük harf duyarsız benzersiz, yazarken canlı uygunluk kontrolü. Tüm eski adlar saklanır; profilde “Geçmiş kullanıcı adları”, lider tablosunda “↺ eski:” olarak görünür. Eski adla aranan profil yeni ada yönlendirir.
- **Küfür filtresi (sunucuda):** Yönetici panelinden düzenlenen kara liste. Büyük/küçük harf, Türkçe karakter, sayı/sembol gizlemesi (S1KT1R, 0r0spu, $iktir, Y4RR4K) ve harf tekrarı (siiiktir) yakalanır; “ışık”, “sarnıç”, “yaramaz” gibi masum kelimeler yakalanmaz. Kullanıcı adı, kayıt, bildirim notları ve adreslerde çalışır.
- **Hesap askıya alma:** Süresiz veya geçici (1/3/7/30 gün), sebep, ban geçmişi (kaldırılanlar silinmez), kaldırma. Askıya alınan kişi **giriş yapamaz** (Supabase Auth seviyesinde, `admin-user` Edge Function ile); denediğinde sebebi ve geri sayımı görür.
- **Rozetler:** Kurucu, Yönetici, Moderatör, Doğrulanmış Kullanıcı (mavi tik), VIP, Destekçi, İçerik Üreticisi, Erken Katılan, Beta Kullanıcısı ve proje rozetleri. Birden fazla rozet; animasyonlu (parlama, ışıltı). Profilde ve lider tablosunda görünür.
- **Karşılama turu:** Yeni kullanıcıya 4 karşılama ekranı (kaydırılabilir, ilerleme çubuğu, Geç) ve ardından ekrandaki öğeleri tek tek vurgulayan 6 adımlı tur. Ayarlar → Yardım merkezi'nden tekrar izlenebilir.
- **Ayarlar:** Telefonda uygulama gibi iç içe menü, bilgisayarda iki sütun. Hesap ayarları (profil, kullanıcı adı, hesap bilgileri, güvenlik), Bildirimler (anlık/push, e-posta, sistem duyuruları), Görünüm, Bu cihaz, Yardım merkezi (tanıtım turu, kullanım rehberi, SSS).
- **Herkese açık profil:** `#/profil/kullanıcıadı` — avatar, rozetler, puan, sıra, eski adlar, son bildirimler, “Şikâyet et”.
- **Yönetici paneli:** Genel bakış (toplam kullanıcı, günlük/haftalık aktif, yeni kayıtlar, askıdaki hesaplar, açık şikâyetler, 14 günlük kayıt grafiği, en aktif kullanıcılar), kullanıcı arama/filtre/düzenleme (ad düzeltme), rozet verme/kaldırma, yasaklı kelimeler, şikâyet edilen kullanıcılar.
- **Arayüz:** Cam efekti (glassmorphism), sayfa geçişleri, açık/koyu tema; yalnızca transform/opacity animasyonları (akıcı 60 FPS hedefi).
- Dosyalar: `guncelleme8.sql`, `supabase-functions/admin-user/index.ts`.

## SÜRÜM 6 — neler eklendi

- **Hata düzeltmeleri:** iPhone'da kendiliğinden uzaklaşma (sayfa taşması) giderildi; telefonda harita sayfası kaymıyor, liste paneli parmakla sürüklenir, haritaya dokununca iner. Netlify rozeti telefonda butonların üstünden alındı (Ayarlar'dan bu cihazda gizlenebilir). Kayıtlı e-postayla tekrar “Kayıt ol” denenince artık sonsuza dek kod beklemiyor, girişe yönlendiriyor.
- **Lider tablosu:** Podyum, sıralama, dönem (tüm zamanlar/30 gün/7 gün) ve kategori filtresi. Puan: yayındaki bildirim 10, yüksek risk +5, orman yangını +3, acil +3, çözüldü +5.
- **Avatar ve rozet (nametag):** Fotoğraf yükleme veya emoji + renk; kazanılan rozetlerden biri takılır. Yeni rozet kazanınca bildirim gelir. Yönetici özel rozet verebilir (Proje Ekibi, Saha Ekibi…).
- **Hesap kısıtlama (yasaklama):** Yönetici bir kullanıcıyı 1/7/30 gün veya süresiz kısıtlar; isteğe bağlı cihazları ve IP adresleri de kısıtlanır. Kısıtlı kişi haritayı görür ama bildirim gönderemez ve fotoğraf yükleyemez (sunucuda engellenir). “Yasaklar” sekmesi, kullanıcı başına “Cihazlar” penceresi (cihaz adı, IP, ilk/son görülme).
- **Cihaz kaydı:** Her giriş cihaz ve IP ile kaydedilir; kullanıcı Ayarlar'da kendi cihazlarını görür.

## SÜRÜM 5 — neler eklendi

- **Bildirim gönderilememe sorunu:** İlçe seçimi kaldırıldı; ilçe ve mahalle işaretlenen noktadan otomatik bulunur. Eksik alan olursa sayfa o alana kayar, kart kırmızı çerçeveyle sallanır ve uyarı çıkar.
- **Adım adım form:** Önce “Ne gördün?”, ardından alt başlık; seçince formun geri kalanı animasyonla açılır. Üstte 4 adımlı ilerleme çubuğu (Başlık · Konum · Foto · Detay).
- **Yol ve acil durumda itfaiye sorusu yok.** Yapı sayısı da sorulmuyor.
- **Öğretmen önerisi:** Orman yangını “Ana odak · küresel sorun, yerel çözüm” olarak öne çıkarıldı. Yeni **Acil altyapı arızası** kategorisi: patlak su borusu, taşan kanalizasyon, kopmuş kablo, gaz kokusu. Formda tek dokunuşla arama düğmeleri (185 İZSU, 187, 186, 112). Haritada kırmızı-mavi yanıp sönen pin ve panelin üstünde “Acil durumlar” şeridi. Yönetici “✅ Çözüldü” diyebilir; bildiren kişiye otomatik teşekkür mesajı gider.
- **Telefon arayüzü:** Cihaz (iPhone/Android/PC) ve tarayıcı (Safari/Chrome/Samsung/Brave…) algılanır. Telefonda alt sekme çubuğu, ortada “+” bildir düğmesi, tam ekran harita ve alttan kaydırılan liste paneli.
- **Uygulama gibi kurulum (PWA):** Android'de “Yükle” düğmesi, iPhone Safari'de “Paylaş → Ana Ekrana Ekle” tarifi. İkon, tam ekran açılış, çevrimdışı açılış.
- **Beni hatırla:** Kapalıysa tarayıcı kapanınca oturum biter. Giriş kayıtlarına cihaz bilgisi yazılır.
- Fotoğrafı sürükle-bırak, iğneyi sürükleyerek konum düzeltme, son girilen gözlemci adı hatırlanır, titreşimli geri bildirim.

## SÜRÜM 4 — neler eklendi

Veritabanı (`guncelleme4.sql`) ve yayın Claude tarafından doğrudan Supabase ve Netlify'a uygulandı.

- **Bağlantıyla giriş düzeldi.** Maildeki bağlantıya başka sekmede tıklayınca, kod ekranında bekleyen sekme kendiliğinden içeri girer. Süresi dolmuş bağlantı anlaşılır bir mesaj gösterir.
- **Yükleme ekranı** ve sayfa üstünde ince yükleme çubuğu; listelerde iskelet yükleyici.
- **Yazı efektleri:** başlıklar kelime kelime, paragraflar kaydırdıkça yavaşça açılır.
- **Giriş ekranında Hakkımızda:** Neyi amaçlıyoruz, nasıl çalışır, biz kimiz, canlı istatistikler, 112 uyarısı.
- **Gerçek sınırlar:** İzmir ili ve Gaziemir ilçesinin gerçek sınırları (`sinirlar.js`). İzmir dışı koyulaşır, Gaziemir parlayan kesikli çizgiyle gösterilir. “Gaziemir / İzmir” odak düğmeleri.
- **Kategoriler “risk taşıyan alan” diliyle:** Harita aktif yangın göstermez; formda 112 uyarısı var.
- **Bildirim zili:** Yöneticinin gönderdiği duyurular ve “bildirimin yayına alındı/kaldırıldı” mesajları anında gelir, isteğe bağlı sesli.
- **Etkinlik günlüğü (log):** Kayıt, giriş, çıkış, bildirim gönderme/silme, durum değişikliği, yetki değişikliği, şifre değişikliği. Kullanıcı kendi geçmişini “Bildirimlerim → Etkinlik geçmişi”nde, yönetici herkesinkini “Yönetici paneli → Kayıtlar”da görür (CSV indirilebilir).
- **Yönetici → Bildirim gönder:** Herkese veya tek kullanıcıya; tür, başlık, mesaj, bağlantı; canlı önizleme; geri çekme.
- **Ayarlar sayfası:** Kullanıcı adı değiştirme, şifre değiştirme (güç göstergesi), tüm cihazlardan çıkış, tema, varsayılan harita, animasyon ve ses aç/kapa, hesabı silme.
- **Giriş ekranı:** Şifre göster/gizle, şifre gücü, Caps Lock uyarısı, son kullanılan e-posta hatırlanır.

---

## 0. SÜRÜM 3

1. **SQL Editor → New query → `guncelleme3.sql`'in tamamını yapıştır → Run.** Yeni “Yol çukuru ve yol hasarı” kategorisinin sütunlarını ekler. Bunu çalıştırmadan çukur bildirimi gönderilemez.
2. **Doğrulama maili sorunu** için `MAIL-KODU.md`'yi takip et: Google ile giriş + kendi Gmail'inle mail gönderme (ikisi de ücretsiz).
3. Siteyi yeniden yayınla (bkz. bölüm 2), tarayıcıda **Ctrl+F5**.

**Bu sürümde neler var**

- **Yol çukuru bildirimi.** 5. ana başlık: yol çukuru, açık/kırık rögar kapağı, asfalt çökmesi, kaldırım hasarı. Sorular: boyut, derinlik, yolun neresinde olduğu, trafik yoğunluğu. Risk puanı bunlara göre hesaplanır (ör. araç şeridinde, büyük ve derin bir çukur yoğun trafikte = 80, yüksek risk).
- **Google ile giriş.** Supabase'de Google sağlayıcısı açılınca giriş ekranında kendiliğinden görünür; kapalıyken gizlidir.
- **Anlaşılır mail hataları.** E-posta sınırına takılınca kullanıcıya ne yapacağı söylenir.
- **Efektler.** Pinler haritaya yukarıdan düşer, yüksek riskli pinler nabız gibi atar, yakın pinler sayılı kümelere toplanır, listede kartlar sırayla belirir, özet sayaçları sayarak artar, butonlarda dokunma dalgası, risk puanı kartı seviyeye göre renklenir, giriş ekranında hareketli renk lekeleri, başarılı gönderimde konfeti. Cihazda “hareketi azalt” açıksa tüm animasyonlar kapanır.
- Harita panelinde **özet şeridi**: toplam / yüksek riskli / son 7 gün.

---

## 1. Supabase adımları (sırayla)

**Adım 1 — SQL.** SQL Editor > New query > `guncelleme2.sql` dosyasının tamamını yapıştır > **Run**. (Daha önce `guncelleme.sql`'i çalıştırmadıysan önce onu çalıştır.)

Bu dosya şunları yapar: ilçe sütununu ekler, bildirimlerin varsayılan durumunu "yayında" yapar, işaretlenme sebebi sütununu ekler, kullanıcının kendi bildirimini silmesine izin verir.

**Adım 2 — Doğrulama kodu e-postası.** Authentication > Emails. İki şablonu düzenle:

*Confirm signup* (kayıt doğrulama):
```html
<h2>İzmir Risk Haritası</h2>
<p>Hesabını doğrulamak için kodun:</p>
<p style="font-size:28px;font-weight:bold;letter-spacing:4px">{{ .Token }}</p>
```

*Magic Link* (şifresiz giriş):
```html
<h2>İzmir Risk Haritası</h2>
<p>Giriş kodun:</p>
<p style="font-size:28px;font-weight:bold;letter-spacing:4px">{{ .Token }}</p>
```

*Reset Password* şablonunu olduğu gibi bırak; o bağlantıyla çalışır.

**Adım 3 — Adresler.** Authentication > **URL Configuration**:
- **Site URL**: sitenin yayın adresi (aşağıdaki adımda alacaksın).
- **Redirect URLs**: aynı adresi buraya da ekle. Şifre sıfırlama bağlantısı bu listede olmayan bir adrese dönemez. Yerelde de deneyeceksen `http://localhost:8000` satırını da ekle.

**Adım 4 — Giriş ayarı.** Authentication > Sign In / Providers > Email: **Confirm email** açık olsun.

> Ücretsiz planda saatlik e-posta sınırı vardır. Çok sayıda deneme hesabı açacaksan Confirm email'i geçici kapatabilirsin.

---

## 2. Siteyi yayınlama (Cloudflare Pages)

Site **https://geogozcu.pages.dev** adresinde, Cloudflare Pages'te (ücretsiz, trafik sınırı yok, DDoS koruması otomatik). Cloudflare projesinin adı: `geogozcu`.

1. Yayınlanacak dosyaları bir klasöre koy: `index.html`, `style.css`, `app.js`, `config.js`, `sinirlar.js`, `sw.js`, `manifest.webmanifest`, `site-tek-dosya.html`, `icons/` ve `_headers`.
2. Her sürümde `index.html` içindeki `?v=` numaralarını ve `sw.js` içindeki `CACHE` adını bir artır (telefonlar eski sürümde takılmasın).
3. Terminalde: `npx wrangler pages deploy <klasör> --project-name geogozcu --branch main --commit-dirty=true` (ilk seferde tarayıcıda Cloudflare girişi ister).
4. Supabase > Authentication > URL Configuration: **Site URL** `https://geogozcu.pages.dev`, **Redirect URLs** `https://geogozcu.pages.dev/**`.

`_headers` dosyası sayfa, kod ve `sw.js` için "no-cache" kuralını koyar; böylece güncelleme anında herkese gelir. (`netlify.toml` artık kullanılmıyor.)
---

## 3. Bu sürümde ne değişti

**Harita.** Sokak haritası artık CARTO altlığı kullanıyor; eski OpenStreetMap sunucuları dosyadan açılan sayfaları engellediği için "Access blocked" karoları çıkıyordu. Üç altlık var: uydu görüntüsü, sokak haritası, sade harita. Sağ üstteki katman düğmesinden değiştirilir. Ölçek çubuğu eklendi.

**Bölge.** Artık tüm İzmir. 30 ilçe listeden seçilir, mahalle isteğe bağlı metin alanıdır. Harita İzmir dışına kaydırılamaz; İzmir dışında bir nokta işaretlenirse "şu an desteklenmiyor" uyarısı çıkar.

**Yönetici onayı kaldırıldı.** Bildirim gönderilir gönderilmez yayında. Yerine otomatik denetim var:
- Küfür ve hakaret listesi (harf yerine rakam yazma gibi oyunları da yakalar)
- Anlamsız metin tespiti (aynı harfin tekrarı, sesli harfsiz uzun diziler, "asdasd", "deneme" gibi kalıplar)
- Ad soyadın birlikte yazılmamış olması
- Bir yıldan eski gözlem tarihi
- Hiçbir unsur işaretlenmemiş ve not da yazılmamış olması

Bunlardan birine takılan bildirim yayına girmez, yönetici panelindeki **İncelenecek** sekmesine düşer ve sebebi kartta yazar. Yönetici yayına alabilir veya kaldırabilir.

**Kullanıcı kendi bildirimini silebilir.** Bildirimlerim sayfasındaki Sil butonu fotoğrafları da temizler.

**Giriş seçenekleri.** Şifremi unuttum (e-postaya sıfırlama bağlantısı, sonra yeni şifre ekranı) ve şifresiz e-posta kodu ile giriş eklendi.

**Özel tema rengi.** Beş hazır rengin yanında artı işaretli renk seçici var; istediğin rengi seçersin, site koyu/açık yazı rengini otomatik ayarlar.

**Yönetici paneli.** En çok bildirim gelen ilçeler şeridi eklendi, sekme adları yeni akışa göre düzeltildi, CSV'ye ilçe ve işaretlenme sebebi sütunları eklendi.

---

## 4. Bilinen sınırlar

- **Uydu görüntüsünün tarihi.** Esri World Imagery kullanıyoruz; görüntü tarihi bölgeye göre değişir ve biz seçemeyiz. Kent merkezlerinde genelde 1-3 yıllıktır. Daha güncel görüntü ücretli servis gerektirir.
- **Küfür filtresi tarayıcıda çalışır.** Teknik bilgisi olan biri filtreyi atlatabilir. Gerçek koruma yönetici panelidir; bildirimleri düzenli kontrol et. Daha sağlam çözüm Supabase Edge Function ile sunucu tarafında denetimdir, bunu sonra ekleyebiliriz.
- **Fotoğraflar herkese açık depoda.** Adresi bilen görebilir. Yüz ve plaka içeren fotoğraf yüklenmemesini kullanıcılara hatırlat.
- Esri uydu görüntüsü okul projesi için uygundur, kaynak ekranda belirtilir.
