/**
 * Deniz Kapısı tasarım sistemi — Apple Human Interface Guidelines'a göre.
 * Her kararın kaynağı, ilgili HIG sayfasının adıyla yazılmıştır
 * (developer.apple.com/design/human-interface-guidelines/<sayfa>). Ayrıntı: docs/TASARIM_HIG.md
 */
import { Platform, PlatformColor, type ColorValue, type TextStyle } from 'react-native';

/* ------------------------------------------------------------------ RENK ---
 * [color › System colors] "Avoid hard-coding system color values… Use APIs like Color."
 *   → iOS'ta değerler PlatformColor ile sistemden okunur; açık/koyu mod ve "Kontrastı Artır"
 *     ayarına kendiliğinden uyar [color › Best practices], [dark-mode].
 * [color › iOS, iPadOS] Gruplanmış listelerde systemGroupedBackground ailesi, diğerlerinde
 *   systemBackground ailesi; metinde label / secondaryLabel / tertiaryLabel.
 * Android ve web'de sistem renk API'si yok; yedek değerler HIG renk tablosundan
 * (color › Specifications, açık mod) alındı.
 */
const sys = (iosName: string, fallback: string): ColorValue => (Platform.OS === 'ios' ? PlatformColor(iosName) : fallback);

export const colors = {
  // Arka planlar [color › iOS, iPadOS]: birincil = ekran, ikincil = gruplanmış içerik
  background: sys('systemBackground', '#FFFFFF'),
  secondaryBackground: sys('secondarySystemBackground', '#F2F2F7'),
  groupedBackground: sys('systemGroupedBackground', '#F2F2F7'),
  secondaryGroupedBackground: sys('secondarySystemGroupedBackground', '#FFFFFF'),
  tertiaryGroupedBackground: sys('tertiarySystemGroupedBackground', '#F2F2F7'),
  // Ön plan [color › iOS, iPadOS: Label, Secondary label, Placeholder text, Separator, Link]
  label: sys('label', '#000000'),
  secondaryLabel: sys('secondaryLabel', 'rgba(60,60,67,0.6)'),
  tertiaryLabel: sys('tertiaryLabel', 'rgba(60,60,67,0.3)'),
  placeholder: sys('placeholderText', 'rgba(60,60,67,0.3)'),
  separator: sys('separator', 'rgba(60,60,67,0.29)'),
  // Dolgular: kontrol zeminleri (segment izi, pasif kapsül, ikon zemini)
  fill: sys('tertiarySystemFill', 'rgba(118,118,128,0.12)'),
  fillStrong: sys('secondarySystemFill', 'rgba(120,120,128,0.16)'),
  /**
   * Uygulama vurgu rengi. [color › Liquid Glass color] "In apps with primarily monochromatic content…
   * choosing your brand color as the app accent color can be effective." Logodaki mavi, sistem
   * mavisine (R0 G136 B255) çok yakın olduğu için marka rengi olarak systemBlue seçildi.
   */
  accent: sys('systemBlue', '#0088FF'),
  // Durum renkleri — anlamları sabit [color › Best practices: aynı renk farklı anlam taşımaz]
  green: sys('systemGreen', '#34C759'), // başarı, ödendi, teslim
  red: sys('systemRed', '#FF383C'), // hata, yeni sipariş, yıkıcı eylem [buttons › destructive]
  orange: sys('systemOrange', '#FF8D28'), // hazırlanıyor / bekliyor
  indigo: sys('systemIndigo', '#6155F5'), // sadakat kartı zemini
  teal: sys('systemTeal', '#00C3D0'), // plaj
  gray: sys('systemGray', '#8E8E93'),
  /** Renkli zemin üstündeki metin/simge (accent buton, kart). Her iki modda beyaz kalır. */
  onAccent: '#FFFFFF' as ColorValue,
  /** Fotoğraf üstü karartma [materials › Liquid Glass: parlak içerik için %35 karartma]. */
  scrim: 'rgba(0,0,0,0.35)' as ColorValue,
} as const;

/* ------------------------------------------------------------- YAZI TİPİ ---
 * [typography › Using system fonts] Sistem fontu: San Francisco. Serif ihtiyacı için yine bir
 *   sistem fontu olan New York: "designed to work well by itself and alongside the SF fonts."
 * [typography › Developer note] "don't embed system fonts" → font dosyası gömülmez; iOS'ta
 *   React Native 'system-ui' (SF) ve 'ui-serif' (New York) adlarıyla sistemden ister.
 * [typography › Conveying hierarchy] "Minimize the number of typefaces" → yalnızca SF + New York.
 * [typography › Ensuring legibility] "avoid Ultralight, Thin, and Light" → en ince ağırlık Regular.
 */
