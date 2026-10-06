import { readFile } from 'node:fs/promises';
import type { Plugin } from 'vite';
import { parseDoc } from '../src/md/parse';

export function docs(): Plugin {
  return {
    name: 'agentee-docs',
    enforce: 'pre',
    async load(id) {
      const [file, query] = id.split('?');
      if (query !== 'doc' || !file.endsWith('.md')) return;
      this.addWatchFile(file);
      return `export default ${JSON.stringify(parseDoc(await readFile(file, 'utf8')))};`;
    },
  };
}
