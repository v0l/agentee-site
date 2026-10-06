import type { ComponentChildren } from 'preact';
import { useState } from 'preact/hooks';
import { FormattedMessage, useIntl } from 'react-intl';
import type { Block, Doc } from '../md/types';
import { useLocalePath, useString } from '../i18n/context';

export function useLocalHtml(): (html: string) => string {
  const to = useLocalePath();
  const prefix = to('/').slice(0, -1);
  return html =>
    prefix ? html.replace(/href="\/(?!\/|\.well-known)([^"]*)"/g, (m, path) => (/\.[a-z0-9]+$/i.test(path) ? m : `href="${prefix}/${path}"`)) : html;
}

export function Html({ html, tag = 'span', class: cls }: { html: string; tag?: string; class?: string }) {
  const local = useLocalHtml();
  const Tag = tag as 'span';
  return <Tag class={cls} dangerouslySetInnerHTML={{ __html: local(html) }} />;
}

export function Code(props: { code: string; lang?: string; raw?: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const intl = useIntl();
  const copy = () => {
    const text = props.raw ?? props.code.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <div class="code" data-lang={props.lang || undefined}>
      {props.label ? <p class="code-label">{props.label}</p> : null}
      <button
        type="button"
        class="copy"
        onClick={copy}
        aria-label={intl.formatMessage({ defaultMessage: 'Copy to clipboard' })}
      >
        {copied ? <FormattedMessage defaultMessage="Copied" /> : <FormattedMessage defaultMessage="Copy" />}
      </button>
      <pre>
        <code dangerouslySetInnerHTML={{ __html: props.code }} />
      </pre>
    </div>
  );
}

function BlockView({ block, t }: { block: Block; t: (s: string) => string }) {
  const local = useLocalHtml();
  const html = (s: string) => ({ __html: local(t(s)) });
  switch (block.t) {
    case 'h': {
      const Tag = `h${Math.min(block.level, 4)}` as 'h2';
      return (
        <Tag id={block.id}>
          <a class="anchor" href={`#${block.id}`} aria-hidden="true" tabIndex={-1}>
            #
          </a>
          <span dangerouslySetInnerHTML={html(block.html)} />
        </Tag>
      );
    }
    case 'p':
      return <p dangerouslySetInnerHTML={html(block.html)} />;
    case 'quote':
      return <blockquote dangerouslySetInnerHTML={html(block.html)} />;
    case 'code':
      return <Code code={block.code} lang={block.lang} raw={block.raw} />;
    case 'list': {
      const items = block.items.map((item, i) => <li key={i} dangerouslySetInnerHTML={html(item)} />);
      return block.ordered ? <ol start={block.start}>{items}</ol> : <ul>{items}</ul>;
    }
    case 'table':
      return (
        <div class="table">
          <table>
            <thead>
              <tr>
                {block.head.map((c, i) => (
                  <th key={i} style={block.align[i] ? { textAlign: block.align[i]! } : undefined} dangerouslySetInnerHTML={html(c)} />
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, r) => (
                <tr key={r}>
                  {row.map((c, i) => (
                    <td key={i} style={block.align[i] ? { textAlign: block.align[i]! } : undefined} dangerouslySetInnerHTML={html(c)} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'hr':
      return <hr />;
  }
}

export function DocBody({ doc, translate = true }: { doc: Doc; translate?: boolean }) {
  const string = useString();
  const t = translate ? string : (s: string) => s;
  return (
    <div class="prose">
      {doc.blocks.map((b, i) => (
        <BlockView key={i} block={b} t={t} />
      ))}
    </div>
  );
}

export function Toc({ doc, translate = true }: { doc: Doc; translate?: boolean }) {
  const string = useString();
  const t = translate ? string : (s: string) => s;
  const heads = doc.blocks.filter((b): b is Extract<Block, { t: 'h' }> => b.t === 'h' && b.level === 2);
  if (heads.length < 2) return null;
  return (
    <nav class="toc" aria-labelledby="toc-h">
      <p class="toc-h" id="toc-h">
        <FormattedMessage defaultMessage="On this page" />
      </p>
      <ul>
        {heads.map(h => (
          <li key={h.id}>
            <a href={`#${h.id}`} dangerouslySetInnerHTML={{ __html: t(h.html).replace(/<\/?code>/g, '') }} />
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Crumbs({ trail }: { trail: [ComponentChildren, string][] }) {
  const to = useLocalePath();
  const intl = useIntl();
  return (
    <nav class="crumbs" aria-label={intl.formatMessage({ defaultMessage: 'Breadcrumb' })}>
      {trail.map(([label, href], i) => (
        <>
          {i ? <span key={`s${href}`} aria-hidden="true">/</span> : null}
          <a key={href} href={to(href)}>
            {label}
          </a>
        </>
      ))}
    </nav>
  );
}

export function PageHead(props: {
  trail?: [ComponentChildren, string][];
  kicker?: ComponentChildren;
  title: ComponentChildren;
  lede?: ComponentChildren;
  children?: ComponentChildren;
}) {
  return (
    <section class="page-head">
      <div class="wrap">
        {props.trail ? <Crumbs trail={props.trail} /> : null}
        {props.kicker ? <p class="eyebrow">{props.kicker}</p> : null}
        <h1>{props.title}</h1>
        {props.lede ? <p class="lede">{props.lede}</p> : null}
        {props.children}
      </div>
    </section>
  );
}

export function SideNav<T extends { slug: string; title: string; group: string }>(props: {
  label: string;
  base: string;
  groups: string[];
  items: T[];
  current?: string;
}) {
  const to = useLocalePath();
  const t = useString();
  return (
    <nav class="sidenav" aria-label={props.label}>
      {props.groups.map(g => (
        <div key={g}>
          <p class="sidenav-h">{t(g)}</p>
          <ul>
            {props.items
              .filter(i => i.group === g)
              .map(i => (
                <li key={i.slug}>
                  <a href={to(`${props.base}${i.slug}/`)} aria-current={i.slug === props.current ? 'page' : undefined}>
                    {t(i.title)}
                  </a>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function Pager<T extends { slug: string; title: string }>(props: { base: string; items: T[]; current: string }) {
  const to = useLocalePath();
  const t = useString();
  const i = props.items.findIndex(x => x.slug === props.current);
  const prev = props.items[i - 1];
  const next = props.items[i + 1];
  return (
    <nav class="pager">
      {prev ? (
        <a class="pager-prev" href={to(`${props.base}${prev.slug}/`)}>
          <span>
            <FormattedMessage defaultMessage="Previous" />
          </span>
          {t(prev.title)}
        </a>
      ) : (
        <span />
      )}
      {next ? (
        <a class="pager-next" href={to(`${props.base}${next.slug}/`)}>
          <span>
            <FormattedMessage defaultMessage="Next" />
          </span>
          {t(next.title)}
        </a>
      ) : null}
    </nav>
  );
}
