/** Dil türü ve cihaz dili — store ile i18n arasında döngüsel içe aktarma olmaması için ayrı dosya. */
export type Lang = 'tr' | 'en' | 'ru';
export const languages: Lang[] = ['tr', 'en', 'ru'];

/** Tarih/sayı biçimi için yerel ayar. */
export const localeOf = (lang: Lang) => ({ tr: 'tr-TR', en: 'en-GB', ru: 'ru-RU' })[lang];

/** İlk açılış dili: cihaz Türkçe/Rusça değilse İngilizce (turist misafirler). */
export function deviceLang(): Lang {
  try {
    const l = Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase();
    if (l.startsWith('tr')) return 'tr';
    if (['ru', 'uk', 'be', 'kk'].some((p) => l.startsWith(p))) return 'ru';
    return 'en';
  } catch {
    return 'tr';
  }
}
