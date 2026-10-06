import type { Messages } from './copy';
import { DEFAULT_LOCALE, type Locale } from './locales';

type Source = Record<string, { defaultMessage: string }>;

const files = import.meta.glob<Source>('../locales/*.json', { import: 'default' });

export async function loadMessages(locale: Locale): Promise<Messages> {
  const load = files[`../locales/${locale}.json`];
  if (locale === DEFAULT_LOCALE || !load) return {};
  const source = await load();
  return Object.fromEntries(Object.entries(source).map(([id, m]) => [id, m.defaultMessage]));
}
