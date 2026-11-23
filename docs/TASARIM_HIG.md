# Tasarım Kararları: Apple Human Interface Guidelines

Kaynaklar, Apple'ın HIG JSON adreslerinden okundu (Kasım 2026):
`https://developer.apple.com/tutorials/data/design/human-interface-guidelines.json` (içindekiler) ve
`.../human-interface-guidelines/<sayfa>.json` biçimindeki sayfalar.

Okunan sayfalar: layout, typography, color, tab-bars, lists-and-tables, sf-symbols, materials, designing-for-ios, toolbars, buttons, sheets, search-fields, segmented-controls, toggles, alerts, dark-mode, accessibility. (`navigation-bars` adresi 404 döndü; gezinme çubuğu kuralları `toolbars` sayfasında.)

Her kararın kodda da yanında `[sayfa › bölüm]` biçiminde kaynağı yazılı. En yoğun olduğu dosyalar: `src/theme/index.ts`, `src/components/ui.tsx`, `src/components/navigation.ts`, `src/app/(tabs)/_layout.tsx`.

## Renk

| Karar | Kaynak |
|---|---|
| iOS'ta renkler kodda sabit yazılmıyor; `PlatformColor` ile sistemden okunuyor (`label`, `systemBlue`, `systemGroupedBackground`…). | color › System colors: "Avoid hard-coding system color values… Use APIs like Color." |
| Açık/koyu mod ve "Kontrastı Artır" ayarına iOS'ta kendiliğinden uyum; `userInterfaceStyle: automatic`. | color › Best practices; dark-mode: "people… expect all apps… to respect their preference" |
| Gruplanmış ekranlarda `systemGroupedBackground` + `secondarySystemGroupedBackground` hücreler; menü (düz liste) `systemBackground`. | color › iOS, iPadOS |
| Metinde `label` / `secondaryLabel` / `tertiaryLabel` / `placeholderText`; ayırıcılarda `separator`. | color › iOS, iPadOS (ön plan renkleri tablosu) |
| Vurgu rengi `systemBlue`: logodaki mavi ile neredeyse aynı. | color › Liquid Glass color: "choosing your brand color as the app accent color can be effective" |
| Her rengin tek anlamı var: mavi = etkileşim, yeşil = tamam/ödendi, turuncu = bekliyor, kırmızı = yeni/hata/yıkıcı, indigo = sadakat kartı. | color › Best practices: "Avoid using the same color to mean different things" |
| Durumlar yalnızca renkle değil, simge ve metinle de anlatılıyor (onay işareti, +/− işareti, "ödendi/hesapta"). | color › Inclusive color |
| Android/web yedek değerleri HIG tablosundan alındı (ör. blue R0 G136 B255, green R52 G199 B89). | color › Specifications |

## Yazı

| Karar | Kaynak |
|---|---|
| Yalnızca sistem fontları: SF (arayüz) + New York (başlıklar, ürün adları). Font dosyası gömülmüyor; EB Garamond ve Montserrat kaldırıldı. | typography › Using system fonts; Developer note: "don't embed system fonts"; "Minimize the number of typefaces" |
| Boyutlar Dynamic Type "Large (default)" tablosundan: Large Title 34/41, Title 1 28/34, Title 2 22/28, Title 3 20/25, Headline/Body 17/22, Callout 16/21, Subhead 15/20, Footnote 13/18, Caption 12/16 ve 11/13. | typography › iOS, iPadOS Dynamic Type sizes |
| Metin sistem yazı boyutu ayarıyla büyüyor. | layout › "Be prepared for text-size changes"; typography › Supporting Dynamic Type |
| En küçük metin 11 pt; ince (Light/Thin) ağırlık yok. | typography › Ensuring legibility |
| Kupon kodu ve üye numarası SF Mono ile. | typography › Using system fonts (SF Mono) |
| Harf aralığı elle ayarlanmıyor; büyük harfli etiketler kaldırıldı. | typography › "the system font dynamically adjusts tracking" |

## Gezinme ve yerleşim

| Karar | Kaynak |
|---|---|
| Sekme çubuğu iOS'un yerel `UITabBar`'ı; iOS 26'da Liquid Glass üzerinde içeriğin üstünde yüzüyor. | tab-bars › iOS; materials: "Standard components… pick up the appearance… automatically" |
| Ortadaki yükseltilmiş "Kartım" düğmesi kaldırıldı; beş eşit sekme var. | tab-bars: "Use a tab bar to support navigation, not to provide actions"; "Avoid overflow tabs" |
| Sekme etiketleri tek kelime (Keşfet, Menü, Kartım, Rezervasyon, Hesabım); seçili sekmede dolgulu simge. | tab-bars: "Use single words whenever possible", "Prefer filled symbols" |
| iOS 26'da sepet, sekme çubuğunun alt aksesuarı (Müzik'teki mini oynatıcı gibi); kaydırınca sekme çubuğu küçülüyor. | tab-bars › iOS (MiniPlayer örneği) |
| Her sekmede kaydırınca küçülen büyük başlık (large title). | toolbars: "Use a large title to help people stay oriented" |
| Başlık altında düz renk yok; içerik altından kayıyor, sistem kaydırma kenarı efekti uyguluyor. | layout › Differentiate controls from content |
| Başlıklar 15 karakterin altında; uygulama adı başlık değil (ana sekme "İyi akşamlar" gibi selamlama). | toolbars › Titles |
| Standart Geri ve Kapat simgeleri; "Geri" yazısı yok. | toolbars: "Use the standard Back and Close buttons… don't use a text label" |
| Ürün ve sepet sayfa (sheet) olarak açılıyor; Kapat düğmesi solda. | sheets: "the Cancel button belongs on the leading edge" |
| Kenar boşluğu 16 pt; güvenli alana uyuluyor. | layout › Guides and safe areas |
| En önemli içerik (kart, aktif sipariş) en üstte. | layout › Visual hierarchy |
| Yatay kaydırmalı "Şefin seçtikleri". | layout › progressive disclosure: "use scrollable sections" |

