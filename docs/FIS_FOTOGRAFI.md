# Fiş Fotoğrafıyla Puan: Değerlendirme

**Soru:** Misafir, aldığı hesap fişinin fotoğrafını uygulamaya yükleyerek İnci kazanabilsin mi?

**Kısa cevap:** Tek başına ana yöntem olmamalı, **yedek yöntem** olarak iyi bir fikir. Ana yöntem kasada QR okutmak kalmalı. Fiş fotoğrafı, QR'ı okutmayı unutan misafir için bir "ikinci şans" olsun ve personel onayıyla çalışsın.

## Neden faydalı?

- **Unutulan puan kurtarılır.** Kalabalık bir akşam garson QR'ı okutmayı unutabilir. Misafir sonradan fişi yükleyip puanını alabilir; bu da güveni artırır.
- **Personele yük bindirmez.** Kasada ekstra bir adım yok; onay, sakin bir saatte toplu yapılabilir.
- **Turistlere uygun.** Uygulamayı yemekten sonra indiren biri, aynı gün fişini yükleyip ilk puanını kazanabilir. İlk etkileşim olarak da güçlüdür.

## Riskler

| Risk | Örnek | Önlem |
|---|---|---|
| Aynı fişin tekrar yüklenmesi | Bir fiş iki kez ya da iki ayrı hesaptan yüklenir | Fiş no + Z no + tarih birlikte tek kayıt sayılır; ikinci yükleme reddedilir |
| Başkasının fişi | Masadaki diğer kişinin ya da yerde bulunan fiş | Fiş en fazla 48 saat içinde yüklenebilir; personel onayında tutar ve tarih kontrol edilir |
| Oynanmış fotoğraf | Tutar değiştirilmiş fiş | Personel onayı; yüksek tutarlar (ör. 5.000 ₺ üstü) ayrıca kontrol edilir |
| Başka restoranın fişi | Komşu işletmenin fişi | Fişte işletme adı ve VKN kontrol edilir (OCR ile otomatik) |
| Okunamayan fotoğraf | Bulanık, karanlık çekim | Uygulama çekim sırasında çerçeve gösterir; okunamazsa misafirden tekrar çekim istenir |
| Kişisel veri | Fişte kart son 4 hanesi gibi bilgiler | Fotoğraf yalnızca onay için saklanır, onaydan 30 gün sonra silinir; KVKK metnine eklenir |

## Önerilen akış

1. Misafir **Kartım → "Fişimi yükle"** der ve fişin fotoğrafını çeker.
2. Uygulama fişten tarih, saat, fiş numarası ve toplam tutarı okur (OCR) ve misafire gösterir: "16 Haziran 20:42 · ₺1.450 · doğru mu?"
3. Kayıt "onay bekliyor" olarak personel paneline düşer. Misafir, bu sürede puanı "beklemede" olarak görür.
4. Personel panelde fotoğrafı ve okunan bilgileri görür, tek dokunuşla **Onayla** ya da **Reddet** der.
5. Onaylanınca İnci yüklenir ve misafire bildirim gider.

**Kurallar:** Fiş en geç 48 saat içinde yüklenebilir. Her fiş bir kez kullanılır. Kişi başı günde en fazla 2 fiş yüklenebilir. Aynı fiş için kasada QR ile puan zaten verildiyse reddedilir; fiş numarası iki yöntemde de kaydedilir.

## Daha iyi bir yol: fişin üstüne QR

Kullandığınız adisyon/POS sistemi fişe bir QR kod basabiliyorsa, en temiz çözüm budur. Fişin altında, o hesaba özel bir QR bulunur ("Bu fişten İnci kazanın"). Misafir okutur, İnci anında ve otomatik yüklenir. Personel onayına, OCR'a ya da fotoğraf saklamaya gerek kalmaz; sahte fiş riski de ortadan kalkar. Bunun için POS sağlayıcınızın böyle bir özelliği olup olmadığını öğrenmemiz gerekiyor.

## Ne gerekiyor?

- **Sunucu:** Fotoğraf saklama, tekrar yükleme kontrolü ve personel onay kuyruğu (Supabase Storage + bir tablo).
- **OCR:** Cihaz üzerinde (iOS Vision / Android ML Kit, ücretsiz) ya da bulutta. Türkçe fişlerde cihaz üzerindeki tanıma genellikle yeterli; okunamayan alanları personel elle düzeltir.
- **Personel paneline** "Fiş onayları" sekmesi.
- **KVKK metnine** fotoğrafların işlenmesi ve saklama süresi eklenmeli.

## Önerim

Sırayla:
1. **Şimdi:** Kasada QR ile puan (hazır).
2. **Sunucuyla birlikte:** Fiş fotoğrafı, personel onaylı yedek yöntem olarak.
3. **POS destekliyorsa:** Fişe QR basılması. Bu olursa fiş fotoğrafına gerek kalmaz.
