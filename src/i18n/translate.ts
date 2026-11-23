import type { Lang } from './lang';
import { en, ru, tr, type StringKey } from './strings';

export const dicts = { tr, en, ru } as const;

/** Store gibi React dışı yerlerde de kullanılabilen çeviri fonksiyonu. */
export function translate(lang: Lang, key: StringKey, params?: Record<string, string | number>) {
  let s: string = dicts[lang][key] ?? tr[key] ?? key;
  if (params) for (const [k, v] of Object.entries(params)) s = s.split(`{${k}}`).join(String(v));
  return s;
}
