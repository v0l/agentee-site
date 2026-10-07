import table from './generated/renders.json';

const renders = table as unknown as Record<string, [number, number, string?]>;

export const renderSize = (name: string): [number, number] => {
  const [width, height] = renders[name] ?? [1600, 1000];
  return [width, height];
};

export const render = (name: string) => {
  const version = renders[name]?.[2];
  return `/assets/renders/${name}.webp${version ? `?v=${version}` : ''}`;
};

export const versionRenders = (html: string) =>
  html.replace(/\/assets\/renders\/([\w-]+)\.webp(?![?\w])/g, (_, name: string) => render(name));
