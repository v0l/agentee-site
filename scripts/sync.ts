import { $ } from 'bun';
import { existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { REFERENCE } from '../src/content/reference';

const REPO = resolve(process.env.AGENTEE_REPO ?? '../agentee');
const BUILT = join(REPO, 'target/release/agentee');
const BIN = process.env.AGENTEE_BIN ?? (existsSync(BUILT) ? BUILT : 'agentee');

const COMMANDS = [
  'new', 'check', 'edit', 'list', 'show', 'render', 'view', 'search', 'import', 'models',
  'stackups', 'calc', 'calc trace-width', 'calc impedance', 'calc field', 'calc serpentine',
  'place', 'route', 'tie', 'tune', 'neck', 'fill', 'silk', 'testpoints', 'pinswap', 'layout',
  'drc', 'sim', 'sparam', 'fab', 'export', 'parts', 'mcp', 'docs',
];

type Render = { project: string; item: string; name: string; canvas?: boolean; size?: [number, number, number] };

const PANEL: [number, number, number] = [1400, 1000, 1.6];

const RENDERS: Render[] = [
  { project: 'lna', item: 'pcb:lna', name: 'lna-pcb', canvas: true },
  { project: 'lna', item: 'sch:lna', name: 'lna-sch', canvas: true },
  { project: 'lna', item: 'board:lna', name: 'lna-board', size: [1200, 760, 1.5] },
  { project: 'lna', item: 'sim:lna-rf', name: 'lna-sim', canvas: true, size: PANEL },
  { project: 'lna', item: 'sim:lna-cascade', name: 'lna-cascade', canvas: true, size: PANEL },
  { project: 'lna', item: 'sim:lna-thermal', name: 'lna-thermal', canvas: true, size: PANEL },
  { project: 'lna', item: 'sim:lna-dc', name: 'lna-dc', canvas: true, size: PANEL },
  { project: 'hackrf-pro', item: 'pcb:praline', name: 'praline-pcb', canvas: true },
  { project: 'logic', item: 'sim:counter', name: 'logic-counter', canvas: true, size: [1400, 640, 1.8] },
  { project: 'demo', item: 'sym:STM32F103C8Tx', name: 'demo-symbol', canvas: true },
  { project: 'demo', item: 'fp:LQFP-48_7x7mm_P0.5mm', name: 'demo-footprint', canvas: true },
];

async function copyUpstream() {
  mkdirSync('content/upstream', { recursive: true });
  await Bun.write('content/upstream/SKILL.md', Bun.file(join(REPO, 'skills/agentee/SKILL.md')));
  await Bun.write('content/upstream/format.md', Bun.file(join(REPO, 'docs/format.md')));
}

function splitReference(format: string) {
  const lines = format.split('\n');
  let fence = false;
  const headingAt = new Map<string, number>();
  lines.forEach((line, i) => {
    if (line.startsWith('```')) fence = !fence;
    if (!fence && line.startsWith('#')) headingAt.set(line.trim(), i);
  });
  const starts = REFERENCE.map(page => {
    const at = headingAt.get(page.start);
    if (at === undefined) throw new Error(`format.md has no heading ${page.start}`);
    return { page, at };
  }).sort((a, b) => a.at - b.at);

  mkdirSync('content/reference', { recursive: true });
  return starts.map(({ page, at }, i) => {
    const end = starts[i + 1]?.at ?? lines.length;
    const level = page.start.indexOf(' ');
    let inFence = false;
    const body = lines.slice(at + 1, end).map(line => {
      if (line.startsWith('```')) inFence = !inFence;
      const m = !inFence && /^(#+) /.exec(line);
      return m ? `${'#'.repeat(Math.max(2, m[1].length - level + 1))}${line.slice(m[1].length)}` : line;
    });
    return Bun.write(`content/reference/${page.slug}.md`, `${body.join('\n').trim()}\n`);
  });
}

async function cliHelp() {
  const out = [];
  for (const command of COMMANDS) {
    const help = (await $`${BIN} ${{ raw: command }} --help`.quiet().nothrow()).stdout.toString().trimEnd();
    out.push({ command, about: help.split('\n')[0], help });
  }
  const edits = [];
  for (const target of ['sch', 'pcb', 'board']) {
    const help = (await $`${BIN} edit ${target} help`.quiet().nothrow()).stdout.toString().trimEnd();
    edits.push({ target, help });
  }
  const top = (await $`${BIN} --help`.quiet()).stdout.toString().trimEnd();
  return { top, commands: out, edits };
}

async function mcpTools() {
  const dir = mkdtempSync(join(tmpdir(), 'agentee-mcp-'));
  const requests = [
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'sync', version: '1' } } },
    { jsonrpc: '2.0', method: 'notifications/initialized' },
    { jsonrpc: '2.0', id: 2, method: 'tools/list' },
  ];
  const input = new Response(requests.map(r => JSON.stringify(r)).join('\n') + '\n');
  const res = await $`${BIN} mcp ${dir} < ${input}`.quiet().nothrow();
  rmSync(dir, { recursive: true });
  const reply = res.stdout.toString().trim().split('\n').map(l => JSON.parse(l)).find(m => m.id === 2);
  return reply.result.tools.map((t: { name: string; description: string; inputSchema: { properties?: Record<string, { description?: string; type?: string }>; required?: string[] } }) => ({
    name: t.name,
    description: t.description,
    args: Object.entries(t.inputSchema.properties ?? {}).map(([name, p]) => ({
      name,
      type: p.type ?? '',
      required: t.inputSchema.required?.includes(name) ?? false,
      description: p.description ?? '',
    })),
  }));
}

