import { zip } from './zip';

const UPSTREAM = 'https://raw.githubusercontent.com/v0l/agentee/master/skills/agentee/';
const BUILT = '/.well-known/skills/agentee/';
export const FILES = ['SKILL.md', 'practice.md'];

type Ctx = { request: Request; env: { ASSETS: { fetch: (r: Request | string) => Promise<Response> } } };

export async function skillFile(ctx: Ctx, name: string): Promise<string> {
  try {
    const r = await fetch(UPSTREAM + name, { cf: { cacheTtl: 300, cacheEverything: true } } as RequestInit);
    if (r.ok) {
      const text = await r.text();
      if (name !== 'SKILL.md' || text.startsWith('---')) return text;
    }
  } catch {}
  const built = await ctx.env.ASSETS.fetch(new URL(BUILT + name, ctx.request.url).toString());
  return built.text();
}

export const skill = (ctx: Ctx) => skillFile(ctx, 'SKILL.md');

export async function skillZip(ctx: Ctx): Promise<Uint8Array> {
  const texts = await Promise.all(FILES.map(f => skillFile(ctx, f)));
  return zip(FILES.map((f, i) => [f, texts[i]]));
}

export async function digest(data: string | Uint8Array): Promise<string> {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return `sha256:${[...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('')}`;
}

export function description(text: string): string {
  return /^description: (.*)$/m.exec(text)?.[1] ?? '';
}

const HEADERS = { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=300' };

export function markdown(text: string): Response {
  return new Response(text, { headers: { ...HEADERS, 'Content-Type': 'text/markdown; charset=utf-8' } });
}

export function json(value: unknown): Response {
  return new Response(`${JSON.stringify(value, null, 2)}\n`, {
    headers: { ...HEADERS, 'Content-Type': 'application/json' },
  });
}

export function archive(bytes: Uint8Array): Response {
  return new Response(bytes, { headers: { ...HEADERS, 'Content-Type': 'application/zip' } });
}
