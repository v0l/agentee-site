import { createContext, type ComponentChildren } from 'preact';
import { useContext } from 'preact/hooks';
import { IntlProvider, type IntlConfig } from 'react-intl';
import { translateCopy, translateString, type Messages } from './copy';
import { DEFAULT_LOCALE, LOCALES, localePath, type Locale } from './locales';

const LocaleContext = createContext<{ locale: Locale; messages: Messages }>({
  locale: DEFAULT_LOCALE,
  messages: {},
});

const richText: IntlConfig['defaultRichTextElements'] = {
  code: chunks => <code>{chunks}</code>,
  strong: chunks => <strong>{chunks}</strong>,
  em: chunks => <em>{chunks}</em>,
};

const onError: IntlConfig['onError'] = e => {
  if (e.code !== 'MISSING_TRANSLATION') console.warn(e.message);
};

export function LocaleProvider(props: { locale: Locale; messages: Messages; children: ComponentChildren }) {
  return (
    <LocaleContext.Provider value={{ locale: props.locale, messages: props.messages }}>
      <IntlProvider
        locale={LOCALES[props.locale].tag}
        defaultLocale={LOCALES[DEFAULT_LOCALE].tag}
        messages={props.messages}
        defaultRichTextElements={richText}
        onError={onError}
      >
        {props.children}
      </IntlProvider>
    </LocaleContext.Provider>
  );
}

export function useLocale(): Locale {
  return useContext(LocaleContext).locale;
}

export function useLocalePath(): (path: string) => string {
  const { locale } = useContext(LocaleContext);
  return path => localePath(locale, path);
}

const translated = new WeakMap<Messages, Map<unknown, unknown>>();

export function useCopy(): <T>(value: T) => T {
  const { messages } = useContext(LocaleContext);
  return <T,>(value: T): T => {
    let cache = translated.get(messages);
    if (!cache) translated.set(messages, (cache = new Map()));
    if (!cache.has(value)) cache.set(value, translateCopy(messages, value));
    return cache.get(value) as T;
  };
}

export function useString(): (english: string) => string {
  const { messages } = useContext(LocaleContext);
  return english => translateString(messages, english);
}
