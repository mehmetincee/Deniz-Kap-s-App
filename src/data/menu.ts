import { ordering, serviceHours } from '../config/restaurant';
import type { Lang } from '../i18n/lang';
import generated from './menu.generated.json';
import { allergenI18n, en as enItems, optionNames, ru as ruItems, sectionTitles } from './menu.i18n';

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
  [/çipura|levrek|somon|balığı/i, 'fish'],
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
      // QR menüde bazı ürünlerde İngilizce ad yerine porsiyon notu yazılmış: "(4 parça / pieces)"
      if (p.nameEn?.startsWith('(')) {
        out.description = [p.nameEn, p.description].filter(Boolean).join(' ');
        out.nameEn = null;
      }
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

/** Ürünün ait olduğu servis (id öneki: kahvalti-, oglen-, aksam-, tatli-, icecek-, cocuk-). */
export function serviceOf(productId: string) {
  const prefix = productId.split('-')[0];
  // Çocuk menüsü öğle menüsünün içinde yer alır
  return prefix === 'cocuk' ? 'oglen' : prefix;
}

/** Bu menü uygulamadan sipariş edilebiliyor mu? (Pilot: yalnızca öğle + içecek.) */
export function isOrderableService(serviceId: string) {
  return ordering.services.includes(serviceId);
}

const minutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/** Şu an mutfak sipariş alıyor mu? */
export function kitchenOpen(date = new Date()) {
  const now = date.getHours() * 60 + date.getMinutes();
  return now >= minutes(serviceHours.kitchen.from) && now < minutes(serviceHours.kitchen.to);
}

/**
 * Ürün şu an (veya verilen saatte) sipariş edilebilir mi?
 * Dönüş: null → edilebilir; metin → neden edilemediği.
 */
export function orderBlockReason(productId: string, date = new Date()): string | null {
  const service = serviceOf(productId);
  if (!isOrderableService(service)) {
    return `Şimdilik ${ordering.areaName.toLocaleLowerCase('tr-TR')}dan yalnızca öğle menüsü ve içecekler sipariş edilebiliyor. Bu ürün için garsonumuza seslenebilirsiniz.`;
  }
  const nowMin = date.getHours() * 60 + date.getMinutes();
  if (nowMin < minutes(ordering.hours.from) || nowMin >= minutes(ordering.hours.to)) {
    return `${ordering.areaName} servisi ${ordering.hours.from}–${ordering.hours.to} arası sipariş alıyor.`;
  }
  if (!kitchenOpen(date)) {
    return `Mutfağımız ${serviceHours.kitchen.from}–${serviceHours.kitchen.to} arası sipariş alıyor.`;
  }
  const w = serviceHours[serviceOf(productId) as keyof typeof serviceHours];
  if (!w) return null;
  const now = date.getHours() * 60 + date.getMinutes();
  if (now < minutes(w.from) || now >= minutes(w.to)) {
    const title = services.find((s) => s.id === serviceOf(productId))?.title ?? 'Bu';
    return `${title} menüsü ${w.from}–${w.to} arası servis ediliyor.`;
  }
  return null;
}

/** Saate göre o an servis edilen menü. */
export function currentServiceId(date = new Date()): string {
  const now = date.getHours() * 60 + date.getMinutes();
  for (const id of ['kahvalti', 'oglen', 'aksam'] as const) {
    if (now >= minutes(serviceHours[id].from) && now < minutes(serviceHours[id].to)) return id;
  }
  return now < minutes(serviceHours.kahvalti.from) ? 'kahvalti' : 'aksam';
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

/* ------------------------------------------------------------- ÇEVİRİ --- */

/**
 * Ürünün seçili dildeki görünümü.
 * - title: büyük ad; alt: küçük italik ikinci ad (TR'de İngilizce ad, diğer dillerde yemeğin Türkçe özgün adı)
 */
export function localize(p: Product, lang: Lang) {
  const enName = enItems[p.id]?.[0] ?? (p.nameEn && !p.nameEn.includes(',') ? p.nameEn : undefined);
  const enDesc = enItems[p.id]?.[1] ?? p.descriptionEn;
  if (lang === 'tr') return { title: p.name, alt: enName && enName !== p.name ? enName : undefined, description: p.description };
  const title = (lang === 'ru' ? ruItems[p.id]?.[0] : undefined) ?? enName ?? p.name;
  const description = (lang === 'ru' ? ruItems[p.id]?.[1] : undefined) ?? enDesc ?? p.description;
  return { title, alt: title !== p.name ? p.name : undefined, description };
}

export function localizeOption(name: string, lang: Lang) {
  return lang === 'tr' ? name : (optionNames[name]?.[lang] ?? name);
}

export function localizeSection(sec: { id: string; title: string; titleEn?: string }, lang: Lang) {
  if (lang === 'tr') return { title: sec.title, alt: sec.id === 'cocuk' ? sec.titleEn : undefined };
  return { title: sectionTitles[sec.id]?.[lang] ?? sec.titleEn ?? sec.title, alt: undefined };
}

export function allergenName(code: AllergenCode, lang: Lang) {
  return lang === 'tr' ? allergenNames[code] : allergenI18n[code][lang];
}
