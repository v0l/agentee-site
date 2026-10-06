import { useRoute } from 'preact-iso';
import { FormattedMessage, useIntl } from 'react-intl';
import { REFERENCE, REFERENCE_GROUPS } from '../content/reference';
import { docView } from '../content/docs';
import { Code, Crumbs, DocBody, PageHead, Pager, SideNav, Toc } from '../components/doc';
import { useLocalePath, useString } from '../i18n/context';
import { NotFound } from './not-found';
import { REPO } from '../components/header';

export function Reference() {
  const to = useLocalePath();
  const t = useString();
  return (
    <main id="main">
      <PageHead
        kicker={<FormattedMessage defaultMessage="Reference" />}
        title={<FormattedMessage defaultMessage="File format reference" />}
        lede={
          <FormattedMessage defaultMessage="Every key of every file, split by topic. It is the same text <code>agentee docs</code> prints and the MCP server returns as <code>format_reference</code>, so an agent offline reads exactly this." />
        }
      >
        <Code code={'<span class="tk-cmd">agentee</span> docs <span class="tk-p">|</span> less'} lang="sh" raw="agentee docs | less" />
      </PageHead>
      <div class="wrap index-groups">
        {REFERENCE_GROUPS.map(group => (
          <section key={group} class="index-group">
            <h2 class="silk-h">{t(group)}</h2>
            <ul class="cards cards-tight">
              {REFERENCE.filter(r => r.group === group).map(r => (
                <li key={r.slug} class="card">
                  <a href={to(`/reference/${r.slug}/`)}>
                    <h3>{t(r.title)}</h3>
                    <p>{t(r.summary)}</p>
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

export function ReferencePage() {
  const { params } = useRoute();
  const page = REFERENCE.find(r => r.slug === params.id);
  const View = page ? docView('reference', page.slug) : null;
  const t = useString();
  const intl = useIntl();
  if (!page || !View) return <NotFound />;
  return (
    <main id="main" class="doc-page">
      <div class="wrap doc-grid">
        <SideNav
          label={intl.formatMessage({ defaultMessage: 'Reference' })}
          base="/reference/"
          groups={REFERENCE_GROUPS}
          items={REFERENCE}
          current={page.slug}
        />
        <View
          render={doc => (
            <>
              <article class="doc">
                <Crumbs trail={[[<FormattedMessage defaultMessage="Reference" />, '/reference/']]} />
                <p class="eyebrow">{t(page.group)}</p>
                <h1>{t(page.title)}</h1>
                <p class="lede">{t(page.summary)}</p>
                <DocBody doc={doc} />
                <p class="doc-source">
                  <a href={`${REPO}/blob/master/docs/format.md`}>docs/format.md</a>
                  {' · '}
                  <a href={`/reference/${page.slug}/index.html.md`}>
                    <FormattedMessage defaultMessage="Markdown for agents" />
                  </a>
                </p>
                <Pager base="/reference/" items={REFERENCE} current={page.slug} />
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
