import { useEffect, useState } from 'preact/hooks';
import { useRoute } from 'preact-iso';
import { FormattedDate, FormattedMessage } from 'react-intl';
import { PLATFORMS, REPO, asset, latestUrl } from '../content/platforms';
import { docView } from '../content/docs';
import { Code, DocBody, Html, PageHead, Toc } from '../components/doc';
import { useLocalePath, useString } from '../i18n/context';
import { highlight } from '../md/highlight';
import { NotFound } from './not-found';
import facts from '../generated/facts.json';

type Release = { tag: string; published: Date } | 'none' | null;

function useRelease(): Release {
  const [release, setRelease] = useState<Release>(null);
  useEffect(() => {
    let live = true;
    fetch('https://api.github.com/repos/v0l/agentee/releases/latest', {
      headers: { Accept: 'application/vnd.github+json' },
    })
      .then(r => (r.status === 404 ? 'none' : r.ok ? r.json() : null))
      .then(rel => {
        if (!live || !rel) return;
        setRelease(rel === 'none' ? 'none' : { tag: rel.tag_name, published: new Date(rel.published_at) });
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  return release;
}

const sh = (code: string) => highlight(code, 'sh');

const CARGO = 'cargo install --git https://github.com/v0l/agentee agentee';

function ReleaseLine({ release }: { release: Release }) {
  if (release && release !== 'none') {
    return (
      <>
        <FormattedMessage defaultMessage="Latest release {tag}" values={{ tag: release.tag }} />
        {' · '}
        <FormattedDate value={release.published} year="numeric" month="short" day="numeric" />
      </>
    );
  }
  return <FormattedMessage defaultMessage="Version {version}" values={{ version: facts.version }} />;
}

function NoRelease() {
  const to = useLocalePath();
  return (
    <div class="notice">
      <p>
        <FormattedMessage defaultMessage="There is no binary release on GitHub yet, so the install scripts and download links below will fail until the first one is tagged. Build it from source in the meantime:" />
      </p>
      <Code code={sh(CARGO)} lang="sh" raw={CARGO} />
      <p>
        <a href={to('/download/source/')}>
          <FormattedMessage defaultMessage="Building from source" />
        </a>
      </p>
    </div>
  );
}

export function Download() {
  const release = useRelease();
  const to = useLocalePath();
  return (
    <main id="main">
      <PageHead
        kicker={<ReleaseLine release={release} />}
        title={<FormattedMessage defaultMessage="Install agentee" />}
        lede={
          <FormattedMessage defaultMessage="One binary with the CLI, the viewer and the MCP server in it. No account, no service, nothing to keep running." />
        }
      />
      <div class="wrap">
        {release === 'none' ? <NoRelease /> : null}
        <ul class="platforms">
          {PLATFORMS.map(p => (
            <li key={p.slug} class="platform">
              <h2>{p.name}</h2>
              <Code code={sh(p.install)} lang="sh" raw={p.install} />
              <p class="platform-files">
                {p.builds.map((b, i) => (
                  <>
                    {i ? ' · ' : null}
                    <a key={b.asset} href={latestUrl(asset(b.asset))}>
                      {b.label}
                    </a>
                  </>
                ))}
              </p>
              <a class="pad pad-ghost" href={to(`/download/${p.slug}/`)}>
                <FormattedMessage defaultMessage="Setup on {platform}" values={{ platform: p.name }} />
              </a>
            </li>
          ))}
          <li class="platform">
            <h2>
              <FormattedMessage defaultMessage="From source" />
            </h2>
            <Code code={sh(CARGO)} lang="sh" raw={CARGO} />
            <p class="platform-files">
              <FormattedMessage defaultMessage="Any platform with Rust {rust} or newer." values={{ rust: '1.92' }} />
            </p>
            <a class="pad pad-ghost" href={to('/download/source/')}>
              <FormattedMessage defaultMessage="Building from source" />
            </a>
          </li>
        </ul>

        <section class="after-install">
          <h2>
            <FormattedMessage defaultMessage="Then" />
          </h2>
          <ol class="steps">
            <li>
              <h3>
                <FormattedMessage defaultMessage="Give your agent the skill" />
              </h3>
              <Code code={sh('npx skills add https://agentee.sh')} lang="sh" raw="npx skills add https://agentee.sh" />
              <p>
                <a href={to('/guides/agents/')}>
                  <FormattedMessage defaultMessage="Agent setup, MCP included" />
                </a>
              </p>
            </li>
            <li>
              <h3>
                <FormattedMessage defaultMessage="Install the KiCad libraries" />
              </h3>
              <p>
                <FormattedMessage defaultMessage="Parts are imported from the KiCad symbol and footprint libraries, so agentee needs them on disk. KiCad itself is optional on Linux." />
              </p>
            </li>
            <li>
              <h3>
                <FormattedMessage defaultMessage="Build your first board" />
              </h3>
              <p>
                <a href={to('/guides/getting-started/')}>
                  <FormattedMessage defaultMessage="From an empty directory to Gerbers" />
                </a>
              </p>
            </li>
          </ol>
          <p class="fine">
            <FormattedMessage
              defaultMessage="Release archives also carry the README, the licence and the skill. Checksums sit beside each archive on the <a>releases page</a>."
              values={{ a: (chunks: preact.ComponentChildren) => <a href={`${REPO}/releases`}>{chunks}</a> }}
            />
          </p>
        </section>
      </div>
    </main>
  );
}

export function PlatformPage() {
  const { params } = useRoute();
  const p = PLATFORMS.find(x => x.slug === params.id);
  const t = useString();
  const to = useLocalePath();
  const release = useRelease();
  if (!p) return <NotFound />;
  return (
    <main id="main">
      <PageHead
        trail={[[<FormattedMessage defaultMessage="Install" />, '/download/']]}
        kicker={<ReleaseLine release={release} />}
        title={<FormattedMessage defaultMessage="agentee on {platform}" values={{ platform: p.name }} />}
        lede={t(p.summary)}
      />
      <div class="wrap narrow prose">
        {release === 'none' ? <NoRelease /> : null}
        <h2>
          <FormattedMessage defaultMessage="Install" />
        </h2>
        <Code code={sh(p.install)} lang="sh" raw={p.install} />
        <p>
          <FormattedMessage defaultMessage="Or download the archive for your machine and put the binary on your PATH:" />
        </p>
        <ul>
          {p.builds.map(b => (
            <li key={b.asset}>
              <a href={latestUrl(asset(b.asset))}>{asset(b.asset)}</a> ({b.label})
            </li>
          ))}
        </ul>
        <p>
          <FormattedMessage defaultMessage="Check that it runs:" />
        </p>
        <Code code={sh('agentee --version')} lang="sh" raw="agentee --version" />

        <h2>
          <FormattedMessage defaultMessage="What it needs" />
        </h2>
        <ul>
          {p.needs.map(n => (
            <li key={n}>
              <Html html={t(n)} />
            </li>
          ))}
        </ul>

        <h2>
          <FormattedMessage defaultMessage="KiCad libraries" />
        </h2>
        <p>
          <Html html={t(p.libraries)} />
        </p>
        <Code code={highlight(p.librariesCode, 'sh')} lang="sh" raw={p.librariesCode} />
        {p.notes.map(n => (
          <p key={n}>
            <Html html={t(n)} />
          </p>
        ))}
        <p>
          <FormattedMessage defaultMessage="See what it found:" />
        </p>
        <Code code={sh('agentee search symbol lm358')} lang="sh" raw="agentee search symbol lm358" />

        <h2>
          <FormattedMessage defaultMessage="Next" />
        </h2>
        <p>
          <a href={to('/guides/agents/')}>
            <FormattedMessage defaultMessage="Set up your coding agent" />
          </a>
          {' · '}
          <a href={to('/guides/getting-started/')}>
            <FormattedMessage defaultMessage="Your first board" />
          </a>
        </p>
      </div>
    </main>
  );
}

export function SourcePage() {
  const View = docView('pages', 'source');
  if (!View) return <NotFound />;
  return (
    <main id="main">
      <PageHead
        trail={[[<FormattedMessage defaultMessage="Install" />, '/download/']]}
        kicker="cargo"
        title={<FormattedMessage defaultMessage="Building from source" />}
        lede={
          <FormattedMessage defaultMessage="agentee is a Rust workspace with no system libraries to install. Any machine with a current Rust toolchain builds it." />
        }
      />
      <div class="wrap doc-grid doc-grid-2">
        <View
          render={doc => (
            <>
              <article class="doc">
                <DocBody doc={doc} />
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
