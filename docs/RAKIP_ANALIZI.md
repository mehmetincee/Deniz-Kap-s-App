# Rakip Analizi, Eksiklerimiz ve Öneriler

_Kasım 2026, 2. sürüm. Kaynaklar: App Store listeleri, Şikayetvar, şirket duyuruları, misafir anketleri (liste en altta)._

## 1. Rakiplerin güçlü yanları

| | **Starbucks** | **Kahve Dünyası** | **Espressolab** | **BigChefs / Happy Moon's** |
|---|---|---|---|---|
| Sadakat | Yıldız. Green/Gold/Reserve seviyeleri (Mart 2026). Yeni 60 yıldız = 2 $ indirim kademesi | Çekirdek (1 = 1 ₺) + damga (6 damga = 1 kahve) | LabCoin (15 = hediye içecek) | Kasada QR okutup puan, ana ekranda bakiye |
| Sipariş | Önceden sipariş. Kasım 2026'da yenilenen, kişiselleştirmesi kolay menü. 2027'de sohbetle sipariş | **Hazır Al**: şube, saat, kişiselleştirme | **Gel-Al** zaman aralığıyla; **Bana Gönder** ile yemek platformlarına yönlendirme | Menü görüntüleme; masadan sipariş yok |
| Ödeme | Ön ödemeli kart, ödeme yöntemine göre daha çok yıldız | Kart veya Çekirdek | **Eslab Wallet** (kart, yemek kartı, İstanbulkart ile yükleme) | — |
| Ekstra | ChatGPT içinde "ruh haline göre içecek" uygulaması | Online mağaza, hediye gönderme | Mağazadaki diğer misafirleri görme, uygulamaya özel kampanya | — |

## 2. Misafirlerin şikayet ettikleri

