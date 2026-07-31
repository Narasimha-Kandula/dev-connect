import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const FRONTEND_PORT = 3000;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 1,
  timeout: 60000,
  expect: {
    timeout: 15000,
  },
  reporter: [
    ['html', { outputFolder: 'e2e-report' }],
    ['list'],
  ],

  use: {
    baseURL: `http://localhost:${FRONTEND_PORT}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // Use the already-installed Chrome for Testing binary
    launchOptions: {
      executablePath: '/usr/bin/google-chrome',
      args: [
        '--no-sandbox',
        '--disable-gpu',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
      ],
    },
  },

  webServer: {
    command: `cd ${__dirname} && npx next dev --port ${FRONTEND_PORT}`,
    port: FRONTEND_PORT,
    timeout: 120_000,
    reuseExistingServer: true,
    stdout: 'pipe',
    stderr: 'pipe',
  },

  projects: [
    {
      name: 'chromium-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: 'chromium-mobile',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 390, height: 844 },
      },
    },
  ],
});
