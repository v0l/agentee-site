import { parse, TYPE, type MessageFormatElement } from '@formatjs/icu-messageformat-parser';
import { collectMessages, type Message } from './messages';
import { DEFAULT_LOCALE, LOCALE_CODES } from '../src/i18n/locales';

const URL = process.env.INTL_URL ?? 'http://localhost:8001/v1';
const KEY = process.env.INTL_KEY ?? process.env.YALR_API_KEY ?? '';
const MODEL = process.env.INTL_MODEL ?? (await (await fetch(`${URL}/models`)).json()).data[0].id;
const BATCH_CHARS = Number(process.env.INTL_BATCH_CHARS ?? 7000);
const PARALLEL = Number(process.env.INTL_PARALLEL ?? 12);
const LIMIT = Number(process.env.INTL_LIMIT ?? Infinity);

const LANGUAGE: Record<string, string> = {
  de: 'German',
  fr: 'French',
  es: 'Spanish (Spain)',
  it: 'Italian',
  pt: 'European Portuguese',
  nl: 'Dutch',
  pl: 'Polish',
  ru: 'Russian',
  ja: 'Japanese',
  zh: 'Simplified Chinese',
};

const PROMPT = (lang: string) => `You translate the website of agentee into ${lang}. agentee is an open source electronics design tool for coding agents: printed circuit boards, schematics, layouts and simulations are plain TOML files that an AI coding agent writes, and the agentee command line checks them against the PCB fab's rules, renders them and simulates them. The readers are electronics engineers.

Use the standard ${lang} terms of PCB design and electronics: board, schematic, layout, footprint, symbol, pad, net, net class, track, via, microvia, pour (copper zone), plane, stackup, prepreg, core, solder mask, silkscreen, courtyard, fab (the PCB manufacturer), Gerber, BOM, placement, routing, ratsnest, impedance, differential pair, skew, eye, S-parameters, noise figure, decoupling capacitor. Where engineers writing in ${lang} normally keep the English word (often via, pad, layout, footprint), keep it.
"check", "render", "show", "edit", "place", "route", "tie", "fill" are usually agentee commands; translate them as verbs in prose but never inside <code>.
"Skill" is an agent skill (a SKILL.md instruction file for AI agents). "Agent" is an AI coding agent. "Issues" are GitHub issues. "Sponsor" is GitHub Sponsors.

Never change: anything inside <code>...</code>, HTML tags and their attributes, href values, file names, command line flags, TOML keys, units and numbers, and product, company and standard names (agentee, KiCad, JLCPCB, PCBWay, Mouser, Farnell, Qorvo, Claude Code, Codex, Cursor, MCP, FDTD, PDN, IBIS, IPC-2221, IPC-4761, STEP, VRML, Gerber, Excellon, ENIG, USB, LVDS, GPU, Vulkan, Metal, DirectX, GitHub and the like).
Some texts are ICU MessageFormat: keep every {placeholder} and every <tag>...</tag> exactly, translating only the words.
Address the reader the way developer documentation in ${lang} usually does, and keep it consistent. Keep the plain, direct register of a technical manual: short sentences, no marketing tone. Never use em dashes or en dashes; use a comma, colon, full stop or parentheses, and a plain hyphen for ranges.

The input is a JSON object of id to {"text", "where"}; "where" says where the text appears. Reply with only a JSON object mapping every id to its ${lang} text as a plain string, for example {"abc": "translated text"}.`;

type LocaleFile = Record<string, { defaultMessage: string }>;

function shape(els: MessageFormatElement[], out: string[] = []): string[] {
  for (const e of els) {
    if (e.type === TYPE.argument || e.type === TYPE.number || e.type === TYPE.date) out.push(`arg:${e.value}`);
    if (e.type === TYPE.plural || e.type === TYPE.select) {
      out.push(`plural:${e.value}`);
      for (const o of Object.values(e.options)) shape(o.value, out);
    }
    if (e.type === TYPE.tag) {
      out.push(`tag:${e.value}`);
      shape(e.children, out);
    }
  }
  return out;
}

function icuSignature(text: string): string | null {
  try {
    return [...new Set(shape(parse(text)))].sort().join(',');
  } catch {
    return null;
  }
}

const decode = (s: string) =>
  s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

function htmlSignature(text: string): string {
  const tags = [...text.matchAll(/<\/?([a-z0-9]+)/gi)].map(m => m[0].toLowerCase()).sort();
  const hrefs = [...text.matchAll(/href="([^"]*)"/g)].map(m => m[1]).sort();
  const code = [...text.matchAll(/<code>([\s\S]*?)<\/code>/g)].map(m => decode(m[1]).trim()).sort();
  const holes = [...text.matchAll(/\{[A-Za-z]+\}/g)].map(m => m[0]).sort();
  return JSON.stringify([tags, hrefs, code, holes]);
}

