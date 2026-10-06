import { FormattedMessage } from 'react-intl';
import mcp from '../generated/mcp.json';
import { Code, PageHead } from '../components/doc';
import { highlight } from '../md/highlight';
import { useLocalePath, useString } from '../i18n/context';

export const MCP_CLIENTS: { name: string; where: string; lang: string; code: string }[] = [
  {
    name: 'Claude Code',
    where: 'a shell in the project',
    lang: 'sh',
    code: 'claude mcp add agentee -- agentee mcp "$PWD"',
  },
  {
    name: 'Codex',
    where: '~/.codex/config.toml',
    lang: 'toml',
    code: '[mcp_servers.agentee]\ncommand = "agentee"\nargs = ["mcp", "/path/to/project"]',
  },
  {
    name: 'Cursor, Claude Desktop and most other clients',
    where: '.cursor/mcp.json, claude_desktop_config.json or the client’s own file',
    lang: 'json',
    code: '{\n  "mcpServers": {\n    "agentee": {\n      "command": "agentee",\n      "args": ["mcp", "/path/to/project"]\n    }\n  }\n}',
  },
];

export const MCP_GROUPS: [string, string[]][] = [
  ['Read the project', ['format_reference', 'list_items', 'show_item', 'check', 'drc', 'render_item', 'stackups']],
  ['Parts', ['kicad_search', 'import_kicad_symbol', 'import_kicad_footprint', 'new_item', 'models']],
  ['Traces', ['impedance', 'field_solve', 'trace_width', 'serpentine']],
  ['Layout', ['place', 'route', 'tie', 'tune', 'neck', 'fill', 'silk', 'testpoints', 'layout']],
  ['Simulation', ['run_sim', 'sparam']],
  ['Output', ['fab', 'export', 'parts']],
];

export function Mcp() {
  const t = useString();
  const to = useLocalePath();
  const byName = new Map(mcp.map(tool => [tool.name, tool]));
  const listed = new Set(MCP_GROUPS.flatMap(([, names]) => names));
  const rest = mcp.filter(tool => !listed.has(tool.name)).map(tool => tool.name);
  const groups = rest.length ? [...MCP_GROUPS, ['Other', rest] as [string, string[]]] : MCP_GROUPS;
  return (
    <main id="main">
      <PageHead
        kicker="Model Context Protocol"
        title={<FormattedMessage defaultMessage="The MCP server" />}
        lede={
          <FormattedMessage
            defaultMessage="<code>agentee mcp</code> serves one project over stdio with {count} tools. The agent still writes TOML with its own file tools; the server checks, renders, routes, simulates and writes the fab package, and hands rendered PNGs straight back into the conversation."
            values={{ count: mcp.length }}
          />
        }
      />
      <div class="wrap">
        <section class="clients">
          <h2 class="silk-h">
            <FormattedMessage defaultMessage="Add it to your client" />
          </h2>
          <ul class="client-list">
            {MCP_CLIENTS.map(c => (
              <li key={c.name}>
                <h3>{t(c.name)}</h3>
                <p class="fine">{t(c.where)}</p>
                <Code code={highlight(c.code, c.lang)} lang={c.lang} raw={c.code} />
              </li>
            ))}
          </ul>
          <p>
            <FormattedMessage
              defaultMessage="The path is the project directory, the one holding the TOML files. Pair the server with <a>the skill</a>, which tells the agent when to call each tool and in what order."
              values={{ a: (chunks: preact.ComponentChildren) => <a href={to('/skills/')}>{chunks}</a> }}
            />
          </p>
        </section>

        <section class="tools">
          <h2 class="silk-h">
            <FormattedMessage defaultMessage="Tools" />
          </h2>
          {groups.map(([group, names]) => (
            <div key={group} class="tool-group">
              <h3>{t(group)}</h3>
              <dl>
                {names.map(name => {
                  const tool = byName.get(name);
                  if (!tool) return null;
                  return (
                    <div key={name} id={name} class="tool">
                      <dt>
                        <code>{name}</code>
                      </dt>
                      <dd>
                        <p>{t(tool.description)}</p>
                        {tool.args.length ? (
                          <p class="args">
                            {tool.args.map((a, i) => (
                              <>
                                {i ? ' ' : null}
                                <code key={a.name} title={a.description || undefined} class={a.required ? 'req' : undefined}>
                                  {a.name}
                                </code>
                              </>
                            ))}
                          </p>
                        ) : null}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
