import { FormattedMessage, useIntl } from 'react-intl';
import { useLocalePath } from '../i18n/context';
import { Mark, REPO } from './header';
import facts from '../generated/facts.json';

export function Footer() {
  const to = useLocalePath();
  const intl = useIntl();
  return (
    <footer class="foot">
      <div class="wrap foot-grid">
        <div class="foot-id">
          <p class="brand">
            <Mark />
            <span class="wordmark">agentee</span>
          </p>
          <p>
            <FormattedMessage defaultMessage="Electronics design for coding agents. GPL-3.0-or-later." />
          </p>
          <p class="silk">
            agentee v{facts.version}-{facts.commit}
          </p>
        </div>
        <nav aria-label={intl.formatMessage({ defaultMessage: 'Learn' })}>
          <p class="foot-h">
            <FormattedMessage defaultMessage="Learn" />
          </p>
          <a href={to('/guides/getting-started/')}>
            <FormattedMessage defaultMessage="Your first board" />
          </a>
          <a href={to('/guides/')}>
            <FormattedMessage defaultMessage="Guides" />
          </a>
          <a href={to('/reference/')}>
            <FormattedMessage defaultMessage="File format reference" />
          </a>
          <a href={to('/examples/')}>
            <FormattedMessage defaultMessage="Examples" />
          </a>
        </nav>
        <nav aria-label={intl.formatMessage({ defaultMessage: 'Use it' })}>
          <p class="foot-h">
            <FormattedMessage defaultMessage="Use it" />
          </p>
          <a href={to('/download/')}>
            <FormattedMessage defaultMessage="Install" />
          </a>
          <a href={to('/cli/')}>
            <FormattedMessage defaultMessage="Command line" />
          </a>
          <a href={to('/mcp/')}>
            <FormattedMessage defaultMessage="MCP server" />
          </a>
          <a href={to('/skills/')}>
            <FormattedMessage defaultMessage="Agent skill" />
          </a>
        </nav>
        <nav aria-label={intl.formatMessage({ defaultMessage: 'For agents' })}>
          <p class="foot-h">
            <FormattedMessage defaultMessage="For agents" />
          </p>
          <a href="/llms.txt">llms.txt</a>
          <a href="/llms-full.txt">llms-full.txt</a>
          <a href="/.well-known/agent-skills/index.json">agent-skills/index.json</a>
          <a href="/sitemap.xml">sitemap.xml</a>
        </nav>
        <nav aria-label={intl.formatMessage({ defaultMessage: 'Project' })}>
          <p class="foot-h">
            <FormattedMessage defaultMessage="Project" />
          </p>
          <a href={REPO}>
            <FormattedMessage defaultMessage="Source code" />
          </a>
          <a href={`${REPO}/releases`}>
            <FormattedMessage defaultMessage="Releases" />
          </a>
          <a href={`${REPO}/issues`}>
            <FormattedMessage defaultMessage="Issues" />
          </a>
          <a href="https://github.com/sponsors/v0l">
            <FormattedMessage defaultMessage="Sponsor" />
          </a>
        </nav>
      </div>
    </footer>
  );
}
