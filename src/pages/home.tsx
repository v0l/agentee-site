import { FormattedMessage } from 'react-intl';
import { Code, Html } from '../components/doc';
import { highlight } from '../md/highlight';
import { useLocalePath, useString } from '../i18n/context';
import { FAB_FILES, FILES, KNOWS, LOOP, SIMS, SIM_KINDS } from '../content/home';
import { EXAMPLES } from '../content/examples';
import { Shot } from './examples';
import { MCP_CLIENTS } from './mcp';
import facts from '../generated/facts.json';

const INSTALL = 'curl -fsSL https://agentee.sh/install.sh | sh';
const SKILL = 'npx skills add https://agentee.sh';

type Line = { kind: 'cmd' | 'out' | 'err' | 'ok'; text: string };

const SESSION: Line[] = [
  { kind: 'cmd', text: 'agentee edit board lna class RF --track-width 0.2mm' },
  { kind: 'out', text: 'netclass RF' },
  {
    kind: 'err',
    text: 'error: lna.board.toml: lna netclass RF on F.Cu: field solver gives 59.4 ohm with solder mask, outside 50ohm +/- 5%, use track_width = "0.2985mm" (50.2 ohm)',
  },
  { kind: 'cmd', text: 'agentee edit board lna class RF --track-width 0.3mm' },
  { kind: 'ok', text: 'wrote 1 files, nothing flagged in them' },
  { kind: 'cmd', text: 'agentee check' },
  { kind: 'ok', text: '5 sims, 1 layouts, 1 schematics, 1 boards, 10 symbols, 11 footprints: 0 errors, 3 warnings' },
  { kind: 'cmd', text: 'agentee render pcb:lna -o lna.png' },
];

function Session() {
  let delay = 0.4;
  return (
    <div class="session" aria-hidden="true">
      <div class="term">
        <p class="term-bar">
          <span>agent</span> ~/lna
        </p>
        <pre>
          {SESSION.map((line, i) => {
            delay += line.kind === 'cmd' ? 0.9 : 0.35;
            const style = { '--d': `${delay}s` } as Record<string, string>;
            return line.kind === 'cmd' ? (
              <span key={i} class="ln ln-cmd" style={style} dangerouslySetInnerHTML={{ __html: `<span class="tk-p">$</span> ${highlight(line.text, 'sh')}` }} />
            ) : (
              <span key={i} class={`ln ln-${line.kind}`} style={style}>
                {line.text}
              </span>
            );
          })}
        </pre>
      </div>
      <figure class="board-pane" style={{ '--d': `${delay + 0.6}s` } as Record<string, string>}>
        <Shot name="lna-pcb" alt="" lazy={false} priority />
        <figcaption>lna.png</figcaption>
      </figure>
    </div>
  );
}

