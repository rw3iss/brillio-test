import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// Import the route contract from the shared *source* so the config and the
// bundled app share one implementation. The shared package's dist is emitted
// as CommonJS with dynamic re-exports, which a bundler can't tree-analyze for
// named exports — so we alias @brillio/shared to its TypeScript source below.
import { ROUTES, WS_PATH } from '../shared/src/index.js';

const BACKEND = 'http://localhost:4180';

const sharedSrc = fileURLToPath(new URL('../shared/src/index.ts', import.meta.url));

// Derive the REST prefixes we must forward to the backend from the shared
// route contract so the proxy list can't drift from the server.
const restPrefixes = Array.from(
  new Set([
    ROUTES.providers,
    ROUTES.knowledgeBases,
    ROUTES.chat,
    ROUTES.sessionsByUser,
    ROUTES.usage,
    ROUTES.health,
  ]),
);

const proxy: Record<string, { target: string; changeOrigin: boolean; ws?: boolean }> = {
  [WS_PATH]: { target: BACKEND, changeOrigin: true, ws: true },
};
for (const p of restPrefixes) {
  proxy[p] = { target: BACKEND, changeOrigin: true };
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@brillio/shared': sharedSrc,
    },
  },
  server: {
    port: 5173,
    proxy,
  },
});
