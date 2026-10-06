import { useRoute } from 'preact-iso';
import { FormattedMessage, useIntl } from 'react-intl';
import { GUIDES, GUIDE_GROUPS } from '../content/guides';
import { docView } from '../content/docs';
import { Crumbs, DocBody, PageHead, Pager, SideNav, Toc } from '../components/doc';
import { useLocalePath, useString } from '../i18n/context';
import { NotFound } from './not-found';

const SITE_REPO = 'https://github.com/v0l/agentee-site';

export function Guides() {
  const to = useLocalePath();
  const t = useString();
  return (
    <main id="main">
      <PageHead
        kicker={<FormattedMessage defaultMessage="Guides" />}
        title={<FormattedMessage defaultMessage="Designing with agentee" />}
        lede={
          <FormattedMessage defaultMessage="One guide per stage of a design, in the order you meet them. Each one is written for the person directing the agent and for the agent itself: every command is real and every key is in the reference." />
        }
      />
      <div class="wrap index-groups">
        {GUIDE_GROUPS.map(group => (
          <section key={group} class="index-group">
            <h2 class="silk-h">{t(group)}</h2>
            <ul class="cards">
              {GUIDES.filter(g => g.group === group).map(g => (
                <li key={g.slug} class="card">
                  <a href={to(`/guides/${g.slug}/`)}>
                    <h3>{t(g.title)}</h3>
                    <p>{t(g.summary)}</p>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}

export function GuidePage() {
  const { params } = useRoute();
  const guide = GUIDES.find(g => g.slug === params.id);
  const View = guide ? docView('guides', guide.slug) : null;
  const t = useString();
  const intl = useIntl();
  if (!guide || !View) return <NotFound />;
  return (
    <main id="main" class="doc-page">
      <div class="wrap doc-grid">
        <SideNav
          label={intl.formatMessage({ defaultMessage: 'Guides' })}
          base="/guides/"
          groups={GUIDE_GROUPS}
          items={GUIDES}
          current={guide.slug}
        />
        <View
          render={doc => (
            <>
              <article class="doc">
                <Crumbs trail={[[<FormattedMessage defaultMessage="Guides" />, '/guides/']]} />
                <p class="eyebrow">{t(guide.group)}</p>
                <h1>{t(guide.title)}</h1>
                <p class="lede">{t(guide.summary)}</p>
                <DocBody doc={doc} />
                <p class="doc-source">
                  <a href={`${SITE_REPO}/blob/master/content/guides/${guide.slug}.md`}>
                    <FormattedMessage defaultMessage="Improve this guide" />
                  </a>
                  {' · '}
                  <a href={`/guides/${guide.slug}/index.html.md`}>
                    <FormattedMessage defaultMessage="Markdown for agents" />
                  </a>
                </p>
                <Pager base="/guides/" items={GUIDES} current={guide.slug} />
              </article>
              <aside class="doc-aside">
                <Toc doc={doc} />
              </aside>
            </>
          )}
        />
      </div>
    </main>
  );
}