const sans = Platform.select({ ios: 'system-ui', web: 'system-ui, -apple-system, "SF Pro Text", Roboto, "Helvetica Neue", sans-serif' });
/** Kupon kodu gibi tek tek okunacak karakterler için sistem eşit aralıklı fontu (SF Mono) [typography › SF Mono]. */
const mono = Platform.select({ ios: 'ui-monospace', android: 'monospace', web: 'ui-monospace, "SF Mono", Menlo, monospace' });
const serif = Platform.select({ ios: 'ui-serif', android: 'serif', web: 'ui-serif, "New York", Georgia, serif' });

export const font = {
  regular: { fontFamily: sans, fontWeight: '400' },
  medium: { fontFamily: sans, fontWeight: '500' },
  semibold: { fontFamily: sans, fontWeight: '600' },
  bold: { fontFamily: sans, fontWeight: '700' },
  serif: { fontFamily: serif, fontWeight: '500' },
  serifItalic: { fontFamily: serif, fontWeight: '400', fontStyle: 'italic' },
  serifBold: { fontFamily: serif, fontWeight: '700' },
  mono: { fontFamily: mono, fontWeight: '600' },
} satisfies Record<string, TextStyle>;

/**
 * [typography › iOS, iPadOS Dynamic Type sizes › Large (default)] metin stilleri.
 * Boyut ve satır aralıkları tablodan birebir alındı. Yazı boyutu sistemle büyür (Dynamic Type),
 * çünkü React Native Text varsayılan olarak allowFontScaling=true'dur [layout › Be prepared for text-size changes].
 */
export const textStyle = {
  largeTitle: { fontSize: 34, lineHeight: 41 },
  title1: { fontSize: 28, lineHeight: 34 },
  title2: { fontSize: 22, lineHeight: 28 },
  title3: { fontSize: 20, lineHeight: 25 },
  headline: { fontSize: 17, lineHeight: 22 },
  body: { fontSize: 17, lineHeight: 22 },
  callout: { fontSize: 16, lineHeight: 21 },
  subhead: { fontSize: 15, lineHeight: 20 },
  footnote: { fontSize: 13, lineHeight: 18 },
  caption1: { fontSize: 12, lineHeight: 16 },
  caption2: { fontSize: 11, lineHeight: 13 }, // [typography] iOS asgari boyut 11 pt
} as const;

/** Bileşenlerin kullandığı hazır stiller (T bileşeni: v="…"). */
export const type = {
  // Büyük başlıklar New York ile: menünün basılı menü kimliği korunur, sistem fontu kuralı da bozulmaz.
  hero: { ...font.serifBold, ...textStyle.largeTitle, color: colors.label },
  h1: { ...font.serifBold, ...textStyle.title1, color: colors.label },
  h2: { ...font.serif, ...textStyle.title2, color: colors.label },
  h3: { ...font.semibold, ...textStyle.headline, color: colors.label },
  body: { ...font.regular, ...textStyle.body, color: colors.label },
  // İkincil metin: [color] secondaryLabel = "secondary content"
  secondary: { ...font.regular, ...textStyle.subhead, color: colors.secondaryLabel },
  small: { ...font.regular, ...textStyle.footnote, color: colors.secondaryLabel },
  // Liste bölüm başlığı: gruplanmış liste başlıkları footnote + secondaryLabel [lists-and-tables › Style]
  label: { ...font.semibold, ...textStyle.footnote, color: colors.secondaryLabel },
  price: { ...font.semibold, ...textStyle.subhead, color: colors.label },
} satisfies Record<string, TextStyle>;

/* ---------------------------------------------------------------- YERLEŞİM ---
 * [layout › Guides and safe areas] standart kenar boşluğu 16 pt (iPhone okunabilir kenar).
 * [buttons] / [accessibility] dokunma alanı en az 44x44 pt → hit = 44.
 */
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 32 } as const;
export const hit = 44;
/** [buttons] "prefer circular or capsule-shape buttons"; gruplanmış liste köşeleri 10–12 pt. */
export const radius = { sm: 8, md: 12, lg: 16, xl: 26, pill: 999 } as const;

/** Gölge yalnızca yüzen öğelerde; içerik kartları gölgesizdir (gruplanmış liste görünümü). */
export const shadow = {
  card: {},
  floating: {
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
} as const;
