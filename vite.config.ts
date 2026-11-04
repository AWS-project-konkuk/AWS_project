import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import mdx from '@mdx-js/rollup';
import remarkGfm from 'remark-gfm';
import mdxIndexPlugin from './src/content/mdxIndexPlugin.ts';

export default defineConfig({
  plugins: [mdx({ remarkPlugins: [remarkGfm, mdxIndexPlugin] }), react()],
  base: './',
  test: { include: ['tests/**/*.test.ts'], environment: 'node' },
});
