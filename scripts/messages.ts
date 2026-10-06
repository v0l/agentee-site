import { transformAsync } from '@babel/core';
import formatjs from 'babel-plugin-formatjs';
import { Glob } from 'bun';
import { messageId } from '../src/i18n/hash';
import { parseDoc } from '../src/md/parse';
import { blockStrings } from '../src/md/types';
import { GUIDES, GUIDE_GROUPS } from '../src/content/guides';
import { REFERENCE, REFERENCE_GROUPS } from '../src/content/reference';
import { EXAMPLES } from '../src/content/examples';
import { PLATFORMS } from '../src/content/platforms';
import { FAB_FILES, FILES, KNOWS, LOOP, SIMS, SIM_KINDS } from '../src/content/home';
import { PAGES, OG_IMAGE_ALT } from '../src/meta';
import { CLI_GROUPS } from '../src/pages/cli';
import { MCP_CLIENTS, MCP_GROUPS } from '../src/pages/mcp';
import cli from '../src/generated/cli.json';
import mcp from '../src/generated/mcp.json';

export type Kind = 'icu' | 'html';

export interface Message {
  english: string;
  where: string;
  kind: Kind;
}

const DATA: [string, string[]][] = [
  ['a page title or meta description', Object.values(PAGES).flatMap(p => [p.title, p.description, p.social])],
  ['the alt text of the social preview image', [OG_IMAGE_ALT]],
  ['the title of the page not found page', ['Page not found - agentee']],
  ['a group heading in the guides menu', GUIDE_GROUPS],
  ['a guide title and summary in the guides menu', GUIDES.flatMap(g => [g.title, g.summary])],
  ['a group heading in the file format reference menu', REFERENCE_GROUPS],
  ['a file format reference page title and summary', REFERENCE.flatMap(r => [r.title, r.summary])],
  [
    'an example design page',
    EXAMPLES.flatMap(e => [e.title, e.summary, ...e.shots.map(s => s.alt), ...e.facts.flat(), ...e.body]),
  ],
  [
    'the install page for an operating system',
    PLATFORMS.flatMap(p => [p.summary, ...p.needs, p.libraries, ...p.notes, ...p.builds.map(b => b.label)]),
  ],
  ['the home page section on the edit, check, look, measure loop', LOOP.flatMap(l => [l.verb, l.body])],
  ['the home page cards for the six kinds of project file', FILES.map(f => f.body)],
  ['the home page list of what the design rule check knows', KNOWS.flatMap(k => [k.term, k.body])],
  ['the home page cards for simulation kinds', [...SIMS.flatMap(s => [s.kind, s.body]), ...SIM_KINDS.map(([label]) => label)]],
  ['the home page list of files in the fab package', FAB_FILES.map(f => f.body)],
  ['a group heading on the command line reference', CLI_GROUPS.map(([g]) => g)],
  ['the one-line description of a command line command', cli.commands.map(c => c.about)],
  ['a group heading on the MCP tools page', [...MCP_GROUPS.map(([g]) => g), 'Other']],
  ['the description of an MCP tool', mcp.map(t => t.description)],
  ['an MCP client and where its settings live', MCP_CLIENTS.flatMap(c => [c.name, c.where])],
];

const DOCS: [string, string][] = [
  ...GUIDES.map((g): [string, string] => [`content/guides/${g.slug}.md`, `the guide "${g.title}"`]),
  ...REFERENCE.map((r): [string, string] => [`content/reference/${r.slug}.md`, `the file format reference page "${r.title}"`]),
  ['content/pages/source.md', 'the page on building agentee from source'],
];

export async function collectMessages(): Promise<Map<string, Message>> {
  const messages = new Map<string, Message>();
  const add = (english: string, where: string, kind: Kind) => {
    if (!english.trim()) return;
    const id = messageId(english);
    const held = messages.get(id);
    if (held && held.english !== english) {
      throw new Error(`id ${id} is both ${JSON.stringify(held.english)} and ${JSON.stringify(english)}`);
    }
    if (!held) messages.set(id, { english, where, kind });
  };

  for (const [where, strings] of DATA) for (const s of strings) add(s, where, 'html');

  for (const [file, where] of DOCS) {
    const doc = parseDoc(await Bun.file(file).text());
    for (const block of doc.blocks) for (const s of blockStrings(block)) add(s, where, 'html');
  }

  for (const file of [...new Glob('src/**/*.tsx').scanSync('.')].sort()) {
    await transformAsync(await Bun.file(file).text(), {
      filename: file,
      babelrc: false,
      configFile: false,
      code: false,
      parserOpts: { plugins: ['typescript', 'jsx'] },
      plugins: [
        [
          formatjs,
          {
            overrideIdFn: (_id?: string, defaultMessage?: string) => messageId(defaultMessage ?? ''),
            throws: true,
            onMsgExtracted: (_file: string, found: { id: string; defaultMessage?: string }[]) => {
              for (const m of found) add(m.defaultMessage ?? '', `the site's ${file.replace('src/', '')}`, 'icu');
            },
          },
        ],
      ],
    });
  }
  return messages;
}
