import { parse, TYPE, type MessageFormatElement } from '@formatjs/icu-messageformat-parser';
import { collectMessages, type Message } from './messages';
import { DEFAULT_LOCALE, LOCALE_CODES } from '../src/i18n/locales';
import { OVERRIDES } from './overrides';

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

const GLOSSARY: Record<string, string> = {
  de: 'check (agentee\'s design check, outside <code>): die Prüfung (verb: prüfen); board: Platine; fab: Leiterplattenhersteller (short: Fertiger); net: Netz; net class: Netzklasse; footprint: Footprint; symbol: Symbol; schematic: Schaltplan; layout: Layout; pad: Pad; via: Via; track: Leiterbahn; pour or zone: Kupferfläche; stackup: Lagenaufbau; silkscreen: Bestückungsdruck; solder mask: Lötstoppmaske; courtyard: Courtyard; ratsnest: Ratsnest; guide: Anleitung; viewer: Viewer. skill: Skill (der Skill, masculine; it is the name of the agent skill format); fab package: Fertigungsdaten; fab rules: Fertigungsregeln; the check (noun): die Prüfung. Address the reader with du.',
  fr: 'check (agentee\'s design check, outside <code>): la vérification (verb: vérifier); board: carte; fab: fabricant; net: net; net class: classe de nets; footprint: empreinte; symbol: symbole; schematic: schéma; layout: routage (the layout file: fichier de routage); pad: pastille; via: via; track: piste; pour or zone: zone de cuivre; stackup: empilement; silkscreen: sérigraphie; solder mask: vernis épargne; courtyard: zone d\'encombrement; ratsnest: chevelu; guide: guide; viewer: visualiseur. skill: skill (la skill; the name of the agent skill format, never compétence). Address the reader with vous.',
  es: 'check (agentee\'s design check, outside <code>): la verificación (verb: verificar); board: placa; fab: fabricante; net: red; net class: clase de red; footprint: huella; symbol: símbolo; schematic: esquemático; skill: skill (la skill, never habilidad); layout: layout; pad: pad; via: vía; track: pista; pour or zone: zona de cobre; stackup: apilamiento; silkscreen: serigrafía; solder mask: máscara de soldadura; courtyard: courtyard; ratsnest: ratsnest; guide: guía; viewer: visor. Address the reader with tú.',
  it: 'check (agentee\'s design check, outside <code>): la verifica (verb: verificare); board: scheda; fab: produttore di PCB (short: produttore); net: net; net class: classe di net; footprint: footprint; symbol: simbolo; schematic: schema; layout: layout; pad: piazzola; via: via; track: pista; pour or zone: area di rame; stackup: stackup; silkscreen: serigrafia; solder mask: solder mask; courtyard: courtyard; ratsnest: ratsnest; guide: guida; agent: agente (plural agenti); viewer: visualizzatore. skill: skill (la skill, never abilità); routing: sbroglio. Address the reader with tu.',
  pt: 'check (agentee\'s design check, outside <code>): a verificação (verb: verificar); board: placa; fab: fabricante; net: rede; net class: classe de rede; footprint: footprint; symbol: símbolo; schematic: esquema; layout: layout; pad: pad; via: via; track: pista; pour or zone: área de cobre; stackup: stackup; silkscreen: serigrafia; solder mask: máscara de solda; courtyard: courtyard; ratsnest: ratsnest; guide: guia; agent: agente; viewer: visualizador. skill: skill (never habilidade). European Portuguese, not Brazilian: use European spelling and constructions, address the reader impersonally or with infinitives.',
  nl: 'check (agentee\'s design check, outside <code>): de controle (verb: controleren); board: printplaat; fab: fabrikant; net: net; net class: netklasse; footprint: footprint; symbol: symbool; schematic: schema; layout: layout; pad: pad; via: via; track: spoor; pour or zone: kopervlak; stackup: stackup; silkscreen: zeefdruk; solder mask: soldeermasker; courtyard: courtyard; ratsnest: ratsnest; guide: handleiding; viewer: viewer. skill: skill (de skill). Address the reader with je.',
  pl: 'check (agentee\'s design check, outside <code>): sprawdzanie (verb: sprawdzać); board: płytka; fab: producent PCB (short: producent); net: sieć; net class: klasa sieci; footprint: footprint; symbol: symbol; schematic: schemat; layout: projekt PCB (layout); pad: pad; via: przelotka; track: ścieżka; pour or zone: wylewka; stackup: stackup; silkscreen: opisy (sitodruk); solder mask: soldermaska; courtyard: courtyard; ratsnest: ratsnest; guide: przewodnik; agent: agent; viewer: podgląd. skill: skill (never umiejętność). Address the reader with ty.',
  ru: 'check (agentee\'s design check, outside <code>): проверка (verb: проверять); board: плата; fab: производитель плат (short: завод); net: цепь; net class: класс цепей; footprint: посадочное место; symbol: УГО; schematic: схема; layout: топология платы; pad: контактная площадка; via: переходное отверстие; track: проводник; pour or zone: полигон; stackup: стек слоёв; silkscreen: шелкография; solder mask: паяльная маска; courtyard: courtyard; ratsnest: линии связей; guide: руководство; agent: агент; viewer: просмотрщик. skill: skill (never навык). Address the reader with вы.',
  ja: 'check (agentee\'s design check, outside <code>): チェック; board: 基板; fab: 基板メーカー; net: ネット; net class: ネットクラス; footprint: フットプリント; symbol: シンボル; schematic: 回路図; layout: レイアウト; pad: パッド; via: ビア; track: 配線; pour or zone: ベタ; stackup: 層構成; silkscreen: シルク; solder mask: ソルダーレジスト; courtyard: コートヤード; ratsnest: ラッツネスト; guide: ガイド; skill: スキル; agent: エージェント; viewer: ビューア. Write in です/ます form, and never leave English nouns in Latin letters where a katakana term exists.',
  zh: 'check (agentee\'s design check, outside <code>): 检查; board: 电路板; fab: 板厂; net: 网络; net class: 网络类; footprint: 封装; symbol: 符号; schematic: 原理图; layout: PCB 布局; pad: 焊盘; via: 过孔; track: 走线; pour or zone: 铺铜; stackup: 叠层; silkscreen: 丝印; solder mask: 阻焊; courtyard: 占位区; ratsnest: 飞线; guide: 指南; skill: 技能; agent: 智能体 (never 代理); viewer: 查看器. Never leave English nouns where a Chinese term exists.',
};

