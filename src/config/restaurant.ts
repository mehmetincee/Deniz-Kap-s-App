/** Restoran sabitleri — denizkapisi.com.tr'den alındı. */
export const restaurant = {
  name: 'Deniz Kapısı',
  tagline: 'Restaurant & Bar · Since 1971',
  address: 'İçmeler Mh. Kayabal Cd. No:63, Marmaris / Muğla',
  mapsUrl: 'https://maps.google.com/?q=Deniz+Kap%C4%B1s%C4%B1+%C4%B0%C3%A7meler+Marmaris',
  phone: '+902524553905',
  phoneLabel: '+90 252 455 39 05',
  mobile: '+905359627919',
  mobileLabel: '+90 535 962 79 19',
  whatsapp: 'https://wa.me/905359627919',
  instagram: 'https://www.instagram.com/denizkapisi',
  spotify: 'https://open.spotify.com/user/denizkapisi',
  email: 'info@denizkapisi.com',
  website: 'https://www.denizkapisi.com.tr',
  hours: { restaurant: '09:00 – 01:00', kitchen: '09:00 – 23:00' },
  founded: 1971,
} as const;

/**
 * Servis saatleri: uygulama bu saatlerin dışında ilgili menüden sipariş almaz.
 * Öğlen saatleri QR menüden; kahvaltı ve akşam saatleri tahmini — restoran onaylamalı.
 */
export const serviceHours = {
  kitchen: { from: '09:00', to: '23:00' },
  kahvalti: { from: '09:00', to: '12:00' },
  oglen: { from: '12:00', to: '18:00' },
  aksam: { from: '18:00', to: '23:00' },
} as const;

/**
 * Masaya / şezlonga sipariş ayarları — PLAJ PİLOTU.
 * Pilot sonrası diğer bölümler buradan açılır; kod değişikliği gerekmez.
 */
export const ordering = {
  /**
   * Uygulamadan sipariş. KAPALI: uygulama şimdilik QR menü gibi çalışır (menü, fiyat, alerjen bilgisi).
   * true yapıldığında plaj pilotu (aşağıdaki ayarlar) yeniden açılır.
   */
  enabled: false,
  /** Sipariş alınan alan adı (arayüzde görünür). */
  areaName: 'Şezlong',
  /** Uygulamadan sipariş edilebilen menüler. Pilot: yalnızca öğle (plaj) menüsü ve içecekler. */
  services: ['oglen', 'icecek'] as string[],
  /** Plaj servisi saatleri: içecekler bu aralıkta, öğle menüsü kendi saatinde (12:00–18:00). */
  hours: { from: '10:00', to: '19:00' },
  /** Uygulama içi ödeme. Kapalıyken hesap ayrılırken garsona/kasaya ödenir. */
  onlinePayment: false,
  /** Gel-Al. Pilotta kapalı. */
  pickup: false,
  /**
   * Siparişin restorana ulaşma yolu:
   *  - 'sunucu'  : backend (Supabase) → personel paneli. Asıl hedef.
   *  - 'whatsapp': sunucu kurulana kadar; sipariş hazır metin olarak bar WhatsApp'ına gider.
   *  - 'demo'    : yalnızca bu cihazda saklanır (test/sunum).
   */
  channel: 'demo' as 'sunucu' | 'whatsapp' | 'demo',
} as const;

/**
 * Şezlong/masa QR'larının açtığı adres. Uygulama yüklüyse uygulamayı (universal link),
 * değilse web sürümünü açar. Alan adı yayın öncesi kurulmalı (ör. app.denizkapisi.com.tr).
 */
export const appLinkBase = 'https://app.denizkapisi.com.tr';

/** Personel paneli PIN'i. DEMO: Gerçekte personel kendi hesabıyla sunucuya giriş yapar. */
export const staffPin = '2580';

/**
 * Sadakat programı: "İnci". 1 İnci = 1 ₺; bir sonraki ziyarette indirim olarak harcanır.
 * Kazanım oranı, son 12 aydaki toplam harcamayla kademeli artar; en üst seviyede %15.
 * Seviye adları ve ayrıcalık metinleri dile göre src/i18n'de (tier.<id>.name).
 * EŞİKLER VE ORANLAR RESTORAN TARAFINDAN ONAYLANMALI (marj etkisi: bkz. docs/SADAKAT.md).
 */
export const tiers = [
  { id: 'misafir', min: 0, rate: 0.03 },
  { id: 'dost', min: 10000, rate: 0.05 },
  { id: 'mudavim', min: 25000, rate: 0.08 },
  { id: 'aile', min: 50000, rate: 0.12 },
  { id: 'kaptan', min: 100000, rate: 0.15 },
] as const;

export type TierId = (typeof tiers)[number]['id'];

/** İkramlar (kupon olarak verilir; garsona gösterilir). */
export const gifts = {
  /** İlk kayıtta: kahve bizden. */
  welcome: { id: 'hosgeldin-kahve', validDays: 30 },
  /** Doğum gününde: tatlı bizden. Doğum gününden 3 gün önce açılır, 7 gün sonrasına kadar geçerli. */
  birthday: { id: 'dogumgunu-tatli', daysBefore: 3, daysAfter: 7 },
} as const;

/** Cüzdana para yüklerken verilen bonus İnci. */
export const topUpOptions = [
  { amount: 500, bonus: 25 },
  { amount: 1000, bonus: 75 },
  { amount: 2500, bonus: 250 },
] as const;

/** İnci ile alınabilecek ödüller. Başlık ve açıklamalar src/i18n'de (reward.<id>). */
export const rewards = [
  { id: 'cay', cost: 75 },
  { id: 'kahve', cost: 150 },
  { id: 'limonata', cost: 225 },
  { id: 'tatli', cost: 480 },
  { id: 'kahvalti', cost: 875 },
] as const;
