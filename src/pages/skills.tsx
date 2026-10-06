import { FormattedMessage } from 'react-intl';
import { Code, DocBody, PageHead } from '../components/doc';
import { docView } from '../content/docs';
import { highlight } from '../md/highlight';
import { useLocalePath } from '../i18n/context';
import { REPO } from '../components/header';

const sh = (code: string) => highlight(code, 'sh');

const MANUAL = [
  'mkdir -p ~/.claude/skills/agentee',
  'curl -fsSL https://agentee.sh/.well-known/agent-skills/agentee/SKILL.md \\',
  '  -o ~/.claude/skills/agentee/SKILL.md',
].join('\n');

const INDEX = `{
  "$schema": "https://schemas.agentskills.io/discovery/0.2.0/schema.json",
  "skills": [
    {
      "name": "agentee",
      "type": "skill-md",
      "description": "Design and iterate on electronics with agentee ...",
      "url": "/.well-known/agent-skills/agentee/SKILL.md",
      "digest": "sha256:..."
    }
  ]
}`;

export function Skills() {
  const to = useLocalePath();
  const View = docView('upstream', 'SKILL');
  return (
    <main id="main">
      <PageHead
        kicker="SKILL.md"
        title={<FormattedMessage defaultMessage="The agentee skill" />}
        lede={
          <FormattedMessage defaultMessage="A skill is a file of instructions an agent loads when a task matches it. This one teaches the edit, check, render loop, the order to build a design in, the traps in the file format, and how to iterate on simulations without spending hours of GPU time." />
        }
      />
      <div class="wrap two-col">
        <section>
          <h2 class="silk-h">
            <FormattedMessage defaultMessage="Install it" />
          </h2>
          <p>
            <FormattedMessage defaultMessage="With the skills installer, which finds the agents on your machine and puts the skill where each one looks:" />
          </p>
          <Code code={sh('npx skills add https://agentee.sh')} lang="sh" raw="npx skills add https://agentee.sh" />
          <p>
            <FormattedMessage defaultMessage="From the repository instead of the website:" />
          </p>
          <Code code={sh('npx skills add v0l/agentee')} lang="sh" raw="npx skills add v0l/agentee" />
          <p>
            <FormattedMessage defaultMessage="Or by hand, for Claude Code. Other agents read the same file from their own skills folder:" />
          </p>
          <Code code={sh(MANUAL)} lang="sh" raw={MANUAL.replace(/ \\\n\s+/, ' ')} />
          <p>
            <FormattedMessage defaultMessage="Every release archive carries the skill under <code>skills/agentee</code> as well, matching the binary beside it." />
          </p>
        </section>
        <section>
          <h2 class="silk-h">
            <FormattedMessage defaultMessage="The registry" />
          </h2>
          <p>
            <FormattedMessage
              defaultMessage="agentee.sh publishes its skills at the well-known address from the <a>Agent Skills Discovery</a> draft, with a SHA-256 digest a client checks before loading the file."
              values={{ a: (chunks: preact.ComponentChildren) => <a href="https://github.com/cloudflare/agent-skills-discovery-rfc">{chunks}</a> }}
            />
          </p>
          <ul class="endpoints">
            <li>
              <a href="/.well-known/agent-skills/index.json">/.well-known/agent-skills/index.json</a>
            </li>
            <li>
              <a href="/.well-known/agent-skills/agentee/SKILL.md">/.well-known/agent-skills/agentee/SKILL.md</a>
            </li>
            <li>
              <a href="/.well-known/skills/index.json">/.well-known/skills/index.json</a>{' '}
              <span class="fine">
                <FormattedMessage defaultMessage="(the older v0.1 index, for clients that still read it)" />
              </span>
            </li>
          </ul>
          <Code code={highlight(INDEX, 'json')} lang="json" raw={INDEX} />
          <p>
            <FormattedMessage
              defaultMessage="Use the skill with <a>the MCP server</a> when your client supports both: the skill says what to do, the server does it and returns the renders as images."
              values={{ a: (chunks: preact.ComponentChildren) => <a href={to('/mcp/')}>{chunks}</a> }}
            />
          </p>
        </section>
      </div>
      {View ? (
        <section class="wrap skill-file">
          <h2 class="silk-h">
            <FormattedMessage defaultMessage="The file, as agents receive it" />
          </h2>
          <p class="fine">
            <a href={`${REPO}/blob/master/skills/agentee/SKILL.md`}>skills/agentee/SKILL.md</a>
          </p>
          <div class="paper-sheet">
            <View render={doc => <DocBody doc={doc} translate={false} />} />
          </div>
        </section>
      ) : null}
    </main>
  );
}
