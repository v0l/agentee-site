export type Block =
  | { t: 'h'; level: number; id: string; html: string }
  | { t: 'p'; html: string }
  | { t: 'code'; lang: string; code: string; raw: string }
  | { t: 'list'; ordered: boolean; start: number; items: string[] }
  | { t: 'table'; align: (string | null)[]; head: string[]; rows: string[][] }
  | { t: 'quote'; html: string }
  | { t: 'hr' };

export interface Doc {
  blocks: Block[];
}

export function blockStrings(block: Block): string[] {
  switch (block.t) {
    case 'h':
    case 'p':
    case 'quote':
      return [block.html];
    case 'list':
      return block.items;
    case 'table':
      return [...block.head, ...block.rows.flat()].filter(c => c.trim());
    default:
      return [];
  }
}