## Listeler, kontroller, simgeler

| Karar | Kaynak |
|---|---|
| Hesabım, Kartım, sepet ve iletişim bilgileri Ayarlar uygulaması düzeninde gruplanmış liste. | lists-and-tables › Style: "the grouped style uses headers, footers, and additional space" |
| Seçenek listelerinde (yumurta çeşidi, ödeme yöntemi) seçili satırda onay işareti. | lists-and-tables: "adding an image — such as a checkmark — indicating that the item is selected" |
| Menü satırı: kısa ad + en fazla 2 satır açıklama, ayrıntı dokununca. | lists-and-tables › Content |
| Menü araması iOS'ta gezinme çubuğunda, ne aranabileceğini anlatan yer tutucuyla; web'de içerikle birlikte. | search-fields › iOS; "Use placeholder text" |
| Ekranda tek belirgin (prominent) düğme: vurgu rengi zeminli kapsül, 52 pt. | buttons: "Keep the number of prominent buttons to one or two per view"; "prefer… capsule-shape" |
| Tüm dokunma alanları en az 44x44 pt (küçük kontrollere hitSlop eklendi). | buttons / accessibility: "hit region of at least 44x44 pt" |
| Yıkıcı eylem (Çıkış, İptal) sistem kırmızısı, belirgin değil. | buttons › Destructive role |
| Bahşiş, yükleme tutarı, Masaya/Gel-Al ve personel paneli sekmeleri segment kontrolü (en fazla 5 bölme). | segmented-controls: "no more than about five segments on iPhone" |
| Anahtarlar varsayılan yeşil. | toggles: "The default green color tends to work well" |
| Yalnızca bilgi veren uyarı pencereleri kaldırıldı (yükleme başarılı, kupon hazır); uyarı sadece hata ve geri alınamaz eylemde (çıkış). | alerts: "Avoid using an alert merely to provide information" |
| iOS'ta tüm simgeler SF Symbols; listede outline, sekmede fill varyantı; ağırlık yanındaki metinle eşleşiyor. | sf-symbols › Design variants; Weights and scales |
| Yalnızca SF Symbols 4.0 ve öncesindeki simgeler kullanıldı (en düşük iOS 16.4). `receipt` (6.2) yerine `doc.text`. | sf-symbols: "Symbols… introduced in a given year aren't available in earlier operating systems" |
| Instagram için marka logosu yok, `camera` simgesi. | sf-symbols: logo/marka kullanım yasağı |

## Malzemeler (Liquid Glass)

| Karar | Kaynak |
|---|---|
| Liquid Glass yalnızca kontrol katmanında: sekme çubuğu, gezinme çubuğu, sepet çubuğu, yuvarlak Kapat/Geri/Favori düğmeleri, alt eylem alanı. | materials: "Don't use Liquid Glass in the content layer"; "Use Liquid Glass effects sparingly" |
| Fotoğraf üstündeki düğmelerde "clear" varyant; fotoğraf üstü metinde %35 karartma. | materials: "Only use clear Liquid Glass for components that appear over visually rich backgrounds"; "dark dimming layer of 35% opacity" |
| Sepet çubuğu vurgu rengiyle renklendirilmiş cam. | color › Liquid Glass color: "apply color to the background rather than to symbols or text" |
| İçerik kartları düz sistem yüzeyi, gölgesiz. | materials › Standard materials |
| iOS 26 öncesinde ve web'de cam yerine sistem bulanıklık malzemesi. | materials › Standard materials |

## Doğrulanamayanlar ve bilinen sınırlar

- **iOS'un kendi görünümü test edilmedi.** Liquid Glass, SF Symbols, yerel sekme ve gezinme çubukları, `PlatformColor` ile koyu mod yalnızca iOS cihazda veya simülatörde görülebilir. Bu çalışma ortamında (Linux) iOS simülatörü yok. Bir geliştirme derlemesiyle (`eas build --profile development`) iPhone'da kontrol edilmeli.
- **Web ve Android'de koyu mod yok.** Sistem renk API'si yalnızca iOS'ta; diğer platformlarda şimdilik açık mod değerleri kullanılıyor.
- **SF Symbols lisans gereği yalnızca Apple platformlarında.** Web ve Android'de aynı anlamı taşıyan çizgi simgeler gösteriliyor.
- **iOS 26 öncesinde yüzen sepet çubuğunun konumu**, standart 49 pt sekme çubuğu yüksekliğine göre hesaplandı; cihazda doğrulanmalı.
