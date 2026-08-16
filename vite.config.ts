import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';

// `base` must match the GitHub Pages subpath (https://<user>.github.io/Forma-App/).
export default defineConfig({
  base: '/Forma-App/',
  plugins: [
    VitePWA({
      registerType: 'prompt',
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
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
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
