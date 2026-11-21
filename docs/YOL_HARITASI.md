# Yol Haritası — Mağazaya Çıkış

Bu repodaki uygulama **çalışan bir ön sürüm (MVP arayüzü)**. Bütün ekranlar ve akışlar hazır. Veriler şimdilik telefonda tutuluyor, ödeme ve SMS ise demo modunda. Yayına çıkmak için aşağıdaki adımlar gerekiyor.

## 1. Backend (en kritik adım)

Önerilen yapı **Supabase**: Postgres, Auth, Edge Functions ve Realtime tek pakette, küçük bir ekip için ucuz ve hızlı. Alternatifi Firebase.

| Modül | Ne yapar |
|---|---|
| `auth` | Telefon + SMS OTP (Netgsm / İleti Merkezi). `src/services/auth.ts` buraya bağlanır |
| `menu` | Ürünler, fiyatlar, stokta yok, saat bazlı menüler. Yönetim panelinden düzenlenir. `src/data/menu.ts` bu API'den beslenir |
| `orders` | Sipariş oluşturma, durum (alındı → hazırlanıyor → hazır), mutfak ekranına iletim |
| `payments` | iyzico Checkout Form / PayTR iFrame. API anahtarları **yalnızca sunucuda** durur (bkz. `src/services/payment.ts`) |
| `loyalty` | İnci bakiyesi, seviye, ödül kullanımı, dönen QR kodunun (TOTP) sunucuda doğrulanması |
| `wallet` | Cüzdan yükleme ve harcama. Ön ödemeli sistem olduğu için muhasebe ve hukuk görüşü alınmalı |
| `reservations` | Talep, onay ve SMS. Yönetim panelinde rezervasyon listesi |

## 2. POS / adisyon entegrasyonu

Kasada QR okutulunca İnci yüklenmesi ve masadan gelen siparişin mutfağa düşmesi, kullandığınız POS sistemine bağlı. Hangi sistemi kullandığınızı öğrenmemiz gerekiyor (ör. Simpra, Adisyo, Sambapos). Entegrasyon yoksa ilk aşamada basit bir **tablet "mutfak/garson ekranı"** (web) yeterli olur.

## 3. Masa QR'ları

Her masa ve şezlong için `denizkapisi://masa/T12` derin bağlantısı içeren QR'lar basılır. Uygulama yüklü değilse web'e veya mağazaya yönlendirilir. Sepet ekranındaki masa numarası alanı bu QR ile otomatik dolar.

## 4. Mağaza yayını (EAS)

```bash
npx eas-cli@latest login
npx eas-cli@latest build:configure
npx eas-cli@latest build --platform all --profile production
npx eas-cli@latest submit --platform ios      # App Store Connect
npx eas-cli@latest submit --platform android  # Google Play Console
```

Gerekenler:
- Apple Developer hesabı (yıllık 99 $). Bir restoran olarak **şirket (organization)** hesabı açılmalı; D-U-N-S numarası gerekir.
- Google Play Console (tek seferlik 25 $), şirket hesabı.
- Logonun yüksek çözünürlüklü/vektör (SVG/AI) hali. Şu anki ikon sitedeki 374 px'lik amblemden üretildi.
- Mağaza ekran görüntüleri ve tanıtım metinleri (TR + EN, gerekirse RU: sitede RU sürümü var).
- KVKK Aydınlatma Metni, Üyelik Sözleşmesi, Mesafeli Satış Sözleşmesi, Gizlilik Politikası URL'leri.
- iOS "Sign in with Apple" şartı yok, çünkü yalnızca telefonla giriş var.

## 5. Sonraki özellikler (öncelik sırasıyla)

1. **Hesabı telefondan öde.** Masadaki adisyonu QR ile çekip bölüşerek ödeme. POS entegrasyonu gerekir.
2. **Push bildirimleri** (expo-notifications): "Siparişiniz hazır", rezervasyon onayı, doğum günü ikramı.
3. **Çoklu dil:** EN / RU. Turist misafirler için kritik; menü verisinde EN alanları zaten var.
4. **Apple Wallet / Google Wallet kartı:** QR'ı uygulama açmadan göstermek için.
5. **Kayıtlı kart** (iyzico card storage) ve Apple Pay / Google Pay.
6. **Etkinlik takvimi:** canlı müzik geceleri, tadım menüleri, sadece "Aileden" seviyesine açık davetler.
7. **Değerlendirme:** ziyaret sonrası kısa anket. İyi puan verenleri Google Yorumlar'a yönlendirmek.

## Açık sorular (restorandan yanıt bekleyen)

- Kullanılan POS/adisyon sistemi hangisi?
- Hangi ödeme kuruluşu tercih ediliyor (iyzico, PayTR, banka sanal POS'u)?
- İnci oranları (%3/%5/%7) ve seviye eşikleri (15.000 ₺ / 40.000 ₺) uygun mu?
- Şezlong numaralandırması var mı? Plaj servisi uygulamadan alınacak mı?
- Alkollü içecek siparişinin masada kabulü için hukuki görüş.
