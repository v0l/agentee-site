import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import type { Plugin } from 'vite';
import { GUIDES, GUIDE_GROUPS } from '../src/content/guides';
import { REFERENCE, REFERENCE_GROUPS } from '../src/content/reference';
import { EXAMPLES } from '../src/content/examples';
import { PLATFORMS, REPO, SITE, asset, latestUrl } from '../src/content/platforms';
import { PAGES, ROUTES, alternates, canonicalPath, markdownPath } from '../src/meta';
import { splitPath } from '../src/i18n/locales';
import cli from '../src/generated/cli.json';
import mcp from '../src/generated/mcp.json';
import facts from '../src/generated/facts.json';

const read = (path: string) => readFileSync(path, 'utf8');
const stripTags = (html: string) =>
  html
    .replace(/<code>(.*?)<\/code>/g, '`$1`')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
const absolute = (md: string) => md.replace(/\]\(\//g, `](${SITE}/`);
const mdUrl = (path: string) => `${SITE}${markdownPath(path)}`;

const SKILL = read('content/upstream/SKILL.md');
const skillDescription = /^description: (.*)$/m.exec(SKILL)?.[1] ?? '';
const digest = `sha256:${createHash('sha256').update(SKILL).digest('hex')}`;

const SUMMARY =
  'Electronics design for coding agents. A design is a directory of plain TOML files (board spec, symbols, footprints, schematics, layouts and simulations) that an agent writes and edits. The `agentee` CLI checks them against the fab, renders them to PNG, solves trace impedance, runs FDTD, cascade, channel, PDN, DC drop, thermal and logic simulations on the GPU, and writes the fab package. A person watches in a live viewer and can edit the layout by hand.';

const INSTALL = [
  '```sh',
  'curl -fsSL https://agentee.sh/install.sh | sh        # Linux and macOS',
  'irm https://agentee.sh/install.ps1 | iex             # Windows PowerShell',
  'cargo install --git https://github.com/v0l/agentee agentee   # from source',
  'npx skills add https://agentee.sh                     # the agent skill',
  '```',
].join('\n');

const LOOP = [
  '```sh',
  'agentee new board NAME                 # starter files that pass check',
  'agentee import symbol Device:R --footprint Resistor_SMD:R_0603_1608Metric',
  'agentee edit sch NAME add R1 R 10k --footprint R_0603_1608Metric',
  'agentee edit sch NAME net VIN R1.1 C1.1 --class Power',
  'agentee check                          # exit 0 clean, 1 errors, 2 load failure',
  'agentee render pcb:NAME -o board.png   # look at it',
  'agentee show pcb:NAME                  # the numbers, as JSON',
  'agentee fab pcb:NAME -o fab/           # Gerbers, drills, BOM, placement',
  'agentee mcp /path/to/project           # the same operations over MCP',
  '```',
].join('\n');

function homeMarkdown() {
  return [
    '# agentee',
    '',
    `> ${SUMMARY}`,
    '',
    `Version ${facts.version}. ${facts.drcRules} design rule checks, ${facts.stackups} fab stackup presets, ${facts.mcpTools} MCP tools. GPL-3.0-or-later. Source: ${REPO}`,
    '',
    '## Install',
    '',
    INSTALL,
    '',
    '## The loop',
    '',
    'Edit one file (with `agentee edit` where a command exists), run `agentee check`, render and look, read numbers with `agentee show`. Every diagnostic names the file, the item and the place to fix.',
    '',
    LOOP,
    '',
    '## Files',
    '',
    '| suffix | holds |',
    '|---|---|',
    '| `*.board.toml` | fab preset and rules, stackup, outline, vias, net classes |',
    '| `*.sym.toml` | a schematic symbol |',
    '| `*.fp.toml` | a footprint |',
    '| `*.sch.toml` | a schematic: parts, nets, wires |',
    '| `*.pcb.toml` | a layout: placement, tracks, vias, zones |',
    '| `*.sim.toml` | a simulation: FDTD, cascade, channel, PDN, DC drop, thermal or logic |',
  ].join('\n');
}

function linkList(items: { title: string; path: string; summary: string }[]) {
  return items.map(i => `- [${i.title}](${mdUrl(i.path)}): ${stripTags(i.summary)}`).join('\n');
}

function guideMarkdown(slug: string) {
  const g = GUIDES.find(x => x.slug === slug)!;
  return `# ${g.title}\n\n> ${g.summary}\n\n${absolute(read(`content/guides/${slug}.md`)).trim()}\n`;
}

function referenceMarkdown(slug: string) {
  const r = REFERENCE.find(x => x.slug === slug)!;
  return `# ${r.title}\n\n> ${r.summary}\n\n${read(`content/reference/${slug}.md`).trim()}\n`;
}

function platformMarkdown(slug: string) {
  const p = PLATFORMS.find(x => x.slug === slug)!;
  return [
    `# Install agentee on ${p.name}`,
    '',
    `> ${p.summary}`,
    '',
    '```sh',
    p.install,
    '```',
    '',
    '## Downloads',
    '',
    ...p.builds.map(b => `- ${b.label}: ${latestUrl(asset(b.asset))}`),
    '',
    '## What it needs',
    '',
    ...p.needs.map(n => `- ${stripTags(n)}`),
    '',
    '## KiCad libraries',
    '',
    stripTags(p.libraries),
    '',
    '```sh',
    p.librariesCode,
    '```',
    '',
    ...p.notes.map(n => `${stripTags(n)}\n`),
  ].join('\n');
}

function downloadMarkdown() {
  return [
    '# Download agentee',
    '',
    `> ${PAGES['/download'].description}`,
    '',
    INSTALL,
    '',
    ...PLATFORMS.flatMap(p => [`## ${p.name}`, '', ...p.builds.map(b => `- ${b.label}: ${latestUrl(asset(b.asset))}`), '', `Setup: ${mdUrl(`/download/${p.slug}/`)}`, '']),
    '## From source',
    '',
    `See ${mdUrl('/download/source/')}`,
  ].join('\n');
}

function sourceMarkdown() {
  return `# Build agentee from source\n\n> ${PAGES['/download/source'].description}\n\n${absolute(read('content/pages/source.md')).trim()}\n`;
}

function cliMarkdown() {
  return [
    '# agentee command line reference',
    '',
    '```',
    cli.top,
    '```',
    '',
    ...cli.commands.flatMap(c => [`## agentee ${c.command}`, '', '```', c.help, '```', '']),
    '## agentee edit commands',
    '',
    ...cli.edits.flatMap(e => [`### agentee edit ${e.target}`, '', '```', e.help, '```', '']),
  ].join('\n');
}

function mcpMarkdown() {
  return [
    '# agentee MCP server',
    '',
    `> ${PAGES['/mcp'].description}`,
    '',
    '```json',
    '{ "mcpServers": { "agentee": { "command": "agentee", "args": ["mcp", "/path/to/project"] } } }',
    '```',
    '',
    '```sh',
    'claude mcp add agentee -- agentee mcp /path/to/project',
    '```',
    '',
    '## Tools',
    '',
    ...mcp.flatMap(t => [
      `### ${t.name}`,
      '',
      t.description,
      '',
      ...(t.args.length ? t.args.map(a => `- \`${a.name}\`${a.type ? ` (${a.type}${a.required ? ', required' : ''})` : ''}${a.description ? `: ${a.description}` : ''}`) : ['No arguments.']),
      '',
    ]),
  ].join('\n');
}

function skillsMarkdown() {
  return [
    '# The agentee agent skill',
    '',
    `> ${PAGES['/skills'].description}`,
    '',
    '```sh',
    'npx skills add https://agentee.sh',
    '```',
    '',
    `- Index (Agent Skills Discovery v0.2.0): ${SITE}/.well-known/agent-skills/index.json`,
    `- SKILL.md: ${SITE}/.well-known/agent-skills/agentee/SKILL.md (${digest})`,
    `- Legacy index: ${SITE}/.well-known/skills/index.json`,
    '',
    '---',
    '',
    SKILL,
  ].join('\n');
}

function exampleMarkdown(slug: string) {
  const e = EXAMPLES.find(x => x.slug === slug)!;
  return [
    `# ${e.title}`,
    '',
    `> ${e.summary}`,
    '',
    ...e.facts.map(([k, v]) => `- ${k}: ${v}`),
    '',
    ...e.body.map(b => `${stripTags(b)}\n`),
    `Files: ${REPO}/tree/master/${e.dir}`,
  ].join('\n');
}

function indexMarkdown(title: string, description: string, groups: string[], items: { title: string; path: string; summary: string; group: string }[]) {
  return [
    `# ${title}`,
    '',
    `> ${description}`,
    '',
    ...groups.flatMap(g => [`## ${g}`, '', linkList(items.filter(i => i.group === g)), '']),
  ].join('\n');
}

const guideItems = GUIDES.map(g => ({ ...g, path: `/guides/${g.slug}/` }));
const referenceItems = REFERENCE.map(r => ({ ...r, path: `/reference/${r.slug}/` }));

export function pageMarkdown(path: string): string {
  const [section, slug] = path.split('/').filter(Boolean);
  if (path === '/') return homeMarkdown();
  if (path === '/download') return downloadMarkdown();
  if (path === '/download/source') return sourceMarkdown();
  if (section === 'download') return platformMarkdown(slug);
  if (path === '/guides') return indexMarkdown('agentee guides', PAGES[path].description, GUIDE_GROUPS, guideItems);
  if (section === 'guides') return guideMarkdown(slug);
  if (path === '/reference') return indexMarkdown('agentee file format reference', PAGES[path].description, REFERENCE_GROUPS, referenceItems);
  if (section === 'reference') return referenceMarkdown(slug);
  if (path === '/cli') return cliMarkdown();
  if (path === '/mcp') return mcpMarkdown();
  if (path === '/skills') return skillsMarkdown();
  if (path === '/examples')
    return indexMarkdown('agentee example designs', PAGES[path].description, ['Examples'], EXAMPLES.map(e => ({ ...e, path: `/examples/${e.slug}/`, group: 'Examples' })));
  if (section === 'examples') return exampleMarkdown(slug);
  throw new Error(`no markdown for ${path}`);
}

function llmsTxt() {
  return [
    '# agentee',
    '',
    `> ${SUMMARY}`,
    '',
    'Give an agent the skill first: it teaches the edit, check, render loop, the order to build a design in, and how to iterate on simulations without burning GPU hours. `agentee docs` prints the full file format reference offline, and `agentee mcp <project>` serves the same operations over MCP.',
    '',
    INSTALL,
    '',
    '## Start',
    '',
    `- [Agent skill](${SITE}/.well-known/agent-skills/agentee/SKILL.md): ${skillDescription}`,
    `- [Download](${mdUrl('/download/')}): install on Linux, macOS and Windows, or build from source`,
    linkList(guideItems.filter(g => g.group === 'Start here')),
    '',
    '## Guides',
    '',
    linkList(guideItems.filter(g => g.group !== 'Start here')),
    '',
    '## Reference',
    '',
    linkList(referenceItems),
    '',
    '## Tools',
    '',
    `- [Command line](${mdUrl('/cli/')}): every command and flag as the binary prints it`,
    `- [MCP server](${mdUrl('/mcp/')}): ${facts.mcpTools} tools and client setup`,
    '',
    '## Optional',
    '',
    linkList(EXAMPLES.map(e => ({ title: e.title, path: `/examples/${e.slug}/`, summary: e.summary }))),
    `- [Everything in one file](${SITE}/llms-full.txt): the guides, the full reference, the CLI and MCP tool reference and the skill`,
    `- [Source](${REPO}): GPL-3.0-or-later`,
    '',
  ].join('\n');
}

function llmsFull() {
  const parts = [
    homeMarkdown(),
    downloadMarkdown(),
    ...PLATFORMS.map(p => platformMarkdown(p.slug)),
    sourceMarkdown(),
    skillsMarkdown(),
    ...GUIDES.map(g => guideMarkdown(g.slug)),
    ...REFERENCE.map(r => referenceMarkdown(r.slug)),
    cliMarkdown(),
    mcpMarkdown(),
    ...EXAMPLES.map(e => exampleMarkdown(e.slug)),
  ];
  return parts.map(p => p.trim()).join('\n\n---\n\n') + '\n';
}

function sitemap() {
  const lastmod = new Date().toISOString().slice(0, 10);
  const priority = (path: string) => (path === '/' ? '1.0' : path.split('/').length > 2 ? '0.6' : '0.8');
  const urls = ROUTES.map(full => {
    const [, path] = splitPath(full);
    const links = alternates(path)
      .map(([lang, href]) => `    <xhtml:link rel="alternate" hreflang="${lang}" href="${href}"/>`)
      .join('\n');
    return `  <url>\n    <loc>${SITE}${canonicalPath(full)}</loc>\n${links}\n    <lastmod>${lastmod}</lastmod>\n    <priority>${priority(path)}</priority>\n  </url>`;
  }).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`;
}

export function agentFiles(): Plugin {
  return {
    name: 'agentee-agent-files',
    apply: 'build',
    generateBundle() {
      const emit = (fileName: string, source: string) => this.emitFile({ type: 'asset', fileName, source });
      emit('sitemap.xml', sitemap());
      emit('llms.txt', llmsTxt());
      emit('llms-full.txt', llmsFull());
      for (const path of Object.keys(PAGES)) emit(markdownPath(path).slice(1), pageMarkdown(path));

      const entry = { name: 'agentee', description: skillDescription };
      emit('.well-known/agent-skills/agentee/SKILL.md', SKILL);
      emit(
        '.well-known/agent-skills/index.json',
        `${JSON.stringify(
          {
            $schema: 'https://schemas.agentskills.io/discovery/0.2.0/schema.json',
            skills: [{ ...entry, type: 'skill-md', url: '/.well-known/agent-skills/agentee/SKILL.md', digest }],
          },
          null,
          2,
        )}\n`,
      );
      emit('.well-known/skills/agentee/SKILL.md', SKILL);
      emit('.well-known/skills/index.json', `${JSON.stringify({ skills: [{ ...entry, files: ['SKILL.md'] }] }, null, 2)}\n`);
    },
  };
}