| Şikayet | Nerede | Bizdeki karşılığı |
|---|---|---|
| **Destek yok**: "müşteri hizmetlerine ulaşamadım" | Espressolab (App Store puanı 1,7; Şikayetvar'da 50 destek şikayeti) | ✅ Hesabım'a "Yardım & destek" (WhatsApp) ve sipariş ekranına "Siparişimde sorun var" eklendi. Mesaj sipariş ve üye numarasıyla hazır açılıyor |
| **Yüklenen bakiye iade edilemiyor** | Espressolab | ✅ Cüzdan ekranında iade kuralı açıkça yazıyor. Yasal metne de eklenmeli |
| **Telefon değişince hesaba girilemiyor** | Espressolab | ⏳ Backend ile "numara değiştir" akışı (eski + yeni numaraya kod) |
| **Hediye kodu geçersiz çıkıyor** | Kahve Dünyası | ✅ Ödüller artık 30 gün geçerli, okunaklı 6 haneli kupon kodu üretiyor (0/O, 1/I gibi karışan karakterler yok) |
| **Yanlış/eksik sipariş, telafi yok** | Kahve Dünyası, Espressolab | ✅ Mutfağa not, seçenekler, sipariş özeti ve tek dokunuşla sorun bildirme var. ⏳ Telafi kuponu backend ile |
| **Uygulama sürekli telefon kullanmaya zorluyor** (misafirlerin %20'si) | Toast QR anketi | ✅ Uygulama isteğe bağlı: garsona sipariş her zaman mümkün, menü sadece bilgi için de kullanılabiliyor |

## 3. Misafirler bir restoran uygulamasında ne istiyor

| İstek | Oran | Durumumuz |
|---|---|---|
| Hızlı ve kolay ödeme | En çok istenen | 🟡 Kart (demo) ve cüzdan var. **Apple Pay / Google Pay ve kayıtlı kart yok** |
| Ürün fotoğrafı | %85 | 🔴 **222 ürünün yalnızca birkaçında fotoğraf var.** En büyük görsel açığımız |
| Ödül ve kampanya | %70 | 🟡 İnci, seviyeler, ödüller var. **Kampanya/duyuru alanı ve push bildirim yok** |
| Puanlama ve yorum | %72 | 🔴 Yok |
| Önceden sipariş | %37 "olmazsa olmaz" | ✅ Gel-Al |
| Mobil ödeme | %37 "olmazsa olmaz" | ✅ (demo) |

## 4. Eksiklerimiz ve açıklarımız (öncelik sırasıyla)

### 🔴 Kritik: yayından önce olmalı
1. **Backend yok.** Ödeme, SMS ve veriler demo; her şey telefonda duruyor. Telefon değişince ya da uygulama silinince puanlar kaybolur (bkz. YOL_HARITASI.md).
2. **Tek dil (Türkçe).** İçmeler misafirlerinin büyük kısmı yabancı turist ve sitenizin zaten EN ve RU sürümleri var. Uygulama şu an sadece Türkçe. **Rakiplerden en büyük farkımız olabilecekken en büyük açığımız.** Menü verisinde İngilizce adlar hazır.
3. **Fotoğraf.** Profesyonel bir çekimde en çok satan 40–50 ürün fotoğraflanmalı.
4. **Hesabı masadan ödeme.** Asıl an masada geçiyor; sipariş garsona verilse bile hesabın telefondan bölüşülerek ödenmesi büyük kolaylık. POS entegrasyonu gerekir.

### 🟡 Önemli: ilk 3 ay
5. **Push bildirimleri:** "Siparişiniz hazır", rezervasyon onayı, doğum günü ikramı, kampanyalar.
6. **Garson çağır / hesap iste** düğmesi (masa QR'ından gelen misafire).
7. **Apple Pay / Google Pay**, kayıtlı kart.
8. **Ziyaret sonrası kısa anket.** Memnun misafiri Google Yorumlar'a yönlendirmek, memnun olmayana WhatsApp'tan ulaşmak.
9. **Apple Wallet / Google Wallet kartı:** QR'ı uygulamayı açmadan göstermek.

### 🟢 Fark yaratır: sonrası
10. **Gün batımı saati ve "deniz kenarı masa" rezervasyonu.** Ana sayfada bugünün gün batımı saati gösterilip o saate masa önerilir. Hiçbir rakipte yok, tamamen sizin konumunuza özgü.
11. **"Şefin bahçesinden":** O gün bahçeden gelen otlar ve meze dolabındaki sürpriz mezeler. Menünüz zaten "meze dolabına göz atın" diyor.
12. **Tekne/plaj servisi:** Marinadan deniz taksiyle gelen misafir (Wanderlog yorumlarında geçiyor) için iskeleye teslim Gel-Al.
13. **Etkinlik takvimi:** Canlı müzik geceleri, tadım menüleri, yalnızca "Aileden" seviyesine açık davetler.
14. **Arkadaşını getir:** Davet eden ve edilen 100'er İnci kazanır.
15. **Sezon dışı kampanyası:** Kasım–Mart arası yerel misafirlere çift İnci (turizm sezonu dışında doluluğu artırır).

## 5. Bu turda düzeltilen hatalar

| Hata | Etkisi | Düzeltme |
|---|---|---|
| "Kahvaltını Zenginleştir" bölümünde 25 üründen 15'i kayboluyordu, kalanların adı TR+EN karışıktı | Menüde eksik ürün | Bölüm tablo olarak tanımlandı; menü artık 222 ürün |
| Açıklamalarda "(EG)" gibi alerjen kodları görünüyordu | Okunaklılık | Temizlendi |
| "Çam Balı" (bal) ürününde balık fotoğrafı çıkıyordu | Yanlış görsel | Eşleştirme kuralı düzeltildi |
| Mutfak kapalıyken (23:00 sonrası) ve akşam saatinde kahvaltı ürünü sipariş edilebiliyordu | Mutfağa yapılamayacak sipariş düşer | Servis saati kontrolü eklendi; ürün ve sepet ekranı nedenini gösteriyor |
| Gel-Al saatleri mutfak kapandıktan sonrasını öneriyordu | Aynı | Saatler mutfak kapanışında bitiyor |
| Cüzdana yükleme **ödeme alınmadan** bakiye ekliyordu | Para kaybı riski | Yükleme önce ödemeden geçiyor |
| Ödül alınınca kupon kodu verilmiyordu ("garsona iletildi" yazıyordu) | Misafir ödülünü kullanamaz | 30 gün geçerli kupon kodu + "Kuponlarım" |
| Çıkış yapınca önceki kişinin bakiyesi, kuponları ve siparişleri cihazda kalıyordu | **Başka biri giriş yaparsa önceki kişinin parasını kullanabilirdi** | Çıkışta kişisel veriler sıfırlanıyor |
| Her çıkış/girişte tekrar 75 İnci hoş geldin hediyesi alınabiliyordu | Suistimal | Hediye her telefona bir kez |
| Seviye hesabı "son 12 ay" diyordu ama harcama hiç düşmüyordu | Seviye kuralı yanlış uygulanıyor | Son 12 ayın siparişlerinden hesaplanıyor |
| "0532…" veya "+90 532…" yazan kayıt olamıyordu | Kayıt hunisinde kayıp | Tüm biçimler kabul ediliyor |
| Rezervasyonda bugünün geçmiş saatleri seçilebiliyor, geçmiş rezervasyonlar "yaklaşan" görünüyordu | Hatalı talep | Geçmiş saatler gizli (en az 1 saat sonrası) |
| Eski siparişler ana sayfada süresiz "alındı" görünüyordu | Kafa karışıklığı | Durum doğru ilerliyor |
| Pasta ve Hikâye sayfalarında geri düğmesi çentikli telefonlarda durum çubuğunun altında kalabiliyordu | Dokunulamaz düğme | Güvenli alan payı eklendi |

## 6. Bu turda eklenenler

- **Masa/şezlong QR bağlantısı:** `denizkapisi://masa/T12` menüyü açar; masa numarası sepete kendiliğinden yazılır, menüde "Masa T12" rozeti görünür.
- **Favoriler:** Kalp ile işaretlenen ürünler menünün en üstünde "Favorilerim" altında toplanır.
- **Tekrar sipariş ver** (Starbucks'ın en sevilen özelliği) ve **Siparişimde sorun var**.
- **Kuponlarım**, **Yardım & destek**.

## Kaynaklar

- Kahve Dünyası, App Store: https://apps.apple.com/app/id1364478029
- Kahve Dünyası şikayetleri: https://www.sikayetvar.com/kahve-dunyasi/siparisim-12-gun-boyunca-kargoya-verilmedi-ve-bilgilendirme-yok · https://www.sikayetvar.com/kahve-dunyasi/6-kahveye-1-kahve · https://www.sikayetvar.com/kahve-dunyasi/kahve-dunyasi-siparis-yanlis-telafi-yok
- Espressolab, App Store: https://apps.apple.com/us/app/id1563181003
- Espressolab şikayetleri: https://www.sikayetvar.com/espressolab/destek · https://www.sikayetvar.com/espressolab/telefon-numarasi-degisikligi-sonrasi-uygulamaya-giris-yapamiyorum · https://www.sikayetvar.com/espressolab/yanlislikla-yuklenen-multinet-bakiyesinin-iadesi-icin-destek-alamiyorum
- Espressolab App Store yorum analizi, Kimola: https://kimola.com/reports/unlock-espressolab-app-insights-a-deep-dive-into-customer-feedback-app-store-tr-153821
- Starbucks yeni sadakat programı (2026): https://about.starbucks.com/press/2026/reimagined-starbucks-rewards-loyalty-program-launches-with-new-member-benefits/
- Starbucks menü yenilemesi (Kasım 2026): https://about.starbucks.com/press/2026/a-new-way-to-inspire-your-starbucks-order/
- Starbucks ChatGPT uygulaması, eWeek: https://www.eweek.com/news/starbucks-chatgpt-ai-prompt-drink-ordering/
- BigChefs App: https://apps.apple.com/app/id6477297743 · Happy Group: https://apps.apple.com/es/app/happy-group/id1144478788?l=en-GB
- Misafir anketleri: Owner.com https://owner.com/blog/restaurant-mobile-app · Tillster https://www.tillster.com/blog/top-restaurant-mobile-app-features · Toast QR menü anketi https://pos.toasttab.com/blog/on-the-line/qr-code-menu-insights · NRN https://www.nrn.com/technology/what-customers-want-restaurant-mobile-apps
- Deniz Kapısı Wanderlog yorumları: https://wanderlog.com/place/details/3040330/deniz-kapısı
