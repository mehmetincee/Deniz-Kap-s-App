# Plaj Pilotu: Şezlongdan Sipariş ve QR ile Puan

Pilotta yalnızca **şezlonglardan**, yalnızca **öğle (plaj) menüsü ve alkolsüz içecekler** sipariş edilir. Uygulamada **ödeme alınmaz**; misafir hesabı ayrılırken garsona ya da kasaya öder. Böylece ilk aşamada ödeme kuruluşu, sözleşme ve iade süreçleriyle uğraşmadan sistem denenir.

Bütün ayarlar `src/config/restaurant.ts` → `ordering` içinde. Pilot bitince ödemeyi ve diğer menüleri açmak tek satırlık değişikliktir.

```ts
services: ['oglen', 'icecek'],     // + 'aksam', 'kahvalti', 'tatli' eklenerek genişletilir
hours: { from: '10:00', to: '19:00' },
onlinePayment: false,              // true → kart/cüzdan ödemesi, bahşiş ve İnci harcama açılır
pickup: false,                     // true → Gel-Al açılır
channel: 'demo',                   // 'whatsapp' veya 'sunucu'
```

## 1. Misafir nasıl sipariş verir?

1. Her şezlongda (ya da şemsiye direğinde) lamine bir **QR kartı** bulunur: "Ş12". Kartlar `node scripts/sezlong-qr.js 1 40 > sezlong-qr.html` ile üretilir; A4'e 6 kart sığar.
2. Misafir telefonunun **kamerasıyla** QR'ı okutur. Kartta `app.denizkapisi.com.tr/masa/S12` adresi vardır:
   - Uygulama yüklüyse doğrudan uygulama açılır.
   - Yüklü değilse aynı ekran tarayıcıda (web sürümü) açılır. **Turistlerin uygulama indirmesine gerek kalmaz.**
3. Menü açılır, sağ üstte **"Şezlong Ş12"** yazar ve numara sepete kendiliğinden dolar.
4. Öğle menüsü ve içeceklerde "+" görünür. Kahvaltı ve akşam menüleri **bilgi amaçlı** gösterilir: "+" yoktur, ürüne girilince "garsonumuza seslenebilirsiniz" yazar.
5. Sepette ödeme bölümü yoktur, onun yerine **"Ödeme hesapta"** notu vardır. Misafir **"Siparişi gönder"** der.
6. Sipariş ekranında durum görünür: Alındı → Hazırlanıyor → Hazır → Afiyet olsun.
7. Plaj servisi saatleri (10:00–19:00) dışında ve mutfak kapalıyken sipariş verilemez.

## 2. Siparişi kim, nasıl yönetir? (Personel paneli)

Bar ya da plaj garsonu için **bir tablet** yeterlidir. Uygulamada Hesabım → en altta **"Personel girişi"** (PIN), ya da doğrudan `/panel` adresi.

**Şezlong siparişleri** sekmesi:
- Siparişler **en eskisi en üstte** sıralanır: şezlong numarası büyük harflerle, misafirin adı, ürünler ve kırmızıyla mutfak notu.
- Renkli şerit ve rozet durumu gösterir: Yeni (kırmızı) → Hazırlanıyor (turuncu) → Hazır (mavi) → Teslim edildi (yeşil). Tek dokunuşla ilerletilir; sunucu kurulduğunda misafirin ekranındaki durum da anında değişir.
- Misafir hesabı ödediğinde **"Ödeme alındı"** → onay. Sipariş kapanır ve **İnci misafirin kartına otomatik yüklenir.**
- Üstte o günün açık sipariş sayısı, kapanan sipariş sayısı ve cirosu görünür.

Önerilen işleyiş:

| Kim | Ne yapar |
|---|---|
| Bar | Tablette yeni siparişi görür, hazırlar, "Hazır" der |
| Plaj garsonu | Siparişi şezlonga götürür, "Teslim edildi" der |
| Kasa / garson | Misafir ayrılırken hesabı alır, "Ödeme alındı" der |

## 3. QR ile puan (İnci) nasıl verilir?

İki yol var. İkisi de personel panelinden yapılır.

**A) Uygulamadan verilen siparişler: otomatik.** Sipariş misafirin üyeliğine bağlıdır. "Ödeme alındı" denince seviyesine göre İnci yüklenir (Misafir %3, Dost %5, Aileden %7). Kimsenin ayrıca bir şey okutması gerekmez.

**B) Garsona sözlü verilen siparişler ve restorandaki masalar: kart QR'ı okutulur.**
1. Misafir hesabı öderken uygulamada **Kartım**'ı açar ve QR'ı gösterir.
2. Personel panelinde **Puan yükle** → **"Kartı kamerayla okut"** → tutarı girer → **"İnci yükle"**.
3. QR okunamazsa üye numarası (DK…) elle yazılabilir. Bu işlem "elle" olarak ayrıca kaydedilir.

