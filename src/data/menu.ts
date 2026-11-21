import generated from './menu.generated.json';

export type AllergenCode =
  | 'WH' | 'EG' | 'PN' | 'CY' | 'LP' | 'SE' | 'SP' | 'CS' | 'SY' | 'MD' | 'MK' | 'FH' | 'TN' | 'MS';

export const allergenNames: Record<AllergenCode, string> = {
  WH: 'Gluten', EG: 'Yumurta', PN: 'Yer fıstığı', CY: 'Kereviz', LP: 'Acı bakla', SE: 'Susam',
  SP: 'Sülfit', CS: 'Kabuklular', SY: 'Soya', MD: 'Hardal', MK: 'Süt', FH: 'Balık',
  TN: 'Kuruyemiş', MS: 'Yumuşakçalar',
};

export type ProductOption = { id: string; name: string; price: number };

export type Product = {
  id: string;
  name: string;
  nameEn?: string | null;
  description?: string;
  descriptionEn?: string;
  price: number;
  allergens: AllergenCode[];
  options?: ProductOption[];
  /** Seçenek grubu başlığı (ör. "Sos seçimi"). */
  optionsTitle?: string;
  image?: number;
  /** Fiyatı güne göre değişen, uygulamadan sipariş edilemeyen ürünler. */
  askWaiter?: boolean;
};

export type MenuSection = { id: string; title: string; titleEn?: string; items: Product[] };
export type Service = { id: string; title: string; hours: string; sections: MenuSection[] };

const images: Record<string, number> = {
  burger: require('../../assets/images/burger.jpg'),
  eggs: require('../../assets/images/eggs.jpg'),
  fish: require('../../assets/images/fish.jpg'),
  mezze: require('../../assets/images/mezze.jpg'),
  bread: require('../../assets/images/bread.jpg'),
  pumpkin: require('../../assets/images/pumpkin.jpg'),
  pepper: require('../../assets/images/pepper.jpg'),
};

/** Ürün adına göre fotoğraf eşleştirmesi. Yeni çekimler geldikçe genişletilmeli. */
const imageByName: [RegExp, keyof typeof images][] = [
  [/burger/i, 'burger'],
  [/sahanda yumurta|menemen|omlet/i, 'eggs'],
  [/çipura|levrek|somon|balı/i, 'fish'],
  [/meze|serpme|kahvaltı tabağı|^tabak$/i, 'mezze'],
  [/börek|bazlama|ekmek|tost/i, 'bread'],
  [/^kabak$/i, 'pumpkin'],
  [/kale biberi|atom|acı/i, 'pepper'],
];

const titleFixes: Record<string, string> = {
  'Iki Dilim Arasında': 'İki Dilim Arasında',
  'Ekmek & Hamur Işleri': 'Ekmek & Hamur İşleri',
  'Soğuk Içecekler': 'Soğuk İçecekler',
  'Sağlikli & Taze': 'Sağlıklı & Taze',
  'Sicak Başlangiç': 'Sıcak Başlangıç',
};

const kidsSection: MenuSection = {
  id: 'cocuk',
  title: 'Çocuk Menüsü',
  titleEn: '11 yaş ve altı',
  items: [
    { id: 'cocuk-kofte', name: 'Izgara Köfte', description: 'Kaşık patates ve pilav', price: 580, allergens: ['WH'] },
    { id: 'cocuk-nugget', name: 'Ev Yapımı Nugget', description: 'Kaşık patates ve ev yapımı ketçap', price: 490, allergens: ['WH', 'EG'] },
    { id: 'cocuk-burger', name: 'Burger', description: 'Cheddar peynirli burger ve kaşık patates', price: 600, allergens: ['WH', 'MK'] },
    { id: 'cocuk-schnitzel', name: 'Tavuk Schnitzel', description: 'Kaşık patates ve ev yapımı ketçap', price: 520, allergens: ['WH', 'EG'] },
  ],
};

const fishOfDay: Product = {
  id: 'aksam-gunun-baligi',
  name: 'Günün Mevsim Balığı',
  nameEn: 'Fresh Seasonal Fish',
  description:
    'Deniz levreği, kaya levreği, orfoz, lagos, mercan, barbun, palamut, kılıç, kalkan. Izgara, buğulama, tuzda, kağıtta, tava veya kızartma. Kg fiyatı için lütfen garsonunuza sorun.',
  price: 2500,
  allergens: ['FH'],
  askWaiter: true,
};

const sauces: ProductOption[] = [
  { id: 'karabiber', name: 'Tane karabiber sosu', price: 1750 },
  { id: 'bearnaise', name: 'Ballı & adaçaylı Béarnaise', price: 1750 },
  { id: 'demi-glace', name: 'Demi-Glace', price: 1750 },
  { id: 'mantar', name: 'Yabani mantar sos', price: 1750 },
];

function enhance(service: Service): Service {
  const sections = service.sections.map((s) => ({
    ...s,
    title: titleFixes[s.title] ?? s.title,
    items: s.items.map((p) => {
      const imageKey = imageByName.find(([re]) => re.test(p.name))?.[1];
      const out: Product = { ...p, image: imageKey ? images[imageKey] : undefined };
      if (p.name.startsWith('Dana Bonfile')) {
        out.options = sauces;
        out.optionsTitle = 'Sos seçimi';
      }
      if (p.options && !out.optionsTitle) out.optionsTitle = 'Seçiminiz';
      return out;
    }),
  }));
  if (service.id === 'aksam') {
    const sea = sections.find((s) => s.title === 'Denizden');
    sea?.items.push(fishOfDay);
  }
  if (service.id === 'oglen') sections.push(kidsSection);
  return { ...service, sections };
}

export const services: Service[] = (generated as unknown as Service[]).map(enhance);

const index = new Map<string, Product>();
for (const s of services) for (const sec of s.sections) for (const p of sec.items) index.set(p.id, p);

export function getProduct(id: string): Product | undefined {
  return index.get(id);
}

/** Saate göre o an servis edilen menü. */
export function currentServiceId(date = new Date()): string {
  const h = date.getHours();
  if (h >= 9 && h < 12) return 'kahvalti';
  if (h >= 12 && h < 18) return 'oglen';
  return 'aksam';
}

/** Ana sayfada öne çıkan ürünler (şefin seçimi) — ada göre eşleşir. */
const featuredNames = ['Reçelli Burger', 'Sakızdırık Kebabı', 'Serpme (kişi başı)', 'Kabak', 'Vişneli Yaprak Sarma', 'Ahtapot Izgara'];

export function featured(): Product[] {
  const all = [...index.values()];
  return featuredNames.map((n) => all.find((p) => p.name === n)).filter(Boolean) as Product[];
}

export function formatPrice(v: number): string {
  return `₺${v.toLocaleString('tr-TR')}`;
}
