import { useLocation } from 'preact-iso';
import { FormattedMessage, useIntl } from 'react-intl';
import { useLocale, useLocalePath } from '../i18n/context';
import { LOCALES, LOCALE_CODES, localePath, splitPath, type Locale } from '../i18n/locales';

export const REPO = 'https://github.com/v0l/agentee';

function LanguagePicker() {
  const { path, route } = useLocation();
  const locale = useLocale();
  const intl = useIntl();
  const change = (next: Locale) => route(localePath(next, splitPath(path)[1]).replace(/\/?$/, '/'));
  return (
    <select
      class="lang"
      value={locale}
      aria-label={intl.formatMessage({ defaultMessage: 'Language' })}
      onChange={e => change(e.currentTarget.value as Locale)}
    >
      {LOCALE_CODES.map(l => (
        <option key={l} value={l} lang={LOCALES[l].tag}>
          {LOCALES[l].name}
        </option>
      ))}
    </select>
  );
}

export function Mark() {
  return (
    <svg class="mark" viewBox="0 0 32 32" aria-hidden="true">
      <path d="M9.5 21.5 L18 13 H24" class="mark-track" />
      <rect x="4.5" y="16.5" width="10" height="10" rx="2.5" class="mark-pad" />
      <circle cx="24" cy="13" r="4" class="mark-pad" />
      <circle cx="24" cy="13" r="1.7" class="mark-hole" />
    </svg>
  );
}

export function SiteHeader() {
  const to = useLocalePath();
  const intl = useIntl();
  const { path } = useLocation();
  const section = splitPath(path)[1].split('/')[1] ?? '';
  const current = (name: string) => (section === name ? 'page' : undefined);
  return (
    <header class="topbar">
      <a class="brand" href={to('/')} aria-label={intl.formatMessage({ defaultMessage: 'agentee home' })}>
        <Mark />
        <span class="wordmark">agentee</span>
      </a>
      <nav class="nav" aria-label={intl.formatMessage({ defaultMessage: 'Primary' })}>
        <a href={to('/guides/')} aria-current={current('guides')}>
          <FormattedMessage defaultMessage="Guides" />
        </a>
        <a href={to('/reference/')} aria-current={current('reference')}>
          <FormattedMessage defaultMessage="Reference" />
        </a>
        <a class="minor" href={to('/examples/')} aria-current={current('examples')}>
          <FormattedMessage defaultMessage="Examples" />
        </a>
        <a class="minor" href={to('/mcp/')} aria-current={current('mcp')}>
          MCP
        </a>
        <a class="minor" href={to('/skills/')} aria-current={current('skills')}>
          <FormattedMessage defaultMessage="Skill" />
        </a>
        <LanguagePicker />
        <a class="pad pad-sm" href={to('/download/')}>
          <FormattedMessage defaultMessage="Install" />
        </a>
      </nav>
    </header>
  );
}