export function Home() {
  const to = useLocalePath();
  const t = useString();
  return (
    <main id="main" class="home">
      <section class="hero">
        <div class="wrap hero-grid">
          <div class="hero-copy">
            <p class="eyebrow">
              <FormattedMessage defaultMessage="Electronics design for coding agents" />
            </p>
            <h1>
              <FormattedMessage defaultMessage="PCB design as text your agent can edit" />
            </h1>
            <p class="lede">
              <FormattedMessage defaultMessage="Schematics, layouts and simulations are plain TOML files. agentee checks every edit against your fab’s rules and says what to change, draws the board, solves impedance, runs FDTD and thermal sims on the GPU, and writes the Gerbers." />
            </p>
            <div class="cta">
              <a class="pad" href={to('/download/')}>
                <FormattedMessage defaultMessage="Install" />
              </a>
              <a class="pad pad-ghost" href={to('/guides/getting-started/')}>
                <FormattedMessage defaultMessage="Your first board" />
              </a>
            </div>
            <Code code={highlight(INSTALL, 'sh')} lang="sh" raw={INSTALL} />
          </div>
          <Session />
        </div>
      </section>

      <section class="band">
        <div class="wrap">
          <h2 class="section-h">
            <FormattedMessage defaultMessage="Every change goes round the same loop" />
          </h2>
          <p class="section-lede">
            <FormattedMessage defaultMessage="There is no editor state to keep in sync. The files are the design, so the agent works on them with the tools it already has, and agentee answers in a form it can act on." />
          </p>
          <ol class="loop">
            {LOOP.map(step => (
              <li key={step.verb}>
                <h3>{t(step.verb)}</h3>
                <Html tag="p" html={t(step.body)} />
                <code class="loop-cmd">{step.code}</code>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section class="band band-alt">
        <div class="wrap">
          <h2 class="section-h">
            <FormattedMessage defaultMessage="A project is a directory of TOML" />
          </h2>
          <p class="section-lede">
            <FormattedMessage defaultMessage="Six kinds of file, loaded by suffix. Unknown keys are errors, so a typo is reported rather than ignored. Bare numbers are millimetres; anything else carries its unit." />
          </p>
          <ul class="files">
            {FILES.map(f => (
              <li key={f.suffix}>
                <p class="silk-label">{f.suffix}</p>
                <p>{t(f.body)}</p>
                <pre class="file-code">
                  <code dangerouslySetInnerHTML={{ __html: highlight(f.code, 'toml') }} />
                </pre>
              </li>
            ))}
          </ul>
          <p class="more">
            <a href={to('/reference/')}>
              <FormattedMessage defaultMessage="Every key, in the reference" />
            </a>
          </p>
        </div>
      </section>

      <section class="band">
        <div class="wrap split">
          <div>
            <h2 class="section-h">
              <FormattedMessage defaultMessage="Check knows the fab" />
            </h2>
            <p class="section-lede">
              <FormattedMessage defaultMessage="Run it after every edit. It exits 1 on errors, so it fits in a loop or in CI, and it names a value that passes wherever there is one." />
            </p>
            <dl class="knows">
              {KNOWS.map(k => (
                <div key={k.term}>
                  <dt>{t(k.term).replace('{drc}', String(facts.drcRules)).replace('{stackups}', String(facts.stackups))}</dt>
                  <dd>{t(k.body)}</dd>
                </div>
              ))}
            </dl>
            <p class="more">
              <a href={to('/reference/drc/')}>
                <FormattedMessage defaultMessage="The design rule checks" />
              </a>
              {' · '}
              <a href={to('/guides/board-spec/')}>
                <FormattedMessage defaultMessage="Stackups and net classes" />
              </a>
            </p>
          </div>
          <figure class="viewer">
            <Shot name={'lna-board'} alt={t('The LNA board spec: the four layer stackup to scale, the fab, finish and outline, and the design rules from the JLCPCB preset.')} />
            <figcaption>
              <code>agentee render board:lna</code>
            </figcaption>
          </figure>
        </div>
      </section>

      <section class="band band-mask">
        <div class="wrap">
          <h2 class="section-h">
            <FormattedMessage defaultMessage="Simulate before you order" />
          </h2>
          <p class="section-lede">
            <FormattedMessage defaultMessage="Each <code>*.sim.toml</code> is a run with a kind. The solvers run through wgpu on Vulkan, Metal or DirectX 12, write their results next to the spec, and check warns when a result goes stale." />
          </p>
          <ul class="sims">
            {SIMS.map(s => (
              <li key={s.kind}>
                <a href={to(`/guides/${s.guide}/`)}>
                  <Shot name={s.image} alt="" />
                  <h3>{t(s.kind)}</h3>
                  <p>{t(s.body)}</p>
                </a>
              </li>
            ))}
          </ul>
          <p class="kinds">
            {SIM_KINDS.map(([label, guide]) => (
              <a key={label} class="tag" href={to(`/guides/${guide}/`)}>
                {t(label)}
              </a>
            ))}
          </p>
          <p class="note">
            <FormattedMessage defaultMessage="FDTD is the expensive one: the LNA’s six port run took 27 minutes on a workstation GPU. <code>agentee sim NAME --dry-run</code> prints the grid and run count in a second, so the agent can size a run before it starts one." />
          </p>
        </div>
      </section>

      <section class="band">
        <div class="wrap split">
          <div>
            <h2 class="section-h">
              <FormattedMessage defaultMessage="Made for the agent you already use" />
            </h2>
            <p class="section-lede">
              <FormattedMessage defaultMessage="The skill teaches the loop, the order to build a design in and the traps in the format. The MCP server gives clients that speak it the same operations as tools, with renders returned as images." />
            </p>
            <h3 class="sub-h">
              <FormattedMessage defaultMessage="The skill" />
            </h3>
            <Code code={highlight(SKILL, 'sh')} lang="sh" raw={SKILL} />
            <p class="more">
              <a href={to('/skills/')}>
                <FormattedMessage defaultMessage="Read the skill" />
              </a>
              {' · '}
              <a href={to('/guides/agents/')}>
                <FormattedMessage defaultMessage="Agent setup" />
              </a>
            </p>
          </div>
          <div>
            <h3 class="sub-h">
              <FormattedMessage defaultMessage="The MCP server, in Claude Code" />
            </h3>
            <Code code={highlight(MCP_CLIENTS[0].code, 'sh')} lang="sh" raw={MCP_CLIENTS[0].code} />
            <h3 class="sub-h">
              <FormattedMessage defaultMessage="In Codex" />
            </h3>
            <Code code={highlight(MCP_CLIENTS[1].code, 'toml')} lang="toml" raw={MCP_CLIENTS[1].code} />
            <p class="more">
              <a href={to('/mcp/')}>
                <FormattedMessage defaultMessage="All {count} tools" values={{ count: facts.mcpTools }} />
              </a>
            </p>
          </div>
        </div>
      </section>

      <section class="band band-alt">
        <div class="wrap split split-flip">
          <figure class="viewer">
            <Shot name={'praline-pcb'} alt={t('The HackRF Pro board imported from KiCad, rendered by agentee.')} />
            <figcaption>
              <code>agentee view</code>
            </figcaption>
          </figure>
          <div>
            <h2 class="section-h">
              <FormattedMessage defaultMessage="A person stays in the loop" />
            </h2>
            <p class="section-lede">
              <FormattedMessage defaultMessage="<code>agentee view</code> opens a window that reloads whenever a file changes, so you watch the board take shape while the agent works. On a layout you can move parts, route tracks and place vias by hand, and saving writes them into the same TOML the agent reads next." />
            </p>
            <p class="more">
              <a href={to('/guides/viewer/')}>
                <FormattedMessage defaultMessage="The viewer" />
              </a>
            </p>
          </div>
        </div>
      </section>

      <section class="band">
        <div class="wrap split">
          <div>
            <h2 class="section-h">
              <FormattedMessage defaultMessage="Out the door" />
            </h2>
            <p class="section-lede">
              <FormattedMessage defaultMessage="<code>agentee fab</code> refuses while the layout has errors. Once it is clean it writes a package a fab accepts as is, with the agentee version and commit in the silk so every board says what built it." />
            </p>
            <p>
              <FormattedMessage defaultMessage="<code>agentee parts</code> prices the BOM at Mouser and Farnell and finds cheaper parts that keep the value, package, rating and dielectric. <code>agentee export</code> writes the board and every part model as one STEP for the enclosure." />
            </p>
            <p class="more">
              <a href={to('/guides/fab/')}>
                <FormattedMessage defaultMessage="Fab package, BOM and pricing" />
              </a>
            </p>
          </div>
          <dl class="fab-files">
            {FAB_FILES.map(f => (
              <div key={f.file}>
                <dt>
                  <code>{f.file}</code>
                </dt>
                <dd>{t(f.body)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section class="band band-alt">
        <div class="wrap">
          <h2 class="section-h">
            <FormattedMessage defaultMessage="Worked examples" />
          </h2>
          <ul class="example-grid example-grid-3">
            {EXAMPLES.map(e => (
              <li key={e.slug} class="example-card">
                <a href={to(`/examples/${e.slug}/`)}>
                  <Shot name={e.image} alt={t(e.shots[0].alt)} />
                  <span class="silk-label">{e.name}</span>
                  <h3>{t(e.title)}</h3>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section class="closer">
        <div class="wrap">
          <h2>
            <FormattedMessage defaultMessage="Start with a board you already understand" />
          </h2>
          <p>
            <FormattedMessage defaultMessage="Install it, give your agent the skill, and ask for something small: a breakout, a power supply, a sensor node. Watch it in the viewer and read what check says." />
          </p>
          <div class="cta">
            <a class="pad" href={to('/download/')}>
              <FormattedMessage defaultMessage="Install" />
            </a>
            <a class="pad pad-ghost" href={to('/guides/getting-started/')}>
              <FormattedMessage defaultMessage="Your first board" />
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

