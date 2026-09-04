import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests', fullyParallel: false, workers: 1, timeout: 60_000,
  outputDir: 'test-results/artifacts',
  expect: { timeout: 15_000 },
  use: {
    baseURL: 'http://127.0.0.1:4173', headless: true,
    channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome',
    trace: 'retain-on-failure', screenshot: 'only-on-failure',
  },
  webServer: {
    command: `"${process.execPath}" node_modules/vite/bin/vite.js --host 127.0.0.1 --port 4173`,
    url: 'http://127.0.0.1:4173', reuseExistingServer: false,
    env: { VITE_API_BASE_URL: '/api', API_PROXY_TARGET: (process.env.E2E_API_BASE || 'http://127.0.0.1:3000/api').replace(/\/api$/, '') },
  },
});
