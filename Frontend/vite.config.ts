import { defineConfig } from 'vitest/config';
import type { ProxyOptions } from 'vite';
import { config as dotenv } from 'dotenv';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@mdx-js/rollup';
import remarkGfm from 'remark-gfm';
import mdxIndexPlugin from './src/content/mdxIndexPlugin.ts';

export default defineConfig(({ mode }) => {
  const env: Record<string, string> = {};
  dotenv({
    path: [`.env.${mode}.local`, `.env.${mode}`, '.env.local', '.env'],
    processEnv: env,
    quiet: true,
  });
  const target = process.env.BACKEND_URL || env.BACKEND_URL || 'http://localhost:8080';
  const targetOrigin = new URL(target).origin;
  const proxy: Record<string, ProxyOptions> = {
    '^/api(?:/|$)': {
      target,
      changeOrigin: true,
      configure(server) {
        server.on('proxyReq', (outgoing, incoming) => {
          // Forward same-origin browser requests as same-origin requests to Spring.
          const scheme =
            'encrypted' in incoming.socket && incoming.socket.encrypted ? 'https' : 'http';
          if (incoming.headers.origin === `${scheme}://${incoming.headers.host}`) {
            outgoing.setHeader('Origin', targetOrigin);
          }
        });
      },
    },
  };
  return {
    plugins: [mdx({ remarkPlugins: [remarkGfm, mdxIndexPlugin] }), react(), tailwindcss()],
    base: './',
    server: { proxy },
    preview: { proxy },
    test: { include: ['tests/**/*.test.ts'], environment: 'node' },
  };
});
