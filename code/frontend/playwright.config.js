import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e-tests',
  fullyParallel: false, // Run tests sequentially to prevent data race conditions
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1, // Single-threaded execution for sequential testing flow
  reporter: [['html', { open: 'never' }]], // Generate HTML report without auto-opening
  use: {
    baseURL: 'http://localhost:5173', // Frontend React Vite server
    trace: 'on-first-retry',
    screenshot: 'only-on-failure', // Take screenshots on test failures
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
