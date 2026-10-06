import { LocationProvider, Router, Route, useLocation } from 'preact-iso';
import { useEffect, useState } from 'preact/hooks';
import type { ComponentType } from 'preact';
import { FormattedMessage } from 'react-intl';
import { Home } from './pages/home';
import { Download, PlatformPage, SourcePage } from './pages/download';
import { Guides, GuidePage } from './pages/guides';
import { Reference, ReferencePage } from './pages/reference';
import { Cli } from './pages/cli';
import { Mcp } from './pages/mcp';
import { Skills } from './pages/skills';
import { Examples, ExamplePage } from './pages/examples';
import { NotFound } from './pages/not-found';
import { SiteHeader } from './components/header';
import { Footer } from './components/footer';
import { PAGES } from './meta';
import { LocaleProvider, useString } from './i18n/context';
import { LOCALES, LOCALE_CODES, localePath, splitPath, type Locale } from './i18n/locales';
import { loadMessages } from './i18n/messages';
import type { Messages } from './i18n/copy';

const PAGE_ROUTES: [string, ComponentType][] = [
  ['/', Home],
  ['/download', Download],
  ['/download/source', SourcePage],
  ['/download/:id', PlatformPage],
  ['/guides', Guides],
  ['/guides/:id', GuidePage],
  ['/reference', Reference],
  ['/reference/:id', ReferencePage],
  ['/cli', Cli],
  ['/mcp', Mcp],
  ['/skills', Skills],
  ['/examples', Examples],
  ['/examples/:id', ExamplePage],
];

const LOCALIZED_ROUTES = LOCALE_CODES.flatMap(locale =>
  PAGE_ROUTES.map(([path, component]) => ({
    path: localePath(locale, path).replace(/(.)\/$/, '$1'),
    component,
  })),
);

function Title() {
  const { path } = useLocation();
  const t = useString();
  useEffect(() => {
    const page = PAGES[splitPath(path.replace(/(.)\/$/, '$1'))[1]];
    if (page) document.title = t(page.title);
  }, [path, t]);
  return null;
}

function ScrollTop() {
  const { path } = useLocation();
  useEffect(() => {
    if (!location.hash) window.scrollTo(0, 0);
  }, [path]);
  return null;
}

function Localized(props: { locale: Locale; messages: Messages }) {
  const { path } = useLocation();
  const [locale] = splitPath(path);
  const [held, setHeld] = useState(props);

  useEffect(() => {
    if (locale === held.locale) return;
    let current = true;
    loadMessages(locale).then(messages => current && setHeld({ locale, messages }));
    return () => {
      current = false;
    };
  }, [locale]);

  useEffect(() => {
    document.documentElement.lang = LOCALES[held.locale].tag;
  }, [held.locale]);

  return (
    <LocaleProvider locale={held.locale} messages={held.messages}>
      <Title />
      <ScrollTop />
      <a class="skip" href="#main">
        <FormattedMessage defaultMessage="Skip to content" />
      </a>
      <SiteHeader />
      <Router>
        {LOCALIZED_ROUTES.map(r => (
          <Route key={r.path} path={r.path} component={r.component} />
        ))}
        <Route default component={NotFound} />
      </Router>
      <Footer />
    </LocaleProvider>
  );
}

export function App(props: { url?: string; locale: Locale; messages: Messages }) {
  return (
    <LocationProvider {...{ url: props.url }}>
      <Localized locale={props.locale} messages={props.messages} />
    </LocationProvider>
  );
}
