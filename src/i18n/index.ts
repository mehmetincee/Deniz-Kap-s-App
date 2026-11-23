import { useCallback } from 'react';

import { useStore } from '../store';
import { localeOf, type Lang } from './lang';
import type { StringKey } from './strings';
import { dicts, translate } from './translate';

export { deviceLang, languages, localeOf, type Lang } from './lang';
export { translate } from './translate';
export type { StringKey };

/** Bileşenlerde: const { t, lang, locale } = useT(); */
export function useT() {
  const lang = useStore((s) => s.lang);
  const t = useCallback((key: StringKey, params?: Record<string, string | number>) => translate(lang, key, params), [lang]);
  return { t, lang, locale: localeOf(lang) };
}

/** "14 Haziran" biçiminde gün + ay (doğum günü için; yıl yok). */
export function dayMonth(lang: Lang, day: number, month: number) {
  return `${day} ${dicts[lang].months.split(',')[month - 1]}`;
}

/** Yüzde: Türkçede işaret başta (%5), İngilizce ve Rusçada sonda (5%). */
export function pct(rate: number, lang: Lang) {
  const n = Math.round(rate * 100);
  return lang === 'tr' ? `%${n}` : `${n}%`;
}
