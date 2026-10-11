# Doğrulama maili neden gelmiyor, nasıl kesin çözülür

## Sorunun asıl sebebi

Supabase'in ücretsiz planında **kendi mail sunucusu sadece deneme amaçlıdır**:

- Saatte yalnızca **2 e-posta** gönderir (tüm site için, kişi başı değil).
- Bazı projelerde sadece **proje ekibindeki adreslere** mail atar; dışarıdan biri kayıt olursa mail hiç gitmez.
- Giden mailler sık sık spam'e düşer.

Yani kodda hata yok, Supabase bilerek sınırlıyor. Replit, Firebase vb. platforma geçmek gerekmez; iki ücretsiz çözüm var. **İkisini birden yapmanı öneririm.**

---

## Çözüm 1 — Google ile giriş (mail hiç gerekmez) ⭐ en kolayı

Kullanıcı tek tıkla Google hesabıyla girer, doğrulama maili beklemez. Sitede “Google ile devam et” düğmesi hazır; Supabase'de açınca kendiliğinden görünür.

1. <https://console.cloud.google.com> → üstten **yeni proje** oluştur (adı: `izmir-risk-haritasi`).
2. Sol menü **APIs & Services → OAuth consent screen**:
   - User type: **External** → Create
   - App name: `İzmir Risk Haritası`, support e-mail: kendi Gmail'in → Save
   - **Publish app** düğmesine bas (yoksa sadece test kullanıcıları girebilir).
3. Sol menü **Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**
   - **Authorized redirect URIs** kısmına şunu ekle:
     `https://ogrkwkefbhofmxeukuhe.supabase.co/auth/v1/callback`
   - Create → çıkan **Client ID** ve **Client secret**'ı kopyala.
4. Supabase → **Authentication → Sign In / Providers → Google** → Enable, ID ve secret'ı yapıştır → Save.
5. Supabase → **Authentication → URL Configuration**:
   - Site URL: sitenin adresi: `https://geogozcu.pages.dev`
   - Redirect URLs: aynı adres + yerelde deniyorsan `http://localhost:8000`
6. SQL Editor'de **`guncelleme3.sql`**'i çalıştır (Google kullanıcısına otomatik kullanıcı adı verir).

---

## Çözüm 2 — Kendi Gmail'inle mail gönder (ücretsiz, günde ~500 mail)

Supabase'e “mailleri benim Gmail hesabımdan gönder” diyoruz. Mailler artık gerçekten ulaşır.

1. Kullanacağın Gmail hesabında **2 adımlı doğrulama** açık olmalı: <https://myaccount.google.com/security>
2. <https://myaccount.google.com/apppasswords> → ad olarak `supabase` yaz → **Oluştur** → çıkan **16 haneli şifreyi** kopyala (boşlukları sil).
3. Supabase → **Authentication → Emails → SMTP Settings** → **Enable custom SMTP**:

   | Alan | Değer |
   |---|---|
   | Sender email | senin Gmail adresin |
   | Sender name | İzmir Risk Haritası |
   | Host | `smtp.gmail.com` |
   | Port | `465` |
   | Username | senin Gmail adresin |
   | Password | 16 haneli uygulama şifresi |

4. Save. Sonra **Authentication → Rate Limits** → “emails per hour” değerini **30** (veya daha fazla) yap.

> Gmail istemezsen alternatif: **Brevo** (brevo.com, günde 300 ücretsiz mail). Host `smtp-relay.brevo.com`, port `587`, kullanıcı adı ve şifre Brevo → SMTP & API sayfasında yazar. Gönderen adresini Brevo'da doğrulaman gerekir.

---

## Mail şablonları (6 haneli kod için)

Site link değil **kod** bekliyor. Authentication → Emails → **Templates**:

**Confirm signup** içeriğini sil, şunu yapıştır:

```html
<h2>İzmir Risk Haritası</h2>
<p>Merhaba, hesabını doğrulamak için kodun:</p>
<p style="font-size:30px;font-weight:bold;letter-spacing:6px">{{ .Token }}</p>
<p>Kodu siteye gir. Bu isteği sen yapmadıysan bu e-postayı yok sayabilirsin.</p>
```

**Magic Link** içeriğini sil, şunu yapıştır:

```html
<h2>İzmir Risk Haritası</h2>
<p>Giriş kodun:</p>
<p style="font-size:30px;font-weight:bold;letter-spacing:6px">{{ .Token }}</p>
```

**Reset Password** şablonuna dokunma, o bağlantıyla çalışır.

---

## Sunum günü için acil çözüm

Jüri önünde mail beklemek istemiyorsan: Authentication → Sign In / Providers → Email → **Confirm email**'i kapat. Kayıt anında giriş yapılır, kod ekranı çıkmaz. Sunumdan sonra tekrar açarsın.

## Bilmen gereken bir şey daha

Supabase ücretsiz projeleri **1 hafta hiç kullanılmazsa duraklatılır**. Sunumdan birkaç gün önce Supabase paneline girip proje “Paused” ise **Restore** de.
