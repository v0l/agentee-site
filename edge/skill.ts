export const UPSTREAM = 'https://raw.githubusercontent.com/v0l/agentee/master/skills/agentee/SKILL.md';
const BUILT = '/.well-known/agent-skills/agentee/SKILL.md';

type Ctx = { request: Request; env: { ASSETS: { fetch: (r: Request | string) => Promise<Response> } } };

export async function skill(ctx: Ctx): Promise<string> {
  try {
    const r = await fetch(UPSTREAM, { cf: { cacheTtl: 300, cacheEverything: true } } as RequestInit);
    if (r.ok) {
      const text = await r.text();
      if (text.startsWith('---')) return text;
    }
  } catch {}
  const built = await ctx.env.ASSETS.fetch(new URL(BUILT, ctx.request.url).toString());
  return built.text();
}

export async function digest(text: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
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
