import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@mdx-js/rollup';
import remarkGfm from 'remark-gfm';
import mdxIndexPlugin from './src/content/mdxIndexPlugin.ts';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'BACKEND_URL');
  const proxy = { '/api': process.env.BACKEND_URL || env.BACKEND_URL || 'http://localhost:8080' };
  return {
    plugins: [mdx({ remarkPlugins: [remarkGfm, mdxIndexPlugin] }), react(), tailwindcss()],
    base: './',
    server: { proxy },
    preview: { proxy },
    test: { include: ['tests/**/*.test.ts'], environment: 'node' },
  };
});
