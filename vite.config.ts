import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';

// `base` must match the GitHub Pages subpath (https://<user>.github.io/forma-workout-app/).
export default defineConfig({
  base: '/forma-workout-app/',
  plugins: [
    VitePWA({
      registerType: 'prompt',
      // Take control of the page as soon as the SW activates so the app is offline-capable
      // on the next navigation (offline-first, spec §31). Updates still require a user prompt.
      workbox: {
        clientsClaim: true,
        skipWaiting: false,
        // Detail-page posters are large and only viewed on demand — keep them out of the install
        // precache and cache them at runtime (offline after first view) to keep first load light.
        globIgnores: ['**/exercises/*-poster.webp'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes('/exercises/') && url.pathname.endsWith('-poster.webp'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'exercise-posters',
              expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 60 },
            },
          },
        ],
      },
      // App shell precache; user data (IndexedDB) is intentionally NOT cached here.
      manifest: {
        name: 'Forma',
        short_name: 'Forma',
        description: 'Sensor-powered fitness PWA — automatic rep counting and coaching.',
        theme_color: '#0b0b0f',
        background_color: '#0b0b0f',
        display: 'standalone',
        start_url: '.',
        icons: [
          {
            src: 'icons/icon-72x72.png',
            sizes: '72x72',
            type: 'image/png',
          },
          {
            src: 'icons/icon-96x96.png',
            sizes: '96x96',
            type: 'image/png',
          },
          {
            src: 'icons/icon-128x128.png',
            sizes: '128x128',
            type: 'image/png',
          },
          {
            src: 'icons/icon-144x144.png',
            sizes: '144x144',
            type: 'image/png',
          },
          {
            src: 'icons/icon-152x152.png',
            sizes: '152x152',
            type: 'image/png',
          },
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-384x384.png',
            sizes: '384x384',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icons/maskable-icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'icons/maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
  },
});
