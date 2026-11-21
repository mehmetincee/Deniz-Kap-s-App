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
 * Sadakat programı: "İnci".
 * Her harcamada seviyeye göre İnci kazanılır; 1 İnci = 1 ₺ değerindedir.
 * Seviye, son 12 aydaki toplam harcamaya göre belirlenir.
 */
export const tiers = [
  { id: 'misafir', name: 'Misafir', min: 0, rate: 0.03, perks: ['Her harcamada %3 İnci', 'Doğum gününde tatlı ikramı'] },
  { id: 'dost', name: 'Dost', min: 15000, rate: 0.05, perks: ['Her harcamada %5 İnci', 'Doğum gününde tatlı ikramı', 'Rezervasyonda öncelik'] },
  {
    id: 'aile',
    name: 'Aileden',
    min: 40000,
    rate: 0.07,
    perks: ['Her harcamada %7 İnci', 'Doğum gününde şefin sürprizi', 'Rezervasyonda öncelik', 'Özel tadım gecelerine davet'],
  },
] as const;

export type TierId = (typeof tiers)[number]['id'];

/** Cüzdana para yüklerken verilen bonus İnci. */
export const topUpOptions = [
  { amount: 500, bonus: 25 },
  { amount: 1000, bonus: 75 },
  { amount: 2500, bonus: 250 },
] as const;

/** İnci ile alınabilecek ödüller (ürün id'leri src/data/menu.ts'teki ürünlere karşılık gelir). */
export const rewards = [
  { id: 'r-cay', title: 'Demleme Çay', cost: 75, note: 'Ev yapımı kurabiyesiyle' },
  { id: 'r-turk-kahvesi', title: 'Türk Kahvesi', cost: 150, note: 'Damla sakızlı da olabilir' },
  { id: 'r-limonata', title: 'Ev Yapımı Limonata', cost: 225, note: 'Mevsim aromasıyla' },
  { id: 'r-tatli', title: 'Pekmezli Muhallebi', cost: 480, note: 'Keçiboynuzu pekmezli' },
  { id: 'r-kahvalti', title: 'Kahvaltı Tabağı', cost: 875, note: 'İki bardak çay dahil' },
] as const;
