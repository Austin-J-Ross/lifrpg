import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  workers: 2,
  timeout: 30000,
  reporter: [['list']],
  use: {
    headless: true,
    viewport: { width: 1280, height: 900 },
    timezoneId: 'America/New_York',
    trace: 'retain-on-failure',
  },
  outputDir: 'artifacts/test-results',
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
