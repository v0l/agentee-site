import { GUIDES } from './content/guides';
import { REFERENCE } from './content/reference';
import { EXAMPLES } from './content/examples';
import { PLATFORMS, REPO, SITE } from './content/platforms';
import facts from './generated/facts.json';
import { LOCALES, LOCALE_CODES, localePath, splitPath } from './i18n/locales';
import { translateString, type Messages } from './i18n/copy';

export interface HeadElement {
  type: string;
  props: Record<string, string>;
  children?: string;
}

export interface PageMeta {
  title: string;
  description: string;
  social: string;
  jsonLd: Record<string, unknown>;
  trail?: [string, string][];
}

export { SITE };

const author = { '@type': 'Person', name: 'Kieran', url: 'https://github.com/v0l' };
const website = { '@type': 'WebSite', name: 'agentee', url: `${SITE}/` };

export const SOFTWARE = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'agentee',
  url: `${SITE}/`,
  applicationCategory: 'DesignApplication',
  applicationSubCategory: 'Electronic design automation',
  operatingSystem: 'Linux, macOS, Windows',
  downloadUrl: `${SITE}/download/`,
  softwareVersion: facts.version,
  license: 'https://www.gnu.org/licenses/gpl-3.0.html',
  image: `${SITE}/assets/og.png`,
  screenshot: `${SITE}/assets/renders/lna-pcb.webp`,
  codeRepository: REPO,
  description:
    'Electronics design for coding agents. Boards, symbols, footprints, schematics, layouts and simulations are plain TOML files an agent writes; agentee checks them against the fab, renders them, solves impedance and runs FDTD, cascade, channel, PDN, DC drop, thermal and logic simulations on the GPU, and writes the fab package.',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  author,
};

const page = (name: string, path: string, type = 'WebPage', extra: Record<string, unknown> = {}) => ({
  '@context': 'https://schema.org',
  '@type': type,
  name,
  url: `${SITE}${path}`,
  isPartOf: website,
  ...extra,
});

const breadcrumb = (trail: [string, string][]) => ({
  '@type': 'BreadcrumbList',
  itemListElement: trail.map(([name, path], i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name,
    item: `${SITE}${path}`,
  })),
});

const article = (headline: string, path: string, description: string, trail: [string, string][]) =>
  page(headline, path, 'TechArticle', {
    headline,
    description,
    author,
    image: `${SITE}/assets/og.png`,
    about: { '@type': 'SoftwareApplication', name: 'agentee', url: `${SITE}/` },
    breadcrumb: breadcrumb(trail),
  });

const list = (name: string, path: string, items: { name: string; path: string }[]) =>
  page(name, path, 'CollectionPage', {
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: items.map((it, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: it.name,
        url: `${SITE}${it.path}`,
      })),
    },
  });

export const PAGES: Record<string, PageMeta> = {
  '/': {
    title: 'agentee - electronics design for coding agents',
    description:
      'Schematics, PCB layouts and simulations as plain TOML files your coding agent writes. agentee checks every edit against the fab’s rules, renders the board, solves impedance and runs FDTD, thermal and logic sims on the GPU, and writes the Gerbers.',
    social: 'Your coding agent writes the board as TOML. agentee checks it, draws it, simulates it and writes the Gerbers.',
    jsonLd: SOFTWARE,
  },
  '/download': {
    title: 'Download agentee for Linux, macOS and Windows',
    description:
      'Install agentee with one command on Linux, macOS or Windows, or build it from source with cargo. What it needs from the system: a GPU driver for the solvers and the KiCad libraries for imports.',
    social: 'One command on Linux, macOS and Windows, or cargo install from source.',
    jsonLd: page('Download agentee', '/download/'),
  },
  '/download/source': {
    title: 'Build agentee from source',
    description: 'Build and install agentee with cargo from the git repository: the Rust version it needs, the crates in the workspace, and running the tests and benchmarks.',
    social: 'cargo install from the git repository, and what is in the workspace.',
    jsonLd: page('Build agentee from source', '/download/source/'),
    trail: [['Download', '/download/']],
  },
  '/guides': {
    title: 'agentee guides',
    description:
      'Guides to designing electronics with agentee and a coding agent: the first board, agent setup, stackups, parts, schematics, layout, impedance, HDI, FDTD and cascade, eyes and PDN, DC drop and thermal, logic sims, the fab package, the viewer and CI.',
    social: 'From the first board to the fab package, one guide per stage of a design.',
    jsonLd: list('agentee guides', '/guides/', GUIDES.map(g => ({ name: g.title, path: `/guides/${g.slug}/` }))),
  },
  '/reference': {
    title: 'agentee file format reference',
    description:
      'The key by key reference for every agentee file: board specs, stackups, vias and fab rules, the design rule checks, symbols, footprints, schematics, layouts, simulations and the fab package.',
    social: 'Every key of every file, the same reference agentee docs prints.',
    jsonLd: list('agentee file format reference', '/reference/', REFERENCE.map(r => ({ name: r.title, path: `/reference/${r.slug}/` }))),
  },
  '/cli': {
    title: 'agentee command line reference',
    description:
      'Every agentee command with its options: new, check, edit, show, render, view, import, place, route, tie, tune, fill, silk, testpoints, drc, sim, sparam, calc, fab, export, parts and mcp.',
    social: 'Every command and flag, as the binary prints it.',
    jsonLd: page('agentee command line reference', '/cli/'),
  },
  '/mcp': {
    title: 'agentee MCP server: tools for coding agents',
    description: `agentee mcp serves a project over the Model Context Protocol on stdio: ${facts.mcpTools} tools to check, render, route, simulate and write the fab package, with setup for Claude Code, Codex, Cursor and other MCP clients.`,
    social: `${facts.mcpTools} MCP tools for checking, rendering, routing and simulating a board.`,
    jsonLd: page('agentee MCP server', '/mcp/'),
  },
  '/skills': {
    title: 'The agentee agent skill',
    description:
      'The agentee skill teaches a coding agent the edit, check, render loop and the order to build a design in. Install it with npx skills add https://agentee.sh, or fetch it from the well-known skill registry.',
    social: 'One skill that teaches an agent how to design a board with agentee.',
    jsonLd: page('The agentee agent skill', '/skills/'),
  },
  '/examples': {
    title: 'agentee example designs',
    description:
      'Worked agentee projects: a bias-tee LNA with FDTD, cascade, DC drop and thermal sims, the HackRF Pro imported from KiCad, and logic simulations of a counter and an I2C bus.',
    social: 'An LNA, the HackRF Pro and two logic sims, all plain TOML.',
    jsonLd: list('agentee example designs', '/examples/', EXAMPLES.map(e => ({ name: e.title, path: `/examples/${e.slug}/` }))),
  },
};

