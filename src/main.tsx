import { hydrate, prerender as ssr } from 'preact-iso';
import { App } from './app';
import { headFor, SITE } from './meta';
import { splitPath } from './i18n/locales';
import { loadMessages } from './i18n/messages';
import './site.css';

if (typeof window !== 'undefined') {
  const [locale] = splitPath(location.pathname);
  loadMessages(locale).then(messages =>
    hydrate(<App locale={locale} messages={messages} />, document.getElementById('app')!),
  );
}

export async function prerender(data: { url: string }) {
  const path = new URL(data.url, SITE).pathname.replace(/\/$/, '') || '/';
  const [locale] = splitPath(path);
  const messages = await loadMessages(locale);
  const { html, links } = await ssr(<App url={data.url} locale={locale} messages={messages} />);
  const pages = new Set([...(links ?? [])].filter(l => !/\.(md|txt|json|xml|sh|ps1)$/.test(l) && !l.includes('/.well-known/')));
  return { html, links: pages, head: headFor(path, messages) };
}
