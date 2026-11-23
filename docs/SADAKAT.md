# İnci Sadakat Programı

1 İnci = 1 ₺. Misafir, kazandığı İnci'yi bir sonraki ziyaretinde indirim ya da ödül olarak kullanır. Kazanım oranı, son 12 aydaki harcamaya göre kademeli artar; en üst seviyede %15'tir.

| Seviye (TR / EN / RU) | Son 12 ay harcama | Kazanım | Ek ayrıcalık |
|---|---|---|---|
| Misafir / Guest / Гость | 0 ₺ | %3 | Doğum günü tatlısı |
| Dost / Friend / Друг | 10.000 ₺ | %5 | + Rezervasyonda öncelik |
| Müdavim / Regular / Завсегдатай | 25.000 ₺ | %8 | |
| Aileden / Family / Семья | 50.000 ₺ | %12 | + Özel tadım gecelerine davet |
| Kaptan / Captain / Капитан | 100.000 ₺ | %15 | + Yılda bir kez şefin masası |

**Eşikler ve oranlar öneridir; restoran onaylamalı.** Ayar dosyası: `src/config/restaurant.ts` → `tiers`.

## İkramlar

- **Hoş geldin kahvesi:** İlk kayıtta Türk kahvesi kuponu oluşur (30 gün geçerli). Her telefon numarasına yalnızca bir kez verilir; çıkış yapıp yeniden kaydolarak tekrar alınamaz.
- **Doğum günü tatlısı:** Kayıtta doğum günü (yalnızca gün ve ay) sorulur. Doğum gününden 3 gün önce kupon açılır ve 7 gün sonrasına kadar geçerlidir; yılda bir kez verilir. Alan isteğe bağlıdır.

İkramlar "Kartım → Kuponlarım"da 6 haneli bir kodla görünür; ayrıca Keşfet ekranının en üstünde "İkramınız hazır" kartı çıkar.

## Maliyet: neden dikkat edilmeli?

%15 İnci, o misafir için fiilen %15 indirim demek. Kaba bir hesap:

- Yılda 100.000 ₺ harcayan bir Kaptan misafir, yılda yaklaşık 15.000 ₺ İnci kazanır.
- Misafirler kazandıklarının hepsini kullanmaz. Sektörde puanların kabaca %20–40'ı kullanılmadan kalır. Yine de en üst seviyede maliyet cironun %10'unu bulabilir.
- Yiyecek maliyeti genellikle cironun %28–35'i olduğundan, en üst seviyede kâr marjının önemli bir kısmı İnci'ye gider.

Önerilen dengeleyiciler (henüz uygulanmadı, karar sizin):
1. **İnci'nin süresi dolsun:** Kazanıldıktan 12 ay sonra geçersiz olsun. Hem maliyeti sınırlar hem misafiri yıl içinde geri getirir.
2. **İnci, hesabın en fazla %50'sini karşılasın:** Bedava yemek yerine indirim olarak kalır.
3. **Kampanyalı ürünlerde ve alkolde İnci kazanılmasın** (alkol için yasal açıdan da daha temiz).
4. **Üst seviyeler daha seyrek olsun:** Kaptan seviyesini yalnızca gerçekten çok sık gelen yerel misafirler görecek. Turistlerin çoğu Misafir veya Dost seviyesinde kalır, yani asıl maliyet düşük seviyelerde oluşur.

## Puan nasıl yükleniyor?

Uygulamada sipariş şimdilik kapalı (QR menü modu). İnci yalnızca kasada yükleniyor:
1. Misafir hesabı öderken Kartım'daki QR'ı gösterir (QR 30 saniyede bir değişir, imzalıdır).
2. Personel panelde "Puan yükle" ile okutur ve hesap tutarını girer.
3. İnci, misafirin seviyesine göre hesaplanıp yüklenir; harcama seviye hesabına da eklenir.

Bu akışın misafir telefonu ile personel tableti arasında gerçekten çalışması için sunucu gerekiyor (bkz. `docs/PLAJ_PILOTU.md`). Demo modunda yalnızca aynı cihazdaki üyeye yükleme yapılabiliyor.