const PROMPT = (locale: string, lang: string) => `You translate the website of agentee into ${lang}. agentee is an open source electronics design tool for coding agents: printed circuit boards, schematics, layouts and simulations are plain TOML files that an AI coding agent writes, and the agentee command line checks them against the PCB manufacturer's rules, renders them and simulates them. The readers are electronics engineers.

Use these ${lang} terms, consistently, and the standard ${lang} terms of PCB design for anything else. Translate every ordinary noun; do not leave English words in the text unless the term list says to.
${GLOSSARY[locale]}

Meanings that are easy to get wrong:
- "fab" is the PCB manufacturer, a company. "Fab package" is the set of manufacturing files (Gerbers, drills, BOM) sent to it.
- "check" in prose is agentee's design check, the command that verifies the files. As a subject ("Check knows the fab", "check warns") translate it as the ${lang} word for the check or verification, never as an untranslated English word. Inside <code> it stays as is.
- "skill" is the name of the agent skill format: keep the word the term list gives, never translate it as an ability or competence.
- In the menu, "Start here", "Design", "Simulate" and "Ship" are the stages of a design; "Ship" means getting the board manufactured. "Out the door" means the design leaving for manufacturing.
- "Edit", "Check", "Look", "Measure" are the four steps of a loop: change a file, run the check, look at the rendered picture, read the numbers.
- "Skill" is an agent skill (a SKILL.md instruction file for AI agents). "Agent" is an AI coding agent. "Issues" are GitHub issues. "Sponsor" links to GitHub Sponsors.
- "Install" in a button is an imperative or a short label for the install page.

Never change: anything inside <code>...</code>, HTML tags and their attributes, href values, file names, command line flags, TOML keys, units and numbers, and product, company and standard names (agentee, KiCad, JLCPCB, PCBWay, Mouser, Farnell, Qorvo, Claude Code, Codex, Cursor, MCP, FDTD, PDN, IBIS, IPC-2221, IPC-4761, STEP, VRML, Gerber, Excellon, ENIG, USB, LVDS, GPU, Vulkan, Metal, DirectX, GitHub and the like).
Some texts are ICU MessageFormat: keep every {placeholder} and every <tag>...</tag> exactly, translating only the words.
Keep the plain, direct register of a technical manual: short sentences, no marketing tone. Translate idioms by meaning, never word for word. Never use em dashes or en dashes; use a comma, colon, full stop or parentheses, and a plain hyphen for ranges.

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

const BARE_CHECK = /\bcheck\b/i;
const plain = (s: string) => s.replace(/<code>[\s\S]*?<\/code>/g, '');

function matches(m: Message, translated: string): boolean {
  if (/[–—]/.test(translated)) return false;
  if (BARE_CHECK.test(plain(translated)) && !/agentee check|, check,/.test(plain(m.english))) return false;
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

async function ask(locale: string, batch: [string, Message][]): Promise<Record<string, unknown>> {
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
        { role: 'system', content: PROMPT(locale, LANGUAGE[locale]) },
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
  const wanted = [...messages].filter(([id, m]) => !have[id] && !OVERRIDES[m.english]?.[locale]).sort(([, a], [, b]) => a.where.localeCompare(b.where)).slice(0, LIMIT);
  for (const batch of batches(wanted)) {
    tasks.push(async () => {
      let reply: Record<string, unknown> = {};
      for (let attempt = 0; attempt < 3 && !Object.keys(reply).length; attempt++) {
        reply = await ask(locale, batch).catch(e => {
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
  for (const [id, m] of [...messages].sort(([a], [b]) => a.localeCompare(b))) {
    const fixed = OVERRIDES[m.english]?.[locale];
    if (fixed) out[id] = { defaultMessage: fixed };
    else if (have[id]) out[id] = have[id];
  }
  await Bun.write(`src/locales/${locale}.json`, `${JSON.stringify(out, null, 2)}\n`);
}

console.log(`${tasks.length} requests with ${MODEL}`);
await pool(tasks, PARALLEL);
for (const locale of locales) {
  await write(locale);
  const have = held.get(locale)!;
  const missing = [...messages].filter(([id, m]) => !have[id] && !OVERRIDES[m.english]?.[locale]).length;
  console.log(`${locale}: ${added.get(locale) ?? 0} added, ${missing} missing`);
}
