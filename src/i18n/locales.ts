export const LOCALES = {
  en: { name: 'English', tag: 'en', og: 'en_GB' },
  de: { name: 'Deutsch', tag: 'de', og: 'de_DE' },
  fr: { name: 'Français', tag: 'fr', og: 'fr_FR' },
  es: { name: 'Español', tag: 'es', og: 'es_ES' },
  it: { name: 'Italiano', tag: 'it', og: 'it_IT' },
  pt: { name: 'Português', tag: 'pt', og: 'pt_PT' },
  nl: { name: 'Nederlands', tag: 'nl', og: 'nl_NL' },
  pl: { name: 'Polski', tag: 'pl', og: 'pl_PL' },
  ru: { name: 'Русский', tag: 'ru', og: 'ru_RU' },
  ja: { name: '日本語', tag: 'ja', og: 'ja_JP' },
  zh: { name: '简体中文', tag: 'zh-Hans', og: 'zh_CN' },
} as const;

export type Locale = keyof typeof LOCALES;

export const DEFAULT_LOCALE: Locale = 'en';

export const LOCALE_CODES = Object.keys(LOCALES) as Locale[];

const isLocale = (s: string): s is Locale => s in LOCALES;

export function splitPath(path: string): [Locale, string] {
  const [, first, ...rest] = path.split('/');
  if (first && first !== DEFAULT_LOCALE && isLocale(first)) {
    return [first, `/${rest.join('/')}`];
  }
  return [DEFAULT_LOCALE, path];
}

export function localePath(locale: Locale, path: string): string {
  if (locale === DEFAULT_LOCALE || !path.startsWith('/') || path.startsWith('//')) return path;
  return `/${locale}${path}`;
}