for (const p of PLATFORMS) {
  PAGES[`/download/${p.slug}`] = {
    title: `Install agentee on ${p.name}`,
    description: p.summary,
    social: p.summary,
    jsonLd: page(`Install agentee on ${p.name}`, `/download/${p.slug}/`),
    trail: [['Download', '/download/']],
  };
}

for (const g of GUIDES) {
  const path = `/guides/${g.slug}/`;
  const trail: [string, string][] = [['Guides', '/guides/']];
  PAGES[`/guides/${g.slug}`] = {
    title: `${g.title} - agentee guide`,
    description: g.summary,
    social: g.summary,
    jsonLd: article(g.title, path, g.summary, [['agentee', '/'], ...trail, [g.title, path]]),
    trail,
  };
}

for (const r of REFERENCE) {
  const path = `/reference/${r.slug}/`;
  const trail: [string, string][] = [['Reference', '/reference/']];
  PAGES[`/reference/${r.slug}`] = {
    title: `${r.title} - agentee reference`,
    description: r.summary,
    social: r.summary,
    jsonLd: article(r.title, path, r.summary, [['agentee', '/'], ...trail, [r.title, path]]),
    trail,
  };
}

for (const e of EXAMPLES) {
  const path = `/examples/${e.slug}/`;
  const trail: [string, string][] = [['Examples', '/examples/']];
  PAGES[`/examples/${e.slug}`] = {
    title: `${e.title} - agentee example`,
    description: e.summary,
    social: e.summary,
    jsonLd: {
      ...article(e.title, path, e.summary, [['agentee', '/'], ...trail, [e.title, path]]),
      image: `${SITE}/assets/renders/${e.image}.webp`,
    },
    trail,
  };
}

export const OG_IMAGE_ALT = 'agentee: electronics design for coding agents, over a rendered LNA layout.';

export const PAGE_PATHS = Object.keys(PAGES);

export const ROUTES = LOCALE_CODES.flatMap(locale => PAGE_PATHS.map(path => localePath(locale, path)));

export const canonicalPath = (path: string) => (path.endsWith('/') ? path : `${path}/`);

export function alternates(path: string): [string, string][] {
  return [
    ...LOCALE_CODES.map((l): [string, string] => [LOCALES[l].tag, `${SITE}${canonicalPath(localePath(l, path))}`]),
    ['x-default', `${SITE}${canonicalPath(path)}`],
  ];
}

export function markdownPath(path: string): string {
  return `${canonicalPath(path)}index.html.md`;
}

export function headFor(fullPath: string, messages: Messages) {
  const [locale, raw] = splitPath(fullPath);
  if (raw === '/404') {
    return {
      lang: LOCALES[locale].tag,
      title: translateString(messages, 'Page not found - agentee'),
      elements: new Set<HeadElement>([{ type: 'meta', props: { name: 'robots', content: 'noindex' } }]),
    };
  }
  const path = PAGES[raw] ? raw : '/';
  const page = PAGES[path];
  const t = (english: string) => translateString(messages, english);
  const title = t(page.title);
  const canonical = `${SITE}${canonicalPath(localePath(locale, path))}`;
  const jsonLd: Record<string, unknown>[] = [{ ...page.jsonLd, inLanguage: LOCALES[locale].tag }];
  if (path === '/') jsonLd.push({ '@context': 'https://schema.org', ...website, inLanguage: LOCALES[locale].tag });
  const elements: HeadElement[] = [
    { type: 'meta', props: { name: 'description', content: t(page.description) } },
    { type: 'link', props: { rel: 'canonical', href: canonical } },
    ...alternates(path).map(([hreflang, href]) => ({ type: 'link', props: { rel: 'alternate', hreflang, href } })),
    { type: 'link', props: { rel: 'alternate', type: 'text/markdown', href: `${SITE}${markdownPath(path)}` } },
    { type: 'meta', props: { property: 'og:url', content: canonical } },
    { type: 'meta', props: { property: 'og:locale', content: LOCALES[locale].og } },
    { type: 'meta', props: { property: 'og:title', content: title } },
    { type: 'meta', props: { property: 'og:description', content: t(page.social) } },
    { type: 'meta', props: { property: 'og:image:alt', content: t(OG_IMAGE_ALT) } },
    { type: 'meta', props: { name: 'twitter:title', content: title } },
    { type: 'meta', props: { name: 'twitter:description', content: t(page.social) } },
    ...jsonLd.map(j => ({ type: 'script', props: { type: 'application/ld+json' }, children: JSON.stringify(j) })),
  ];
  return { lang: LOCALES[locale].tag, title, elements: new Set(elements) };
}
