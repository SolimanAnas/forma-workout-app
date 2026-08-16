import { defineConfig, devices } from '@playwright/test';

/**
 * E2E config (spec §24 PWA/offline). Builds + previews the app, then runs against real Chromium.
 * Run: `npm run build && npx playwright test`.
 */
const BASE = '/forma-workout-app/';
const PORT = 4173;

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: true,
  use: {
    baseURL: `http://localhost:${PORT}${BASE}`,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run preview -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}${BASE}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
