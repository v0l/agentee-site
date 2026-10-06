import { lazy } from 'preact-iso';
import type { ComponentType } from 'preact';
import type { Doc } from '../md/types';

type Loaders = Record<string, () => Promise<Doc>>;

const SOURCES: Record<string, Loaders> = {
  guides: import.meta.glob<Doc>('/content/guides/*.md', { query: '?doc', import: 'default' }),
  reference: import.meta.glob<Doc>('/content/reference/*.md', { query: '?doc', import: 'default' }),
  pages: import.meta.glob<Doc>('/content/pages/*.md', { query: '?doc', import: 'default' }),
  upstream: import.meta.glob<Doc>('/content/upstream/SKILL.md', { query: '?doc', import: 'default' }),
};

export type DocView = ComponentType<{ render: (doc: Doc) => preact.ComponentChildren }>;

const cache = new Map<string, DocView>();

export function docView(kind: keyof typeof SOURCES, slug: string): DocView | null {
  const key = `${kind}/${slug}`;
  const load = SOURCES[kind][`/content/${key}.md`];
  if (!load) return null;
  let view = cache.get(key);
  if (!view) {
    view = lazy(() =>
      load().then(doc => (props: { render: (doc: Doc) => preact.ComponentChildren }) => <>{props.render(doc)}</>),
    ) as DocView;
    cache.set(key, view);
  }
  return view;
}