function matches(m: Message, translated: string): boolean {
  if (/[–—]/.test(translated)) return false;
  if (htmlSignature(translated) !== htmlSignature(m.english)) return false;
  if (m.kind === 'icu') {
    const want = icuSignature(m.english);
    return want !== null && icuSignature(translated) === want;
  }
  return true;
}

function undash(english: string, text: string, locale: string): string {
  let t = text.replace(/(\d)\s*[–—―]\s*(\d)/g, '$1-$2');
  const between = english.includes(' - ') ? ' - ' : null;
  if (locale === 'ja' || locale === 'zh') return t.replace(/\s*[–—―]{1,2}\s*/g, between ?? (locale === 'zh' ? '，' : '、'));
  return t
    .replace(/\s+[–—―]\s+/g, between ?? ', ')
    .replace(/(\p{L})[–—―](\p{L})/gu, '$1-$2')
    .replace(/\s*[–—―]\s*/g, ', ');
}

async function ask(lang: string, batch: [string, Message][]): Promise<Record<string, unknown>> {
  const input = Object.fromEntries(batch.map(([id, m]) => [id, { text: m.english, where: m.where }]));
  const r = await fetch(`${URL}/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${KEY}` },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      reasoning: { enabled: false },
      chat_template_kwargs: { enable_thinking: false },
      messages: [
        { role: 'system', content: PROMPT(lang) },
        { role: 'user', content: JSON.stringify(input, null, 1) },
      ],
    }),
    signal: AbortSignal.timeout(300_000),
  });
  if (!r.ok) throw new Error(`${r.status} ${(await r.text()).slice(0, 300)}`);
  const reply = (await r.json()).choices[0].message.content as string;
  return JSON.parse(reply.slice(reply.indexOf('{'), reply.lastIndexOf('}') + 1));
}

function batches(items: [string, Message][]): [string, Message][][] {
  const out: [string, Message][][] = [];
  let current: [string, Message][] = [];
  let size = 0;
  for (const item of items) {
    if (current.length && size + item[1].english.length > BATCH_CHARS) {
      out.push(current);
      current = [];
      size = 0;
    }
    current.push(item);
    size += item[1].english.length;
  }
  if (current.length) out.push(current);
  return out;
}

async function pool<T>(tasks: (() => Promise<T>)[], size: number): Promise<T[]> {
  const results: T[] = [];
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(size, tasks.length) }, async () => {
      while (next < tasks.length) {
        const i = next++;
        results[i] = await tasks[i]();
      }
    }),
  );
  return results;
}

const messages = await collectMessages();
const only = process.argv.slice(2);
const locales = LOCALE_CODES.filter(l => l !== DEFAULT_LOCALE && (!only.length || only.includes(l)));
const held = new Map<string, LocaleFile>();
for (const locale of locales) {
  const file = Bun.file(`src/locales/${locale}.json`);
  held.set(locale, (await file.exists()) ? await file.json() : {});
}

const tasks: (() => Promise<void>)[] = [];
const added = new Map<string, number>();
for (const locale of locales) {
  const have = held.get(locale)!;
  const wanted = [...messages].filter(([id]) => !have[id]).sort(([, a], [, b]) => a.where.localeCompare(b.where)).slice(0, LIMIT);
  for (const batch of batches(wanted)) {
    tasks.push(async () => {
      let reply: Record<string, unknown> = {};
      for (let attempt = 0; attempt < 3 && !Object.keys(reply).length; attempt++) {
        reply = await ask(LANGUAGE[locale], batch).catch(e => {
          console.warn(`${locale}: ${e}`);
          return {};
        });
      }
      for (const [id, m] of batch) {
        const raw = reply[id];
        const t = raw && typeof raw === 'object' && 'text' in raw ? (raw as { text: unknown }).text : raw;
        if (typeof t !== 'string' || !t.trim()) continue;
        const clean = undash(m.english, t.trim(), locale);
        if (matches(m, clean)) {
          have[id] = { defaultMessage: clean };
          added.set(locale, (added.get(locale) ?? 0) + 1);
        }
      }
      await write(locale);
    });
  }
}

async function write(locale: string) {
  const have = held.get(locale)!;
  const out: LocaleFile = {};
  for (const [id] of [...messages].sort(([a], [b]) => a.localeCompare(b))) if (have[id]) out[id] = have[id];
  await Bun.write(`src/locales/${locale}.json`, `${JSON.stringify(out, null, 2)}\n`);
}

console.log(`${tasks.length} requests with ${MODEL}`);
await pool(tasks, PARALLEL);
for (const locale of locales) {
  await write(locale);
  const have = held.get(locale)!;
  const missing = [...messages.keys()].filter(id => !have[id]).length;
  console.log(`${locale}: ${added.get(locale) ?? 0} added, ${missing} missing`);
}
