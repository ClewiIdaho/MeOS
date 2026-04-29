import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

// MY.OS — production base path is /MeOS/ for GitHub Pages.
// In dev we use '/' so the dev server serves from root.
const isProd = process.env.NODE_ENV === 'production';
const base = isProd ? '/MeOS/' : '/';

export default defineConfig({
  base,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'es2022',
    sourcemap: false,
    cssCodeSplit: true,
    // Bigger chunks are fine — the SW precaches them once and serves locally
    // forever after. The warning threshold is just for our own visibility.
    chunkSizeWarningLimit: 1024,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          motion: ['framer-motion'],
          charts: ['recharts'],
          db: ['dexie', 'dexie-react-hooks'],
          icons: ['lucide-react'],
          dates: ['date-fns'],
        },
      },
    },
  },
  server: {
    host: true,
    port: 5173,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      strategies: 'generateSW',
      includeAssets: [
        'favicon.svg',
        'icons/icon-192.png',
        'icons/icon-512.png',
        'icons/icon-maskable-512.png',
        'icons/apple-touch-icon.png',
      ],
      manifest: {
        name: 'MY.OS',
        short_name: 'MY.OS',
        description: 'A personal life-OS. Money, tasks, workouts, goals, leveling, and a coach with personality.',
        theme_color: '#0A0918',
        background_color: '#0A0918',
        display: 'standalone',
        orientation: 'portrait',
        start_url: base,
        scope: base,
        categories: ['lifestyle', 'productivity', 'health'],
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Precache every asset the build emits so the very first offline launch
        // has zero network dependencies. JSON is included for any future static
        // data drops (e.g. quip catalogs) we ship as files.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,woff,ico,json,webmanifest}'],
        // Default is 2 MiB; bumping prevents large vendor chunks (recharts,
        // framer-motion) from silently being skipped by the precache.
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: `${base}index.html`,
        // Only intercept navigations within our scope. Anything else (e.g.
        // a stray external link) falls through to the network.
        navigateFallbackAllowlist: [new RegExp(`^${base.replace(/\//g, '\\/')}`)],
        navigateFallbackDenylist: [/\/[^/?]+\.[^/]+$/],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'font',
            handler: 'CacheFirst',
            options: {
              cacheName: 'myos-fonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'myos-images',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 90 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Catch-all for any same-origin GET that slipped past precaching
            // (e.g. a file added at runtime). Stale-while-revalidate keeps the
            // app responsive offline while quietly refreshing in the
            // background when a connection returns.
            urlPattern: ({ sameOrigin, request }) =>
              sameOrigin && request.method === 'GET',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'myos-runtime',
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
});
