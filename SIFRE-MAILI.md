# Şifre sıfırlama maili Türkçe olsun ve çalışsın

Gelen mailin İngilizce olmasının sebebi: Supabase'in **Reset Password** şablonu varsayılan (İngilizce) hâlinde duruyor.
Bu şablonu sadece Supabase panelinden değiştirebilirsin (2 dakika):

## 1) Türkçe şablon

Supabase → **Authentication → Emails → Templates → Reset Password**

**Subject (konu):**

```
GeoGözcü · Şifreni sıfırla
```

**Message body (içerik)** — hepsini silip bunu yapıştır → **Save**:

```html
<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border-radius:16px;background:#0F1613;color:#EAF1ED">
  <h2 style="margin:0 0 12px">🔑 GeoGözcü · Şifre sıfırlama</h2>
  <p>Merhaba, hesabın için şifre sıfırlama isteği aldık.</p>
  <p>Yeni şifreni belirlemek için aşağıdaki düğmeye bas:</p>
  <p style="text-align:center;margin:24px 0">
    <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:14px 26px;border-radius:12px;background:#22C55E;color:#06100C;font-weight:bold;text-decoration:none">Şifremi sıfırla</a>
  </p>
  <p style="font-size:13px;color:#9BAAA2">Bağlantı 1 saat geçerlidir ve tek kullanımlıktır. Bu isteği sen yapmadıysan bu e-postayı yok sayabilirsin, şifren değişmez.</p>
</div>
```

## 2) Adres izni (bağlantı haritaya atıyorsa)

Supabase → **Authentication → URL Configuration**

- **Site URL:** `https://geogozcu.pages.dev`
- **Redirect URLs:** aynı adresi ekle: `https://geogozcu.pages.dev/**`

Site adresi değişirse (ör. kendi alan adı) burayı da güncelle.

## 3) Koddaki düzeltme (Sürüm 10'da yapıldı)

Eski sürüm sıfırlama bağlantısını `.../#/giris` adresine gönderiyordu. Supabase jetonu da `#` ile eklediği için adres
`...#/giris#access_token=...` gibi **çift #** oluyordu; site jetonu okuyamıyor, seni haritaya atıyordu.
Artık bağlantı sitenin kök adresine döner, site “Yeni şifre belirle” formunu kendisi açar.

> Eski sürümle gönderilmiş sıfırlama mailleri çalışmaz. Arkadaşın siteden **yeniden** “Şifremi unuttum” demeli.
> Mail hiç gelmezse: Yönetici paneli → Kullanıcılar → kullanıcı → **Yönet ⋯ → 🔑 Şifre sıfırla → Yeni şifre belirle**.
