import { messageId } from './hash';

export type Messages = Record<string, string>;

const UNTRANSLATED = new Set([
  'slug', 'id', 'key', 'start', 'code', 'file', 'suffix', 'guide', 'image', 'src', 'dir', 'asset',
  'install', 'librariesCode', 'lang', 'raw', 'command', 'help', 'top', 'target', 'name', 'type', 'args',
]);

export function* copyStrings(value: unknown): Generator<string> {
  if (typeof value === 'string') {
    if (value.trim()) yield value;
  } else if (Array.isArray(value)) {
    for (const v of value) yield* copyStrings(v);
  } else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if (!UNTRANSLATED.has(k)) yield* copyStrings(v);
    }
  }
}

export function translateString(messages: Messages, english: string): string {
  return messages[messageId(english)] ?? english;
}

export function translateCopy<T>(messages: Messages, value: T): T {
  if (typeof value === 'string') return translateString(messages, value) as T;
  if (Array.isArray(value)) return value.map(v => translateCopy(messages, v)) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, UNTRANSLATED.has(k) ? v : translateCopy(messages, v)]),
    ) as T;
  }
  return value;
}
