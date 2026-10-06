import { useRoute } from 'preact-iso';
import { FormattedMessage } from 'react-intl';
import { EXAMPLES } from '../content/examples';
import { Html, PageHead } from '../components/doc';
import { useLocalePath, useString } from '../i18n/context';
import { REPO } from '../components/header';
import { NotFound } from './not-found';

import sizes from '../generated/renders.json';
import facts from '../generated/facts.json';

export const render = (name: string) => `/assets/renders/${name}.webp?v=${facts.commit}`;

export function Shot(props: { name: string; alt: string; lazy?: boolean; priority?: boolean }) {
  const [width, height] = (sizes as Record<string, number[]>)[props.name] ?? [1600, 1000];
  return (
    <img
      src={render(props.name)}
      alt={props.alt}
      width={width}
      height={height}
      loading={props.lazy === false ? undefined : 'lazy'}
      {...(props.priority ? { fetchpriority: 'high' } : {})}
    />
  );
}

export function Examples() {
  const to = useLocalePath();
  const t = useString();
  return (
    <main id="main">
      <PageHead
        kicker={<FormattedMessage defaultMessage="Examples" />}
        title={<FormattedMessage defaultMessage="Worked designs" />}
        lede={
          <FormattedMessage defaultMessage="Each example is a directory of TOML in the agentee repository. Clone it, run <code>agentee check</code> and <code>agentee view</code> inside one, and copy its patterns before inventing your own." />
        }
      />
      <div class="wrap">
        <ul class="example-grid">
          {EXAMPLES.map(e => (
            <li key={e.slug} class="example-card">
              <a href={to(`/examples/${e.slug}/`)}>
                <Shot name={e.image} alt={t(e.shots[0].alt)} />
                <span class="silk-label">{e.name}</span>
                <h2>{t(e.title)}</h2>
                <p>{t(e.summary)}</p>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}

export function ExamplePage() {
  const { params } = useRoute();
  const e = EXAMPLES.find(x => x.slug === params.id);
  const t = useString();
  if (!e) return <NotFound />;
  const clone = `git clone https://github.com/v0l/agentee\ncd agentee/${e.dir}\nagentee check\nagentee view`;
  return (
    <main id="main">
      <PageHead
        trail={[[<FormattedMessage defaultMessage="Examples" />, '/examples/']]}
        kicker={e.name}
        title={t(e.title)}
        lede={t(e.summary)}
      />
      <div class="wrap example">
        <figure class="viewer">
          <Shot name={e.shots[0].src} alt={t(e.shots[0].alt)} lazy={false} />
        </figure>
        <div class="example-body">
          <div class="prose">
            {e.body.map(b => (
              <Html key={b} tag="p" html={t(b)} />
            ))}
            <h2>
              <FormattedMessage defaultMessage="Open it" />
            </h2>
            <pre class="code-plain">
              <code>{clone}</code>
            </pre>
            <p>
              <a href={`${REPO}/tree/master/${e.dir}`}>
                <FormattedMessage defaultMessage="Browse the files on GitHub" />
              </a>
            </p>
          </div>
          <aside>
            <dl class="facts">
              {e.facts.map(([k, v]) => (
                <div key={k}>
                  <dt>{t(k)}</dt>
                  <dd>{t(v)}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>
        {e.shots.length > 1 ? (
          <ul class="shots">
            {e.shots.slice(1).map(s => (
              <li key={s.src}>
                <figure class="viewer">
                  <Shot name={s.src} alt={t(s.alt)} />
                  <figcaption>{t(s.alt)}</figcaption>
                </figure>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </main>
  );
}
