/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type Plugin } from 'vite';

/**
 * Content-Security-Policy для production-сборки. Токен инстанса хранится в браузере,
 * поэтому запрещаем любые сторонние скрипты и соединения, кроме API GREEN-API.
 * В dev-режиме не добавляется: Vite использует inline-скрипты для HMR.
 */
function csp(apiOverride?: string): Plugin {
  const connect = ["'self'", 'https://*.api.green-api.com'];
  if (apiOverride) connect.push(new URL(apiOverride).origin);
  const policy = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self'",
    "img-src 'self' data:",
    "font-src 'self'",
    `connect-src ${connect.join(' ')}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    // frame-ancestors в <meta> игнорируется — задавайте его HTTP-заголовком на сервере.
  ].join('; ');
  return {
    name: 'green-chat:csp',
    apply: 'build',
    transformIndexHtml: () => [
      {
        tag: 'meta',
        attrs: { 'http-equiv': 'Content-Security-Policy', content: policy },
        injectTo: 'head-prepend',
      },
    ],
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  return {
    plugins: [react(), csp(env.VITE_GREEN_API_URL)],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    css: {
      modules: { localsConvention: 'camelCaseOnly' },
    },
    build: {
      target: 'es2022',
      sourcemap: true,
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
    },
  };
});
