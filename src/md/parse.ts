import { Lexer, Parser, type Token, type Tokens } from 'marked';
import { highlight } from './highlight';
import type { Block, Doc } from './types';

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-z]+;/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function stripFrontmatter(source: string): string {
  return source.startsWith('---\n') ? source.slice(source.indexOf('\n---', 4) + 4).trimStart() : source;
}

const unwrap = (html: string) => html.replace(/\s*\n\s*/g, ' ').trim();

const inline = (tokens: Token[] | undefined) => unwrap(Parser.parseInline(tokens ?? []));

function itemHtml(item: Tokens.ListItem): string {
  const simple = item.tokens.every(t => t.type === 'text' || t.type === 'space');
  if (simple) {
    return item.tokens
      .filter((t): t is Tokens.Text => t.type === 'text')
      .map(t => inline(t.tokens ?? [{ type: 'text', raw: t.text, text: t.text } as Tokens.Text]))
      .join(' ');
  }
  if (item.tokens.every(t => t.type === 'paragraph' || t.type === 'space')) {
    return item.tokens
      .filter((t): t is Tokens.Paragraph => t.type === 'paragraph')
      .map(t => inline(t.tokens))
      .join('<br><br>');
  }
  return Parser.parse(item.tokens).trim();
}

export function parseDoc(source: string): Doc {
  const tokens = new Lexer({ gfm: true }).lex(stripFrontmatter(source));
  const blocks: Block[] = [];
  const ids = new Map<string, number>();
  for (const token of tokens) {
    switch (token.type) {
      case 'heading': {
        const t = token as Tokens.Heading;
        let id = slugify(t.text);
        const seen = ids.get(id) ?? 0;
        ids.set(id, seen + 1);
        if (seen) id = `${id}-${seen + 1}`;
        blocks.push({ t: 'h', level: Math.max(2, t.depth), id, html: inline(t.tokens) });
        break;
      }
      case 'paragraph':
        blocks.push({ t: 'p', html: inline((token as Tokens.Paragraph).tokens) });
        break;
      case 'code': {
        const t = token as Tokens.Code;
        const lang = (t.lang ?? '').split(/\s/)[0] || guessLang(t.text);
        blocks.push({ t: 'code', lang, code: highlight(t.text, lang), raw: t.text });
        break;
      }
      case 'list': {
        const t = token as Tokens.List;
        blocks.push({
          t: 'list',
          ordered: t.ordered,
          start: typeof t.start === 'number' ? t.start : 1,
          items: t.items.map(itemHtml),
        });
        break;
      }
      case 'table': {
        const t = token as Tokens.Table;
        blocks.push({
          t: 'table',
          align: t.align,
          head: t.header.map(c => inline(c.tokens)),
          rows: t.rows.map(r => r.map(c => inline(c.tokens))),
        });
        break;
      }
      case 'blockquote':
        blocks.push({ t: 'quote', html: Parser.parse((token as Tokens.Blockquote).tokens).trim() });
        break;
      case 'hr':
        blocks.push({ t: 'hr' });
        break;
      case 'html':
        blocks.push({ t: 'p', html: (token as Tokens.HTML).text.trim() });
        break;
    }
  }
  return { blocks };
}

function guessLang(code: string): string {
  if (/^\s*(\[|[a-z_]+ = )/m.test(code) && !/^\s*agentee /m.test(code)) return 'toml';
  if (/^\s*(agentee|\$|cargo|curl|npx) /m.test(code)) return 'sh';
  if (/^\s*\{/.test(code)) return 'json';
  return 'text';
}
