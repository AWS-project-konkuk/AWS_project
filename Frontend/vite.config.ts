import { defineConfig } from 'vitest/config';
import type { ProxyOptions } from 'vite';
import { config as dotenv } from 'dotenv';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@mdx-js/rollup';
import remarkGfm from 'remark-gfm';
import mdxIndexPlugin from './src/content/mdxIndexPlugin.ts';
import rehypeCodeHighlight from './src/content/rehypeCodeHighlight.ts';

export default defineConfig(({ mode }) => {
  const env: Record<string, string> = {};
  dotenv({
    path: [`.env.${mode}.local`, `.env.${mode}`, '.env.local', '.env'],
    processEnv: env,
    quiet: true,
  });
  const target = process.env.BACKEND_URL || env.BACKEND_URL || 'http://localhost:8080';
  const targetOrigin = new URL(target).origin;
  // 공유 미리보기 이미지 주소에 쓰는 사이트 주소. 빌드할 때 정하지 않으면 컨테이너 실행 시 SITE_URL로 채운다.
  const siteUrl = (process.env.SITE_URL || env.SITE_URL || '').replace(/\/+$/, '');
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
    plugins: [
      {
        name: 'site-url',
        transformIndexHtml: {
          order: 'post',
          // 개발 서버는 바로 채우고, 빌드 결과는 nginx가 실행할 때 SITE_URL로 채우도록 남겨 둔다.
          handler: (html: string, ctx: { server?: unknown }) =>
            ctx.server || siteUrl ? html.replaceAll('__SITE_URL__', siteUrl) : html,
        },
      },
      mdx({
        remarkPlugins: [remarkGfm, mdxIndexPlugin],
        rehypePlugins: [rehypeCodeHighlight],
      }),
      react(),
      tailwindcss(),
    ],
    base: './',
    server: { proxy },
    preview: { proxy },
    test: { include: ['tests/**/*.test.ts'], environment: 'node' },
  };
});