async function renders() {
  mkdirSync('public/assets/renders', { recursive: true });
  const tmp = mkdtempSync(join(tmpdir(), 'agentee-render-'));
  const convert =
    'import sys; from PIL import Image; Image.open(sys.argv[1]).convert("RGB").save(sys.argv[2], "WEBP", quality=88, method=6)';
  for (const r of RENDERS) {
    const png = join(tmp, `${r.name}.png`);
    const [width, height, scale] = r.size ?? [1600, 1000, 1];
    const flags = [`--width=${width}`, `--height=${height}`, `--scale=${scale}`, ...(r.canvas ? ['--canvas-only'] : [])];
    const res = await $`${BIN} render ${r.item} -o ${png} ${flags}`.cwd(join(REPO, 'examples', r.project)).quiet().nothrow();
    if (res.exitCode !== 0) {
      console.warn(`render ${r.project} ${r.item}: ${res.stderr}`);
      continue;
    }
    await $`python3 -c ${convert} ${png} ${`public/assets/renders/${r.name}.webp`}`;
  }
  rmSync(tmp, { recursive: true });
  await renderSizes();
}

async function renderSizes() {
  const sizes = await $`python3 -c ${'import glob, json, os; from PIL import Image; print(json.dumps({os.path.basename(f)[:-5]: Image.open(f).size for f in sorted(glob.glob("public/assets/renders/*.webp"))}))'}`.quiet();
  await Bun.write('src/generated/renders.json', `${JSON.stringify(JSON.parse(sizes.stdout.toString()), null, 2)}\n`);
}

async function facts(format: string) {
  const cargo = await Bun.file(join(REPO, 'Cargo.toml')).text();
  const version = /^version = "([^"]+)"/m.exec(cargo)?.[1] ?? '0.0.0';
  const commit = (await $`git -C ${REPO} rev-parse --short HEAD`.quiet()).stdout.toString().trim();
  const date = (await $`git -C ${REPO} log -1 --format=%cs`.quiet()).stdout.toString().trim();
  const stackups = (await $`${BIN} stackups`.quiet()).stdout.toString().trim().split('\n').length;
  const drc = format.split('### Design rule checks')[1].split('\n### ')[0];
  const rules = [...drc.matchAll(/^\| `([a-z0-9-]+)` \|/gm)].map(m => m[1]);
  return { version, commit, date, stackups, drcRules: rules.length };
}

await copyUpstream();
const format = await Bun.file('content/upstream/format.md').text();
await Promise.all(splitReference(format));
mkdirSync('src/generated', { recursive: true });
const tools = await mcpTools();
await Bun.write('src/generated/mcp.json', `${JSON.stringify(tools, null, 2)}\n`);
await Bun.write('src/generated/cli.json', `${JSON.stringify(await cliHelp(), null, 2)}\n`);
await Bun.write('src/generated/facts.json', `${JSON.stringify({ ...(await facts(format)), mcpTools: tools.length }, null, 2)}\n`);
if (!process.argv.includes('--no-renders')) await renders();
else await renderSizes();
console.log(`synced from ${REPO} with ${BIN}`);
