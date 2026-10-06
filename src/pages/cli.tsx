import { FormattedMessage } from 'react-intl';
import cli from '../generated/cli.json';
import { Code, PageHead } from '../components/doc';
import { useLocalePath, useString } from '../i18n/context';

export const CLI_GROUPS: [string, string[]][] = [
  ['Project', ['new', 'check', 'list', 'show', 'render', 'view', 'docs']],
  ['Editing', ['edit']],
  ['Parts', ['search', 'import', 'models']],
  ['Board and traces', ['stackups', 'calc', 'calc trace-width', 'calc impedance', 'calc field', 'calc serpentine']],
  ['Layout', ['place', 'route', 'tie', 'tune', 'neck', 'fill', 'silk', 'testpoints', 'pinswap', 'layout', 'drc']],
  ['Simulation', ['sim', 'sparam']],
  ['Output', ['fab', 'export', 'parts']],
  ['Agents', ['mcp']],
];

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const id = (command: string) => command.replace(/\s+/g, '-');

export function Cli() {
  const t = useString();
  const to = useLocalePath();
  const byName = new Map(cli.commands.map(c => [c.command, c]));
  return (
    <main id="main">
      <PageHead
        kicker={<FormattedMessage defaultMessage="Command line" />}
        title={<FormattedMessage defaultMessage="Every command" />}
        lede={
          <FormattedMessage defaultMessage="The help text of each command as the binary prints it. A project is the current directory unless a command takes a path or <code>-p</code>." />
        }
      />
      <div class="wrap cli">
        <nav class="cli-index" aria-labelledby="cli-index-h">
          <p class="toc-h" id="cli-index-h">
            <FormattedMessage defaultMessage="Commands" />
          </p>
          {CLI_GROUPS.map(([group, commands]) => (
            <div key={group}>
              <p class="sidenav-h">{t(group)}</p>
              <ul>
                {commands.map(c => (
                  <li key={c}>
                    <a href={`#${id(c)}`}>{c}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <div class="cli-body">
          {CLI_GROUPS.map(([group, commands]) => (
            <section key={group}>
              <h2 class="silk-h">{t(group)}</h2>
              {commands.map(name => {
                const c = byName.get(name);
                if (!c) return null;
                return (
                  <article key={name} id={id(name)} class="cli-cmd">
                    <h3>
                      <code>agentee {name}</code>
                    </h3>
                    <p>{t(c.about)}</p>
                    <details>
                      <summary>
                        <FormattedMessage defaultMessage="Full help" />
                      </summary>
                      <Code code={escape(c.help)} lang="help" raw={c.help} />
                    </details>
                    {name === 'edit'
                      ? cli.edits.map(e => (
                          <details key={e.target} open={e.target === 'sch'}>
                            <summary>
                              <code>agentee edit {e.target} help</code>
                            </summary>
                            <Code code={escape(e.help)} lang="help" raw={e.help} />
                          </details>
                        ))
                      : null}
                  </article>
                );
              })}
            </section>
          ))}
          <p class="fine">
            <FormattedMessage
              defaultMessage="The same operations are served to agents over MCP. See <a>the MCP tools</a>."
              values={{ a: (chunks: preact.ComponentChildren) => <a href={to('/mcp/')}>{chunks}</a> }}
            />
          </p>
        </div>
      </div>
    </main>
  );
}
