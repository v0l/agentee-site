import { existsSync, renameSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { ROUTES } from './src/meta';
import { messageId } from './src/i18n/hash';
import { docs } from './plugins/docs';
import { agentFiles } from './plugins/agent-files';

export default defineConfig({
  plugins: [
    docs(),
    preact({
      babel: {
        plugins: [
          [
            'formatjs',
            {
              overrideIdFn: (_id: string, defaultMessage: string) => messageId(defaultMessage),
              ast: false,
            },
          ],
        ],
      },
      prerender: {
        enabled: true,
        renderTarget: '#app',
        additionalPrerenderRoutes: [...ROUTES.filter(p => p !== '/'), '/404'],
        previewMiddlewareEnabled: true,
      },
    }),
    agentFiles(),
    {
      name: 'not-found-page',
      apply: 'build',
      closeBundle() {
        const page = resolve('dist/404/index.html');
        if (existsSync(page)) {
          renameSync(page, resolve('dist/404.html'));
          rmSync(resolve('dist/404'), { recursive: true });
        }
      },
    },
  ],
  build: { target: 'es2022' },
});