**Kötüye kullanıma karşı önlemler (çalışır durumda):**
- Kart QR'ı **30 saniyede bir değişir** ve misafirin telefonundaki gizli anahtarla **imzalanır**. Ekran görüntüsü birkaç dakika sonra geçersiz olur; başkasının üye numarasıyla sahte kod üretilemez.
- **Aynı karta aynı tutar 10 dakika içinde ikinci kez yüklenemez** (çift okutma koruması).
- Her işlem tarih, üye, tutar, kazanılan İnci ve kaynak (QR / sipariş / elle) ile kaydedilir. Panelde "Son işlemler" bölümünde görünür.
- Sunucu kurulunca ek olarak her işleme personel adı ve günlük üst limit eklenecek.

## 4. Şu an ne çalışıyor, ne eksik?

| | Durum |
|---|---|
| Misafir akışı (QR → menü → sepet → sipariş → takip) | ✅ Çalışıyor, test edildi |
| Personel paneli (sipariş yönetimi, ödeme alındı, QR ile puan) | ✅ Çalışıyor, test edildi |
| Şezlong QR kartları | ✅ Betik hazır |
| **Misafir telefonu ↔ bar tableti bağlantısı** | ❌ **Sunucu gerekiyor.** Şu an sipariş ve puan yalnızca aynı cihazda görünür (`channel: 'demo'`) |
| `app.denizkapisi.com.tr` alan adı ve web sürümü yayını | ❌ Kurulmalı |

**Sunucu gelene kadar ara çözüm:** `channel: 'whatsapp'`. Misafir "Siparişi gönder" deyince WhatsApp, şezlong numarası, ürünler, notlar ve üye numarasıyla hazır bir mesajla açılır; mesaj barın WhatsApp Business hattına gider. Altyapı gerektirmez ve hemen denenebilir. Eksikleri: misafirde WhatsApp olmalı, durum takibi yok, İnci QR ile kasada elle yüklenir.

## 5. Sunucu (önerilen: Supabase)

Pilot için gereken tablolar az. **Aşağıdaki şema tasarım taslağıdır, henüz kurulmadı ve test edilmedi.**

```sql
create table members (
  member_no   text primary key,              -- DK12345678
  phone       text unique not null,
  name        text not null,
  qr_secret   text not null,                 -- kart QR imzası için (istemciye yalnızca bir kez verilir)
  pearls      integer not null default 0,
  created_at  timestamptz default now()
);

create table orders (
  id          text primary key,
  member_no   text references members,
  spot        text not null,                 -- Ş12
  status      text not null default 'alindi',-- alindi | hazirlaniyor | hazir | teslim
  subtotal    integer not null,
  paid        boolean not null default false,
  paid_at     timestamptz,
  paid_by     uuid,                          -- personel
  created_at  timestamptz default now()
);

create table order_lines (
  order_id    text references orders on delete cascade,
  product_id  text not null,
  name        text not null,
  option_name text,
  note        text,
  qty         integer not null,
  unit_price  integer not null               -- fiyat sunucudaki menüden doğrulanır
);

create table pearl_ledger (                  -- her İnci hareketi; bakiye bunun toplamıdır
  id          bigserial primary key,
  member_no   text references members,
  delta       integer not null,
  amount      integer,                       -- ilgili hesap tutarı
  source      text not null,                 -- siparis | qr | elle | odul | hosgeldin
  order_id    text,
  staff_id    uuid,
  created_at  timestamptz default now()
);
```

- **Realtime:** Bar tableti `orders` tablosunu dinler; yeni sipariş anında düşer, sesli uyarı verilir. Misafirin ekranı da kendi siparişini dinler.
- **Kurallar (RLS):** Misafir yalnızca kendi siparişlerini görür. Personel rolü bütün açık siparişleri görür ve durum değiştirir. İnci yalnızca sunucudaki bir fonksiyonla yüklenir (`award_pearls`); fonksiyon QR imzasını, süreyi ve çift okutmayı orada denetler.
- **Fiyat güvenliği:** Sepetteki fiyat istemciden gelir ama sunucu her satırı menü tablosundan yeniden hesaplar.

## 6. Pilot planı

1. **Hazırlık:** Şezlong sayısı ve numaralandırması belirlenir, QR kartları basılıp lamine edilir. Bar için bir tablet ayrılır.
2. **Bir hafta, birkaç şezlong:** Örneğin Ş1–Ş10 ile başlanır, ekip panelle çalışmaya alışır.
3. **Bakılacaklar:** Siparişlerin ne kadarı uygulamadan geldi, sipariş başına ortalama tutar, hazırlama süresi, hatalı siparişler, kaç misafirin üye olduğu, personelin geri bildirimi.
4. **Genişletme:** Bütün şezlonglar, ardından `services` listesine tatlı ve akşam menüsü, sonra masalar (`/masa/T12`), en son `onlinePayment: true`.

## Restorandan yanıt beklenenler

- Şezlong sayısı ve numaralandırma (Ş1–Ş40 mı?).
- Plaj servisi saatleri: şu an 10:00–19:00 (öğle menüsü 12:00–18:00).
- İlk gün WhatsApp ara çözümüyle mi başlansın, sunucu kurulduktan sonra mı?
- Bar tableti için hangi cihaz (iPad / Android tablet)?
- Personel PIN'i (şu an demo: `2580`). Sunucuyla birlikte her personelin kendi girişi olacak.
